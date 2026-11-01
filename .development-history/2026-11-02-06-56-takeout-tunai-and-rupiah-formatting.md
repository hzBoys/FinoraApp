# Development Report: Takeout Tunai Account Type and Thousand Separator Currency Formatting

- **Date & Time:** 2026-11-02 06:56 (Local Project Time)
- **Title:** `2026-11-02-06-56-takeout-tunai-and-rupiah-formatting.md`

## Task Summary
1. Completely removed the "Tunai" account/transaction type from the mobile frontend, database services, models, documentation, and live Supabase PostgreSQL database (migrating existing Tunai records to Bank).
2. Built a flexible real-time Indonesian thousand-separator dot formatter (`formatRupiahInput` & `parseRupiahInput`) with a dedicated `Rp` prefix badge across all nominal inputs (`AddTransactionModal`, `MagicReceiptModal`, `SetBudgetModal`).
3. Diagnosed and resolved the `npm audit fix --force` regression: restored Expo SDK 58 (`~58.0.20`, `react-native: 0.88.1`), verified 20/20 checks passed on `expo-doctor`, and provided architectural explanation on why `--force` must never be run on Expo projects.

## Relevant Previous Context
- The user ran `npm audit fix --force` which downgraded Expo from SDK 58 to SDK 51, causing incompatible native code and vulnerability warnings.
- The user requested removing the `Tunai` transaction and account type completely from both mobile and backend with a thorough quality check.
- The user requested real-time thousand-separator formatting for rupiah inputs (e.g., `50000` automatically formatted as `50.000` with flexible backspacing/editing).

## Changes Made
1. **Dependency & Expo Restoration:**
   - Restored `package.json` to `expo: ~58.0.20` and `react-native: 0.88.1`.
   - Re-audited and aligned native dependencies using `npx expo install --fix`.
   - Verified that `npx expo-doctor` passes all 20/20 checks with zero errors.
2. **Takeout of "Tunai" Type:**
   - Database live migration: Migrated all existing Tunai accounts and transactions in Supabase to Bank; deleted all `tunai` accounts from `public.accounts`.
   - Updated `docs/remove-tunai-migration.sql` documenting the migration steps.
   - Updated `docs/database-schema.sql` and `docs/update-trigger-clean-seed.sql`: `account_type` ENUM and `handle_new_user()` trigger now strictly seed 3 accounts (`Bank`, `E-Wallet`, `Investasi`).
   - Updated `src/models/types.ts`: `AccountType = 'bank' | 'ewallet' | 'investasi'`.
   - Updated `src/models/mockData.ts`: Removed Tunai from `INITIAL_ACCOUNTS`.
   - Updated `AddTransactionModal.tsx` and `MagicReceiptModal.tsx`: Removed Tunai fallback account.
   - Updated `src/controllers/services/magicReceiptService.ts`: Default `metode_bayar` set to `'Bank'`.
   - Updated `src/views/components/icons/CategoryIconBadge.tsx`: Removed Tunai icon entry.
   - Updated `README.md` and `docs/database-design.md` to reflect 3 asset pillars.
3. **Rupiah Thousand-Separator Input Formatting:**
   - Created `src/utils/currency.ts`:
     - `formatRupiahInput(value)`: Strips non-digits and formats integers with Indonesian thousand dots (e.g. `50000` -> `50.000`).
     - `parseRupiahInput(value)`: Extracts clean numeric values for state and database payloads.
   - `AddTransactionModal.tsx`: Applied formatted input with a dedicated `Rp` prefix container and `number-pad` keyboard.
   - `MagicReceiptModal.tsx`: Applied formatted input for OCR review nominal adjustments.
   - `SetBudgetModal.tsx`: Applied formatted input for monthly total budget and manual category limits (`Makan`, `Transportasi`, `Tagihan`, `Belanja`).

## Files Affected
- `package.json` (Restored)
- `package-lock.json` (Updated)
- `src/utils/currency.ts` (Created)
- `src/models/types.ts` (Modified)
- `src/models/mockData.ts` (Modified)
- `src/controllers/services/magicReceiptService.ts` (Modified)
- `src/views/components/icons/CategoryIconBadge.tsx` (Modified)
- `src/views/components/transactions/AddTransactionModal.tsx` (Modified)
- `src/views/components/modals/MagicReceiptModal.tsx` (Modified)
- `src/views/components/modals/SetBudgetModal.tsx` (Modified)
- `docs/remove-tunai-migration.sql` (Created)
- `docs/database-schema.sql` (Modified)
- `docs/update-trigger-clean-seed.sql` (Modified)
- `docs/database-design.md` (Modified)
- `README.md` (Modified)

## Verification Performed
- Queried remote Supabase database: verified `accounts` with `tipe = 'tunai'` count is 0, and `transactions` with `metode_bayar = 'Tunai'` count is 0.
- Ran `npx tsc --noEmit`; confirmed 0 TypeScript compilation errors.
- Ran `npx expo-doctor`; verified **20/20 checks passed**.
- Checked `git check-ignore -v .env`; verified `.env` remains securely ignored.

## Final Result
Tunai type is completely eliminated from frontend and database. Currency input formatting dynamically separates thousands with dots across all modals. Package configuration is fully restored to Expo SDK 58.
