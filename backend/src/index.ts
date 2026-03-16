import "dotenv/config";
import cors from "cors";
import express, { type Request } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { chatWithAI, getProvider, isAIEnabled, type AIContext, type AIRequestOverrides } from "./services/aiService.js";
import { keywordCategorize, normalizeCategoryName } from "./services/financeCategorizer.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "connect-src": [
          "'self'",
          "https://*.supabase.co",
          "wss://*.supabase.co",
          "https://cdn.jsdelivr.net",
        ],
        "img-src": ["'self'", "data:", "blob:", "https://*.supabase.co"],
        "script-src": [
          "'self'",
          "'unsafe-eval'",
          "'wasm-unsafe-eval'",
          "https://cdn.jsdelivr.net",
        ],
        "style-src": ["'self'", "'unsafe-inline'"],
        "worker-src": ["'self'", "blob:", "https://cdn.jsdelivr.net"],
      },
    },
  }),
);

const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  const origins = corsOrigin
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(cors({ origin: origins, credentials: true }));
} else {
  app.use(cors());
}

app.use(express.json({ limit: "10mb" }));

function getAIOverridesFromReq(req: Request): AIRequestOverrides | undefined {
  const providerRaw = String(req.headers["x-ai-provider"] || "").toLowerCase().trim();
  const apiKey = typeof req.headers["x-ai-key"] === "string" ? req.headers["x-ai-key"] : undefined;

  if (!apiKey) return undefined;
  if (providerRaw !== "openai" && providerRaw !== "gemini") return undefined;

  return {
    provider: providerRaw as AIRequestOverrides["provider"],
    apiKey,
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/ai/status", (_req, res) => {
  res.json({ provider: getProvider(), enabled: isAIEnabled(), supportsByok: true });
});

const chatBodySchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.unknown().optional(),
});

const studyPlanSchema = z.object({
  subject: z.string().min(1).max(200),
  duration: z.string().min(1).max(50),
  examDate: z.string().min(1).max(50).optional(),
  learningStyle: z.enum(["visual", "text", "hands-on", "mixed"]).default("mixed"),
  hoursAvailable: z.number().min(1).max(80).default(10),
});

const financeCategorizeSchema = z.object({
  merchant: z.string().min(1).max(200),
  categories: z.array(z.string().min(1).max(40)).max(50).default([]),
});

const financeInsightsSchema = z.object({
  monthKey: z.string().min(7).max(7), // YYYY-MM
  budget: z.number().nullable(),
  totalSpent: z.number().min(0),
  byCategory: z.array(z.object({ name: z.string(), value: z.number() })).default([]),
});

const weeklyRecapSchema = z.object({
  weekOf: z.string().min(10).max(10),
  profile: z
    .object({
      archetype: z.string().optional(),
      peakTime: z.string().optional(),
      strengths: z.array(z.string()).optional(),
      challenges: z.array(z.string()).optional(),
      updatedAt: z.string().optional(),
    })
    .passthrough()
    .optional(),
  analytics: z
    .object({
      current: z.unknown(),
      delta: z.unknown(),
    })
    .passthrough(),
  health: z
    .object({
      stepsAvg: z.number().nullable().optional(),
      sleepAvgHours: z.number().nullable().optional(),
      restingHrAvg: z.number().nullable().optional(),
    })
    .passthrough()
    .optional(),
  correlations: z.array(z.unknown()).default([]),
  anomalies: z.array(z.object({ id: z.string(), title: z.string(), detail: z.string() })).default([]),
  nextActions: z.array(z.object({ id: z.string(), title: z.string(), minutes: z.number(), route: z.string() })).default([]),
});

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: "Too many AI requests. Please wait a moment.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const auth = req.headers.authorization;
    return auth ? `auth:${auth.slice(0, 32)}` : `ip:${req.ip}`;
  },
  skip: (req) => {
    const envMock = String(process.env.AI_PROVIDER || "mock").toLowerCase() === "mock";
    if (!envMock) return false;

    const hasByok =
      typeof req.headers["x-ai-key"] === "string" &&
      String(req.headers["x-ai-provider"] || "").trim().length > 0;

    return !hasByok;
  },
});

app.post("/api/ai/chat", aiLimiter, async (req, res) => {
  const parsed = chatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const overrides = getAIOverridesFromReq(req);

  try {
    const { message, context } = parsed.data;
    const result = await chatWithAI(message, context as AIContext | undefined, overrides);

    res.json({
      response: result.content,
      content: result.content,
      model: result.model,
      tokens: result.tokens,
      citations: result.citations ?? [],
      followUp: result.followUp ?? null,
      timestamp: new Date().toISOString(),
      provider: result.provider,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("AI chat error:", err);
    res.status(500).json({ error: "Failed to get response" });
  }
});

app.post("/api/ai/weekly-recap", aiLimiter, async (req, res) => {
  const parsed = weeklyRecapSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const overrides = getAIOverridesFromReq(req);
  const enabled = isAIEnabled(overrides);

  const basicBullets: string[] = [];
  const anomalies = parsed.data.anomalies || [];
  for (const a of anomalies.slice(0, 2)) {
    basicBullets.push(`${a.title}: ${a.detail}`);
  }

  const next = parsed.data.nextActions?.[0] || null;

  if (!enabled) {
    res.json({
      bullets: basicBullets.length ? basicBullets.slice(0, 3) : ["Log one thing daily to get a cleaner weekly signal."],
      nextStep: next ? { title: next.title, minutes: next.minutes, route: next.route } : null,
      provider: getProvider(),
    });
    return;
  }

  const prompt =
    "Write a weekly recap for the user and return ONLY JSON (no markdown). " +
    "Schema: {bullets:string[],nextStep:{title:string,minutes:number,route?:string}|null,why?:string[]}. " +
    "Rules: max 3 bullets, no fluff, include at least one number, be kind but direct. " +
    `WeekOf: ${parsed.data.weekOf}. ` +
    `Profile: ${JSON.stringify(parsed.data.profile || {})}. ` +
    `Analytics: ${JSON.stringify(parsed.data.analytics)}. ` +
    `Health: ${JSON.stringify(parsed.data.health || {})}. ` +
    `Correlations: ${JSON.stringify(parsed.data.correlations || [])}. ` +
    `Anomalies: ${JSON.stringify(parsed.data.anomalies || [])}. ` +
    `NextActions: ${JSON.stringify(parsed.data.nextActions || [])}.`;

  try {
    const result = await chatWithAI(prompt, { isADHDContext: true }, overrides);
    const raw = result.content.trim();

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const candidate = jsonStart >= 0 && jsonEnd >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;

    const data = JSON.parse(candidate) as { bullets?: unknown; nextStep?: unknown; why?: unknown };

    res.json({
      bullets: Array.isArray(data.bullets) ? data.bullets.map(String).slice(0, 3) : basicBullets.slice(0, 3),
      nextStep: data.nextStep ?? (next ? { title: next.title, minutes: next.minutes, route: next.route } : null),
      why: Array.isArray(data.why) ? data.why.map(String).slice(0, 5) : [],
      provider: result.provider,
    });
  } catch {
    res.json({
      bullets: basicBullets.length ? basicBullets.slice(0, 3) : ["Log one thing daily to get a cleaner weekly signal."],
      nextStep: next ? { title: next.title, minutes: next.minutes, route: next.route } : null,
      provider: overrides?.provider || getProvider(),
    });
  }
});

function fallbackStudyPlan(subject: string, duration: string) {
  const days = duration.toLowerCase().includes("week") ? 7 : 14;
  return {
    id: `plan-${Date.now()}`,
    title: `Study plan: ${subject}`,
    days: Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      topics: [subject],
      activities: ["Review notes", "Practice problems", "Recall quiz"],
      duration: 60,
    })),
    resources: [],
    spacedRepetition: [],
  };
}

app.post("/api/ai/study-plan", aiLimiter, async (req, res) => {
  const parsed = studyPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const overrides = getAIOverridesFromReq(req);

  const { subject, duration, examDate, learningStyle, hoursAvailable } = parsed.data;

  const prompt =
    "Create an ADHD-friendly study plan and return ONLY valid JSON (no markdown). " +
    "Schema: {id:string,title:string,days:Array<{day:number,topics:string[],activities:string[],duration:number}>,resources:string[],spacedRepetition:any[]}. " +
    "Keep durations realistic and break topics into small chunks. " +
    `Subject: ${subject}. Duration: ${duration}. Hours/week: ${hoursAvailable}. Learning style: ${learningStyle}. ` +
    (examDate ? `Exam date: ${examDate}. ` : "");

  try {
    const result = await chatWithAI(prompt, { isADHDContext: true }, overrides);
    const raw = result.content.trim();

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const candidate = jsonStart >= 0 && jsonEnd >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;

    const plan = JSON.parse(candidate);
    res.json({ plan });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Study plan generation failed, returning fallback:", err);
    res.json({ plan: fallbackStudyPlan(subject, duration) });
  }
});

app.post("/api/ai/finance/categorize", aiLimiter, async (req, res) => {
  const parsed = financeCategorizeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const overrides = getAIOverridesFromReq(req);

  const merchant = parsed.data.merchant;
  const fallback = keywordCategorize(merchant);

  if (!isAIEnabled(overrides)) {
    res.json({ category: fallback, provider: overrides?.provider || getProvider(), usedAI: false });
    return;
  }

  const categories = parsed.data.categories.map(normalizeCategoryName).filter(Boolean);

  const prompt =
    "Pick the best spending category for this merchant and return ONLY JSON. " +
    "Schema: {category:string}. Use one from the provided list if possible. " +
    `Merchant: ${merchant}. Categories: ${JSON.stringify(categories)}.`;

  try {
    const result = await chatWithAI(prompt, { isADHDContext: false }, overrides);
    const raw = result.content.trim();

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const candidate = jsonStart >= 0 && jsonEnd >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;

    const data = JSON.parse(candidate) as { category?: string };
    const cat = normalizeCategoryName(String(data.category || ""));

    res.json({
      category: cat || fallback,
      provider: result.provider,
      usedAI: true,
    });
  } catch {
    res.json({ category: fallback, provider: overrides?.provider || getProvider(), usedAI: false });
  }
});

app.post("/api/ai/finance/insights", aiLimiter, async (req, res) => {
  const parsed = financeInsightsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const overrides = getAIOverridesFromReq(req);

  const { monthKey, budget, totalSpent, byCategory } = parsed.data;
  const basic: string[] = [];

  if (budget && budget > 0) {
    const pct = totalSpent / budget;
    if (pct >= 1) basic.push(`You're over budget (${Math.round(pct * 100)}%).`);
    else if (pct >= 0.75) basic.push(`You're at ${Math.round(pct * 100)}% of budget.`);
  }

  const top = byCategory.sort((a, b) => b.value - a.value)[0];
  if (top) basic.push(`Top category: ${top.name} (${Math.round(top.value)}).`);

  if (!isAIEnabled(overrides)) {
    res.json({ monthKey, insights: basic, provider: overrides?.provider || getProvider(), usedAI: false });
    return;
  }

  const prompt =
    "Given this monthly spending snapshot, return ONLY JSON. " +
    "Schema: {insights:string[],recommendations:string[]}. " +
    "Make it short and actionable for a student (numbers + tiny next steps). " +
    `Month: ${monthKey}. Total spent: ${totalSpent}. Budget: ${budget ?? "none"}. By category: ${JSON.stringify(byCategory)}.`;

  try {
    const result = await chatWithAI(prompt, { isADHDContext: true }, overrides);
    const raw = result.content.trim();

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const candidate = jsonStart >= 0 && jsonEnd >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;

    const data = JSON.parse(candidate) as { insights?: string[]; recommendations?: string[] };
    res.json({
      monthKey,
      insights: Array.isArray(data.insights) ? data.insights.slice(0, 8) : basic,
      recommendations: Array.isArray(data.recommendations) ? data.recommendations.slice(0, 8) : [],
      provider: result.provider,
      usedAI: true,
    });
  } catch {
    res.json({ monthKey, insights: basic, provider: overrides?.provider || getProvider(), usedAI: false });
  }
});

const frontendDist = path.resolve(process.cwd(), "../dist");
const frontendIndex = path.join(frontendDist, "index.html");

if (fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendDist, { maxAge: "1y", index: false }));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(frontendIndex);
  });
}

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Future running on http://localhost:${port}`);
});
