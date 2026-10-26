import { Account, Budget, Category, Tx } from './types';

export const INITIAL_ACCOUNTS: Account[] = [
  { account_id: 1, user_id: 1, nama_akun: 'Bank', tipe: 'bank', saldo: 0, updated_at: '2026-10-26' },
  { account_id: 2, user_id: 1, nama_akun: 'E-Wallet', tipe: 'ewallet', saldo: 0, updated_at: '2026-10-26' },
  { account_id: 3, user_id: 1, nama_akun: 'Investasi', tipe: 'investasi', saldo: 0, updated_at: '2026-10-26' },
  { account_id: 4, user_id: 1, nama_akun: 'Tunai', tipe: 'tunai', saldo: 0, updated_at: '2026-10-26' },
];

export const CATEGORIES: Category[] = [
  { category_id: 1, nama_kategori: 'Makan', tipe: 'kebutuhan' },
  { category_id: 2, nama_kategori: 'Transportasi', tipe: 'kebutuhan' },
  { category_id: 3, nama_kategori: 'Tagihan', tipe: 'kebutuhan' },
  { category_id: 4, nama_kategori: 'Belanja', tipe: 'gaya_hidup' },
  { category_id: 5, nama_kategori: 'Hiburan', tipe: 'gaya_hidup' },
  { category_id: 6, nama_kategori: 'Pemasukan', tipe: 'tabungan' },
  { category_id: 7, nama_kategori: 'Transfer', tipe: 'kebutuhan' },
];

export const CATEGORY_ICONS: Record<string, string> = {
  Pemasukan: '↓',
  Makan: '🍽',
  Belanja: '🛍',
  Transportasi: '🚌',
  Tagihan: '💡',
  Hiburan: '🎬',
  Transfer: '↔',
  Semua: '•',
};

export const INITIAL_TRANSACTIONS: Tx[] = [];

export const BUDGET_CATS = [
  { key: 'Makan',        label: 'Makan & Minum', budget: 0, type: 'kebutuhan'  },
  { key: 'Transportasi', label: 'Transportasi',   budget: 0, type: 'kebutuhan'  },
  { key: 'Belanja',      label: 'Belanja',        budget: 0, type: 'gaya_hidup' },
  { key: 'Tagihan',      label: 'Tagihan',        budget: 0, type: 'kebutuhan'  },
] as const;

export const INITIAL_BUDGET: Budget = {
  budget_id: 1,
  user_id: 1,
  periode: 'Oktober 2026',
  persen_kebutuhan: 60,
  persen_gaya_hidup: 20,
  persen_tabungan: 20,
  total_anggaran: 0,
};

export const PROFILE_MENUS = [
  {
    group: 'Preferensi',
    items: [
      { icon: '⚙️', title: 'Pengaturan Akun', desc: 'Ubah nama, email, dan info profil' },
      { icon: '🔔', title: 'Notifikasi', desc: 'Atur pengingat dan pemberitahuan' },
      { icon: '🎨', title: 'Tampilan Aplikasi', desc: 'Tema dan preferensi tampilan' },
    ],
  },
  {
    group: 'Keamanan',
    items: [
      { icon: '🔒', title: 'Privasi dan Keamanan', desc: 'Kelola data dan izin akses' },
      { icon: '🔑', title: 'PIN dan Autentikasi', desc: 'Atur PIN atau biometrik' },
    ],
  },
  {
    group: 'Bantuan',
    items: [
      { icon: '💬', title: 'Pusat Bantuan', desc: 'FAQ dan panduan penggunaan' },
      { icon: 'ℹ️', title: 'Tentang Finora', desc: 'Versi 1.0.0 — arsitektur MVC' },
    ],
  },
] as const;
