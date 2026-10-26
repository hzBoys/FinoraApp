export type User = {
  user_id: number | string;
  nama: string;
  email: string;
  created_at: string;
};

export type AccountType = 'bank' | 'ewallet' | 'investasi' | 'tunai';

export type Account = {
  account_id: number | string;
  user_id: number | string;
  nama_akun: string;
  tipe: AccountType;
  saldo: number;
  updated_at: string;
};

export type CategoryType = 'kebutuhan' | 'gaya_hidup' | 'tabungan';

export type Category = {
  category_id: number | string;
  nama_kategori: string;
  tipe: CategoryType;
};

export type TransactionType = 'masuk' | 'keluar';

export type Tx = {
  id: number | string;
  name: string;
  date: string;
  cat: string;
  amount: number;
  income: boolean;
  account_id?: number | string;
  merchant?: string;
  metode_bayar?: string;
};

export type ScanResult = {
  scan_id: number | string;
  user_id: number | string;
  transaction_id?: number | string;
  jenis_scan: 'struk' | 'saldo';
  file_url: string;
  teks_ocr: string;
  status: 'pending' | 'success' | 'failed';
};

export type Budget = {
  budget_id: number | string;
  user_id: number | string;
  periode: string;
  persen_kebutuhan: number;
  persen_gaya_hidup: number;
  persen_tabungan: number;
  total_anggaran: number;
};

export type Recommendation = {
  recommendation_id: number | string;
  budget_id: number | string;
  isi_saran: string;
  created_at: string;
};

export type UserProfile = {
  id: number | string;
  nama: string;
  username: string;
  email: string;
  avatarUri: string | null;
  role: string;
};

export type NotificationPreferences = {
  dailyReminder: boolean;
  reminderTime: string;
  budgetAlert: boolean;
  weeklyReport: boolean;
  smartAdvisorTips: boolean;
};

export type ThemeMode = 'light' | 'dark' | 'system';

export type TabKey = 'home' | 'transactions' | 'budget' | 'profile';
