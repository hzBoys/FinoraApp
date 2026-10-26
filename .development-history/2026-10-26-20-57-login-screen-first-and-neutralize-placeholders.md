# Development Report: Login Screen First and Neutralize Placeholders

- **Date & Time:** 2026-10-26 20:57 (Local Project Time)
- **Title:** `2026-10-26-20-57-login-screen-first-and-neutralize-placeholders.md`

## Task Summary
Configured the application entry screen to display the Login screen first rather than the Register screen, removed the subtitle tagline on the login card, and neutralized all input field placeholders and demo references across the app to use clean generic identifiers (`user@finora.app`, `userfinora`, `Pengguna`) with zero mentions of "Teddy".

## Relevant Previous Context
- Previously, the entry screen was set to Register and input fields had legacy placeholders referring to "Teddy Prasetya" / "seskabteddy".
- The user requested:
  1. Login screen must appear first when opening the app.
  2. Remove the subtitle "Kelola pengeluaran dan pantau anggaran dengan tenang" from LoginScreen.
  3. Replace all field placeholders with generic examples (`user@finora.app`, `userfinora`).

## Changes Made
1. **Entry Screen Routing (`App.tsx`):**
   - Changed `authScreen` initial state to `'login'`.
2. **Login Screen Refinements (`src/views/screens/LoginScreen.tsx`):**
   - Removed subtitle paragraph `<Text style={styles.cardSub}>Kelola pengeluaran dan pantau anggaran dengan tenang.</Text>`.
   - Updated email/username input placeholder to `"user@finora.app atau userfinora"`.
3. **Register Screen Placeholders (`src/views/screens/RegisterScreen.tsx`):**
   - Name input placeholder updated to `"Nama Lengkap Anda"`.
   - Username input placeholder updated to `"userfinora"`.
   - Email input placeholder updated to `"user@finora.app"`.
4. **Modals & Global Profile Neutralization:**
   - `ForgotPasswordModal.tsx`: Placeholder updated to `"contoh: user@finora.app"`.
   - `AppHeader.tsx`: Default `userName` updated to `'Pengguna'`.
   - `useUserProfile.ts`: `INITIAL_USER` updated to generic `Pengguna`, `userfinora`, `user@finora.app`.
   - `AuthContext.tsx`: Local fallback updated to `demo@finora.app` / `userfinora`.

## Files Affected
- `App.tsx` (Modified)
- `src/views/screens/LoginScreen.tsx` (Modified)
- `src/views/screens/RegisterScreen.tsx` (Modified)
- `src/views/components/modals/ForgotPasswordModal.tsx` (Modified)
- `src/views/components/navigation/AppHeader.tsx` (Modified)
- `src/controllers/useUserProfile.ts` (Modified)
- `src/context/AuthContext.tsx` (Modified)

## Verification Performed
- Ran `Grep` across `src/` and `App.tsx` for `teddy`; verified 0 occurrences remain.
- Ran `npx tsc --noEmit`; confirmed 0 TypeScript compilation errors.
- Verified that `App.tsx` starts with `authScreen = 'login'` and renders `LoginScreen` on cold launch.

## Final Result
App launches on clean Login screen with no promotional sub-text, generic placeholders, and a direct link to "Daftar Baru".
