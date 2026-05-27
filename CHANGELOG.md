# Changelog

Notable changes to the agent prompt, workflow, and site. Dates reflect when the change was applied.

## 2026-05-26

- Versioned the agent configuration. Full Managed Agents YAML now lives in `agent/agent-config.yaml`.
- Added README and CHANGELOG for the repo.

## 2026-05-22

### Agent prompt
- Tightened DATA POINTS FOR COMMERCIAL CASE format with strict single-line requirement, four positive examples, and explicit "no blank lines between items" instruction.
- Added WHO TO WATCH strict format requirements (consistent paragraph structure, no horizontal rules between entries, no definition list syntax).
- Added SEPARATORS AND OUTPUT DISCIPLINE section requiring blank lines around `---` separators (fixes Marked interpreting trailing `---` as a Setext heading).
- Removed implicit trailing separator after Who to Watch — briefing now ends with the final entry.

### Site rendering
- Replaced hand-rolled markdown parser with Marked. Site now renders the same markdown that Claude Console displays.
- Sidebar stats now reflect actual briefing content: cluster headings (excluding agentwashing, data points, who to watch sections), vendor claims assessed across all verdict types, and unique source domains cited.
- Added pre-processor regex to normalise common agent output quirks (collapsing multi-line data points, defanging accidental Setext headings).
- Visual identity aligned with inverisla.com — Fraunces serif, Inter Tight body, JetBrains Mono labels, warm gold accent (#c9a96a) replacing the previous red.

## 2026-05-20

### Cost diagnosis
- Hit Anthropic Tier 1 rate limit (50k input tokens per minute) during synthesis call after twelve parallel article fetches accumulated context.
- Upgraded to Tier 2 (100k ITPM). Briefings now complete reliably at ~$0.75 per run.

### Workflow improvements
- Reduced polling timeout from 20 minutes to 7.5 minutes.
- Added explicit error and timeout handling — commits a failure stub markdown file if the agent errors or doesn't complete, so the site doesn't go silent on failed runs.
- Token usage now logged in the briefing footer for cost visibility.

## 2026-05-13

### Agent prompt
- Hard constraints moved to top of system prompt, numbered, framed as overriding all other instructions.
- Single-pass enforcement: one search round (max 8 queries), one fetch round (max 12 articles), then write. No iteration permitted.
- Within-cluster structural guidance added: theme statement, bold vendor names at paragraph starts, blank lines between developments, explicit Sources and So what lines.

### Cost outcome
- Daily cost dropped from ~$2.30 per run (with iterative agent loops) to ~$0.75 per run with single-pass enforcement.

## 2026-05-06

### Schedule and sources
- Moved from daily to Monday/Wednesday/Friday cadence with 2-3 day lookback. Reduces monthly cost by 40% and produces denser briefings.
- Source list rebalanced toward restaurant trade press (Restaurant Dive, Big Hospitality, Nation's Restaurant News, Modern Restaurant Management, The Caterer, Restaurant Business Online, Eater, Restaurant Technology News) to match the operator audience.
- Vendor blogs (Mews, Toast, SevenRooms, OpenTable, Cendyn) explicitly flagged as positioning material to cross-reference rather than take at face value.

### Custom domain
- Briefings site moved from `colinwinning-hue.github.io/hospitality-ai-briefings/` to `briefings.inverisla.com`.

## 2026-05-01

- Initial release. Daily agent run, generic source list, iterative agent loop. Cost ~$50/month.
