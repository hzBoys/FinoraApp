# CLAUDE.md — Finora Project Context & Specifications

Dokumen ini adalah panduan utama dan *source of truth* untuk Claude Code dalam memahami, merancang, dan mengembangkan proyek **Finora**. Seluruh kode, skema database, endpoint API, dan komponen UI yang dibuat harus mengikuti spesifikasi di bawah ini.

---

## 1. Gambaran Umum Proyek (Project Overview)
- **Nama Proyek:** Finora — Aplikasi Manajemen Keuangan Pribadi
- **Target Pengguna:** Mahasiswa dan pekerja muda / *first-jobber* (usia produktif 18–35 tahun).
- **Tujuan Sistem:** Asisten manajemen keuangan pribadi mandiri berbasis pemroses data transaksi otomatis (OCR) dan konsolidasi saldo terpadu untuk mengatasi kelelahan mencatat manual, saldo yang terfragmentasi di berbagai platform, serta alokasi anggaran bulanan yang tidak terstruktur.
- **Platform:** Aplikasi Mobile Cross-Platform (Android & iOS).
- **Tech Stack Utama:**
  - **Frontend:** React Native dengan Expo (menangani UI/UX, kamera/galeri untuk unggah gambar, state management, dan visualisasi dashboard).
  - **Backend:** RESTful API (menangani autentikasi, manajemen database transaksi & akun, integrasi mesin OCR, kategorisasi otomatis, dan algoritma penganggaran).
  - **Teknologi Kunci:** Optical Character Recognition (OCR) untuk ekstraksi teks dari foto struk belanja dan *screenshot* mutasi/saldo.
  - **Batasan (Constraints):** Dikembangkan tanpa alokasi server komersial berbayar (mengutamakan layanan *free-tier* / *open-source* / lokal yang efisien) serta wajib menjaga privasi data finansial pengguna.

---

## 2. Modul & Fitur Utama (Core Submodules)

Sistem didekomposisi menjadi 3 submodul utama beserta fitur pendukungnya:

### A. Modul 1: Magic Receipt (Otomatisasi Pencatatan & Kategorisasi Transaksi)
- **Input:** Foto struk fisik atau *screenshot* bukti pembayaran/transfer (`JPEG` atau `PNG`, ukuran maksimal `5 MB`).
- **Proses:**
  1. Validasi format (`JPEG`/`PNG`) dan ukuran file ($\le 5\text{ MB}$).
  2. Ekstraksi teks menggunakan Engine OCR untuk mendapatkan 4 atribut utama: **Tanggal (`tanggal`)**, **Nominal (`nominal`)**, **Nama Merchant (`merchant`)**, dan **Metode Pembayaran (`metode_bayar`)**.
  3. Pemetaan otomatis (*auto-categorization*) transaksi ke dalam kategori pengeluaran standar (misal: Makanan, Transportasi, Hiburan, dll.) tanpa mengharuskan pemilihan manual.
  4. Menampilkan halaman *Review Transaksi* agar pengguna dapat mengonfirmasi/mengoreksi hasil ekstraksi sebelum disimpan ke database.
- **Output:** Catatan transaksi terstruktur & tervalidasi di database, pembaruan histori transaksi.
- **Target Engineering Requirement (ER-1.1 & ER-1.2):**
  - Waktu ekstraksi OCR $< 3\text{ detik}$ dengan tingkat akurasi $\ge 90\%$.
  - Mendukung file `JPEG`/`PNG` hingga `5 MB` ($5.000.000\text{ byte}$).

### B. Modul 2: Auto-Portfolio (Konsolidasi Saldo Multi-Akun)
- **Input:** *Screenshot* tampilan saldo dari berbagai aplikasi keuangan pengguna (Bank, E-Wallet, Platform Investasi).
- **Proses:**
  1. Unggah *screenshot* saldo akun keuangan.
  2. Ekstraksi nominal saldo dan identifikasi akun menggunakan OCR (`ProsesOCRSaldo`).
  3. Pengguna meninjau hasil ekstraksi saldo (`ReviewSaldo`) dan menyimpannya.
  4. Sistem memperbarui saldo akun terkait (tanpa membuat duplikasi akun jika akun sudah ada) dan menghitung ulang akumulasi total portofolio.
- **Output:** Rincian saldo tiap akun dan akumulasi total portofolio keuangan pada satu tampilan Dashboard.
- **Target Engineering Requirement (ER-2.1):**
  - Mampu merangkum dan menghitung akumulasi saldo dari minimal **5 akun keuangan berbeda** (kombinasi `bank`, `ewallet`, dan `investasi`).
  - Latensi respons pemuatan dashboard $< 2\text{ detik}$.

### C. Modul 3: Smart Advisor (Analisis & Rekomendasi Alokasi Anggaran)
- **Input:** Data historis pemasukan (`masuk`), pengeluaran (`keluar`), dan pengelompokan tipe kategori pengguna (`kebutuhan`, `gaya_hidup`, `tabungan`).
- **Proses:**
  1. Memeriksa kecukupan data historis transaksi pengguna pada periode berjalan/terpilih.
  2. Menganalisis pola arus kas dan menghitung persentase alokasi pengeluaran terhadap total pemasukan.
  3. Membandingkan realisasi pengeluaran dengan aturan penganggaran ideal (acuan dasar/simulasi: **60% Kebutuhan, 20% Gaya Hidup, 20% Tabungan** atau adaptif sesuai profil).
  4. Jika pengeluaran `gaya_hidup` melewati batas (misal $> 20\%$), sistem menghitung selisih kelebihan tersebut dan memberikan saran pengurangan nominal secara spesifik agar target tabungan tetap tercapai.
- **Output:** Persentase & nominal alokasi anggaran bulanan serta teks rekomendasi finansial personal.

### D. Fitur Pendukung
- **Autentikasi Pengguna:** Login & Register (penyimpanan *password hash*).
- **Pencatatan Manual:** Input pemasukan dan pengeluaran secara manual jika tidak menggunakan struk.
- **Dashboard Visual:** Ringkasan total saldo portofolio, pemantauan arus kas bulanan (pemasukan vs pengeluaran), dan grafik kondisi keuangan.

---

## 3. Skema Database (Entity Relationship Diagram / ERD)

Gunakan struktur tabel dan relasi berikut sebagai acuan pembuatan model database / migrasi (SQL/ORM):

### 1. Tabel `users`
- `user_id` : `INT` (Primary Key, Auto Increment)
- `nama` : `VARCHAR`
- `email` : `VARCHAR` (Unique)
- `password_hash` : `VARCHAR`
- `created_at` : `DATETIME`

### 2. Tabel `accounts` (Akun Keuangan / Portofolio)
- `account_id` : `INT` (Primary Key, Auto Increment)
- `user_id` : `INT` (Foreign Key $\rightarrow$ `users.user_id`)
- `nama_akun` : `VARCHAR` (Contoh: "Bank A", "E-Wallet A", "Investasi A")
- `tipe` : `ENUM('bank', 'ewallet', 'investasi')`
- `saldo` : `DECIMAL(15, 2)`
- `updated_at` : `DATETIME`

### 3. Tabel `categories` (Kategori Transaksi)
- `category_id` : `INT` (Primary Key, Auto Increment)
- `nama_kategori` : `VARCHAR` (Contoh: "Makanan", "Transportasi", "Hiburan", "Sembako", dll.)
- `tipe` : `ENUM('kebutuhan', 'gaya_hidup', 'tabungan')`

### 4. Tabel `transactions` (Data Transaksi)
- `transaction_id` : `INT` (Primary Key, Auto Increment)
- `user_id` : `INT` (Foreign Key $\rightarrow$ `users.user_id`)
- `category_id` : `INT` (Foreign Key $\rightarrow$ `categories.category_id`)
- `account_id` : `INT` (Foreign Key $\rightarrow$ `accounts.account_id`, Nullable jika tunai/tidak terikat akun spesifik)
- `tanggal` : `DATE`
- `nominal` : `DECIMAL(15, 2)`
- `merchant` : `VARCHAR`
- `metode_bayar` : `VARCHAR` (Contoh: "Tunai", "Dompet Digital", "Transfer Bank")
- `jenis` : `ENUM('masuk', 'keluar')`

### 5. Tabel `scan_results` (Log & Hasil Ekstraksi OCR)
- `scan_id` : `INT` (Primary Key, Auto Increment)
- `user_id` : `INT` (Foreign Key $\rightarrow$ `users.user_id`)
- `transaction_id` : `INT` (Foreign Key $\rightarrow$ `transactions.transaction_id`, Nullable untuk scan saldo)
- `jenis_scan` : `ENUM('struk', 'saldo')`
- `file_url` : `VARCHAR`
- `teks_ocr` : `TEXT`
- `status` : `VARCHAR` (Contoh: `'pending'`, `'success'`, `'failed'`)

### 6. Tabel `budgets` (Alokasi Anggaran Bulanan)
- `budget_id` : `INT` (Primary Key, Auto Increment)
- `user_id` : `INT` (Foreign Key $\rightarrow$ `users.user_id`)
- `periode` : `VARCHAR` (Contoh: `"2026-09"` atau `"September 2026"`)
- `persen_kebutuhan` : `DECIMAL(5, 2)`
- `persen_gaya_hidup` : `DECIMAL(5, 2)`
- `persen_tabungan` : `DECIMAL(5, 2)`

### 7. Tabel `recommendations` (Saran Smart Advisor)
- `recommendation_id` : `INT` (Primary Key, Auto Increment)
- `budget_id` : `INT` (Foreign Key $\rightarrow$ `budgets.budget_id`)
- `isi_saran` : `TEXT`
- `created_at` : `DATETIME`

---

## 4. Alur Kerja Sistem (State & Flowchart Logic)

1. **App Launch & Auth:**
   - `Splash Screen` $\rightarrow$ Cek sesi login.
   - Jika belum login: masuk ke `Login` / `Register`. Validasi kredensial; jika gagal tampilkan pesan error.
   - Jika autentikasi valid: arahkan ke `Dashboard`.
2. **Alur Magic Receipt:**
   - Dari `Dashboard` $\rightarrow$ Pilih `Magic Receipt` $\rightarrow$ Pilih/ambil foto struk atau bukti transfer.
   - Validasi file: Apakah format `JPEG`/`PNG` dan ukuran $\le 5\text{ MB}$?
     - Jika **Tidak Valid**: Tampilkan *alert/error message* gambar tidak valid dan kembali ke pemilihan gambar.
     - Jika **Valid**: Jalankan `Proses OCR` $\rightarrow$ Ekstrak `tanggal`, `nominal`, `merchant`, `metode_bayar` $\rightarrow$ Jalankan fungsi kategorisasi otomatis $\rightarrow$ Tampilkan layar `Review Transaksi` (pengguna dapat meninjau/mengoreksi) $\rightarrow$ Simpan transaksi ke tabel `transactions` & `scan_results` $\rightarrow$ Perbarui `Dashboard`.
3. **Alur Auto-Portfolio:**
   - Dari `Dashboard` $\rightarrow$ Pilih `Auto-Portfolio` $\rightarrow$ Unggah *screenshot* saldo (`bank` / `ewallet` / `investasi`).
   - Jalankan `Proses OCR Saldo` $\rightarrow$ Tampilkan layar `Review Saldo` untuk konfirmasi pengguna $\rightarrow$ Simpan/perbarui nilai saldo pada tabel `accounts` dan hitung ulang total portofolio $\rightarrow$ Perbarui `Dashboard`.
4. **Alur Smart Advisor:**
   - Dari `Dashboard` $\rightarrow$ Pilih `Smart Advisor` $\rightarrow$ Ambil histori pemasukan dan pengeluaran dari database.
   - Cek apakah data historis cukup untuk dianalisis:
     - Jika **Belum Cukup**: Tampilkan informasi bahwa data historis belum mencukupi.
     - Jika **Cukup**: Analisis pola pengeluaran berdasarkan tipe kategori (`kebutuhan`, `gaya_hidup`, `tabungan`) $\rightarrow$ Hitung persentase alokasi anggaran $\rightarrow$ Hasilkan dan tampilkan rekomendasi (simpan ke `budgets` dan `recommendations`).

---

## 5. Skenario Pengujian Acuan (Acceptance Criteria / Test Cases)

Pastikan logika kode yang ditulis mampu lulus keempat skenario pengujian *Black Box* berikut:

1. **TC-01 (Ekstraksi Bukti Pembayaran - ER-1.1):**
   - Menerima unggahan gambar `JPEG` (1 MB), `PNG` (2 MB), hingga batas tepat `5 MB` ($5.000.000\text{ byte}$). File di atas 5 MB atau format selain JPEG/PNG harus ditolak dengan pesan yang jelas.
   - Berhasil mengekstrak 4 atribut: Tanggal (contoh: `01/10/2026`), Nominal (contoh: `Rp75.000`), Merchant (contoh: `Toko Sembako Uji`), dan Metode Pembayaran (contoh: `tunai`) tanpa ada atribut kosong.
2. **TC-02 (Kategorisasi Otomatis - ER-1.2):**
   - Kata kunci merchant/item seperti `"Makan Siang"` otomatis dipetakan ke kategori **Makanan** (tanpa mengubah nominal).
   - Kata kunci seperti `"Bus Kota"` otomatis dipetakan ke kategori **Transportasi**.
   - Kata kunci seperti `"Bioskop"` otomatis dipetakan ke kategori **Hiburan**.
   - Kategori tetap tersimpan dengan benar saat transaksi dibuka kembali.
3. **TC-03 (Konsolidasi Multi-Akun - ER-2.1):**
   - Mampu menyimpan dan menampilkan minimal 5 akun berbeda sekaligus (contoh: `Bank A` Rp1.500.000, `Bank B` Rp2.000.000, `E-Wallet A` Rp250.000, `E-Wallet B` Rp350.000, `Investasi A` Rp900.000 $\rightarrow$ Total `Rp5.000.000`).
   - Ketika satu akun diperbarui (misal `Bank A` di-*update* menjadi `Rp1.750.000`), total portofolio otomatis terakumulasi menjadi `Rp5.250.000` dan jumlah akun tetap 5 (**tidak terjadi duplikasi akun/saldo ganda**).
4. **TC-04 (Rekomendasi Anggaran Bulanan - ER-3.1):**
   - Contoh kasus: Pemasukan `Rp5.000.000`, pengeluaran Kebutuhan `Rp3.000.000` (60%), Gaya Hidup `Rp1.000.000` (20%), Sisa/Tabungan `Rp1.000.000` (20%). Sistem menampilkan alokasi ideal `60% / 20% / 20%` (Total 100% = Rp5.000.000).
   - Ketika pengeluaran Gaya Hidup naik menjadi `Rp1.500.000` (30%), sistem mendeteksi adanya kelebihan di atas batas 20% dan memberikan saran spesifik untuk **mengurangi pengeluaran gaya hidup sebesar `Rp500.000`** agar alokasi kembali ke target `60% / 20% / 20%`.

---

## 6. Panduan Penulisan Kode untuk Claude Code (Coding Guidelines)

- **Bahasa Antarmuka (UI):** Gunakan Bahasa Indonesia yang bersih, modern, dan mudah dipahami oleh pengguna usia muda (mahasiswa & *first-jobber*).
- **Format Mata Uang:** Selalu tampilkan nominal uang dalam format Rupiah Indonesia (contoh: `Rp75.000` atau `Rp5.000.000`) pada sisi UI, namun simpan sebagai angka murni (`DECIMAL`/`NUMBER`) di database dan *state*.
- **Penanganan Error (Error Handling):** Pastikan setiap kegagalan unggah gambar (ukuran $> 5\text{ MB}$, format salah, atau teks OCR gagal terbaca) ditangani secara *graceful* dengan pesan error yang ramah pengguna dan menyediakan opsi *fallback* koreksi manual di layar Review.
- **Modularitas:** Pisahkan dengan rapi logika layanan untuk ketiga modul utama (`magicReceiptService`, `autoPortfolioService`, `smartAdvisorService`) agar mudah diuji secara independen sesuai tabel pengujian di atas.