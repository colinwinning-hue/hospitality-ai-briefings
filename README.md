# Hospitality AI Intelligence Briefings

Daily AI intelligence for hospitality operators and PE-backed SaaS companies. An autonomous research agent scans 15+ hospitality and technology sources each morning and produces a structured briefing — signal over noise, vendor-independent.

## Setup

### 1. Create the repo
Create a new GitHub repository called `hospitality-ai-briefings`. Make it **public** (required for GitHub Pages).

### 2. Add your API key
In the repo: **Settings → Secrets and variables → Actions → New repository secret**
- Name: `ANTHROPIC_API_KEY`
- Value: your Anthropic API key

### 3. Update the dashboard
In `index.html`, find this line near the top of the `<script>` block and update it:
```js
const REPO_OWNER = 'YOUR_GITHUB_USERNAME';  // ← update this
```

### 4. Enable GitHub Pages
In the repo: **Settings → Pages**
- Source: `Deploy from a branch`
- Branch: `main`, folder: `/ (root)`
- Save

Your dashboard will be live at: `https://YOUR_USERNAME.github.io/hospitality-ai-briefings/`

### 5. Run manually to test
Go to **Actions → Hospitality AI Daily Briefing → Run workflow**

The first briefing will be committed to `/briefings/YYYY-MM-DD.md` and appear on the dashboard within a minute.

---

## How it works

```
GitHub Actions (7am UTC daily)
    → Creates a Managed Agents session
    → Sends trigger message
    → Polls for completion (up to 20 minutes)
    → Commits briefing as /briefings/YYYY-MM-DD.md
    → Dashboard reads from repo via GitHub API
```

## Briefing structure

Each briefing covers:
- **Clusters** — themes grouped by signal, not source
- **Agentwashing Watch** — vendors relabelling old features as AI
- **Data Points** — ROI figures, stats useful for client conversations  
- **Who to Watch** — new voices worth following

## Adjusting the schedule

In `.github/workflows/daily-briefing.yml`, the cron schedule is:
```
0 7 * * *   →  7:00am UTC daily
```

Adjust to your preferred time. UTC+1 (BST) means `0 6 * * *` for 7am Scottish time in summer.

## Costs

Each briefing run costs approximately:
- ~$0.05–0.15 in Claude API tokens (depending on article volume)
- ~$0.01–0.02 in session runtime ($0.08/hour, runs ~10–15 minutes)
- Web searches: $0.01 per 1,000 searches

Estimated monthly cost: **~$3–5/month** for a daily briefing.
