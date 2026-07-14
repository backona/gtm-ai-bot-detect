import { formatProbeTable } from './bot-probe.mjs';
import { runPlaywrightBotDetectTests } from './run-playwright.mjs';
import { runPuppeteerBotDetectTests } from './run-puppeteer.mjs';

const playwrightResults = await runPlaywrightBotDetectTests();
const puppeteerResults = await runPuppeteerBotDetectTests();
const allResults = [...playwrightResults, ...puppeteerResults];

console.log('\nPlaywright + Puppeteer automation probe comparison on https://backona.com/\n');
console.log(formatProbeTable(allResults));

console.log('\nDetection summary:\n');
for (const item of allResults) {
  console.log(
    `- ${item.source}: ${item.probe.automationStatus || item.probe.stealthTrapResult || 'error'}`
  );
}

console.log('\nFull probe payloads:\n');
for (const item of allResults) {
  console.log(`--- ${item.source} ---`);
  console.log(JSON.stringify(item.probe, null, 2));
  console.log('');
}
