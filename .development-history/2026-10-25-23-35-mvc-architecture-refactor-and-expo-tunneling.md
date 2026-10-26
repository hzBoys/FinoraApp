# Development Report: MVC Architecture Refactor and Expo Tunneling Configuration

- **Date & Time:** 2026-10-25 23:35 (Local Project Time)
- **Title:** `2026-10-25-23-35-mvc-architecture-refactor-and-expo-tunneling.md`

## Task Summary
Refactored the monolithic `App.tsx` file (~1950 lines) into a clean, modular MVC (Model-View-Controller) architecture across `src/` to optimize mobile build performance and maintainability. Configured Expo tunneling dependencies and scripts to support QR code dev testing with Expo Go.

## Relevant Previous Context
- Previously, the entire application UI, state, mock data, sub-components, and screens were bundled in a single `App.tsx` file.
- The project documentation in `docs/claude_md_finora_project_context.md` defined three key submodules: Magic Receipt (OCR), Auto-Portfolio (Multi-account consolidation), and Smart Advisor (60/20/20 budgeting).
- The user approved the MVC refactoring plan and requested Expo Go / QR tunneling readiness.

## Changes Made
1. **Package Configuration:**
   - Updated `package.json` with Expo Go compatible dependencies: `expo-image-picker`, `react-native-safe-area-context`, and `@expo/ngrok` (devDependency).
   - Added `"tunnel": "expo start --tunnel"` script to `package.json`.
2. **Constants (`src/constants/`):**
   - `theme.ts`: Extracted design tokens (Deep Forest `#14382C`, Soft Sage `#52B788`, Warm Alabaster `#F4F6F4`, status semantics, layout metrics, and cross-platform shadows).
   - `typography.ts`: Defined Plus Jakarta Sans font families and font size scales.
3. **Model Layer (`src/models/`):**
   - `types.ts`: Defined TypeScript domain entities corresponding to ERD schemas (`User`, `Account`, `Category`, `Tx`, `ScanResult`, `Budget`, `Recommendation`, `TabKey`).
   - `mockData.ts`: Centralized initial accounts, categories, mock transactions, initial budget, and profile menu items.
4. **Controller Layer (`src/controllers/`):**
   - `services/magicReceiptService.ts`: File validation ($\le 5\text{ MB}$, JPEG/PNG) and auto-categorization engine matching TC-01 & TC-02.
   - `services/autoPortfolioService.ts`: Consolidated portfolio calculation and duplicate-safe account upsert matching TC-03.
   - `services/smartAdvisorService.ts`: 60% Kebutuhan, 20% Gaya Hidup, 20% Tabungan allocation logic and lifestyle reduction calculation matching TC-04.
   - `useTransactions.ts`: Reusable hook for transaction list state, category filtering, search, and additions.
   - `usePortfolio.ts`: Reusable hook for account balances and asset pillars (Bank, E-Wallet, Investasi).
   - `useBudget.ts`: Reusable hook for category spendings, limit alerts, and smart advisor analysis.
5. **View Layer (`src/views/`):**
   - `components/navigation/`: Created `AppHeader.tsx` and `BottomTabBar.tsx`.
   - `components/cards/`: Created `BalanceHeroCard.tsx`, `CashFlowCard.tsx`, `BudgetProgressCard.tsx`, and `AdvisorCard.tsx`.
   - `components/transactions/`: Created `TransactionRowItem.tsx` and `AddTransactionModal.tsx`.
   - `screens/`: Created `HomeScreen.tsx`, `TransactionsScreen.tsx`, `BudgetScreen.tsx`, and `ProfileScreen.tsx`.
6. **Application Orchestrator (`App.tsx`):**
   - Streamlined `App.tsx` from ~1950 lines down to ~220 lines, focusing purely on font initialization, state controller wiring, screen routing, and modal visibility.

## Files Affected
- `package.json` (Modified)
- `App.tsx` (Refactored)
- `src/constants/theme.ts` (Created)
- `src/constants/typography.ts` (Created)
- `src/models/types.ts` (Created)
- `src/models/mockData.ts` (Created)
- `src/controllers/services/magicReceiptService.ts` (Created)
- `src/controllers/services/autoPortfolioService.ts` (Created)
- `src/controllers/services/smartAdvisorService.ts` (Created)
- `src/controllers/useTransactions.ts` (Created)
- `src/controllers/usePortfolio.ts` (Created)
- `src/controllers/useBudget.ts` (Created)
- `src/views/components/navigation/AppHeader.tsx` (Created)
- `src/views/components/navigation/BottomTabBar.tsx` (Created)
- `src/views/components/cards/BalanceHeroCard.tsx` (Created)
- `src/views/components/cards/CashFlowCard.tsx` (Created)
- `src/views/components/cards/BudgetProgressCard.tsx` (Created)
- `src/views/components/cards/AdvisorCard.tsx` (Created)
- `src/views/components/transactions/TransactionRowItem.tsx` (Created)
- `src/views/components/transactions/AddTransactionModal.tsx` (Created)
- `src/views/screens/HomeScreen.tsx` (Created)
- `src/views/screens/TransactionsScreen.tsx` (Created)
- `src/views/screens/BudgetScreen.tsx` (Created)
- `src/views/screens/ProfileScreen.tsx` (Created)

## Technical Decisions
- **Separation of Concerns:** Isolated UI presentation in `views/` from data processing in `controllers/services/`, ensuring tests for TC-01 to TC-04 can run directly against pure functions without mounting UI components.
- **Expo Go Compatibility:** Utilized dynamic runtime checks for `expo-image-picker` with user-friendly fallback dialogs, ensuring the app runs in both standard Expo Go and bare native builds without crashing.
- **Tunneling Script:** Added `"tunnel": "expo start --tunnel"` to `package.json` so users can immediately run `npm run tunnel` to generate a QR code accessible over the public internet.

## Verification Performed
- Inspected file tree via `Glob`, verifying all 22 modules under `src/` were successfully created and structured.
- Verified `App.tsx` imports and component bindings against the newly created files.
- Confirmed `package.json` contains valid JSON syntax with the new scripts and dependencies.

## Known Limitations
- The host terminal sandbox classifier (`code[1m]`) temporarily prevented shell execution for `npx tsc --noEmit` and `npm install` during this turn.
- The user can run `npm install` and `npm run tunnel` directly in their terminal to launch the tunnel server.

## Unresolved Issues or Follow-up Work
- Run `npm install` to download newly added packages into `node_modules`.
- Connect real backend RESTful endpoints to `magicReceiptService`, `autoPortfolioService`, and `smartAdvisorService` once backend services are deployed.
