# QuickCut Mobile App

React Native + Expo Router app for clients and barbers.

## Local development
1. Install dependencies:
   - `npm install`
2. Start app:
   - `npx expo start`

## Backend URL config
- Development can auto-detect host from Expo.
- Production build requires:
  - `EXPO_PUBLIC_API_BASE_URL=https://your-api-domain`

## Notifications
- Push notifications require development build or production build (not Expo Go).

## Android Play Store release
1. Login to Expo: `eas login`
2. Build AAB:
   - `eas build --platform android --profile production`
3. Submit:
   - `eas submit --platform android --profile production`
4. Complete Play Console listing and Data Safety form.

## Required release assets
- App icon and screenshots
- Privacy policy URL
- Support/contact info
