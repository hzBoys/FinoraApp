# Phase 2B: Auto-Portfolio Balance OCR, Multi-Account (>= 5) & Smart Advisor AI + Full E2E QA

**Tanggal**: 2026-11-02 23:55 WIB  
**PIC**: Naufal Saifullah Yusuf (`103062300091` — Backend Developer)

## Ringkasan Perubahan

1. **Shared 14-Key Round-Robin Gemini Engine (`src/services/ai/geminiClient.ts`)**:
   - Menyatukan rotasi Round-Robin 14 API Key Gemini (`gemini-3.5-flash-lite`, `/v1beta/interactions`, `Api-Revision: 2026-05-20`, `store: false`, `thinking_level: 'minimal'`) beserta mekanisme *per-key rate-limit cooldown* (`429`/`503` -> 60 detik) untuk dipakai bersama oleh Magic Receipt, Auto-Portfolio, dan Smart Advisor.
   - Merefaktor `src/services/ai/geminiReceiptService.ts` agar menggunakan engine terpusat.

2. **Auto-Portfolio Scan Screenshot Saldo (`ER-2.1`) & Manajemen Multi-Akun `>= 5` (`TC-03`)**:
   - Menambahkan `src/services/ai/geminiPortfolioService.ts` (`extractBalanceWithGemini`) untuk mengekstrak `nama_akun` (`BCA`, `Mandiri`, `GoPay`, `OVO`, `Bibit`, dll.), `tipe` (`bank | ewallet | investasi`), dan `saldo` dari screenshot m-Banking/E-Wallet/Investasi.
   - Memperbarui `src/services/db/storageService.ts` untuk mendukung awalan file `saldo_...` pada bucket privat `receipts`.
   - Memperbarui `src/services/db/accountService.ts` (`upsertAccount`) dan `src/controllers/usePortfolio.ts` (`updateBalance`) agar mengembalikan UUID PostgreSQL asli serta menjaga pembaruan saldo bebas duplikasi (`ON CONFLICT (user_id, nama_akun)`).
   - Menambahkan controller `src/controllers/useAutoPortfolioScan.ts`, modal `src/views/components/modals/AutoPortfolioModal.tsx` (tab **Scan Saldo AI** & **Kelola Akun**), tombol aksi `Scan / Kelola` pada `BalanceHeroCard.tsx`, serta pencocokan ikon cerdas di `CategoryIconBadge.tsx`.

3. **Smart Advisor AI (`SD-AI-02` / `ER-3.1` / `TC-04`) & Persistensi `public.recommendations`**:
   - Menambahkan `src/services/ai/geminiAdvisorService.ts` (`generateSmartAdvisorNarrative`) yang mengombinasikan hasil kalkulasi deterministik rasio `60/20/20` (`analyzeSmartAdvisor`) dengan narasi rekomendasi personal dari `gemini-3.5-flash-lite`.
   - Menambahkan `fetchLatestRecommendation` pada `src/services/db/budgetService.ts` serta aksi `refreshAiAdvisor` pada `src/controllers/useBudget.ts` untuk menyimpan dan memuat riwayat saran dari tabel `public.recommendations`.
   - Memperbarui `AdvisorCard.tsx` (dengan tombol **Analisis AI**), `HomeScreen.tsx`, `BudgetScreen.tsx`, `TransactionsScreen.tsx`, `TransactionRowItem.tsx` (dukungan tekan-lama hapus transaksi atomik), serta Edge Functions `supabase/functions/ai-extract-document/index.ts` dan `supabase/functions/ai-smart-advisor/index.ts`.

## Verifikasi & QA End-to-End (Phase 1 s.d. Phase 2B)

- `npx tsc --noEmit`: **0 error**.
- `npx expo-doctor`: **20/20 checks passed**.
- **Automated Live Cloud QA Suite (`QA-01` s.d. `QA-12`)**: **12/12 LULUS 100%** pada Supabase Cloud (`ophepwhbraswwuizyssv`) dan Gemini Cloud (`gemini-3.5-flash-lite`, rotasi terverifikasi `Key#1 -> Key#2 -> Key#3 -> Key#4`), diakhiri pembersihan penuh seluruh data uji (`0` data residu).
