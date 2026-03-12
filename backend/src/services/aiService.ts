export type AIProvider = "mock" | "openai" | "gemini" | "anthropic";

export interface AIChatResult {
  provider: AIProvider;
  response: string;
  citations?: string[];
  followUp?: string | null;
}

const DEFAULT_SYSTEM_INSTRUCTIONS =
  "You are Nexus AI, a calm, practical companion for a university student. " +
  "Be concise and actionable. Prefer checklists, small next steps, and realistic schedules. " +
  "Avoid medical claims or diagnosis. If the user mentions self-harm or immediate danger, " +
  "encourage them to seek urgent help locally or contact emergency services.";

function getProvider(): AIProvider {
  const raw = String(process.env.AI_PROVIDER || "mock").toLowerCase();
  if (raw === "openai" || raw === "gemini" || raw === "anthropic" || raw === "mock") return raw;
  return "mock";
}

function buildUserPrompt(message: string, context?: unknown) {
  if (context == null) return message;
  return `${message}\n\nContext (JSON): ${JSON.stringify(context)}`;
}

async function chatMock(message: string, _context?: unknown): Promise<AIChatResult> {
  return {
    provider: "mock",
    response:
      `Mock AI (demo mode): I heard: "${message}"\n\n` +
      "If you want real responses, set AI_PROVIDER=openai or AI_PROVIDER=gemini in backend/.env.",
    citations: [],
    followUp: null,
  };
}

async function chatOpenAI(message: string, context?: unknown): Promise<AIChatResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to backend/.env");
  }

  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "developer", content: DEFAULT_SYSTEM_INSTRUCTIONS },
        { role: "user", content: buildUserPrompt(message, context) },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI error: ${resp.status} ${text}`);
  }

  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim() || "";

  return {
    provider: "openai",
    response: text,
    citations: [],
    followUp: null,
  };
}

async function chatGemini(message: string, context?: unknown): Promise<AIChatResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY (or GOOGLE_API_KEY). Add it to backend/.env");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `${DEFAULT_SYSTEM_INSTRUCTIONS}\n\nUser: ${buildUserPrompt(message, context)}`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    },
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini error: ${resp.status} ${text}`);
  }

  const data = (await resp.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

  return {
    provider: "gemini",
    response: text,
    citations: [],
    followUp: null,
  };
}

async function chatAnthropic(message: string, context?: unknown): Promise<AIChatResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY. Add it to backend/.env");
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
  const prompt = buildUserPrompt(message, context);

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": process.env.ANTHROPIC_VERSION || "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      system: DEFAULT_SYSTEM_INSTRUCTIONS,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Anthropic error: ${resp.status} ${text}`);
  }

  const data = (await resp.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text = data.content?.find((c) => c.type === "text")?.text?.trim() || "";

  return {
    provider: "anthropic",
    response: text,
    citations: [],
    followUp: null,
  };
}

export async function chatWithAI(message: string, context?: unknown): Promise<AIChatResult> {
  const provider = getProvider();

  try {
    if (provider === "openai") return await chatOpenAI(message, context);
    if (provider === "gemini") return await chatGemini(message, context);
    if (provider === "anthropic") return await chatAnthropic(message, context);
    return await chatMock(message, context);
  } catch (err) {
    const fallback = await chatMock(message, context);
    const details = err instanceof Error ? err.message : String(err);

    return {
      ...fallback,
      response: `${fallback.response}\n\n(Provider error: ${details})`,
    };
  }
}
