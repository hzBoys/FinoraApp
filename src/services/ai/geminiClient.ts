const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export type GeminiInputPart =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mime_type: 'image/jpeg' | 'image/png' };

export type GeminiJsonInteractionOptions = {
  systemInstruction: string;
  inputParts: GeminiInputPart[];
  schema: Record<string, unknown>;
  temperature?: number;
};

export type GeminiJsonInteractionResult<T> = {
  data: T;
  processingTimeMs: number;
  keyIndexUsed: number;
  totalKeysConfigured: number;
  modelUsed: string;
};

// Shared module-level Round-Robin pointer & per-key rate-limit cooldown tracker across all AI services
let roundRobinCursor = 0;
const keyCooldownUntilMs = new Map<number, number>();

export function getConfiguredGeminiKeys(): string[] {
  const raw =
    process.env.EXPO_PUBLIC_GEMINI_API_KEYS ||
    process.env.GEMINI_API_KEYS ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  return String(raw)
    .split(',')
    .map((k: string) => k.trim().replace(/^['"]|['"]$/g, ''))
    .filter((k: string) => k.length > 0);
}

export function getConfiguredGeminiModel(): string {
  const raw =
    process.env.EXPO_PUBLIC_GEMINI_MODEL ||
    process.env.GEMINI_MODEL ||
    DEFAULT_GEMINI_MODEL;
  return raw.trim() || DEFAULT_GEMINI_MODEL;
}

export function isGeminiConfigured(): boolean {
  return getConfiguredGeminiKeys().length > 0;
}

export function buildRoundRobinKeyOrder(totalKeys: number): number[] {
  if (totalKeys <= 0) return [];
  const start = roundRobinCursor % totalKeys;
  // Advance pointer immediately so consecutive requests distribute across all 14 keys
  roundRobinCursor = (start + 1) % totalKeys;

  const now = Date.now();
  const ready: number[] = [];
  const coolingDown: number[] = [];

  for (let offset = 0; offset < totalKeys; offset++) {
    const idx = (start + offset) % totalKeys;
    const blockedUntil = keyCooldownUntilMs.get(idx) ?? 0;
    if (blockedUntil > now) {
      coolingDown.push(idx);
    } else {
      ready.push(idx);
    }
  }

  return [...ready, ...coolingDown];
}

function extractTextFromInteractionResponse(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim().length > 0) {
    return payload.output_text.trim();
  }

  if (Array.isArray(payload?.steps)) {
    for (let i = payload.steps.length - 1; i >= 0; i--) {
      const step = payload.steps[i];
      if (step?.type === 'model_output' && Array.isArray(step.content)) {
        const joined = step.content
          .filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
          .map((part: any) => part.text)
          .join('')
          .trim();
        if (joined.length > 0) {
          return joined;
        }
      }
    }
  }

  const fallbackCandidateText = payload?.candidates?.[0]?.content?.parts
    ?.map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
    .join('')
    .trim();

  return fallbackCandidateText || '';
}

export async function executeGeminiJsonInteraction<T = any>(
  options: GeminiJsonInteractionOptions
): Promise<GeminiJsonInteractionResult<T>> {
  const keys = getConfiguredGeminiKeys();
  if (keys.length === 0) {
    throw new Error('API Key Gemini belum dikonfigurasi pada file .env (EXPO_PUBLIC_GEMINI_API_KEYS).');
  }

  const model = getConfiguredGeminiModel();
  const keyOrder = buildRoundRobinKeyOrder(keys.length);
  const startedAt = Date.now();
  let lastErrorMessage = 'Gagal terhubung ke layanan Gemini AI.';

  for (const keyIdx of keyOrder) {
    const apiKey = keys[keyIdx];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(GEMINI_INTERACTIONS_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          model,
          store: false,
          system_instruction: options.systemInstruction,
          input: options.inputParts,
          generation_config: {
            thinking_level: 'minimal',
            temperature: options.temperature ?? 0.1,
          },
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: options.schema,
          },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        if (response.status === 429 || response.status === 503 || response.status === 500) {
          keyCooldownUntilMs.set(keyIdx, Date.now() + 60_000);
          lastErrorMessage = `Kuota API Key #${keyIdx + 1} penuh (HTTP ${response.status}), mencoba key berikutnya...`;
          continue;
        }
        if (response.status === 401 || response.status === 403) {
          keyCooldownUntilMs.set(keyIdx, Date.now() + 300_000);
          lastErrorMessage = `API Key #${keyIdx + 1} tidak diizinkan (HTTP ${response.status}).`;
          continue;
        }
        throw new Error(`Permintaan AI ditolak (HTTP ${response.status}): ${errBody.slice(0, 140)}`);
      }

      const rawJson = await response.json();
      const jsonText = extractTextFromInteractionResponse(rawJson);
      if (!jsonText) {
        lastErrorMessage = 'Respons AI kosong, mencoba key berikutnya...';
        continue;
      }

      const parsed = JSON.parse(jsonText) as T;
      return {
        data: parsed,
        processingTimeMs: Date.now() - startedAt,
        keyIndexUsed: keyIdx + 1,
        totalKeysConfigured: keys.length,
        modelUsed: model,
      };
    } catch (err: any) {
      const msg = err?.name === 'AbortError'
        ? `Koneksi API Key #${keyIdx + 1} melebihi batas waktu, mencoba key berikutnya...`
        : err?.message || String(err);
      if (msg.includes('Permintaan AI ditolak')) {
        throw err;
      }
      lastErrorMessage = msg;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(lastErrorMessage);
}
