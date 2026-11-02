// Supabase Edge Function: ai-extract-document (SD-AI-01 OrkestratorAI)
// Runtime: Deno (Supabase Edge Functions)
// Secrets required on Supabase Dashboard: GEMINI_API_KEYS, GEMINI_MODEL

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const GEMINI_API_REVISION = '2026-05-20';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let edgeRoundRobinCursor = 0;

const RECEIPT_SCHEMA = {
  type: 'object',
  properties: {
    is_valid_receipt: { type: 'boolean' },
    merchant: { type: 'string' },
    nominal: { type: 'integer' },
    tanggal: { type: 'string' },
    metode_bayar: { type: 'string', enum: ['Bank', 'E-Wallet', 'Investasi'] },
    kategori: { type: 'string', enum: ['Makan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan'] },
    ringkasan_ocr: { type: 'string' },
  },
  required: [
    'is_valid_receipt',
    'merchant',
    'nominal',
    'tanggal',
    'metode_bayar',
    'kategori',
    'ringkasan_ocr',
  ],
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image_base64, mime_type = 'image/jpeg' } = await req.json();
    if (!image_base64 || typeof image_base64 !== 'string') {
      return new Response(JSON.stringify({ error: 'image_base64 is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keys = (Deno.env.get('GEMINI_API_KEYS') || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (keys.length === 0) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEYS secret is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash-lite';
    const startIdx = edgeRoundRobinCursor % keys.length;
    edgeRoundRobinCursor = (startIdx + 1) % keys.length;

    const startedAt = Date.now();
    let lastStatus = 500;
    let lastErr = 'All Gemini keys failed';

    for (let offset = 0; offset < keys.length; offset++) {
      const idx = (startIdx + offset) % keys.length;
      const res = await fetch(GEMINI_INTERACTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Revision': GEMINI_API_REVISION,
          'x-goog-api-key': keys[idx],
        },
        body: JSON.stringify({
          model,
          store: false,
          input: [
            {
              type: 'text',
              text: 'Ekstrak data struk/bukti pembayaran Indonesia berikut ke JSON (merchant, nominal Rupiah bulat, tanggal YYYY-MM-DD, metode_bayar Bank/E-Wallet/Investasi, kategori Makan/Transportasi/Belanja/Tagihan/Hiburan, ringkasan_ocr).',
            },
            {
              type: 'image',
              data: image_base64,
              mime_type,
            },
          ],
          generation_config: {
            thinking_level: 'minimal',
            temperature: 0.1,
          },
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: RECEIPT_SCHEMA,
          },
        }),
      });

      if (!res.ok) {
        lastStatus = res.status;
        lastErr = await res.text().catch(() => 'Upstream error');
        if (res.status === 429 || res.status === 503 || res.status === 500) {
          continue;
        }
        break;
      }

      const data = await res.json();
      const modelStep = Array.isArray(data?.steps)
        ? [...data.steps].reverse().find((s: any) => s?.type === 'model_output')
        : null;
      const text =
        modelStep?.content
          ?.filter((c: any) => c?.type === 'text')
          .map((c: any) => c.text)
          .join('') || '';

      return new Response(
        JSON.stringify({
          result: JSON.parse(text),
          processing_time_ms: Date.now() - startedAt,
          key_index_used: idx + 1,
          model,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: lastErr }), {
      status: lastStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
