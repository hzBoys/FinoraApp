---
name: Finora Design System
colors:
  surface: '#f8faf8'
  surface-dim: '#d8dad9'
  surface-bright: '#f8faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f2'
  surface-container: '#eceeec'
  surface-container-high: '#e6e9e7'
  surface-container-highest: '#e1e3e1'
  on-surface: '#191c1b'
  on-surface-variant: '#414845'
  inverse-surface: '#2e3130'
  inverse-on-surface: '#eff1ef'
  outline: '#717974'
  outline-variant: '#c1c8c3'
  surface-tint: '#426558'
  primary: '#002218'
  on-primary: '#ffffff'
  primary-container: '#14382c'
  on-primary-container: '#7da292'
  inverse-primary: '#a8cfbe'
  secondary: '#006c48'
  on-secondary: '#ffffff'
  secondary-container: '#92f7c3'
  on-secondary-container: '#00734d'
  tertiary: '#0b2113'
  on-tertiary: '#ffffff'
  tertiary-container: '#203727'
  on-tertiary-container: '#87a08c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4ebd9'
  primary-fixed-dim: '#a8cfbe'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#2a4d40'
  secondary-fixed: '#92f7c3'
  secondary-fixed-dim: '#75daa8'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005235'
  tertiary-fixed: '#cee9d3'
  tertiary-fixed-dim: '#b3cdb7'
  on-tertiary-fixed: '#092012'
  on-tertiary-fixed-variant: '#354c3b'
  background: '#f8faf8'
  on-background: '#191c1b'
  surface-variant: '#e1e3e1'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  currency-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  currency-display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  currency-item:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
Sistem desain ini dibangun untuk menghadirkan rasa tenang, kendali penuh, dan stabilitas finansial bagi mahasiswa serta profesional muda usia 18–35 tahun. Menghindari kesan kaku perbankan konvensional maupun kecemasan visual akibat peringatan anggaran yang agresif, estetika yang diusung adalah *Warm Organic Fintech Minimalism*.

Karakteristik visual utama:
- **Ketenangan Emosional (*Calm & Composed*):** Menggunakan bidang negatif lapang, hierarki informasi yang jernih, dan visualisasi data monokromatis bernuansa botani untuk meredam stres finansial.
- **Kejelasan Utilitarian:** Menitikberatkan keterbacaan angka nominal dan transparansi alur kas dengan tata letak ramah jangkauan satu tangan (*thumb-zone priority*).
- **Presisi Modern:** Mengombinasikan sudut lengkung lembut kontemporer, garis pembatas berbobot ultra-halus (*hairline borders*), dan interaksi taktil mikro yang berbobot subtil.

## Colors
Palet warna dirancang untuk memberikan kontras fungsional tinggi yang memenuhi standar keterbacaan WCAG AAA pada teks inti dan data numerik, sembari memancarkan kehangatan alami.

- **Primary (`#14382C` - Deep Forest):** Digunakan untuk elemen penahan pandangan utama, kartu neraca prioritas tinggi, *primary buttons*, dan navigasi aktif. Memberikan bobot kepercayaan perbankan institusional tanpa kekakuan biru korporat.
- **Secondary (`#52B788` - Soft Sage):** Aksen fungsional untuk visualisasi tren positif, grafik tabungan, indikator pencapaian anggaran, dan status berhasil.
- **Tertiary (`#D8F3DC` - Mint Frost):** Warna pengisi berintensitas rendah untuk *pill badges*, penanda kategori transaksi, dan area sorotan sekunder.
- **Surface & Background (`#F4F6F4` - Warm Alabaster):** Latar belakang kanvas dasar yang hangat, mengurangi keletihan mata dibandingkan putih mutlak (`#FFFFFF`).
- **Surface Card (`#FFFFFF` - Crisp White):** Permukaan kontainer konten untuk memisahkan data transaksi dengan batas tepi (`#E5E9E7`).
- **Text Primary (`#111827` - Dark Slate Charcoal):** Standar mutlak untuk angka mata uang Rupiah dan judul utama demi keterbacaan kontras tinggi.
- **Text Secondary (`#4B5563` - Slate Subdued):** Digunakan untuk label kategori, tanggal transaksi, dan teks pendukung.
- **Functional Semantics:**
  - *Expense / Alert:* Terakota teredam (`#C84B31`) berlatar `#FDF2F0`.
  - *Income / Surplus:* Emerald fungsional (`#1B4332`) berlatar `#EBF7F0`.

## Typography
Tipografi menggunakan keluarga jenis huruf tunggal **Plus Jakarta Sans** untuk menjaga kepatuhan struktural modern yang ergonomis dan geometris.

Aturan penerapan:
- **Tabular Figures (`tnum`):** Wajib diterapkan di seluruh elemen penyajian numerik (saldo, ringkasan mutasi, grafik alokasi pos, dan input nominal uang) melalui fitur OpenType `font-variant-numeric: tabular-nums` atau `font-feature-settings: "tnum" 1`. Hal ini menjamin keselarasan vertikal titik desimal dan pemisah ribuan.
- **Prefix Simbol Mata Uang:** Penulisan nominal mata uang menggunakan format baku Indonesia `Rp` yang diletakkan berdampingan tanpa spasi lebar (`Rp1.500.000`), di mana simbol `Rp` menggunakan bobot reguler atau medium satu tingkat di bawah bobot digit numerik untuk memfokuskan atensi pembaca pada nilai riil.
- **Keterbacaan Label Mikro:** Label pelengkap seperti status transfer, indikator tanggal, dan kategori dompet disajikan dalam format teks proporsional dengan peningkatan jarak antar karakter (*letter-spacing*) untuk memastikan legibilitas pada resolusi layar genggam padat.

## Layout & Spacing
Sistem tata letak mengutamakan kenyamanan penggunaan dengan satu tangan (*one-handed mobile reachability*) berbasis ritme kelipatan dasar 4px dan 8px.

- **Filosofi Jangkauan Satu Tangan (Mobile Ergonomics):**
  - Komponen aksi utama, tombol penambah mutasi cepat (*Quick Add FAB*), navigasi tab bawah, dan kartu filter anggaran ditempatkan pada zona jangkauan jempol bawah (sepertiga bawah layar).
  - Tampilan saldo kumulatif dan visual grafik ringkasan ditempatkan pada separuh layar atas sebagai zona observasi statis.
- **Skala Grid & Responsivitas:**
  - **Mobile (< 768px):** 4-kolom fluid grid dengan `margin` 16px (`1rem`) dan `gutter` 16px (`1rem`). Konten tersusun tumpuk vertikal dengan *bottom sheet* modal untuk input transaksi.
  - **Tablet (768px - 1023px):** 8-kolom fluid grid dengan `margin` 32px (`2rem`) dan `gutter` 24px (`1.5rem`). Rasio visual kartu pengeluaran dan ringkasan anggaran berdampingan secara proporsional.
  - **Desktop (≥ 1024px):** 12-kolom fluid grid dengan pembatas lebar maksimal wadah (*container max-width*) sebesar 1120px untuk menjaga fokus visibilitas lembar pembukuan keuangan.

## Elevation & Depth
Kedalaman antarmuka dicapai melalui kombinasi *tactile surface layers*, pembatas berdensitas rendah (*subtle borders*), dan bayangan ambient bernuansa hangat, bukan abu-abu mati.

- **Batas Fisik Lembut (*Hairline Structure*):** Seluruh elemen kontainer kartu dan lembar kerja transaksi menggunakan batas tepi fisik sebesar 1px solid dengan warna `#E5E9E7`.
- **Tingkatan Bayangan (*Shadow Tiers*):**
  - **Level 0 (Flat):** Permukaan kanvas utama (`#F4F6F4`) tanpa bayangan.
  - **Level 1 (Card & List):** Bayangan ambient difus untuk kartu mutasi dan kartu saldo sekunder: `box-shadow: 0 2px 8px -2px rgba(20, 56, 44, 0.04), 0 1px 3px -1px rgba(20, 56, 44, 0.02)`.
  - **Level 2 (Active Focus & Sticky Bar):** Bilah navigasi melayang (*floating bottom navigation*) dan kartu dompet terpilih: `box-shadow: 0 10px 24px -4px rgba(20, 56, 44, 0.08), 0 4px 8px -2px rgba(20, 56, 44, 0.03)`.
  - **Level 3 (Modal & Sheet):** *Bottom sheet* interaksi pencatatan nominal dan menu dialog: `box-shadow: 0 20px 32px -8px rgba(17, 24, 39, 0.12), 0 8px 16px -4px rgba(20, 56, 44, 0.04)`.
- **Hierarki Lapisan (*Tonal Stacking*):**
  Elemen bertingkat disusun berdasarkan kontras warna permukaan: Latar Layar (`#F4F6F4`) → Kartu Modul (`#FFFFFF`) → Area Data Terisolasi / Input Box (`#F8F9FA` atau `#F4F6F4`) → Elemen Sorot Utama (`#14382C`).

## Shapes
Sistem bentuk mengadopsi tingkat kelengkungan modern-organik yang konsisten untuk memberikan kesan bersahabat namun tetap presisi:

- **Base Radius (`rounded-md` - 8px / 0.5rem):** Digunakan untuk bidang input teks, kotak pemilih tanggal (*date picker inputs*), dan *checkbox*.
- **Container Radius (`rounded-lg` - 16px / 1rem):** Digunakan untuk kartu transaksi, ringkasan mutasi, dan wadah modul statistik bulanan.
- **Hero & Modal Radius (`rounded-xl` - 24px / 1.5rem):** Digunakan untuk kartu saldo utama (*total net worth card*), penampung *bottom sheet*, dan panel alokasi anggaran interaktif.
- **Pill Utility (`rounded-full`):** Digunakan secara ketat untuk indikator kategori transaksi (*category chips*), tombol tindakan cepat (*action buttons*), dan penanda status verifikasi kas.

## Components
Komponen antarmuka diformulasikan untuk menjamin kecepatan input harian dan pembacaan data instan:

- **Buttons (Tombol):**
  - *Primary:* Berlatar `#14382C` dengan teks `#FFFFFF`, sudut lengkung `rounded-full` atau `rounded-lg` (tinggi 48px pada mobile untuk ergonomi sentuh). Memberikan respons taktil berskala `scale(0.98)` saat ditekan.
  - *Secondary / Accent:* Berlatar `#D8F3DC` dengan teks `#14382C` dan bobot semi-bold, digunakan untuk aksi non-destruktif seperti "Unduh Laporan" atau "Ubah Dompet".
  - *Ghost / Tertiary:* Tanpa latar, warna teks `#4B5563`, batas transparan untuk aksi batal atau navigasi kembali.

- **Chips & Kategori Anggaran:**
  - Tampilan ringkas dengan tinggi 32px, radius `rounded-full`, dan padding horizontal 12px.
  - State aktif menggunakan latar `#14382C` berteks putih; state pasif menggunakan latar `#FFFFFF` dengan batas tepi `#E5E9E7` dan teks `#4B5563`.

- **Cards (Kartu Transaksi & Saldo):**
  - *Hero Balance Card:* Latar belakang kontras tinggi Deep Forest `#14382C` atau Deep Emerald `#1B4332`, teks putih, angka saldo tabular berukuran besar, dilengkapi aksen dekoratif garis isolasi halus.
  - *Transaction List Item Card:* Latar `#FFFFFF`, batas tepi `#E5E9E7`, padding 16px. Menempatkan ikon kategori dalam lingkaran `#F4F6F4` di sisi kiri, nama transaksi dan tanggal di tengah, serta angka nominal berbobot tebal di sisi kanan (dengan awalan `+` bernuansa hijau `#1B4332` untuk pemasukan, dan `-` bernuansa gelap `#111827` untuk pengeluaran).

- **Input Fields (Nominal & Transaksi):**
  - *Amount Display Input:* Input nominal utama dengan ukuran teks 32px tabular, berpusat atau rata kiri, borderless dengan garis bawah lembut, meniadakan distraksi bingkai bertumpuk saat mencatat pengeluaran harian.
  - *Standard Form Fields:* Latar belakang `#FFFFFF`, tinggi 48px, border 1px solid `#E5E9E7`, radius `rounded-md`. State fokus ditandai dengan transisi border ke `#52B788` tanpa bayangan luar yang tebal.

- **Lists & Section Dividers:**
  - Pengelompokan daftar transaksi berdasarkan tanggal menggunakan pemisah judul tanggal berukuran `label-sm` berwarna `#4B5563` dengan garis pembatas berbobot 1px horizontal.

- **Checkboxes & Toggle Switches:**
  - *Toggle Switch:* Berukuran proporsional 44x24px, track aktif berwarna `#52B788`, track inaktif `#E5E9E7`, dan thumb bundar putih `#FFFFFF` dengan shadow lembut level 1.