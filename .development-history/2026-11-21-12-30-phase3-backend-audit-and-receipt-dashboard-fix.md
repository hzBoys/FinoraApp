# Audit Ulang Backend, Perbaikan Bug Scan Struk -> Dashboard, & Penyelesaian Phase 3

**Tanggal**: 2026-11-21 12:30 WIB  
**PIC**: Naufal Saifullah Yusuf (`103062300091` — Backend Developer)

## 1. Akar Masalah Bug "Hasil Scan Struk Tidak Terdaftar di Dashboard" yang Diperbaiki

1. **Tanggal Struk di Luar Bulan Aktif & Tidak Bisa Diubah pada Modal Review**:
   - `MagicReceiptModal.tsx` sebelumnya hanya menampilkan tanggal hasil OCR secara statis (tidak bisa diedit), padahal `Arus Kas Bulan Ini` (`useTransactions.ts`) dan `Anggaran Bulanan` (`useBudget.ts`) memfilter ketat berdasarkan bulan aktif (`YYYY-MM`).
   - **Perbaikan**: Menambahkan `CalendarDatePickerModal` di layar Review Struk + *banner* peringatan otomatis beserta tombol 1 klik **"Pakai Hari Ini"** ketika tanggal struk berada di luar bulan berjalan.
2. **Bug Normalisasi Tanggal (`src/utils/date.ts`)**:
   - `buildDateResult()` sebelumnya mengembalikan `day/monthIndex/year` mentah bukan nilai ter-normalisasi (`safeDay/safeMonthIndex/safeYear`), dan `parseIsoOrDisplayDate()` belum mendukung format struk 2-digit tahun (`DD/MM/YY`) serta nama bulan Inggris (`Oct`/`Aug`/`May`/`Dec`).
   - **Perbaikan**: Seluruh parser tanggal kini mendukung ISO, `DD/MM/YYYY`, `DD/MM/YY`, serta nama bulan Indonesia & Inggris dengan normalisasi aman dan pengurutan transaksi deterministik (`compareDateStringsDesc`).
3. **Kegagalan Simpan ke DB yang Tersembunyi + *Race Condition* UUID Akun**:
   - `useMagicReceipt.ts` sebelumnya memanggil `reset()` sebelum `await onTransactionSaved()` dan tetap memunculkan alert `"Transaksi Berhasil Disimpan"` walaupun simpan ke Supabase gagal (`transactionId: null`). Selain itu, `App.tsx` tidak mengonversi `account_id` numerik *fallback* (`1`) ke UUID akun Supabase asli.
   - **Perbaikan**: Menambahkan kunci `isSaving` anti *double-tap*, *rollback* otomatis saldo & daftar transaksi saat simpan cloud gagal, resolusi otomatis UUID akun (`resolveTargetAccountId`), tautan atomik `p_scan_id`, serta pesan error jujur tanpa menghapus data hasil scan di modal Review.
4. **Normalisasi Nama Kategori & Pencocokan Merek Akun Pembayaran**:
   - Menambahkan `normalizeCategoryName()` (mis. `"Makanan"` / `"Makan & Minum"` -> `"Makan"`) di klien maupun RPC PostgreSQL agar `BudgetProgressCard` & `SmartAdvisor` selalu menghitung hasil scan struk secara akurat, serta `detectAccountBrandHint()` agar struk QRIS GoPay/BCA otomatis memilih akun spesifik pengguna (bukan akun generik bersaldo `Rp0`).

## 2. Penyelesaian Seluruh Tahap Backend (Phase 3 Hardening)

1. **Edit & Hapus Transaksi Atomik Lengkap (`update_transaction_atomic` & `delete_transaction_atomic`)**:
   - Menghubungkan `transactionService.updateTransactionAtomic()` ke `useTransactions.editTransaction()`, `App.tsx` (`handleTransactionUpdated` dengan rekonsiliasi saldo akun lama & baru secara atomik), `TransactionRowItem.tsx` (ketuk untuk ubah, tekan lama untuk hapus), dan `AddTransactionModal.tsx` (mode Ubah Transaksi + kunci `isSaving`).
2. **Manajemen Akun Lengkap & Hapus Akun Aman (`delete_account_safe`)**:
   - Menambahkan `accountService.deleteAccount()`, `usePortfolio.removeAccount()`, dan tombol hapus akun di `AutoPortfolioModal.tsx` dengan proteksi minimal 1 akun aktif.
3. **Cloud Storage Signed URL, Riwayat Scan, Persistensi Tema, & Pull-to-Refresh**:
   - Menambahkan `storageService.getReceiptSignedUrl()` & `deleteReceiptImage()`, `scanService.fetchScanHistory()`, persistensi `themeMode` ke `AsyncStorage` + `public.users.theme_mode`, validasi error profil unik (`23505`), impor statis `expo-image-picker` di `App.tsx`, serta `RefreshControl` di Beranda, Transaksi, dan Anggaran.
4. **Hardening Edge Functions & Migrasi SQL Phase 3 (`docs/phase3-backend-complete.sql`)**:
   - Memperkuat `supabase/functions/ai-extract-document/index.ts` & `ai-smart-advisor/index.ts` (verifikasi JWT Auth, batas 5 MB, timeout `45s`, failover `401/403/429/500/503`, bebas header CORS bermasalah) serta mendukung mode hibrida opsional `EXPO_PUBLIC_USE_EDGE_FUNCTIONS` di `geminiClient.ts`.
   - Menambahkan migrasi idempoten `docs/phase3-backend-complete.sql`: `normalize_finora_category()`, upgrade `create_transaction_atomic()` (auto-resolve akun + tautan atomik `p_scan_id`), `delete_account_safe()`, `get_dashboard_summary()`, dan indeks komposit performa.
