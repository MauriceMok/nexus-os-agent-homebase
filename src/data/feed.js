export const INITIAL_FEED = [
  { id: 1, time: '16:54:02', agent: 'NOVA', type: 'success', msg: 'CI/CD pipeline deployment verified — 0 errors across 14 services' },
  { id: 2, time: '16:53:47', agent: 'ARIA', type: 'info', msg: 'Scraped 847 data points from competitor pricing pages' },
  { id: 3, time: '16:53:31', agent: 'CIPHER', type: 'code', msg: 'Committed rate-limiter.ts — 312 lines, 98.4% test coverage' },
  { id: 4, time: '16:53:15', agent: 'ORION', type: 'success', msg: 'Meta campaign CTR increased +2.3% after bid adjustment' },
  { id: 5, time: '16:52:58', agent: 'ECHO', type: 'info', msg: 'Email sequence draft complete — 7 emails, 2,847 words total' },
  { id: 6, time: '16:52:40', agent: 'NOVA', type: 'warning', msg: 'Zapier webhook latency spike detected — auto-retry engaged' },
  { id: 7, time: '16:52:22', agent: 'VEGA', type: 'info', msg: 'Q4 Monte Carlo simulation: P50=$2.1M, P90=$3.4M' },
  { id: 8, time: '16:52:04', agent: 'ARIA', type: 'success', msg: 'Investor one-pager approved — routing to REVIEW queue' },
  { id: 9, time: '16:51:47', agent: 'CIPHER', type: 'code', msg: 'Mixpanel SDK integrated — 23 custom events tracked' },
  { id: 10, time: '16:51:30', agent: 'ORION', type: 'info', msg: 'Keyword cluster analysis complete — 1,240 high-intent terms found' },
];

export const LOG_TEMPLATES = [
  { agent: 'ARIA', type: 'info', msgs: [
    'Web crawl complete — {n} URLs indexed',
    'Market report section {n} drafted — {w} words',
    'Citation verification passed — {n} sources confirmed',
  ]},
  { agent: 'ORION', type: 'success', msgs: [
    'ROAS improved +{n}% on Google Search campaign',
    'A/B test variant B winning at {n}% confidence',
    'Retargeting audience updated — {n}K new users added',
  ]},
  { agent: 'CIPHER', type: 'code', msgs: [
    'Function refactored — complexity reduced {n}%',
    'Unit tests passing: {n}/{n} assertions green',
    'Docker image built — {n}MB optimized layer',
  ]},
  { agent: 'ECHO', type: 'info', msgs: [
    'Blog post outline generated — {n} sections',
    'SEO title variants created — top score {n}/100',
    'Social post batch scheduled — {n} posts queued',
  ]},
  { agent: 'NOVA', type: 'success', msgs: [
    'Workflow automation executed — {n} steps completed',
    'Slack notification dispatched to {n} channels',
    'Data sync complete — {n} records updated',
  ]},
  { agent: 'VEGA', type: 'info', msgs: [
    'Financial model updated with {n} new assumptions',
    'Risk score recalculated — current index: {n}',
    'Invoice batch processed — ${n}K total',
  ]},
];
