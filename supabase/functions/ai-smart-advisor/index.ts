// Supabase Edge Function: ai-smart-advisor (SD-AI-02 SmartAdvisorEngine)
// Deterministic 60/20/20 budget metrics -> Personalized Gemini 3.5 Flash-Lite advice
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

let advisorRoundRobinCursor = 0;

const ADVISOR_SCHEMA = {
  type: 'object',
  properties: {
    isi_saran: { type: 'string' },
  },
  required: ['isi_saran'],
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

    const body = await req.json();
    const {
      periode = '',
      total_income = 0,
      total_expense = 0,
      pct_kebutuhan = 0,
      pct_gaya_hidup = 0,
      pct_tabungan = 0,
      lifestyle_reduction_needed = 0,
      top_categories = '',
    } = body || {};

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
    const startIdx = advisorRoundRobinCursor % keys.length;
    advisorRoundRobinCursor = (startIdx + 1) % keys.length;
    const startedAt = Date.now();

    const prompt = [
      `Periode: ${periode}`,
      `Pemasukan: Rp${Number(total_income).toLocaleString('id-ID')}, Pengeluaran: Rp${Number(total_expense).toLocaleString('id-ID')}`,
      `Rasio 60/20/20 -> Kebutuhan: ${pct_kebutuhan}%, Gaya Hidup: ${pct_gaya_hidup}%, Tabungan: ${pct_tabungan}%`,
      `Pengurangan Gaya Hidup Diperlukan: Rp${Number(lifestyle_reduction_needed).toLocaleString('id-ID')}`,
      `Kategori Terbesar: ${top_categories}`,
      'Berikan isi_saran keuangan personal 2-3 kalimat ringkas dalam Bahasa Indonesia tanpa mengubah angka Rupiah di atas.',
    ].join('\n');

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
          system_instruction:
            'Anda adalah Finora Smart Advisor berbasis rasio 60/20/20. Susun saran keuangan personal 2-3 kalimat dalam Bahasa Indonesia menggunakan angka deterministik yang diberikan.',
          input: [{ type: 'text', text: prompt }],
          generation_config: {
            thinking_level: 'minimal',
            temperature: 0.25,
          },
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: ADVISOR_SCHEMA,
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
