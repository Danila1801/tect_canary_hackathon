// Minimal OpenAI-compatible client (Nebius Token Factory by default). No SDK: fewer dependencies,
// smaller attack surface. Server-side only: the key never reaches the browser.
let calls = 0;

export function llmCallCount(): number {
  return calls;
}

export function modelName(): string {
  return process.env.LLM_MODEL ?? "Qwen/Qwen3-235B-A22B-Instruct-2507";
}

function extractJson(text: string): string {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model output");
  return cleaned.slice(start, end + 1);
}

export async function chatJSON<T>(
  system: string,
  user: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<T> {
  const base = process.env.LLM_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1";
  const key = process.env.LLM_API_KEY;
  if (!key) throw new Error("LLM_API_KEY is not set");

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      calls++;
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName(),
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: opts.temperature ?? 0,
          max_tokens: opts.maxTokens ?? 4000,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content ?? "";
      return JSON.parse(extractJson(content)) as T;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("LLM call failed");
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}
