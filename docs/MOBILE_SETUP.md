# DevelopWork mobile setup

The React app is wrapped by Capacitor under `client/android` and `client/ios`. The browser build remains unchanged.

## Android push setup (free)

1. Create a Firebase project without enabling billing.
2. Add an Android app with package ID `com.developsuite.developwork`.
3. Download `google-services.json` and place it at `client/android/app/google-services.json`.
4. In Firebase project settings, create a service account key. Do not commit that JSON file.
5. Set these Supabase Edge Function secrets from the service account JSON:

   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `PUSH_WEBHOOK_SECRET` (create a long random value)

6. Apply `supabase/migrations/024_native_push_notifications.sql`.
7. Deploy the webhook function with its own secret validation enabled:

   `supabase functions deploy send-push --no-verify-jwt`
8. Create a Supabase Database Webhook for INSERT events on `public.notifications`:

   - URL: `https://<project-ref>.supabase.co/functions/v1/send-push`
   - Header: `Authorization: Bearer <PUSH_WEBHOOK_SECRET>`

## Build and open the native projects

From `client`:

```powershell
npm run mobile:sync
npm run mobile:android
```

Android Studio can build and install the debug APK without a Play Store account. Use a physical phone for final push testing.

The iOS project is generated too, but compiling it requires macOS/Xcode. Native iOS push delivery requires Apple Push Notification configuration and normally an Apple Developer membership.

## Important files

- `capacitor.config.json`: app identity and native plugin options
- `src/components/native/NativeRuntimeBridge.jsx`: native lifecycle, deep links, and push events
- `src/services/nativePushService.js`: permission, token registration, and logout cleanup
- `supabase/functions/send-push`: secure FCM HTTP v1 sender
