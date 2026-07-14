import { formatProbeTable } from './bot-probe.mjs';
import { runPlaywrightBotDetectTests } from './run-playwright.mjs';
import { runPuppeteerBotDetectTests } from './run-puppeteer.mjs';
import { runSeleniumBotDetectTests } from './run-selenium.mjs';
import { runFirecrawlBotDetectTest } from './run-firecrawl.mjs';

const playwrightResults = await runPlaywrightBotDetectTests();
const puppeteerResults = await runPuppeteerBotDetectTests();
const seleniumResults = await runSeleniumBotDetectTests();
const firecrawlResult = await runFirecrawlBotDetectTest();

const allResults = [...playwrightResults, ...puppeteerResults, ...seleniumResults];
if (!firecrawlResult.skipped) {
  allResults.push(firecrawlResult);
}

console.log('\nBot detection comparison on https://backona.com/\n');
console.log(formatProbeTable(allResults));

if (firecrawlResult.skipped) {
  console.log('\nFirecrawl: skipped -', firecrawlResult.reason);
} else {
  console.log('\nFirecrawl metadata:', JSON.stringify(firecrawlResult.metadata, null, 2));
}

console.log('\nFull probe payloads:\n');
for (const item of allResults) {
  console.log(`--- ${item.source} ---`);
  console.log(JSON.stringify(item.probe, null, 2));
  console.log('');
}
