import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import firefox from 'selenium-webdriver/firefox.js';
import { TARGET_URL, runBotProbe, formatProbeTable } from './bot-probe.mjs';
import { isMainModule, probeErrorResult } from './test-utils.mjs';

const probeScript = `return (${runBotProbe.toString()})();`;

async function acceptCookiesSelenium(driver) {
  const clicked = await driver.executeScript(`
    const buttons = Array.from(document.querySelectorAll('button'));
    const accept = buttons.find((button) => /accept all/i.test(button.textContent || ''));
    if (!accept) {
      return false;
    }
    accept.click();
    return true;
  `);

  if (clicked) {
    await driver.sleep(1000);
  }
}

function buildChromeOptions({ headless, stealthish }) {
  const options = new chrome.Options();

  if (headless) {
    options.addArguments('--headless=new');
  }

  options.addArguments('--no-sandbox', '--disable-dev-shm-usage');

  if (stealthish) {
    options.excludeSwitches('enable-automation');
    options.addArguments('--disable-blink-features=AutomationControlled');
  }

  return options;
}

function buildFirefoxOptions({ headless }) {
  const options = new firefox.Options();
  if (headless) {
    options.addArguments('-headless');
  }
  return options;
}

const scenarios = [
  {
    source: 'selenium-chrome-headless',
    build: () =>
      new Builder()
        .forBrowser('chrome')
        .setChromeOptions(buildChromeOptions({ headless: true, stealthish: false }))
        .build()
  },
  {
    source: 'selenium-chrome-headed',
    build: () =>
      new Builder()
        .forBrowser('chrome')
        .setChromeOptions(buildChromeOptions({ headless: false, stealthish: false }))
        .build()
  },
  {
    source: 'selenium-chrome-headless-disable-automation-switch',
    build: () =>
      new Builder()
        .forBrowser('chrome')
        .setChromeOptions(buildChromeOptions({ headless: true, stealthish: true }))
        .build()
  },
  {
    source: 'selenium-firefox-headless',
    build: () =>
      new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(buildFirefoxOptions({ headless: true }))
        .build()
  }
];

async function runScenario(scenario) {
  const driver = await scenario.build();

  try {
    await driver.get(TARGET_URL);
    await acceptCookiesSelenium(driver);
    const probe = await driver.executeScript(probeScript);
    return { source: scenario.source, probe };
  } finally {
    await driver.quit();
  }
}

export async function runSeleniumBotDetectTests() {
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

if (isMainModule('run-selenium.mjs')) {
  const results = await runSeleniumBotDetectTests();
  console.log('\nSelenium bot detection probe on', TARGET_URL);
  console.log(formatProbeTable(results));
  console.log('\nDetails:\n');
  for (const item of results) {
    console.log(`--- ${item.source} ---`);
    console.log(JSON.stringify(item.probe, null, 2));
    console.log('');
  }
}
