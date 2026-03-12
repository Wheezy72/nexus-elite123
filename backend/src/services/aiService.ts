export type AIProvider = 'openai' | 'gemini' | 'anthropic' | 'mock';

export interface AIResponse {
  content: string;
  model: string;
  tokens: { input: number; output: number };
  provider: AIProvider;
  citations?: string[];
  followUp?: string;
}

export interface AIContext {
  userId?: string;
  userProfile?: {
    archetype?: string;
    peakTime?: string;
    strengths?: string[];
    challenges?: string[];
  };
  recentMood?: number; // 1-5
  currentGoals?: Array<{ title: string; status: string }>;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  isADHDContext?: boolean;
}

const BASE_SYSTEM_PROMPT =
  "You are Nexus, a personal companion for a university student. " +
  "Conversational and warm, but practical. Avoid medical claims or diagnosis. " +
  "Always give small next steps. Keep answers concise unless asked for detail.";

function getProvider(): AIProvider {
  const raw = String(process.env.AI_PROVIDER || 'mock').toLowerCase();
  if (raw === 'openai' || raw === 'gemini' || raw === 'anthropic' || raw === 'mock') return raw;
  return 'mock';
}

function buildSystemPrompt(context?: AIContext): string {
  const lines: string[] = [BASE_SYSTEM_PROMPT];

  if (context?.isADHDContext) {
    lines.push(
      "ADHD framing: treat ADHD as neurodivergence, not a character flaw. " +
        "Be validating and action-oriented. Suggest structure, friction reduction, and short timers.",
    );
  }

  lines.push('Guidelines:');
  lines.push('- Prefer bullet points and concrete next actions.');
  lines.push('- If user is overwhelmed, propose a 10-30 minute plan.');
  lines.push('- If user mentions self-harm or immediate danger: advise urgent local help/emergency services.');

  if (context?.userProfile || context?.recentMood || context?.timeOfDay || context?.currentGoals?.length) {
    lines.push('User context:');
    if (context.userProfile?.archetype) lines.push(`- Archetype: ${context.userProfile.archetype}`);
    if (context.userProfile?.peakTime) lines.push(`- Peak time: ${context.userProfile.peakTime}`);
    if (typeof context.recentMood === 'number') lines.push(`- Mood: ${context.recentMood}/5`);
    if (context.timeOfDay) lines.push(`- Time of day: ${context.timeOfDay}`);
    if (context.currentGoals?.length) {
      lines.push(`- Active goals: ${context.currentGoals.map(g => `${g.title} (${g.status})`).join(', ')}`);
    }
  }

  return lines.join('\n');
}

function buildUserPrompt(message: string, context?: AIContext) {
  if (!context) return message;
  const safeContext = {
    userId: context.userId,
    timeOfDay: context.timeOfDay,
  };
  return `${message}\n\nContext (JSON): ${JSON.stringify(safeContext)}`;
}

function mockResponse(prompt: string, _context?: AIContext): AIResponse {
  const responses = [
    "Let's break it down: pick one 10-minute task you can do right now.",
    "Quick plan: 1) set a 15-min timer 2) do the first tiny step 3) stop and reassess.",
    "You're not behind — you're overloaded. Want a realistic plan for today?",
  ];

  return {
    content: responses[Math.floor(Math.random() * responses.length)],
    model: 'mock',
    tokens: { input: 0, output: 0 },
    provider: 'mock',
  };
}

async function callOpenAI(systemPrompt: string, prompt: string): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY. Add it to backend/.env');

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 700,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI error: ${resp.status} ${text}`);
  }

  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  return {
    provider: 'openai',
    model,
    tokens: {
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
    },
    content: data.choices?.[0]?.message?.content?.trim() || '',
  };
}

async function callGemini(systemPrompt: string, prompt: string): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY (or GOOGLE_API_KEY). Add it to backend/.env');

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }],
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
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return {
    provider: 'gemini',
    model,
    tokens: { input: 0, output: 0 },
    content: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '',
  };
}

async function callAnthropic(systemPrompt: string, prompt: string): Promise<AIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY. Add it to backend/.env');

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';

  const resp = await fetch(process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': process.env.ANTHROPIC_VERSION || '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Anthropic error: ${resp.status} ${text}`);
  }

  const data = (await resp.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  return {
    provider: 'anthropic',
    model,
    tokens: {
      input: data.usage?.input_tokens ?? 0,
      output: data.usage?.output_tokens ?? 0,
    },
    content: data.content?.find(c => c.type === 'text')?.text?.trim() || '',
  };
}

export async function chatWithAI(prompt: string, context?: AIContext): Promise<AIResponse> {
  const provider = getProvider();
  const systemPrompt = buildSystemPrompt(context);
  const userPrompt = buildUserPrompt(prompt, context);

  try {
    if (provider === 'openai') return await callOpenAI(systemPrompt, userPrompt);
    if (provider === 'gemini') return await callGemini(systemPrompt, userPrompt);
    if (provider === 'anthropic') return await callAnthropic(systemPrompt, userPrompt);
    return mockResponse(prompt, context);
  } catch (err) {
    const fallback = mockResponse(prompt, context);
    const details = err instanceof Error ? err.message : String(err);
    return {
      ...fallback,
      content: `${fallback.content}\n\n(Provider error: ${details})`,
    };
  }
}
