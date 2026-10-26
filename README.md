# Finora — Mobile Personal Finance Assistant

Finora adalah aplikasi asisten manajemen keuangan pribadi mandiri berbasis mobile (React Native & Expo) yang dirancang untuk mengatasi kelelahan mencatat transaksi manual, saldo yang terfragmentasi di berbagai platform, serta pengalokasian pos anggaran bulanan yang tidak terstruktur.

---

## Fitur Utama

- **Magic Receipt AI (OCR Scanner)**
  - Ekstraksi otomatis atribut mutasi (Merchant, Tanggal, Nominal, Metode Pembayaran) dari foto struk belanja atau bukti transfer (&le; 5 MB).
  - Pemetaan kategori otomatis (*Auto-Categorization*) ke pos Makanan, Transportasi, Belanja, Tagihan, dan Hiburan.
  - Layar konfirmasi interaktif sebelum mutasi memotong saldo akun.

- **Auto-Portfolio**
  - Konsolidasi saldo terpadu dari 4 pilar aset keuangan: **Bank**, **E-Wallet**, **Investasi**, dan **Tunai**.
  - Kalkulasi saldo portofolio dan arus kas (masuk vs keluar) secara otomatis dan *real-time*.

- **Smart Advisor & Anggaran**
  - Pemantauan alokasi pengeluaran berdasarkan aturan finansial: **60% Kebutuhan Pokok, 20% Gaya Hidup, 20% Tabungan**.
  - Analisis cerdas yang merekomendasikan batas reduksi nominal pengeluaran jika pos gaya hidup melebihi target.
  - Pengaturan batas anggaran bulanan fleksibel (Rekomendasi Otomatis Smart Advisor atau Kustom Manual per pos).

- **Autentikasi & Pengaturan Terintegrasi**
  - Manajemen sesi pengguna terintegrasi dengan Supabase Auth (GoTrue).
  - Pemulihan kata sandi *in-app* menggunakan kode verifikasi OTP 6 digit.
  - Kustomisasi preferensi notifikasi (pengingat catat harian, batas limit anggaran, laporan mingguan) yang tersinkronisasi dengan akun cloud.

---

## Arsitektur Proyek (MVC Architecture)

Aplikasi dibangun menggunakan pemisahan tanggung jawab yang modular:

```
finora/
├── src/
│   ├── constants/             # Token desain visual (Colors, Layout, Typography)
│   ├── models/                # Definisi entitas data & interface TypeScript
│   ├── controllers/           # State management hooks & submodule business logic
│   │   └── services/          # Pure services: Magic Receipt, Auto-Portfolio, Smart Advisor
│   ├── services/
│   │   ├── supabase.ts        # Client Supabase & konfigurasi persistent session
│   │   └── db/                # Layanan data: Account, Transaction, Profile, Budget, Notification
│   ├── context/               # Global Contexts: ThemeContext & AuthContext
│   └── views/
│       ├── components/        # Reusable UI components (Cards, Modals, Navigation, Icons)
│       └── screens/           # Layar utama: Home, Transactions, Budget, Profile, Auth
├── docs/                      # Dokumentasi perancangan, skema database SQL & PlantUML
├── .env.example               # Template variabel lingkungan untuk konfigurasi mandiri
├── App.tsx                    # Root orchestrator & font loader
└── package.json
```

---

## Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) (v0.88) dengan [Expo SDK 58](https://expo.dev/)
- **Bahasa:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL dengan Row Level Security)
- **Komponen Ikon:** [@expo/vector-icons](https://docs.expo.dev/guides/icons/) (Ionicons Apple-styled squircles)
- **Penyimpanan Lokal:** [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)
- **Kamera & Galeri:** [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)

---

## Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (versi LTS direkomendasikan)
- [Aplikasi Expo Go](https://expo.dev/go) pada perangkat smartphone Android atau iOS

### 2. Kloning & Pasang Dependensi
```bash
git clone <url-repository-anda>
cd finora
npm install
```

### 3. Konfigurasi Environment Variables
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Lengkapi kredensial Supabase Anda di dalam berkas `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-key
```

### 4. Menyiapkan Skema Database
Jalankan script SQL yang tersedia di `docs/database-schema.sql` pada **SQL Editor di Dashboard Supabase** Anda untuk membentuk tabel, trigger auto-provisioning akun, dan aturan Row Level Security (RLS).

### 5. Menjalankan Aplikasi via Expo Tunnel
Jalankan server pengembangan dengan mode *tunneling* agar dapat diakses dari smartphone tanpa harus berada di jaringan Wi-Fi yang sama:
```bash
npm run tunnel
```
Pindai **QR Code** yang tampil di terminal menggunakan aplikasi **Expo Go** pada smartphone Anda.

---

## Lisensi
Proyek ini didistribusikan di bawah lisensi MIT.
