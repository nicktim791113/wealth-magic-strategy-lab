# Phase 2 cloud investment lab

Phase 2 turns the static GitHub Pages dashboard into a cloud-backed lab with login, database snapshots, and a manual refresh button.

## Architecture

```text
GitHub Pages React app
  -> Supabase Auth for login
  -> Supabase Postgres for user snapshots and refresh history
  -> Supabase Edge Function for privileged refresh requests
  -> GitHub Actions for market/news refresh and Pages deployment
```

The browser must never receive the GitHub token or Supabase service-role key. Those secrets live only in GitHub repository secrets or Supabase Edge Function secrets.

## Files added

```text
src/components/CloudPage.tsx
src/lib/cloudConfig.ts
src/lib/supabaseClient.ts
src/lib/useCloudSession.ts
supabase/migrations/202606210001_phase2_cloud_lab.sql
supabase/functions/trigger-refresh/index.ts
.env.example
```

## Supabase setup

1. Create a Supabase project.
2. In Supabase SQL Editor, run:

```text
supabase/migrations/202606210001_phase2_cloud_lab.sql
```

3. Enable Email/Password sign-in under Supabase Auth providers.
4. Deploy the Edge Function:

```powershell
supabase functions deploy trigger-refresh
```

5. Set Edge Function secrets:

```powershell
supabase secrets set GITHUB_ACTIONS_TOKEN=your_github_token
supabase secrets set GITHUB_REPOSITORY=nicktim791113/wealth-magic-strategy-lab
supabase secrets set GITHUB_WORKFLOW_FILE=deploy-pages.yml
supabase secrets set GITHUB_BRANCH=main
```

Supabase automatically provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions.

## GitHub repository secrets

Add these in `Settings -> Secrets and variables -> Actions`:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

After secrets are added, run the GitHub Actions workflow manually once:

```text
Refresh data and deploy GitHub Pages
```

## Local development

Copy `.env.example` to `.env` and fill:

```powershell
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
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
Supabase Edge Function: trigger-refresh
```

The function verifies the logged-in Supabase user, calls the GitHub Actions workflow dispatch API with a server-side token, writes a row into `refresh_jobs`, and returns the Actions URL.

## Privacy rules

- Public GitHub Pages can show the UI, but personal data should live in Supabase behind Auth and RLS.
- Do not put real broker credentials, API keys, or account balances into public repo files.
- Keep GitHub tokens and service-role keys out of frontend variables.
- Use RLS policies in the migration before storing user-specific trading data.
