# Google Calendar and Meet Integration

## What is implemented

- One Google Calendar connection per DevelopWork workspace/tenant.
- Only a workspace administrator can connect or disconnect the Google account.
- Admins and authorized Meetings managers use the workspace connection; OAuth tokens never reach the browser.
- Creating a Google Meet meeting creates a real Google Calendar event, invites attendees, and returns Google's unique Meet URL.
- Updating or deleting the DevelopWork meeting updates or cancels its linked Google event.
- The AI Command Center can check connection status and create, update, list, or cancel meetings through the same meeting service.
- Refresh tokens are encrypted with AES-256-GCM before being stored.

## Google Cloud setup

1. Create or select a project in Google Cloud Console.
2. Enable the **Google Calendar API**.
3. Configure the OAuth consent screen. While the app is in testing, add every Google account that will be used as a test user.
4. Create an OAuth client with application type **Web application**.
5. Add this exact production redirect URI:

   ```text
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/google-calendar/callback
   ```

6. For local Supabase Edge Function testing, also add:

   ```text
   http://127.0.0.1:54321/functions/v1/google-calendar/callback
   ```

The integration requests `openid`, `email`, and `calendar.events`. The Calendar scope allows DevelopWork to view and edit events so it can maintain linked meetings; it does not request Drive, Gmail, or contacts access.

## Supabase configuration

Generate an encryption key and keep it stable. Changing it later makes stored refresh tokens unreadable, so every workspace would need to reconnect.

```bash
openssl rand -base64 32
```

Set production secrets:

```bash
supabase secrets set GOOGLE_CLIENT_ID="..." GOOGLE_CLIENT_SECRET="..."
supabase secrets set GOOGLE_REDIRECT_URI="https://YOUR_PROJECT_REF.supabase.co/functions/v1/google-calendar/callback"
supabase secrets set GOOGLE_TOKEN_ENCRYPTION_KEY="..." APP_URL="https://thedevelopwork.com"
```

Apply and deploy:

```bash
supabase db push
supabase functions deploy google-calendar --no-verify-jwt
```

`verify_jwt` is disabled at the gateway because Google's OAuth callback does not include a Supabase token. The function validates the one-time OAuth state on callbacks and validates the current Supabase user for every application action.

For local development, copy `supabase/functions/.env.example` to a private environment file, fill it in, and start Supabase functions with that environment file. Do not put the Google client secret or token-encryption key in `client/.env` or any `VITE_*` variable.

## Admin workflow

1. Sign in as a workspace admin.
2. Open **Settings > Integrations**.
3. Select **Connect Google** and approve access.
4. Open Meetings and schedule a Google Meet meeting.
5. Confirm the event appears on the connected Google account's calendar, the attendee received an invitation, and the generated Meet URL opens.

Each admin workspace repeats this flow with its own Google account. A manager cannot replace or disconnect the workspace calendar.

## Acceptance checks

- Workspace A and Workspace B can connect different Google accounts.
- A meeting created in Workspace A never appears in Workspace B's calendar.
- A Google Meet meeting has a genuine `meet.google.com` link returned by Google.
- Editing its title, time, attendees, or agenda updates the same Google event.
- Deleting it removes the Google event and sends attendee cancellation updates.
- The AI can list, schedule, edit, and cancel meetings only for the signed-in admin's tenant.
- Disconnecting a workspace leaves existing Google events intact but blocks new Google Meet scheduling until reconnection.
