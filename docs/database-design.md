# Perancangan Skema Database PostgreSQL (Supabase) - Finora Mobile App

Dokumen ini memuat hasil *brainstorming*, analisis kebutuhan data, relasi antar tabel (ERD), dan rujukan arsitektur database PostgreSQL di platform Supabase untuk aplikasi Finora.

---

## 1. Hasil Brainstorming & Analisis Kebutuhan Data

### A. Integrasi dengan Supabase Auth
- **Tantangan:** Supabase telah memiliki skema internal `auth.users` yang menyimpan kredensial dan enkripsi kata sandi secara aman.
- **Solusi:**
  - Tabel profil publik diberi nama `public.users`.
  - Kolom `id` pada `public.users` bertipe `UUID PRIMARY KEY` dan merujuk langsung ke `auth.users(id)` dengan relasi `ON DELETE CASCADE`.
  - Dibuatkan trigger otomatis `on_auth_user_created` di PostgreSQL: Setiap kali pengguna mendaftar melalui `supabase.auth.signUp()`, PostgreSQL secara otomatis menyisipkan profil ke `public.users`, serta membuat akun awal (`Bank`, `E-Wallet`, `Investasi`, `Tunai`) dan anggaran bulan berjalan.

### B. Modul 1: Magic Receipt (Otomatisasi Catatan Transaksi)
- **Kebutuhan Kolom:**
  - Menyimpan hasil ekstraksi OCR: `tanggal`, `nominal`, `merchant`, `metode_bayar`, serta keterkaitan dengan gambar struk (`file_url`).
  - Menyimpan log riwayat pemindaian pada tabel `scan_results`.
  - Menghubungkan setiap mutasi pengeluaran ke akun sumber dana (`account_id`) agar saldo portofolio otomatis terpotong saat transaksi dikonfirmasi.

### C. Modul 2: Auto-Portfolio (Konsolidasi Multi-Akun)
- **Kebutuhan Atribut:**
  - Jenis akun distandarisasi tanpa merk dagang: `tipe ENUM('bank', 'ewallet', 'investasi', 'tunai')`.
  - Constraint Unik: `CONSTRAINT uq_user_account_name UNIQUE (user_id, nama_akun)` untuk memenuhi kriteria uji **TC-03** (mencegah duplikasi nama akun saat pengguna memperbarui saldo).

### D. Modul 3: Smart Advisor & Anggaran 60/20/20
- **Kebutuhan Relasi:**
  - Tabel `categories` memiliki atribut `tipe ENUM('kebutuhan', 'gaya_hidup', 'tabungan')`.
  - Tabel `budgets` menyimpan alokasi per periode bulanan (`periode VARCHAR`), misal `'2026-10'`, dengan persentase ideal `60.00 / 20.00 / 20.00`.
  - Tabel `recommendations` berelasi `N:1` ke `budgets` untuk menyimpan saran personal reduksi pengeluaran gaya hidup jika melewati batas 20%.

---

## 2. Diagram Relasi Entitas (Entity Relationship / ERD)

```
        auth.users (Supabase Auth)
             │
             │ 1 : 1 (Auto Trigger)
             ▼
        public.users
        ├── id (PK, UUID)
        ├── nama
        ├── username
        ├── email
        ├── avatar_url
        └── theme_mode
             │
             ├─── 1:N ───► public.accounts (Bank, E-Wallet, Investasi, Tunai)
             │                 ├── id (PK, UUID)
             │                 ├── user_id (FK)
             │                 ├── nama_akun
             │                 ├── tipe ('bank', 'ewallet', 'investasi', 'tunai')
             │                 └── saldo
             │                     │
             ├─── 1:N ──────┐      │ 1:N (Nullable)
             │              ▼      ▼
             │         public.transactions
             │         ├── id (PK, UUID)
             │         ├── user_id (FK)
             │         ├── account_id (FK -> accounts)
             │         ├── category_id (FK -> categories)
             │         ├── nama / merchant
             │         ├── nominal
             │         ├── jenis ('masuk', 'keluar')
             │         └── tanggal
             │              ▲
             │              │ 1:1 (Nullable)
             ├─── 1:N ───► public.scan_results (Log OCR Magic Receipt & Saldo)
             │         ├── id (PK, UUID)
             │         ├── user_id (FK)
             │         ├── transaction_id (FK -> transactions)
             │         ├── jenis_scan ('struk', 'saldo')
             │         ├── file_url
             │         └── teks_ocr
             │
             └─── 1:N ───► public.budgets (Alokasi Bulanan 60/20/20)
                       ├── id (PK, UUID)
                       ├── user_id (FK)
                       ├── periode (e.g. '2026-10')
                       ├── total_anggaran
                       ├── persen_kebutuhan (60%)
                       ├── persen_gaya_hidup (20%)
                       └── persen_tabungan (20%)
                            │
                            │ 1:N
                            ▼
                       public.recommendations (Saran Smart Advisor)
                       ├── id (PK, UUID)
                       ├── budget_id (FK)
                       ├── isi_saran
                       └── lifestyle_reduction_needed
```

---

## 3. Rincian Tabel dan Tipe Data

| Tabel | Kolom Utama | Tipe Data & Constraint | Keterangan Fungsional |
|---|---|---|---|
| **`users`** | `id`<br>`nama`<br>`username`<br>`email`<br>`avatar_url`<br>`theme_mode` | `UUID PRIMARY KEY REFERENCES auth.users`<br>`VARCHAR(100) NOT NULL`<br>`VARCHAR(50) UNIQUE NOT NULL`<br>`VARCHAR(150) UNIQUE NOT NULL`<br>`TEXT`<br>`ENUM('light', 'dark', 'system')` | Profil pengguna tersinkron dengan autentikasi Supabase & preferensi tema mobile. |
| **`accounts`** | `id`<br>`user_id`<br>`nama_akun`<br>`tipe`<br>`saldo` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()`<br>`UUID REFERENCES users(id)`<br>`VARCHAR(50) NOT NULL`<br>`ENUM('bank', 'ewallet', 'investasi', 'tunai')`<br>`NUMERIC(15, 2) CHECK (saldo >= 0)` | Akun keuangan portofolio (Bank, E-Wallet, Investasi, Tunai). Mencegah duplikasi nama akun via constraint unik. |
| **`categories`** | `id`<br>`user_id`<br>`nama_kategori`<br>`tipe`<br>`icon` | `SERIAL PRIMARY KEY`<br>`UUID NULL REFERENCES users(id)`<br>`VARCHAR(50) NOT NULL`<br>`ENUM('kebutuhan', 'gaya_hidup', 'tabungan')`<br>`VARCHAR(50)` | Kategori pengeluaran/pemasukan. `user_id = NULL` untuk kategori bawaan sistem. |
| **`transactions`** | `id`<br>`user_id`<br>`account_id`<br>`category_id`<br>`nama`<br>`nominal`<br>`jenis`<br>`tanggal` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()`<br>`UUID REFERENCES users(id)`<br>`UUID REFERENCES accounts(id)`<br>`INT REFERENCES categories(id)`<br>`VARCHAR(120) NOT NULL`<br>`NUMERIC(15, 2) CHECK (nominal > 0)`<br>`ENUM('masuk', 'keluar')`<br>`DATE NOT NULL DEFAULT CURRENT_DATE` | Pencatatan mutasi keuangan. Terhubung ke akun sumber dana dan pos kategori anggaran. |
| **`scan_results`** | `id`<br>`user_id`<br>`transaction_id`<br>`jenis_scan`<br>`teks_ocr`<br>`status` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()`<br>`UUID REFERENCES users(id)`<br>`UUID REFERENCES transactions(id)`<br>`ENUM('struk', 'saldo')`<br>`TEXT`<br>`VARCHAR(20) DEFAULT 'success'` | Audit trail log ekstraksi OCR Magic Receipt dan screenshot saldo portofolio. |
| **`budgets`** | `id`<br>`user_id`<br>`periode`<br>`total_anggaran`<br>`persen_kebutuhan`<br>`persen_gaya_hidup`<br>`persen_tabungan` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()`<br>`UUID REFERENCES users(id)`<br>`VARCHAR(20) NOT NULL`<br>`NUMERIC(15, 2) CHECK (total_anggaran >= 0)`<br>`NUMERIC(5, 2) DEFAULT 60.00`<br>`NUMERIC(5, 2) DEFAULT 20.00`<br>`NUMERIC(5, 2) DEFAULT 20.00` | Target pembagian pos anggaran bulanan berbasis aturan 60/20/20. |
| **`recommendations`** | `id`<br>`budget_id`<br>`isi_saran`<br>`lifestyle_reduction_needed` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()`<br>`UUID REFERENCES budgets(id)`<br>`TEXT NOT NULL`<br>`NUMERIC(15, 2) DEFAULT 0.00` | Catatan cerdas Smart Advisor berupa saran pemotongan pos gaya hidup. |

---

## 4. Keamanan Data (Row Level Security / RLS)

Sesuai batasan privasi finansial Finora, seluruh tabel diaktifkan **Row Level Security (RLS)**:
1. `users`: Hanya pemilik akun yang dapat membaca dan memperbarui profilnya (`auth.uid() = id`).
2. `accounts`: Pengguna hanya dapat melihat dan memanipulasi saldo akun miliknya (`auth.uid() = user_id`).
3. `categories`: Seluruh pengguna dapat membaca kategori sistem (`user_id IS NULL`), sedangkan kategori kustom hanya dapat diakses pembuatnya (`auth.uid() = user_id`).
4. `transactions`: Terisolasi penuh per pengguna (`auth.uid() = user_id`).
5. `scan_results`: Terisolasi penuh per pengguna (`auth.uid() = user_id`).
6. `budgets` & `recommendations`: Terisolasi penuh per pengguna (`auth.uid() = user_id`).

---

## 5. Optimasi Performa & Indeks (Latency < 2 Detik)

Untuk memenuhi target latensi ER-2.1 ($< 2\text{ detik}$):
- `CREATE INDEX idx_transactions_user_date ON transactions(user_id, tanggal DESC);` (Mempercepat riwayat mutasi & filter rentang tanggal).
- `CREATE INDEX idx_transactions_user_cat ON transactions(user_id, category_id);` (Mempercepat rekap pengeluaran per kategori anggaran).
- `CREATE INDEX idx_accounts_user ON accounts(user_id);` (Mempercepat kalkulasi total saldo portofolio di Beranda).
- `CREATE INDEX idx_budgets_user_periode ON budgets(user_id, periode);` (Mempercepat pemuatan dashboard anggaran bulanan).

---

## 6. Berkas DDL SQL

Seluruh kode pembuatan skema, tipe enum, tabel, relasi foreign key, trigger otomatis, indeks, dan kebijakan RLS telah dihimpun pada berkas:
👉 `docs/database-schema.sql`
