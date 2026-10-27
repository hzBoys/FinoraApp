# Development Report: Fix Calendar Date Picker In-Modal Overlay and Dynamic Day Selection

- **Date & Time:** 2026-10-27 15:04 (Local Project Time)
- **Title:** `2026-10-27-15-04-fix-calendar-in-modal-overlay.md`

## Task Summary
Investigated and resolved the date picker calendar bug in `AddTransactionModal` where the calendar was unclickable and stuck on today's date. Eliminated the nested native `<Modal>` conflict by restructuring `CalendarDatePickerModal` into an in-modal absolute overlay view, bound calendar touch events directly within the active modal window, dynamically computed today's date and day name from `new Date()`, and enhanced `transactionService.formatIsoDate` to parse any Indonesian month name into standard ISO format.

## Root Cause Analysis
1. **Nested Native Modal Conflict:**
   - `AddTransactionModal` is presented via a native React Native `<Modal>`.
   - `CalendarDatePickerModal` previously also rendered using a nested native `<Modal visible={isCalendarOpen}>`.
   - In React Native (both iOS and Android), presenting a secondary `<Modal>` while another `<Modal>` is active fails:
     - On iOS: UIKit rejects the presentation (`Attempt to present on a view controller which is already presenting`).
     - On Android: Native Dialog window layering swallows touches, rendering the child modal unresponsive or invisible.
2. **Hardcoded Fallbacks:**
   - Previous state hardcoded `'27 Okt'` and `'Selasa'` without dynamic initialization from device time.
   - Day selection did not dynamically format across all 12 Indonesian month names in database ISO conversions.

## Changes Made
1. **In-Modal Overlay Architecture (`CalendarDatePickerModal.tsx`):**
   - Removed the outer native `<Modal>` wrapper from `CalendarDatePickerModal`.
   - Replaced it with an absolute-positioned overlay view (`styles.overlayBackdrop`: `position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, elevation: 20`).
   - Dynamically calculates current day, month, and year from device `new Date()`.
   - Allows users to tap any day in the grid, instantly updating the header preview (e.g. `Rabu, 28 Oktober 2026`) and confirm button (`Pilih Rabu, 28 Okt`).
   - Added quick "Hari Ini" button to instantly select today's date.
2. **Modal Integration (`AddTransactionModal.tsx`):**
   - Integrated `CalendarDatePickerModal` directly inside `AddTransactionModal`'s native `<Modal>` window.
   - Automatically calls `Keyboard.dismiss()` when opening the calendar to prevent keyboard obstruction.
   - Added `getTodayState()` helper to dynamically set today's day name, date, and `isToday` flag.
   - Formatted button label to clearly display day name and status (e.g. `Hari ini (Selasa), 27 Okt 2026` or `Kamis, 15 Okt 2026`).
3. **Database Date Parsing (`transactionService.ts`):**
   - Updated `formatIsoDate` with `MONTH_NAME_TO_NUMBER` dictionary mapping Indonesian short month names (`Jan`–`Des`) to two-digit numbers, ensuring all calendar choices persist accurately to Supabase.

## Files Affected
- `src/views/components/modals/CalendarDatePickerModal.tsx` (Modified)
- `src/views/components/transactions/AddTransactionModal.tsx` (Modified)
- `src/services/db/transactionService.ts` (Modified)

## Verification Performed
- Ran `npx tsc --noEmit`; confirmed 0 TypeScript compilation errors.
- Verified that `CalendarDatePickerModal` no longer uses native `<Modal>` and renders within `AddTransactionModal`'s window.
- Verified `transactionService.formatIsoDate` parses dynamic month and day strings accurately.

## Final Result
Calendar date picker now opens smoothly without native modal collisions, touch interactions on all calendar days work instantly, and dates can be freely changed with dynamic day name indicators.
