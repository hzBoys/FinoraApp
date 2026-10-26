import { Account, AccountType } from '../../models/types';

export function calculateTotalPortfolio(accounts: Account[]): number {
  return accounts.reduce((sum, acc) => sum + acc.saldo, 0);
}

export function calculatePillars(accounts: Account[]): Record<AccountType, number> {
  return accounts.reduce(
    (acc, item) => {
      acc[item.tipe] = (acc[item.tipe] || 0) + item.saldo;
      return acc;
    },
    { bank: 0, ewallet: 0, investasi: 0 } as Record<AccountType, number>
  );
}

/**
 * Memperbarui saldo akun yang ada atau menambahkan akun baru tanpa duplikasi (TC-03).
 */
export function upsertAccountBalance(
  accounts: Account[],
  namaAkun: string,
  tipe: AccountType,
  nominalSaldo: number
): Account[] {
  const normalizedName = namaAkun.trim().toLowerCase();
  const existingIndex = accounts.findIndex(
    (a) => a.nama_akun.trim().toLowerCase() === normalizedName
  );

  const now = new Date().toISOString().split('T')[0];

  if (existingIndex >= 0) {
    const updated = [...accounts];
    updated[existingIndex] = {
      ...updated[existingIndex],
      saldo: nominalSaldo,
      updated_at: now,
    };
    return updated;
  }

  const numericIds = accounts
    .map((a) => (typeof a.account_id === 'number' ? a.account_id : parseInt(String(a.account_id), 10)))
    .filter((n) => !isNaN(n));
  const newId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : Date.now();
  const newAccount: Account = {
    account_id: newId,
    user_id: 1,
    nama_akun: namaAkun.trim(),
    tipe,
    saldo: nominalSaldo,
    updated_at: now,
  };

  return [...accounts, newAccount];
}
