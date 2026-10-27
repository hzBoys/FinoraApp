# Development Report: EAS Build Pre-Flight Quality Check (APK & IPA)

- **Date & Time:** 2026-10-27 22:05 (Local Project Time)
- **Title:** `2026-10-27-22-05-eas-build-preflight-quality-check.md`

## Task Summary
Conducted an exhaustive pre-flight Quality Check (QC) across native Android (APK) and iOS (IPA) build configurations. Identified and resolved critical issues that would cause cloud compilation or runtime crashes: missing EAS cloud environment variables for Supabase, missing `expo-image-picker` native permissions in `app.json`, and an obsolete `splash` schema declaration.

## Critical Findings & Fixes
1. **Missing EAS Cloud Environment Variables (Runtime Crash Prevention):**
   - *Issue Identified:* Because `.env` is ignored by git, EAS Build on the cloud had 0 environment variables defined. Any APK/IPA compiled would have had empty `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, causing the app to crash or fail authentication on device launch.
   - *Fix:* Injected `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` directly into project `@hzboy/finora` on EAS cloud for both `preview` and `production` environments.
2. **Missing Native Camera & Photos Permissions (`app.json`):**
   - *Issue Identified:* In standalone native builds, iOS crashes immediately upon accessing camera or photo library if `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` are not defined in `Info.plist`.
   - *Fix:* Added `expo-image-picker` config plugin in `app.json` with user-friendly Indonesian permission descriptions.
3. **App Config Schema Validation (`app.json`):**
   - *Issue Identified:* `expo-doctor` caught an invalid top-level `splash` property deprecated in SDK 58.
   - *Fix:* Removed the property to comply 100% with Expo SDK 58 schema.
4. **Build Profiles (`package.json` & `eas.json`):**
   - Configured `npm run build:apk` for standalone Android `.apk`.
   - Configured `npm run build:ipa` for iOS device `.ipa` (requires Apple Developer account).
   - Added `npm run build:ios-sim` for iOS simulator `.tar.gz` (no Apple Developer account required).

## Verification Performed
- `npx expo-doctor`: **20/20 checks passed** (0 errors).
- `npx tsc --noEmit`: **0 TypeScript compilation errors**.
- `npx eas-cli env:list --environment preview`: Verified `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are active on EAS cloud.
- `npx expo config --type public`: Verified all plugins and platform configs evaluate cleanly.
- Git committed and pushed cleanly to `main` as `hzBoys`.

## Final Result
Both Android APK and iOS IPA build configurations are verified 100% compliant and ready for compilation.
