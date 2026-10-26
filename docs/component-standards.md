# Finora Mobile Component Standards

Standar implementasi komponen antarmuka React Native di Finora untuk menjaga keterbacaan, ergonomi satu tangan, dan konsistensi antar modul.

---

## 1. Buttons (Tombol Aksi)

Semua tombol sentuh memiliki tinggi minimum **44px – 48px** untuk kenyamanan jangkauan jempol (*touch target ergonomics*).

### Tombol Primer (`btnPrimary`)
- Background: `#14382C`
- Teks: `#FFFFFF`, `PlusJakartaSans_700Bold`, 14px
- Radius: 14px
- Feedback sentuh: `activeOpacity={0.85}`
- Contoh: "Catat Transaksi", "Simpan Transaksi"

### Tombol Sekunder / Aksen (`btnSecondary`)
- Background: `#D8F3DC`
- Teks: `#14382C`, `PlusJakartaSans_700Bold`, 14px
- Radius: 14px
- Contoh: "Pindai Struk", "Ubah Filter"

### Tombol Batal / Netral (`btnCancel`)
- Background: `#F4F6F4`
- Border: 1px solid `#E5E9E7`
- Teks: `#4B5563`, `PlusJakartaSans_600SemiBold`, 14px
- Radius: 14px
- Contoh: "Batal" pada modal sheet

---

## 2. Input Fields

### Form Text Input
- Tinggi: 46px
- Border: 1px solid `#E5E9E7`
- Background: `#FFFFFF`
- Radius: 12px
- Padding horizontal: 14px
- Teks: 14px `PlusJakartaSans_400Regular`, warna `#111827`
- Placeholder: `#9CA3AF`
- State error: Border berubah menjadi `#C53030`, tampilkan pesan di bawah input

### Search Bar Transaksi
- Tinggi: 44px
- Menggunakan ikon kaca pembesar di sisi kiri dan tombol clear (✕) di sisi kanan saat input memiliki nilai.

---

## 3. Cards & Containers

### Hero Balance Card
- Container utama di bagian atas layar Beranda & Profil
- Background: `#14382C`
- Radius: 20px
- Aksen dekoratif: 2 lingkaran semi-transparan (`deco1` & `deco2`) di sudut kanan atas dan kiri bawah
- Pembagian 3 pilar aset: `Bank`, `E-Wallet`, `Investasi` dipisahkan oleh border vertikal `rgba(196,235,217,0.15)`

### White Content Card
- Container standar untuk grouping data (Arus Kas, Anggaran, Riwayat Transaksi)
- Background: `#FFFFFF`
- Border: 1px solid `#E5E9E7`
- Radius: 16px
- Padding: 16px

---

## 4. Transaction List Items

Item baris transaksi mengikuti struktur horizontal 3 zona:
1. **Leading:** Kotak ikon kategori (34x34px, radius 10px). Background `#F0FAF4` untuk pemasukan, `#FFF5F5` untuk pengeluaran.
2. **Center (Flex 1):** Nama transaksi (13px semi-bold `#111827`) di atas metadata `Kategori · Tanggal` (11px regular `#4B5563`).
3. **Trailing:** Nominal nominal transaksi (13px bold). Warna `#1A7A45` diawali tanda `+` untuk pemasukan; warna `#C53030` diawali tanda `-` untuk pengeluaran.
4. **Divider:** Garis bawah 1px `#E5E9E7` antar item, dihilangkan pada item terakhir.

---

## 5. Chips & Category Filters

- Tinggi: 32px
- Radius: 20px (pill)
- Padding horizontal: 14px
- State Inaktif: Background `#F4F6F4`, border `#E5E9E7`, teks `#4B5563` (12px semi-bold)
- State Aktif: Background `#14382C`, border `#14382C`, teks `#FFFFFF` (12px semi-bold)

---

## 6. Bottom Sheet Modal

Modal input transaksi (`AddTransactionModal`) menggunakan pola sheet naik dari bawah:
- Backdrop: `rgba(0, 0, 0, 0.45)`
- Sheet: Background `#FFFFFF`, radius atas 24px (`borderTopLeftRadius: 24`, `borderTopRightRadius: 24`)
- Dukungan Keyboard: Terbungkus dalam `KeyboardAvoidingView` (khusus iOS `behavior="padding"`)
- Safe Area Bawah: Diberikan padding bottom dinamis sesuai bottom safe inset
- Header Sheet: Judul tebal 18px di kiri dan tombol silang (✕) di kanan
- Toggle Jenis Transaksi: 2 tombol bersebelahan (Pengeluaran vs Pemasukan) dengan warna penanda aktif merah/hijau

---

## 7. Bottom Navigation Tab Bar

- Posisi: Fixed di bagian bawah layar (`position: 'absolute'`, `bottom: 0`, `left: 0`, `right: 0`)
- Tinggi: 56px + bottom safe area
- Background: `#FFFFFF`, border atas 1px solid `#E5E9E7`
- 4 Tab Utama:
  1. **Beranda** (`⌂`)
  2. **Transaksi** (`↕`)
  3. **Anggaran** (`◎`)
  4. **Profil** (`◉`)
- State tab aktif: Ikon & teks `#14382C` (bold). State tidak aktif: `#9CA3AF`.
