#!/usr/bin/env node
// Static site build for briefings.inverisla.com
// Renders briefings/*.md into static HTML so all content is present in raw
// HTML for AI crawlers and non-JS fetchers. Ports the transforms previously
// done client-side in index.html, one for one.
//
// Outputs (repo root, served by GitHub Pages):
//   index.html                  latest briefing inlined
//   briefings/YYYY-MM-DD.html   permanent page per briefing
//   archive.html                full archive list
//   sitemap.xml
//
// index.html is GENERATED. Edit templates/page.html to change the design.

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const BRIEFINGS_DIR = path.join(ROOT, 'briefings');
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'templates', 'page.html'), 'utf8');
const SITE = 'https://briefings.inverisla.com';

marked.setOptions({ gfm: true, breaks: false, headerIds: false });

// ── markdown transforms (ported verbatim from the old client-side parser) ──
function parseMarkdown(md) {
  md = md.replace(/^# .+\n?/m, '');
  md = md.replace(/([^\n])\n(---+)\s*$/gm, '$1\n\n$2');
  md = md.replace(/^(- [^\n]+?)\n[ \t]+(\([^\n]+\))/gm, '$1 $2');
  md = md.replace(/^(- [^\n]+)\n\n(?=- )/gm, '$1\n');
  md = md
    .replace(/\[SIGNAL\]/g, '<span class="tag tag-signal">Signal</span>')
    .replace(/\[NOISE\]/g, '<span class="tag tag-noise">Agentwash</span>')
    .replace(/\[WATCH\]/g, '<span class="tag tag-watch">Watch</span>')
    .replace(/\[DATA\]/g, '<span class="tag tag-data">Data Point</span>');

  let html = marked.parse(md);

  html = html.replace(
    /<h2>([^<]*CLUSTER[^<]*)<\/h2>([\s\S]*?)(?=<h2|$)/gi,
    '<div class="cluster-card"><h3>$1</h3>$2</div>'
  );
  html = html.replace(
    /<p><strong>So what:<\/strong>\s*([^<]*)<\/p>/g,
    '<div class="so-what"><strong>So what:</strong> $1</div>'
  );
  html = html.replace(/<table>/g, '<div class="table-wrap"><table class="briefing-table">');
  html = html.replace(/<\/table>/g, '</table></div>');
  html = html.replace(
    /(<h2>[^<]*DATA POINTS[^<]*<\/h2>\s*)<ul>/i,
    '$1<ul class="data-points">'
  );
  return html;
}

// ── stats (ported from old renderBriefing) ──
function computeStats(markdown) {
  const clusterHeadings = markdown.match(/^##\s+(.+)$/gm) || [];
  const clusterCount = clusterHeadings.filter(h => {
    const text = h.replace(/^##\s+/, '').toUpperCase();
    return !text.includes('DATA POINTS') && !text.includes('AGENTWASHING') && !text.includes('WHO TO WATCH');
  }).length;

  const claimMatches = markdown.match(/\|\s*\**\s*(Signal|Noise|Watch)\b[^|]*\|/gi) || [];
  const urlMatches = markdown.match(/https?:\/\/[^\s<)"]+/g) || [];
  const uniqueSources = new Set(urlMatches.map(u => {
    try { return new URL(u).hostname; } catch { return u; }
  })).size;

  return {
    clusters: clusterCount || '—',
    flags: String(claimMatches.length || 0),
    sources: String(uniqueSources || 0),
  };
}

function tickerHtml(markdown) {
  const headings = [...markdown.matchAll(/^##\s*CLUSTER[^—-]*[—-]\s*(.+)$/gmi)].map(m => m[1].trim());
  if (headings.length === 0) return 'Signal over noise · Vendor independent';
  return headings.map(h => `<span>${escapeHtml(h)}</span><span class="ticker-sep">◆</span>`).join('');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDateFull(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  });
}
function formatDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', timeZone: 'UTC'
  });
}

// First non-heading paragraph of the briefing, for the meta description.
function metaDesc(markdown) {
  const lines = markdown.split('\n').map(l => l.trim());
  for (const l of lines) {
    if (!l || l.startsWith('#') || l.startsWith('|') || l.startsWith('-') || l.startsWith('---')) continue;
    const clean = l.replace(/\[(SIGNAL|NOISE|WATCH|DATA)\]/g, '').replace(/[*_`]/g, '').trim();
    if (clean.length > 40) return clean.length > 155 ? clean.slice(0, 152) + '...' : clean;
  }
  return 'Hospitality AI intelligence for operators and PE-backed SaaS companies. Signal-first, vendor-independent, published Monday, Wednesday and Friday.';
}

// ── load briefings ──
const dates = fs.readdirSync(BRIEFINGS_DIR)
  .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
  .map(f => f.replace('.md', ''))
  .sort((a, b) => b.localeCompare(a));

if (dates.length === 0) {
  console.error('No briefings found; nothing to build.');
  process.exit(1);
}

function archiveNav(activeDate) {
  return dates.map(date =>
    `<a class="archive-btn ${date === activeDate ? 'active' : ''}" href="/briefings/${date}.html">${formatDateShort(date)}</a>`
  ).join('\n      ');
}

function sidebarArchive() {
  return dates.slice(0, 10).map(date =>
    `<div style="padding: 0.1rem 0;"><a href="/briefings/${date}.html" style="color: inherit; text-decoration: none;">${formatDateFull(date)}</a></div>`
  ).join('\n            ');
}

function renderPage(date, { canonicalPath, pageTitle }) {
  const markdown = fs.readFileSync(path.join(BRIEFINGS_DIR, `${date}.md`), 'utf8');
  const stats = computeStats(markdown);
  const body = `
        <div class="briefing-date-header">
          <div class="date-label">${formatDateFull(date)}</div>
          <div class="date-meta">Daily Intelligence Report</div>
        </div>
        <div class="briefing-body">${parseMarkdown(markdown)}</div>`;

  return TEMPLATE
    .replace(/%%PAGE_TITLE%%/g, pageTitle)
    .replace(/%%META_DESC%%/g, escapeHtml(metaDesc(markdown)))
    .replace(/%%CANONICAL_URL%%/g, SITE + canonicalPath)
    .replace(/%%DATE_DISPLAY%%/g, formatDateFull(date))
    .replace(/%%TICKER%%/g, tickerHtml(markdown))
    .replace(/%%ARCHIVE_NAV%%/g, archiveNav(date))
    .replace(/%%BRIEFING_OUTPUT%%/g, body)
    .replace(/%%STAT_CLUSTERS%%/g, String(stats.clusters))
    .replace(/%%STAT_FLAGS%%/g, stats.flags)
    .replace(/%%STAT_SOURCES%%/g, stats.sources)
    .replace(/%%SIDEBAR_ARCHIVE%%/g, sidebarArchive());
}

// ── build ──
// index.html: latest briefing inlined
const latest = dates[0];
fs.writeFileSync(path.join(ROOT, 'index.html'), renderPage(latest, {
  canonicalPath: '/',
  pageTitle: 'Hospitality AI Intelligence — The Daily Brief',
}));

// one permanent page per briefing
for (const date of dates) {
  fs.writeFileSync(path.join(BRIEFINGS_DIR, `${date}.html`), renderPage(date, {
    canonicalPath: `/briefings/${date}.html`,
    pageTitle: `Hospitality AI Briefing — ${formatDateFull(date)}`,
  }));
}

// archive.html: full list as a simple static page reusing the template
const archiveBody = `
        <div class="briefing-date-header">
          <div class="date-label">Archive</div>
          <div class="date-meta">All published briefings</div>
        </div>
        <div class="briefing-body"><ul>
${dates.map(d => `          <li><a href="/briefings/${d}.html">${formatDateFull(d)}</a></li>`).join('\n')}
        </ul></div>`;
fs.writeFileSync(path.join(ROOT, 'archive.html'), TEMPLATE
  .replace(/%%PAGE_TITLE%%/g, 'Archive — Hospitality AI Intelligence')
  .replace(/%%META_DESC%%/g, 'Full archive of hospitality AI intelligence briefings, published Monday, Wednesday and Friday.')
  .replace(/%%CANONICAL_URL%%/g, SITE + '/archive.html')
  .replace(/%%DATE_DISPLAY%%/g, formatDateFull(latest))
  .replace(/%%TICKER%%/g, 'Signal over noise · Vendor independent')
  .replace(/%%ARCHIVE_NAV%%/g, archiveNav(null))
  .replace(/%%BRIEFING_OUTPUT%%/g, archiveBody)
  .replace(/%%STAT_CLUSTERS%%/g, String(dates.length))
  .replace(/%%STAT_FLAGS%%/g, '—')
  .replace(/%%STAT_SOURCES%%/g, '—')
  .replace(/%%SIDEBAR_ARCHIVE%%/g, sidebarArchive()));

// sitemap.xml
const urls = [
  { loc: SITE + '/', lastmod: latest },
  { loc: SITE + '/archive.html', lastmod: latest },
  ...dates.map(d => ({ loc: `${SITE}/briefings/${d}.html`, lastmod: d })),
];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n') +
  `\n</urlset>\n`);

console.log(`Built: index.html, archive.html, ${dates.length} briefing pages, sitemap.xml (latest: ${latest})`);
