import puppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { TARGET_URL, runBotProbe, formatProbeTable } from './bot-probe.mjs';
import { acceptCookiesInPage, isMainModule, probeErrorResult } from './test-utils.mjs';

const puppeteerExtra = addExtra(puppeteer);
puppeteerExtra.use(StealthPlugin());

const scenarios = [
  {
    source: 'puppeteer-plain-headless',
    launch: () =>
      puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      })
  },
  {
    source: 'puppeteer-plain-headed',
    launch: () =>
      puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
      })
  },
  {
    source: 'puppeteer-stealth-headless',
    launch: () =>
      puppeteerExtra.launch({
        headless: true,
        args: ['--no-sandbox']
      })
  },
  {
    source: 'puppeteer-stealth-headed',
    launch: () =>
      puppeteerExtra.launch({
        headless: false,
        args: ['--no-sandbox']
      })
  },
  {
    source: 'puppeteer-stealth-headless-no-enable-automation',
    launch: () =>
      puppeteerExtra.launch({
        headless: true,
        ignoreDefaultArgs: ['--enable-automation'],
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
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

export async function runPuppeteerBotDetectTests() {
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

if (isMainModule('run-puppeteer.mjs')) {
  const results = await runPuppeteerBotDetectTests();
  console.log('\nPuppeteer bot detection probe on', TARGET_URL);
  console.log(formatProbeTable(results));
  console.log('\nDetails:\n');
  for (const item of results) {
    console.log(`--- ${item.source} ---`);
    console.log(JSON.stringify(item.probe, null, 2));
    console.log('');
  }
}
