// Renders the built card with fake Home Assistant data and saves the README screenshots.
//
//   npm run build && npm run screenshots
//
// Uses an installed Chrome by default. Set BROWSER_CHANNEL=msedge to use Edge instead.

import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';

const root = new URL('..', import.meta.url);
const bundle = fileURLToPath(new URL('dist/celestial-arc-card.js', root));
const output = (name) => fileURLToPath(new URL(`docs/images/${name}.png`, root));

const THEMES = {
  light: {
    page: '#f5f5f5',
    '--primary-text-color': '#141414',
    '--secondary-text-color': '#5e5e5e',
    '--card-background-color': '#ffffff',
    '--ha-card-border-color': '#e0e0e0',
    '--primary-color': '#03a9f4',
    font: 'Roboto, sans-serif',
  },
  dark: {
    page: '#111111',
    '--primary-text-color': '#e1e1e1',
    '--secondary-text-color': '#9b9b9b',
    '--card-background-color': '#1c1c1c',
    '--ha-card-border-color': '#2e2e2e',
    '--primary-color': '#03a9f4',
    font: 'Roboto, sans-serif',
  },
  vintage: {
    page: '#ede2cd',
    '--primary-text-color': '#3d2f1f',
    '--secondary-text-color': '#5c4a33',
    '--card-background-color': '#f6efe1',
    '--ha-card-border-color': '#d9cbb0',
    '--primary-color': '#c9a35a',
    font: 'Montserrat, sans-serif',
  },
};

// Fictional location (Paris) and times: no personal data in the screenshots.
const SCENARIOS = [
  {
    name: 'preview-day',
    theme: 'light',
    now: '2024-06-21T14:30:00Z',
    language: 'en',
    sun: {
      state: 'above_horizon',
      next_setting: '2024-06-21T19:58:00Z',
      next_rising: '2024-06-22T03:47:00Z',
    },
    config: { title: 'Sun & Moon', background: true, show_day_length: true },
  },
  {
    name: 'preview-night',
    theme: 'dark',
    now: '2024-06-11T22:30:00Z',
    language: 'en',
    sun: {
      state: 'below_horizon',
      next_rising: '2024-06-12T03:47:00Z',
      next_setting: '2024-06-12T19:55:00Z',
    },
    config: { background: true, show_day_length: true, show_moon_phase: true },
  },
  {
    name: 'preview-vintage',
    theme: 'vintage',
    now: '2024-06-21T08:15:00Z',
    language: 'fr',
    sun: {
      state: 'above_horizon',
      next_setting: '2024-06-21T19:58:00Z',
      next_rising: '2024-06-22T03:47:00Z',
    },
    config: { colors: { label: '#5c4a33' }, show_moon_phase: true },
  },
];

function pageHtml(theme) {
  const variables = Object.entries(theme)
    .filter(([key]) => key.startsWith('--'))
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&family=Roboto:wght@400;500;700&display=block" />
    <style>
      html, body { margin: 0; background: ${theme.page}; }
      body { ${variables} font-family: ${theme.font}; --cac-font-family: ${theme.font}; }
      #frame { width: 380px; padding: 20px; background: ${theme.page}; }
    </style>
  </head>
  <body><div id="frame"></div></body>
</html>`;
}

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'chrome' });
try {
  for (const scenario of SCENARIOS) {
    const page = await browser.newPage({
      deviceScaleFactor: 2,
      viewport: { width: 420, height: 400 },
    });
    await page.clock.setFixedTime(new Date(scenario.now));
    await page.setContent(pageHtml(THEMES[scenario.theme]), { waitUntil: 'networkidle' });
    await page.addScriptTag({ path: bundle, type: 'module' });
    await page.waitForFunction(() => customElements.get('celestial-arc-card'));

    await page.evaluate(
      ({ scenario }) => {
        const { state, ...attributes } = scenario.sun;
        const card = document.createElement('celestial-arc-card');
        card.setConfig({ type: 'custom:celestial-arc-card', ...scenario.config });
        card.hass = {
          states: {
            'sun.sun': {
              entity_id: 'sun.sun',
              state,
              attributes,
              last_changed: '',
              last_updated: '',
            },
          },
          config: { latitude: 48.85, longitude: 2.35, time_zone: 'Europe/Paris' },
          locale: { language: scenario.language, time_format: '24', time_zone: 'server' },
          language: scenario.language,
        };
        document.getElementById('frame').appendChild(card);
        return card.updateComplete;
      },
      { scenario },
    );
    await page.evaluate(() => document.fonts.ready);

    await page.locator('#frame').screenshot({ path: output(scenario.name) });
    console.log(`docs/images/${scenario.name}.png`);
    await page.close();
  }
} finally {
  await browser.close();
}
