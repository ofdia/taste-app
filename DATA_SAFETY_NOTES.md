# Google Play Data Safety Notes for Ramenlog

Use this as a working draft when filling out Google Play Console.

## App Behavior in Current Project

- User-entered ramen records are stored locally on device
- Photos are selected from device library only when the user chooses
- No login flow is present
- No analytics SDK is present
- No ads SDK is present
- No remote backend is configured in this project for user data upload

## Likely Play Console Answers

These are not legal advice. Review against the final shipped app before submitting.

- Data shared: No
- No ads SDK
- No analytics SDK
- No account creation
- Core app data is stored locally on device

## Important

If you later add:

- analytics
- crash reporting
- ads
- cloud sync
- account login
- external API upload of user content

you must update the Data Safety form to match the shipped app.
