# Development Report: Apple Dark Grey Palette and Dark Green Widget Overhaul

- **Date & Time:** 2026-10-26 22:44 (Local Project Time)
- **Title:** `2026-10-26-22-44-apple-dark-grey-mode-overhaul.md`

## Task Summary
Redesigned the Dark Mode color system across the Finora mobile application. Replaced the previously dominant dark-green background with Apple-inspired neutral Dark Grey tones (`#121214` canvas, `#1C1C1E` card modules, `#2C2C2E` borders, `#8E8E93` system text) while preserving refined Dark Green highlights (`#132E22` with `#24523F` emerald borders) exclusively for key widget surfaces (Balance Hero Card, Budget Summary, and Portfolio Account cards), buttons, and active tabs.

## Relevant Previous Context
- Previously, Dark Mode used heavy dark green across all layers (`#0B1E17` canvas, `#132B22` cards, `#A8CFBE` text), causing the entire interface to feel overwhelmingly green rather than neutral and clean.
- The user requested an Apple-style Dark Grey palette combined with Dark Green accents and widgets.

## Changes Made
1. **Theme Tokens (`src/constants/theme.ts`):**
   - Added `widgetBg` and `widgetBorder` to `ColorTheme`.
   - Updated `DARK_COLORS`:
     - `surface`: `#121214` (Apple Dark Charcoal System Background, replaced `#0B1E17`).
     - `card`: `#1C1C1E` (Apple System Secondary Dark Grey for cards, modules, and modal sheets, replaced `#132B22`).
     - `border`: `#2C2C2E` (Apple Hairline Dark Grey border, replaced `#1F4033`).
     - `chipBg`: `#242426` (Apple Elevated Tertiary Dark Grey).
     - `widgetBg`: `#132E22` (Apple-style Dark Green Hero Widget surface).
     - `widgetBorder`: `#24523F` (Subtle Emerald Hairline Border).
     - `textPrimary`: `#FFFFFF` (Crisp high-contrast white).
     - `textSecondary`: `#8E8E93` (Apple Neutral System Cool Gray, eliminating muddy greenish tint).
     - `textMuted`: `#636366` (Apple Tertiary Gray).
     - `primary`: `#2D6A4F` (Emerald Accent for primary action buttons).
     - `secondary`: `#52B788` (Vibrant Sage Green for active tabs, links, and indicators).
     - `incomeText`: `#30D158` (Apple System Green) / `incomeBg`: `#14241B`.
     - `expenseText`: `#FF453A` (Apple System Red) / `expenseBg`: `#261616`.
     - `warningText`: `#FFD60A` (Apple System Yellow) / `warningBg`: `#262214`.
2. **Hero & Account Widgets:**
   - `BalanceHeroCard.tsx`: Connected to `useThemeContext()`; in Dark Mode, renders as an Apple-style Dark Green widget (`#132E22`) with an emerald hairline border (`#24523F`), subtle radial glows, and white/mint metrics. Removed all static `COLORS` references.
   - `BudgetScreen.tsx`: Summary budget hero card dynamically styled with `colors.widgetBg` and `colors.widgetBorder`.
   - `ProfileScreen.tsx`: Account card styled with `colors.widgetBg` and `colors.widgetBorder`.
3. **Category Badges (`CategoryIconBadge.tsx`):**
   - Added dark-mode specific translucent tinted backgrounds (`darkBgColor: 'rgba(..., 0.16)'`) and luminous glyph colors (`darkColor`), matching Apple Health/Stocks frosted icon widgets.
4. **Navigation & Interactive Accents:**
   - `AppHeader.tsx`: Title rendered in crisp `#FFFFFF` with `#52B788` dot, avatar icon dynamically framed with emerald accents.
   - `BottomTabBar.tsx`: Active tabs highlight with Sage Green (`#52B788`) against `#1C1C1E` dark grey bar.
   - `HomeScreen.tsx`: Primary action button uses `#2D6A4F`; secondary action button uses `#1C1C1E` with `#2C2C2E` border and `#52B788` text.
   - `BudgetProgressCard.tsx`: Header title `#FFFFFF`, progress track `#2C2C2E`, fill `#52B788`.
   - `TransactionsScreen.tsx`: Active filter chips use `#2D6A4F` with `#52B788` borders; inactive chips sit on `#1C1C1E`.
5. **Modals & Inputs:**
   - `AddTransactionModal.tsx`, `MagicReceiptModal.tsx`, `EditProfileModal.tsx`, `ThemeModal.tsx`, `ForgotPasswordModal.tsx`, `CalendarDatePickerModal.tsx`, `DateRangeFilterModal.tsx`: All sheets now sit on `#1C1C1E` with `#242426` elevated inputs, `#2C2C2E` borders, and `#2D6A4F` submit buttons.

## Files Affected
- `src/constants/theme.ts` (Modified)
- `src/views/components/cards/BalanceHeroCard.tsx` (Modified)
- `src/views/components/icons/CategoryIconBadge.tsx` (Modified)
- `src/views/components/navigation/AppHeader.tsx` (Modified)
- `src/views/components/navigation/BottomTabBar.tsx` (Modified)
- `src/views/screens/HomeScreen.tsx` (Modified)
- `src/views/screens/BudgetScreen.tsx` (Modified)
- `src/views/screens/ProfileScreen.tsx` (Modified)
- `src/views/screens/TransactionsScreen.tsx` (Modified)
- `src/views/screens/LoginScreen.tsx` (Modified)
- `src/views/screens/RegisterScreen.tsx` (Modified)
- `src/views/components/cards/BudgetProgressCard.tsx` (Modified)
- `src/views/components/transactions/AddTransactionModal.tsx` (Modified)
- `src/views/components/modals/MagicReceiptModal.tsx` (Modified)
- `src/views/components/modals/EditProfileModal.tsx` (Modified)
- `src/views/components/modals/ThemeModal.tsx` (Modified)
- `src/views/components/modals/ForgotPasswordModal.tsx` (Modified)
- `src/views/components/modals/CalendarDatePickerModal.tsx` (Modified)
- `src/views/components/modals/DateRangeFilterModal.tsx` (Modified)

## Verification Performed
- Ran `Grep` across `src/views`; verified 0 static `COLORS.` references remain.
- Ran `npx tsc --noEmit`; confirmed 0 TypeScript compilation errors.

## Final Result
Dark Mode now delivers a premium Apple Dark Grey experience with purposeful Dark Green widget accents, clear neutral typography, and frosted jewel category badges.
