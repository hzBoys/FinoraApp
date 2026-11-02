# Development Report: Phase 1 Backend Stabilization, Atomic RPCs, RLS Optimization & Budget Persistence

- **Date & Time:** 2026-11-02 17:30 (Local Project Time)
- **Title:** `2026-11-02-17-30-phase1-backend-atomic-rpc-rls-stabilization.md`

## Task Summary
Stabilized the Phase 1 Supabase PostgreSQL 17 backend and synchronized all frontend controllers/services with atomic database operations, hardened authentication flows, persistent per-category budget limits (`category_limits` JSONB), complete Row Level Security (RLS) policies, and standardized 3-pillar account provisioning (`Bank`, `E-Wallet`, `Investasi`).

## Root Cause Analysis
- **Non-Atomic Balance Updates:** Creating or deleting a transaction previously ran separate client-side `transactions` and `accounts` queries, risking race conditions or desynchronized balances on network drops.
- **Username Login & Registration Collision Edge Cases:** Unauthenticated username lookup was blocked by `public.users` RLS (`auth.uid() = id`), and `handle_new_user()` lacked collision handling if two users registered with identical usernames or email prefixes.
- **Ephemeral Custom Category Limits & Missing `Hiburan` Allocation:** Custom manual category limits in `SetBudgetModal` were stored only in React state (resetting on reload), and `Hiburan` was missing from budget allocation and expense chips despite existing in `public.categories`.
- **RLS & Trigger Security Hardening:** Trigger functions needed explicit `SET search_path = ''`, and RLS policies needed `(select auth.uid())` initPlan caching, `TO authenticated`, and `WITH CHECK` predicates across all 7 tables (including `recommendations` write policies for Smart Advisor persistence).

## Changes Made
1. **Database Migration & Hardening (`docs/phase1-backend-fixes.sql`, `docs/database-schema.sql`):**
   - Added `category_limits JSONB DEFAULT NULL` to `public.budgets` plus 7 FK/lookup/uniqueness indexes.
   - Standardized `public.handle_new_user()` on the 3 financial pillars (`Bank`, `E-Wallet`, `Investasi`) with `SET search_path = ''`, collision-safe username suffixing, and `REVOKE ALL FROM PUBLIC`.
   - Upgraded 12 RLS policies across all 7 tables (`users`, `accounts`, `categories`, `transactions`, `scan_results`, `budgets`, `recommendations`) with `(select auth.uid())` and `WITH CHECK`.
   - Created 4 PostgreSQL RPC functions: `resolve_email_by_username`, `create_transaction_atomic`, `delete_transaction_atomic`, and `update_transaction_atomic` (using `FOR UPDATE` row-level locking).
2. **Authentication & Supabase Client (`src/services/supabase.ts`, `src/context/AuthContext.tsx`):**
   - Added cross-platform storage adapter (Web `localStorage` + Native `AsyncStorage` + SSR/Node memory fallback) and `isSupabaseConfigured` guard.
   - Integrated `resolve_email_by_username` RPC for username login, disabled silent mock fallback on invalid credentials, added `verifyResetOtp` recovery flow, and synced email updates with `supabase.auth.updateUser`.
3. **Services, Controllers & UI Sync (`transactionService.ts`, `budgetService.ts`, `useTransactions.ts`, `usePortfolio.ts`, `useBudget.ts`, `smartAdvisorService.ts`, `SetBudgetModal.tsx`, `AddTransactionModal.tsx`, `MagicReceiptModal.tsx`):**
   - Wired `create_transaction_atomic` and `delete_transaction_atomic` with instant optimistic UI updates and exact server balance reconciliation (`syncAccountBalanceLocal`).
   - Persisted `category_limits` JSONB and Smart Advisor `recommendations` rows to Supabase, added `Hiburan` (10% Belanja + 10% Hiburan = 20% Gaya Hidup), and synchronized modal `selectedAccountId` when async UUID accounts load.
   - Added Indonesian & ISO date parser (`src/utils/date.ts`) and configured `eas.json` (`preview` APK build profile) + `.gitignore` rules for local documents.

## Files Affected
- `.gitignore` (Modified)
- `App.tsx` (Modified)
- `eas.json` (Added)
- `package.json` / `package-lock.json` (Modified)
- `docs/database-schema.sql` (Modified)
- `docs/phase1-backend-fixes.sql` (Added)
- `src/services/supabase.ts` (Modified)
- `src/context/AuthContext.tsx` (Modified)
- `src/services/db/transactionService.ts` (Modified)
- `src/services/db/budgetService.ts` (Modified)
- `src/controllers/services/smartAdvisorService.ts` (Modified)
- `src/controllers/useBudget.ts` (Modified)
- `src/controllers/usePortfolio.ts` (Modified)
- `src/controllers/useTransactions.ts` (Modified)
- `src/models/types.ts` (Modified)
- `src/models/mockData.ts` (Modified)
- `src/utils/date.ts` (Modified)
- `src/views/components/modals/MagicReceiptModal.tsx` (Modified)
- `src/views/components/modals/SetBudgetModal.tsx` (Modified)
- `src/views/components/transactions/AddTransactionModal.tsx` (Modified)
- `src/views/screens/BudgetScreen.tsx` (Modified)
- `src/views/screens/TransactionsScreen.tsx` (Modified)

## Verification Performed
- Applied `docs/phase1-backend-fixes.sql` idempotently to Supabase PostgreSQL 17 (`ophepwhbraswwuizyssv`) and verified atomic RPC rollback dry-runs.
- Executed 20-point automated QA & RLS multi-tenant isolation test suite (20/20 PASS).
- Ran `npx tsc --noEmit` and `npx expo-doctor` with zero errors.

## Final Result
All Phase 1 backend services, RLS policies, triggers, and atomic RPCs are live, hardened, and cleanly merged with the latest 3-pillar UI, Rupiah input formatting, OS notification scheduling, and Android safe-area updates.
