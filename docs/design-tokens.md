# Finora Mobile Design Tokens

Panduan token visual resmi untuk aplikasi Finora (React Native / Expo). Seluruh komponen dan layar wajib merujuk ke token ini untuk menjamin konsistensi visual.

---

## 1. Color Palette

### Primary & Brand
| Token | Hex | Pemakaian di React Native |
|---|---|---|
| `primary` | `#14382C` | Deep Forest — Kartu saldo utama, tombol primer, tab bar aktif, header app |
| `primaryDark` | `#002218` | Penekanan kontras tinggi / border gelap |
| `secondary` | `#52B788` | Soft Sage — Aksen progress bar, tombol link, indikator positif |
| `mintBg` | `#D8F3DC` | Mint Frost — Latar badge, tombol sekunder, icon container |
| `mintBorder` | `#B7E4C7` | Border kartu pemasukan / badge |

### Neutral & Surfaces
| Token | Hex | Pemakaian di React Native |
|---|---|---|
| `surface` | `#F4F6F4` | Warm Alabaster — Background utama layar (`Screen container`) |
| `card` | `#FFFFFF` | Crisp White — Background kartu modul, input, modal sheet |
| `border` | `#E5E9E7` | Hairline border untuk kartu, divider, dan input field |
| `chipBg` | `#F4F6F4` | Background chip filter tidak aktif |

### Typography & Content
| Token | Hex | Pemakaian di React Native |
|---|---|---|
| `textPrimary` | `#111827` | Dark Slate — Judul utama, nominal saldo/transaksi, teks kartu |
| `textSecondary` | `#4B5563` | Slate Subdued — Label, metadata transaksi, sub-teks |
| `textMuted` | `#9CA3AF` | Placeholder input, ikon tidak aktif, keterangan sekunder |
| `textOnDark` | `#FFFFFF` | Teks di atas container warna primer (`#14382C`) |
| `textOnDarkDim` | `rgba(196,235,217,0.8)` | Sub-label di atas kartu warna primer |

### Functional / Semantics
| Status | Background | Border | Text / Value |
|---|---|---|---|
| Pemasukan (Income) | `#F0FAF4` | `#B7E4C7` | `#1A7A45` |
| Pengeluaran (Expense) | `#FFF5F5` | `#FED7D7` | `#C53030` |
| Peringatan (Warning) | `#FEF3C7` | `#FDE68A` | `#D97706` |
| Info / Netral | `#EFF6FF` | `#BFDBFE` | `#2563EB` |

---

## 2. Typography

Font tunggal: **Plus Jakarta Sans** (via `@expo-google-fonts/plus-jakarta-sans`).

```ts
export const FONT = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;
```

### Scale & Hierarchy
| Level | Size | Weight | Line Height | Contoh Pemakaian |
|---|---|---|---|---|
| `displayBalance` | 28px | Bold (700) | 34px | Total saldo hero card |
| `titleLg` | 20px | Bold (700) | 26px | Nama pengguna, total budget |
| `titleMd` | 16px | SemiBold (600) | 22px | Judul modal, section header besar |
| `titleSm` | 14px | SemiBold (600) | 20px | Nama transaksi, item list |
| `bodyMd` | 14px | Regular (400) | 20px | Teks input, deskripsi umum |
| `bodySm` | 12px | Regular (400) | 18px | Penjelasan tips, catatan advisor |
| `labelMd` | 12px | SemiBold (600) | 16px | Chip filter, tab bar aktif |
| `labelSm` | 11px | Medium (500) | 14px | Metadata kategori, tanggal mutasi |
| `labelUppercase`| 11px | SemiBold (600) | 14px | Section header kapital (`letterSpacing: 0.5`) |

### Format Penulisan Angka & Rupiah
- Format baku: `Rp` tanpa spasi berlebih, pemisah ribuan titik: `Rp2.450.000`.
- Tanda arus kas:
  - Masuk: `+Rp750.000` (hijau `#1A7A45`)
  - Keluar: `-Rp45.000` atau `Rp45.000` (merah `#C53030` atau slate `#111827`)

---

## 3. Spacing & Radius

### Grid Ritme 4px / 8px
- `space-xs`: 4px (gap micro icon-text)
- `space-sm`: 8px (gap antar elemen internal kartu)
- `space-md`: 12px – 16px (padding kartu, gap antar modul)
- `space-lg`: 20px (padding hero card, modal header)
- `screen-gutter`: 16px (padding horizontal kiri/kanan layar)

### Corner Radius
- `radius-sm` (8px): Input text field, date picker, small chip
- `radius-md` (12px – 14px): Tombol primer/sekunder, search bar, card kecil
- `radius-lg` (16px): White card modul, transaction list card
- `radius-xl` (20px – 24px): Hero balance card, Bottom Sheet modal
- `radius-pill` (9999px): Badge persentase, filter category chips, avatar circle

---

## 4. Shadows & Elevation

### React Native Cross-Platform Specs
```ts
export const SHADOWS = {
  card: {
    shadowColor: '#14382C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
};
```
