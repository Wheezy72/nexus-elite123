import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { chatWithAI, type AIContext } from "./services/aiService";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Nexus Elite Backend running on port ${port}`);
});
