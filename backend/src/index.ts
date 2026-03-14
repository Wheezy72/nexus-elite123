import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { chatWithAI, getProvider, isAIEnabled, type AIContext } from "./services/aiService";
import { keywordCategorize, normalizeCategoryName } from "./services/financeCategorizer";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  const origins = corsOrigin
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  app.use(cors({ origin: origins, credentials: true }));
} else {
  app.use(cors());
}

app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/ai/status", (_req, res) => {
  res.json({ provider: getProvider(), enabled: isAIEnabled() });
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
  skip: () => String(process.env.AI_PROVIDER || "mock").toLowerCase() === "mock",
});

app.post("/api/ai/chat", aiLimiter, async (req, res) => {
  const parsed = chatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const { message, context } = parsed.data;
    const result = await chatWithAI(message, context as AIContext | undefined);

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

  const { subject, duration, examDate, learningStyle, hoursAvailable } = parsed.data;

  const prompt =
    "Create an ADHD-friendly study plan and return ONLY valid JSON (no markdown). " +
    "Schema: {id:string,title:string,days:Array<{day:number,topics:string[],activities:string[],duration:number}>,resources:string[],spacedRepetition:any[]}. " +
    "Keep durations realistic and break topics into small chunks. " +
    `Subject: ${subject}. Duration: ${duration}. Hours/week: ${hoursAvailable}. Learning style: ${learningStyle}. ` +
    (examDate ? `Exam date: ${examDate}. ` : "");

  try {
    const result = await chatWithAI(prompt, { isADHDContext: true });
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

  const merchant = parsed.data.merchant;
  const fallback = keywordCategorize(merchant);

  if (!isAIEnabled()) {
    res.json({ category: fallback, provider: getProvider(), usedAI: false });
    return;
  }

  const categories = parsed.data.categories.map(normalizeCategoryName).filter(Boolean);

  const prompt =
    "Pick the best spending category for this merchant and return ONLY JSON. " +
    "Schema: {category:string}. Use one from the provided list if possible. " +
    `Merchant: ${merchant}. Categories: ${JSON.stringify(categories)}.`;

  try {
    const result = await chatWithAI(prompt, { isADHDContext: false });
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
    res.json({ category: fallback, provider: getProvider(), usedAI: false });
  }
});

app.post("/api/ai/finance/insights", aiLimiter, async (req, res) => {
  const parsed = financeInsightsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { monthKey, budget, totalSpent, byCategory } = parsed.data;
  const basic: string[] = [];

  if (budget && budget > 0) {
    const pct = totalSpent / budget;
    if (pct >= 1) basic.push(`You're over budget (${Math.round(pct * 100)}%).`);
    else if (pct >= 0.75) basic.push(`You're at ${Math.round(pct * 100)}% of budget.`);
  }

  const top = byCategory.sort((a, b) => b.value - a.value)[0];
  if (top) basic.push(`Top category: ${top.name} (${Math.round(top.value)}).`);

  if (!isAIEnabled()) {
    res.json({ monthKey, insights: basic, provider: getProvider(), usedAI: false });
    return;
  }

  const prompt =
    "Given this monthly spending snapshot, return ONLY JSON. " +
    "Schema: {insights:string[],recommendations:string[]}. " +
    "Make it short and actionable for a student (numbers + tiny next steps). " +
    `Month: ${monthKey}. Total spent: ${totalSpent}. Budget: ${budget ?? "none"}. By category: ${JSON.stringify(byCategory)}.`;

  try {
    const result = await chatWithAI(prompt, { isADHDContext: true });
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
    res.json({ monthKey, insights: basic, provider: getProvider(), usedAI: false });
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
  console.log(`Nexus Elite running on http://localhost:${port}`);
});
