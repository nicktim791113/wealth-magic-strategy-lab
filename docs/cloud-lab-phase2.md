# Phase 2 Firebase cloud lab

Phase 2 uses Firebase to turn the static GitHub Pages dashboard into a cloud-backed lab with login, Firestore snapshots, and a manual refresh button.

## Architecture

```text
GitHub Pages React app
  -> Firebase Auth for login
  -> Cloud Firestore for user snapshots and refresh history
  -> Firestore Security Rules for per-user data isolation
  -> Cloud Functions for privileged refresh requests
  -> GitHub Actions for market/news refresh and Pages deployment
```

The browser must never receive the GitHub token. That token lives only in Firebase Functions secrets.

## Files added

```text
src/components/CloudPage.tsx
src/lib/cloudConfig.ts
src/lib/firebaseClient.ts
src/lib/useFirebaseSession.ts
firebase.json
firestore.rules
firestore.indexes.json
functions/index.js
functions/package.json
.env.example
```

## Firebase setup

1. Create a Firebase project.
2. Add a Web app in Firebase project settings.
3. Enable Authentication -> Email/Password.
4. Create Cloud Firestore in production mode.
5. Install and log in to Firebase CLI:

```powershell
npm install -g firebase-tools
firebase login
```

6. Connect this repo to the Firebase project:

```powershell
firebase use --add
```

7. Deploy Firestore rules and Functions:

```powershell
firebase deploy --only firestore:rules,firestore:indexes,functions
```

## Firebase Function secrets

Create a GitHub personal access token that can dispatch workflows for this repo, then set it as a Firebase secret:

```powershell
firebase functions:secrets:set GITHUB_ACTIONS_TOKEN
```

Copy `functions/.env.example` to `functions/.env` for non-secret function settings before deploy:

```text
GITHUB_REPOSITORY=nicktim791113/wealth-magic-strategy-lab
GITHUB_WORKFLOW_FILE=deploy-pages.yml
GITHUB_BRANCH=main
```

Do not commit `functions/.env`.

## GitHub repository secrets

Add these in `Settings -> Secrets and variables -> Actions`:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_FIREBASE_FUNCTIONS_REGION
```

After secrets are added, run the GitHub Actions workflow manually once:

```text
Refresh data and deploy GitHub Pages
```

## Local development

Copy `.env.example` to `.env` and fill the Firebase web config:

```powershell
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
VITE_GITHUB_REPOSITORY=nicktim791113/wealth-magic-strategy-lab
VITE_REFRESH_WORKFLOW_FILE=deploy-pages.yml
```

Then run:

```powershell
npm run dev:daily
```

## What the button does

The `立即更新` button calls:

```text
Firebase callable function: triggerRefresh
```

The function verifies the logged-in Firebase user, calls the GitHub Actions workflow dispatch API with a server-side token, writes a row into `users/{uid}/refreshJobs`, and returns the Actions URL.

## Firestore layout

```text
users/{uid}
users/{uid}/labSnapshots/{snapshotId}
users/{uid}/refreshJobs/{jobId}
users/{uid}/settings/{settingId}
users/{uid}/hypotheses/{hypothesisId}
users/{uid}/trades/{tradeId}
users/{uid}/intelligenceSources/{sourceId}
```

## Privacy rules

- Public GitHub Pages can show the UI, but personal data should live in Firestore behind Auth and Security Rules.
- Do not put real broker credentials, API keys, account balances, or private trading logs into public repo files.
- Keep GitHub tokens out of frontend variables.
- Deploy `firestore.rules` before storing user-specific trading data.
