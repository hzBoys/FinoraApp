// Supabase Edge Function: ai-extract-document (SD-AI-01 OrkestratorAI)
// Supports both Magic Receipt (`jenis_scan = 'struk'`) and Auto-Portfolio (`jenis_scan = 'saldo'`)
// Runtime: Deno (Supabase Edge Functions)
// Secrets required on Supabase Dashboard: GEMINI_API_KEYS, GEMINI_MODEL

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

const BALANCE_SCHEMA = {
  type: 'object',
  properties: {
    is_valid_balance: { type: 'boolean' },
    nama_akun: { type: 'string' },
    tipe: { type: 'string', enum: ['bank', 'ewallet', 'investasi'] },
    saldo: { type: 'integer' },
    ringkasan_ocr: { type: 'string' },
  },
  required: ['is_valid_balance', 'nama_akun', 'tipe', 'saldo', 'ringkasan_ocr'],
};

function extractJsonText(data: any): string {
  let raw = '';
  if (typeof data?.output_text === 'string' && data.output_text.trim().length > 0) {
    raw = data.output_text.trim();
  } else if (Array.isArray(data?.steps)) {
    const modelStep = [...data.steps].reverse().find((s: any) => s?.type === 'model_output');
    raw =
      modelStep?.content
        ?.filter((c: any) => c?.type === 'text' && typeof c.text === 'string')
        .map((c: any) => c.text)
        .join('')
        .trim() || '';
  }
  const fenceMatch = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : raw;
}

async function verifySupabaseJwt(authHeader: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) return true;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authHeader,
        apikey: anonKey,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isAuthenticated = await verifySupabaseJwt(authHeader);
    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid or expired session token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image_base64, mime_type = 'image/jpeg', jenis_scan = 'struk' } = await req.json();
    if (!image_base64 || typeof image_base64 !== 'string') {
      return new Response(JSON.stringify({ error: 'image_base64 is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate <= 5 MB decoded image limit (SRS ER-1.1)
    const approxBytes = Math.floor((image_base64.length * 3) / 4);
    if (approxBytes > 5_242_880) {
      return new Response(JSON.stringify({ error: 'File melebihi batas maksimal 5 MB' }), {
        status: 413,
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

    const isBalanceScan = jenis_scan === 'saldo';
    const promptText = isBalanceScan
      ? 'Ekstrak data screenshot saldo m-Banking/E-Wallet/Investasi Indonesia berikut ke JSON (is_valid_balance, nama_akun misal BCA/GoPay/Bibit, tipe bank/ewallet/investasi, saldo Rupiah bulat, ringkasan_ocr).'
      : 'Ekstrak data struk/bukti pembayaran Indonesia berikut ke JSON (is_valid_receipt, merchant, nominal Rupiah bulat, tanggal YYYY-MM-DD, metode_bayar Bank/E-Wallet/Investasi, kategori Makan/Transportasi/Belanja/Tagihan/Hiburan, ringkasan_ocr).';

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash-lite';
    const startIdx = edgeRoundRobinCursor % keys.length;
    edgeRoundRobinCursor = (startIdx + 1) % keys.length;

    const startedAt = Date.now();
    let lastStatus = 500;
    let lastErr = 'All Gemini keys failed';

    for (let offset = 0; offset < keys.length; offset++) {
      const idx = (startIdx + offset) % keys.length;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45_000);
      try {
        const res = await fetch(GEMINI_INTERACTIONS_URL, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': keys[idx],
          },
          body: JSON.stringify({
            model,
            store: false,
            input: [
              { type: 'text', text: promptText },
              { type: 'image', data: image_base64, mime_type },
            ],
            generation_config: {
              thinking_level: 'minimal',
              temperature: 0.1,
            },
            response_format: {
              type: 'text',
              mime_type: 'application/json',
              schema: isBalanceScan ? BALANCE_SCHEMA : RECEIPT_SCHEMA,
            },
          }),
        });

        if (!res.ok) {
          lastStatus = res.status;
          lastErr = await res.text().catch(() => 'Upstream error');
          if ([401, 403, 429, 500, 503].includes(res.status)) {
            continue;
          }
          break;
        }

        const data = await res.json();
        const text = extractJsonText(data);
        if (!text) {
          lastErr = 'Empty model output';
          continue;
        }

        return new Response(
          JSON.stringify({
            jenis_scan: isBalanceScan ? 'saldo' : 'struk',
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
      } catch (err: any) {
        lastErr = err?.name === 'AbortError' ? 'Gemini upstream timeout' : err?.message || 'Fetch error';
      } finally {
        clearTimeout(timeoutId);
      }
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
