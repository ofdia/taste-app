# Google Play Data Safety Notes for Ramenlog

Use this as a working draft when filling out Google Play Console.

## App Behavior in Current Project

- User-entered ramen records are stored locally on device
- Photos are selected from device library only when the user chooses
- Google AdMob banner ads are included on native builds
- The ads SDK may use advertising identifiers and device/app information
- No microphone access is required by the shipped Android config
- No login flow is present
- No analytics SDK is present
- No remote backend is configured in this project for user data upload

## Likely Play Console Answers

These are not legal advice. Review against the final shipped app before submitting.

- Data shared: Review carefully with your final AdMob setup
- Ads SDK: Yes
- No analytics SDK
- No account creation
- Core app data is stored locally on device

## Important

If you later add:

- analytics
- crash reporting
- cloud sync
- account login
- external API upload of user content

you must update the Data Safety form to match the shipped app.
