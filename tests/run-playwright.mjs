import { chromium } from 'playwright';
import { chromium as chromiumExtra } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { TARGET_URL, runBotProbe, formatProbeTable } from './bot-probe.mjs';
import { acceptCookiesInPage, isMainModule, probeErrorResult } from './test-utils.mjs';

chromiumExtra.use(StealthPlugin());

const scenarios = [
  {
    source: 'playwright-plain-headless',
    launch: () => chromium.launch({ headless: true })
  },
  {
    source: 'playwright-plain-headed',
    launch: () => chromium.launch({ headless: false })
  },
  {
    source: 'playwright-stealth-headless',
    launch: () => chromiumExtra.launch({ headless: true })
  },
  {
    source: 'playwright-stealth-headed',
    launch: () => chromiumExtra.launch({ headless: false })
  },
  {
    source: 'playwright-stealth-headless-no-enable-automation',
    launch: () =>
      chromiumExtra.launch({
        headless: true,
        ignoreDefaultArgs: ['--enable-automation'],
        args: ['--disable-blink-features=AutomationControlled']
      })
  }
];

async function runScenario(scenario) {
  const browser = await scenario.launch();
  const page = await browser.newPage();

  try {
    await page.goto(TARGET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await acceptCookiesInPage(page);
    const probe = await page.evaluate(runBotProbe);
    return { source: scenario.source, probe };
  } finally {
    await browser.close();
  }
}

export async function runPlaywrightBotDetectTests() {
  const results = [];

  for (const scenario of scenarios) {
    try {
      results.push(await runScenario(scenario));
    } catch (error) {
      results.push({
        source: scenario.source,
        probe: probeErrorResult(error)
      });
    }
  }

  return results;
}

if (isMainModule('run-playwright.mjs')) {
  const results = await runPlaywrightBotDetectTests();
  console.log('\nPlaywright bot detection probe on', TARGET_URL);
  console.log(formatProbeTable(results));
  console.log('\nDetails:\n');
  for (const item of results) {
    console.log(`--- ${item.source} ---`);
    console.log(JSON.stringify(item.probe, null, 2));
    console.log('');
  }
}
