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
};
