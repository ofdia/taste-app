# Google Play Release Checklist

## Current App Setup

- Android package: `app.ramenlog.mobile`
- Android versionCode: `5`
- Expo app version: `1.0.0`
- EAS config file: `eas.json`
- EAS Android keystore: configured
- Latest production Android build: completed on 2026-03-21

## Before First Release

1. Review the package name in [app.json](/C:/Users/OFdia/taste-app/app.json).
   Keep it if you want `app.ramenlog.mobile`.
   Change it now if you want a different permanent package name.
2. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
3. Log in to Expo:
   ```bash
   eas login
   ```
4. Configure the project for EAS:
   ```bash
   eas build:configure
   ```
5. Build the Android App Bundle:
   ```bash
   eas build --platform android --profile production
   ```
6. Confirm your Google Play Console app exists for `app.ramenlog.mobile`.
7. Upload the latest `.aab` build to the `Internal testing` track.

## Play Console Tasks

- Add app name, short description, full description
- Upload app icon, feature graphic, phone screenshots
- Complete `App content`
- Complete `Data safety`
- Complete `Content rating`
- Add privacy policy URL
- Set test details if requested
- Add release notes
- Replace remaining AdMob test IDs before production release

## Current Release Blockers

- Android ads are configured, but iOS still uses Google test App ID and test banner ID.
- The Play Console privacy policy URL should point to the published `docs/privacy-policy.html` page or another public page with the same AdMob disclosure.
- Because AdMob is a native SDK, ads must be validated in an Android development build or production build, not Expo Go.

## Suggested Release Assets

- App icon: already present in `assets/images/icon.png`
- Android adaptive icon assets: already present in `assets/images/`
- Prepare at least 2-4 phone screenshots from real app screens

## After First Upload

You can continue with:

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

## Notes

- `versionCode` must increase for every Play Store update.
- `autoIncrement` is enabled in `eas.json` for production builds.
- Android build signing is configured in EAS remote credentials.
- `android.permission.RECORD_AUDIO` is blocked in `app.json` because the app only uses photo library access.
- AdMob is partially configured for production. Android uses a production App ID and banner unit, while iOS still uses Google test IDs.
- The package name cannot be changed after the app is created in Google Play.
