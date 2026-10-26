# Finora Screen Architecture & UX Hierarchy

Dokumen arsitektur layar mobile untuk memandu tata letak, hirarki data, dan interaksi di seluruh alur Finora.

---

## 1. Prinsip Navigasi & Ergonomi Mobile

- **One-Handed Thumb Zone:** Aksi primer (Catat Transaksi, Tab Navigasi, Filter Chip) diposisikan di 2/3 bagian bawah layar.
- **Top Observation Area:** Ringkasan status dan angka kumulatif (Total Saldo, Arus Kas) diletakkan di bagian atas sebagai area pandang statis.
- **Dynamic Safe Area:**
  - Header memperhitungkan tinggi status bar Android (`StatusBar.currentHeight ?? 24`) dan iOS (`44px`).
  - Scroll container selalu menambahkan padding bottom sebesar `TAB_HEIGHT (56px) + BOTTOM_SAFE + 16px` agar konten paling bawah tidak tertutup tab bar.

---

## 2. Struktur Layar Utama

### A. Beranda (`home`)
1. **Top Bar:** Identitas aplikasi Finora + greeting personalisasi ("Halo, Teddy 👋") + thumbnail profil avatar.
2. **Hero Balance Card:**
   - Total Saldo Portofolio kumulatif (Rp2.450.000).
   - Breakdown 3 pilar: Bank (BCA & Mandiri), E-Wallet (GoPay & QRIS), Investasi (Reksadana).
3. **Quick Actions:**
   - Tombol utama "Catat Transaksi" (membuka modal).
   - Tombol sekunder "Pindai Struk".
4. **Magic Receipt Banner:** Kartu pemicu fitur AI ekstraksi struk belanja.
5. **Arus Kas Bulan Ini:** 2 kartu berdampingan (Pemasukan vs Pengeluaran konsumsi).
6. **Anggaran Bulanan:** Progress bar total anggaran terpakai + breakdown 4 kategori (Makan, Transportasi, Belanja, Tagihan).
7. **Smart Advisor:** Kartu rekomendasi finansial kontekstual berbasis data pengeluaran aktual.
8. **Transaksi Terbaru:** 4 item riwayat mutasi terakhir.

---

### B. Transaksi (`transactions`)
1. **Ringkasan Arus Kas Masuk/Keluar:** Kartu ringkasan total pemasukan dan total pengeluaran filter aktif.
2. **Search Input Bar:** Filter pencarian real-time berdasarkan nama transaksi atau kategori.
3. **Filter Chip Horizontal:** Kategori ('Semua', 'Pemasukan', 'Makan', 'Belanja', 'Transportasi', 'Tagihan', 'Transfer').
4. **Daftar Mutasi Lengkap:** Card putih berisi deretan transaksi yang difilter dengan indikator ikon kategori, tanggal, dan nominal.

---

### C. Anggaran (`budget`)
1. **Header Periode:** Penanda bulan aktif ("Oktober 2026").
2. **Kartu Ringkasan Total Anggaran:**
   - Total limit anggaran (Rp3.000.000) dan persentase terpakai.
   - Sisa anggaran dan total pengeluaran terpakai.
3. **Progress Bar Per Kategori:**
   - Makan & Minum (Rp900.000)
   - Transportasi (Rp500.000)
   - Belanja (Rp800.000)
   - Tagihan (Rp600.000)
   - Indikator warna dinamis: Hijau (`<75%`), Kuning (`75–99%`), Merah (`>=100%`).
4. **Notifikasi Alokasi:** Info jika ada porsi anggaran yang belum dialokasikan ke kategori.
5. **Smart Advisor Alert:** Peringatan otomatis kategori yang mendekati atau melebihi limit.

---

### D. Profil (`profile`)
1. **Avatar & Info Pengguna:**
   - Foto profil bulat dengan badge kamera (bisa pilih dari galeri via `expo-image-picker` atau fallback inisial).
   - Nama, handle, dan tag badge "Pengguna Finora".
2. **Ringkasan Akun Portofolio:** Kartu warna primer Deep Forest menampilkan status akun ("Personal Demo") dan total saldo portofolio.
3. **Grup Menu Pengaturan:**
   - Preferensi (Pengaturan Akun, Notifikasi, Tampilan Aplikasi).
   - Keamanan (Privasi dan Keamanan, PIN dan Autentikasi).
   - Bantuan (Pusat Bantuan, Tentang Finora).
4. **Tombol Keluar:** Tombol merah outline di bagian terbawah.

---

## 3. Alur Input Transaksi (Modal Flow)

1. Pengguna menekan tombol "Catat Transaksi" (dari Beranda atau tombol aksi).
2. Muncul Bottom Sheet interaktif:
   - Pemilihan jenis: **Pengeluaran** atau **Pemasukan**.
   - Input Nama Transaksi.
   - Input Nominal Rupiah (keyboard angka).
   - Pemilihan Chip Kategori Pengeluaran (Makan, Transportasi, Belanja, Tagihan, Transfer).
   - Input Tanggal.
3. Validasi lokal:
   - Nama wajib diisi.
   - Nominal harus angka positif > 0.
   - Tanggal wajib diisi.
4. Saat disimpan:
   - Objek `Tx` baru ditambahkan ke awal state `transactions`.
   - Ringkasan Beranda, Riwayat Transaksi, dan Progress Anggaran otomatis sinkron secara reaktif.
