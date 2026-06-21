# GitHub Pages phase 1 remote mode

This project can run as a static GitHub Pages site. GitHub Actions refreshes market/news data, builds the Vite app, and publishes the generated `dist` folder.

## What this enables

- The local computer does not need to stay on for scheduled refreshes.
- The site can be opened from a phone or another computer through the GitHub Pages URL.
- The workflow can be triggered manually from GitHub Actions.
- Future Codex/GitHub changes can be merged into `main`; the site rebuilds after push.

## Automation schedule

The workflow is stored at:

```text
.github/workflows/deploy-pages.yml
```

It runs on:

- push to `main`
- manual `workflow_dispatch`
- Monday-Friday 08:00 Asia/Taipei for Taiwan pre-market refresh
- Monday-Friday 06:30 Asia/Taipei for US after-market refresh

GitHub cron schedules are written in UTC inside the workflow.

## Local verification

Run these before pushing a deployment change:

```powershell
npm run refresh:data
npm run build
```

## GitHub setup checklist

1. Push this project to a GitHub repository.
2. In the repository, open `Settings -> Pages`.
3. Under `Build and deployment`, choose `Source: GitHub Actions`.
4. Open the `Actions` tab.
5. Run `Refresh data and deploy GitHub Pages` manually once.
6. After it finishes, open the URL shown in the deploy job.

## Important privacy note

GitHub Pages is best for public or non-sensitive dashboards. Do not publish real personal holdings, broker records, account balances, API keys, or private trading logs here. Move those to an authenticated cloud app before publishing them remotely.
