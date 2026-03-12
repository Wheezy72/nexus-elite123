import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { chatWithAI } from "./services/aiService";

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

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/api/ai/chat", aiLimiter, async (req, res) => {
  const parsed = chatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const { message, context } = parsed.data;
    const result = await chatWithAI(message, context);

    res.json({
      response: result.response,
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

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Nexus Elite Backend running on port ${port}`);
});
