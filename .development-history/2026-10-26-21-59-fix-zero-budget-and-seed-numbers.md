# Development Report: Fix Phantom Seed Numbers and Zero-State Bug for New Users

- **Date & Time:** 2026-10-26 21:59 (Local Project Time)
- **Title:** `2026-10-26-21-59-fix-zero-budget-and-seed-numbers.md`

## Task Summary
Investigated and resolved the issue where newly registered users saw phantom numbers (Rp3,000,000 budget and Rp2,600,000 portfolio balances) on their dashboard. Identified two independent root causes: the PostgreSQL database registration trigger and client-side mock initializations. Cleaned the newly created user's database records to 0, updated trigger scripts, and reconfigured all controllers/screens to cleanly present zero-state for new users.

## Relevant Previous Context
- The user registered a fresh account and noticed non-zero budget numbers and balances despite entering no data.
- The user requested auditing and eliminating all bugs causing unwanted numbers or false states for fresh accounts.

## Root Causes Identified
1. **PostgreSQL Trigger `handle_new_user` in `database-schema.sql`:**
   - Lines 230–239 had an automated seed inserting demo values: `Bank: 1600000`, `E-Wallet: 450000`, `Investasi: 400000`, `Tunai: 150000`, and `total_anggaran: 3000000` into Supabase whenever any new user was created.
2. **Client-Side State Defaults:**
   - `src/models/mockData.ts`: `INITIAL_ACCOUNTS` held Rp2.6jt total, `INITIAL_BUDGET` held Rp3jt, and `BUDGET_CATS` hardcoded category limits (Rp900k, Rp500k, etc.).
   - `useBudget.ts`: Hardcoded category calculations against `BUDGET_CATS` even if `total_anggaran` was 0, resulting in `0 / 0 = NaN%` and negative unallocated numbers.
   - `smartAdvisorService.ts`: Defaulted `baseIncome` to `5000000` if `totalIncome === 0` and showed "Pola pengeluaran seimbang" for users with 0 transactions.
   - `ProfileScreen.tsx`: Had a default prop fallback `totalBalance = 2450000`.

## Changes Made
1. **Live Database Reset:**
   - Updated the user's accounts in Supabase to `saldo = 0.00` across all 4 accounts (Bank, E-Wallet, Investasi, Tunai).
   - Updated the user's budget in Supabase to `total_anggaran = 0.00`.
   - Verified that `transactions` count is 0.
2. **Trigger Script Update (`docs/database-schema.sql` & `docs/update-trigger-clean-seed.sql`):**
   - Updated `handle_new_user()` definition to seed initial accounts with `saldo = 0.00` and budget with `total_anggaran = 0.00`.
3. **Model & Mock Data Clean Slate (`src/models/mockData.ts`):**
   - Reset `INITIAL_ACCOUNTS` to `saldo: 0` for all accounts.
   - Reset `INITIAL_BUDGET` to `total_anggaran: 0`.
   - Emptied `INITIAL_TRANSACTIONS` to `[]`.
   - Reset `BUDGET_CATS` default limits to 0.
4. **Dynamic Budget Controller (`src/controllers/useBudget.ts`):**
   - Derived category limits dynamically from `budget.total_anggaran` using 60/20/20 proportions (Makan 30%, Transportasi 15%, Tagihan 15%, Belanja 20%).
   - When `budget.total_anggaran === 0`, all category limits evaluate to 0, `totalPct = 0`, `totalRemaining = 0`, and `nearLimitCategories = []`.
5. **Smart Advisor Empty State (`src/controllers/services/smartAdvisorService.ts`):**
   - When `transactions.length === 0`, returns a dedicated onboarding guidance message: *"Belum ada data transaksi. Catat transaksi pertama Anda atau pindai struk untuk mengaktifkan analisis finansial cerdas Finora."*
6. **Account Service Fix (`src/services/db/accountService.ts` & `src/controllers/usePortfolio.ts`):**
   - Changed `fetchAccounts` to return `[]` instead of `null` when 0 rows are returned, ensuring `usePortfolio` updates reliably with `remote !== null`.
7. **Screen UI Zero-States:**
   - `HomeScreen.tsx`: Added dedicated empty state placeholder for "Transaksi Terbaru" (*"Belum ada transaksi tercatat."*).
   - `BudgetScreen.tsx`: Updated tip text to display neutral status (*"Belum ada alokasi anggaran yang ditetapkan untuk bulan ini."*) when `totalBudget === 0`.
   - `BudgetProgressCard.tsx`: Displays *"Belum ada batas anggaran bulanan yang ditentukan"* when `totalBudget === 0`.
   - `ProfileScreen.tsx`: Default prop `totalBalance` updated from `2450000` to `0`.

## Files Affected
- `docs/database-schema.sql` (Modified)
- `docs/update-trigger-clean-seed.sql` (Created)
- `src/models/mockData.ts` (Modified)
- `src/controllers/useBudget.ts` (Modified)
- `src/controllers/usePortfolio.ts` (Modified)
- `src/controllers/services/smartAdvisorService.ts` (Modified)
- `src/services/db/accountService.ts` (Modified)
- `src/views/screens/HomeScreen.tsx` (Modified)
- `src/views/screens/BudgetScreen.tsx` (Modified)
- `src/views/screens/ProfileScreen.tsx` (Modified)
- `src/views/components/cards/BudgetProgressCard.tsx` (Modified)

## Verification Performed
- Queried remote Supabase for user `hzby`:
  - `accounts`: Bank (0), E-Wallet (0), Investasi (0), Tunai (0) — verified.
  - `budgets`: total_anggaran (0) — verified.
  - `transactions`: 0 rows — verified.
- Ran `npx tsc --noEmit`; confirmed 0 TypeScript compilation errors.

## Final Result
New accounts start completely clean with 0 saldo, 0 budget, 0 transactions, and no mock data leaks.
