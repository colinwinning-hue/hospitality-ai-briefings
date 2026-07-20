# Hospitality AI Intelligence Briefings

Three-times-a-week AI intelligence for hospitality operators and PE-backed SaaS companies. An autonomous research agent scans 15+ hospitality trade press, research, and technology sources and publishes a structured briefing to [briefings.inverisla.com](https://briefings.inverisla.com).

Signal over noise. Vendor-independent. Built and run by [Inverisla](https://inverisla.com).

## What gets published

Each briefing covers:

- **Clusters** — themes grouped by signal, not source, drawn from seven domains (Data & Integration, AI Visibility & Discovery, Vendor Moves, Operational AI, People & Skills, Governance & Security, Funding & M&A)
- **Agentwashing table** — vendors relabelling old features versus genuine AI-native moves, with explicit verdicts (Signal / Watch / Noise)
- **Data points** — stats and figures useful for building a commercial case for AI readiness work
- **Who to watch** — analysts, operators, and founders worth following based on the week's material

## How it works

```
GitHub Actions (7am UTC, Mon/Wed/Fri)
    → Creates an Anthropic Managed Agents session
    → Sends trigger message ("Run a briefing covering the last 2-3 days...")
    → Polls for completion (up to 7.5 minutes)
    → Commits the briefing as /briefings/YYYY-MM-DD.md
    → Site reads from the repo and renders via Marked
```

The briefing dashboard at briefings.inverisla.com is a static HTML page that fetches the latest markdown files from this repo via the GitHub API and renders them client-side. No build step.

## Repository structure

```
hospitality-ai-briefings/
├── .github/workflows/briefing.yml   GitHub Actions schedule and trigger
├── agent/agent-config.yaml          Anthropic Managed Agents system prompt and config
├── briefings/                       Markdown output, one file per edition
├── index.html                       Dashboard / rendering site
├── CNAME                            Custom domain config for GitHub Pages
├── CHANGELOG.md
└── README.md
```

## Schedule and cost

- Runs three times a week: Monday, Wednesday, Friday at 7am UTC
- Cost per run: ~$0.75 in Anthropic API tokens (Sonnet 4.6, requires Tier 2 or higher)
- Approximate monthly cost: **~$10/month**

The cron schedule lives in `.github/workflows/briefing.yml`:

```
0 7 * * 1,3,5   →   7am UTC on Mon, Wed, Fri
```

## Agent configuration

The full system prompt is versioned in `agent/agent-config.yaml`. Changes to the prompt are reflected in subsequent briefings. To update the live agent, edit the YAML, copy its contents into the Anthropic Managed Agents console, and save.

The current configuration enforces:

- One search round, one fetch round, then write (no agent loops)
- Maximum 12 articles fetched per run
- Strict format requirements for the agentwashing table, data points list, and who to watch entries

## Known limitations

- Duplicate stories occasionally appear in consecutive editions when the news cycle hasn't moved on. The agent doesn't yet track what it covered in the previous run.
- Coverage balance between restaurant and hotel can skew on quieter news days. The prompt instructs the agent to note this explicitly rather than pad with weak material.

## About

Published by [Inverisla](https://inverisla.com) — independent advisory for hospitality technology and AI.

The story of building this tool, including the cost iterations and the rate limit diagnosis, is at [inverisla.com/writing/intelligence-briefing-tool](https://inverisla.com/writing/intelligence-briefing-tool).

## Static build (added July 2026)

The site is now rendered at build time so all content is present in raw HTML for AI crawlers and non-JS fetchers. `index.html`, `archive.html`, `sitemap.xml` and `briefings/*.html` are **generated** — do not edit them by hand. Edit `templates/page.html` to change the design and `scripts/build.js` to change rendering.

- `scripts/build.js` converts every `briefings/YYYY-MM-DD.md` into `briefings/YYYY-MM-DD.html` (permanent URL), inlines the latest briefing into `index.html`, and emits `archive.html` and `sitemap.xml`.
- `daily-briefing.yml` runs the build after the agent commits a new markdown briefing.
- `build-site.yml` rebuilds on manual pushes to `briefings/**.md`, `templates/**` or `scripts/**` (Actions-token pushes from the daily workflow do not trigger it, which is why the daily workflow builds itself).
- Run locally: `npm install && npm run build`.
- `robots.txt` allows all crawlers and points at the sitemap. Check the Cloudflare zone isn't serving a managed robots.txt over the top of it.
