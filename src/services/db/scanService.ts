import { isSupabaseConfigured, supabase } from '../supabase';

export type CreateScanLogInput = {
  userId: string;
  jenisScan?: 'struk' | 'saldo';
  fileUrl?: string | null;
  teksOcr?: string | null;
  merchantExtracted?: string | null;
  nominalExtracted?: number | null;
  kategoriExtracted?: string | null;
  metodeExtracted?: string | null;
  processingTimeMs?: number | null;
  status?: 'pending' | 'success' | 'failed';
};

export type StoredScanLog = {
  id: string;
  user_id: string;
  transaction_id: string | null;
  jenis_scan: 'struk' | 'saldo';
  file_url: string | null;
  teks_ocr: string | null;
  merchant_extracted: string | null;
  nominal_extracted: number | null;
  kategori_extracted: string | null;
  metode_extracted: string | null;
  processing_time_ms: number | null;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
};

export const scanService = {
  async createScanLog(input: CreateScanLogInput): Promise<string | null> {
    if (!isSupabaseConfigured || !input.userId || !input.userId.includes('-')) {
      return null;
    }

    try {
      const payload: Record<string, unknown> = {
        user_id: input.userId,
        jenis_scan: input.jenisScan ?? 'struk',
        file_url: input.fileUrl ?? null,
        teks_ocr: input.teksOcr ?? null,
        merchant_extracted: input.merchantExtracted ?? null,
        nominal_extracted:
          typeof input.nominalExtracted === 'number' && input.nominalExtracted > 0
            ? input.nominalExtracted
            : null,
        kategori_extracted: input.kategoriExtracted ?? null,
        metode_extracted: input.metodeExtracted ?? null,
        processing_time_ms:
          typeof input.processingTimeMs === 'number' ? Math.round(input.processingTimeMs) : null,
        status: input.status ?? 'success',
      };

      const { data, error } = await supabase
        .from('scan_results')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        console.warn('scanService.createScanLog warning:', error.message);
        return null;
      }

      return data?.id ?? null;
    } catch (err) {
      console.warn('scanService.createScanLog exception:', err);
      return null;
    }
  },

  async linkScanToTransaction(scanId: string, transactionId: string): Promise<boolean> {
    if (
      !isSupabaseConfigured ||
      !scanId ||
      !scanId.includes('-') ||
      !transactionId ||
      !transactionId.includes('-')
    ) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('scan_results')
        .update({ transaction_id: transactionId })
        .eq('id', scanId);

      if (error) {
        console.warn('scanService.linkScanToTransaction warning:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('scanService.linkScanToTransaction exception:', err);
      return false;
    }
  },

  async fetchScanHistory(userId: string, limit = 20): Promise<StoredScanLog[]> {
    if (!isSupabaseConfigured || !userId || !userId.includes('-')) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('scan_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) {
        if (error) console.warn('scanService.fetchScanHistory warning:', error.message);
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        transaction_id: row.transaction_id ?? null,
        jenis_scan: row.jenis_scan,
        file_url: row.file_url ?? null,
        teks_ocr: row.teks_ocr ?? null,
        merchant_extracted: row.merchant_extracted ?? null,
        nominal_extracted: row.nominal_extracted !== null ? Number(row.nominal_extracted) : null,
        kategori_extracted: row.kategori_extracted ?? null,
        metode_extracted: row.metode_extracted ?? null,
        processing_time_ms: row.processing_time_ms !== null ? Number(row.processing_time_ms) : null,
        status: row.status ?? 'success',
        created_at: row.created_at,
      }));
    } catch (err) {
      console.warn('scanService.fetchScanHistory exception:', err);
      return [];
    }
  },
};
