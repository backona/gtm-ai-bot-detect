import Firecrawl from '@mendable/firecrawl-js';
import { TARGET_URL, getBotProbeScript, formatProbeTable } from './bot-probe.mjs';

function normalizeJavascriptReturn(raw) {
  if (!raw) {
    return null;
  }

  if (typeof raw === 'object' && raw.value !== undefined) {
    return raw.value;
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  }

  return raw;
}

export async function runFirecrawlBotDetectTest() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return {
      skipped: true,
      reason: 'FIRECRAWL_API_KEY is not set'
    };
  }

  const client = new Firecrawl({ apiKey });
  const probeScript = getBotProbeScript();

  const response = await client.scrape(TARGET_URL, {
    formats: ['markdown'],
    actions: [
      { type: 'wait', milliseconds: 4000 },
      {
        type: 'executeJavascript',
        script: probeScript
      }
    ]
  });

  const javascriptReturns = response.actions?.javascriptReturns || [];
  const probe = normalizeJavascriptReturn(javascriptReturns[javascriptReturns.length - 1]);

  return {
    skipped: false,
    source: 'firecrawl-scrape',
    probe: probe || {
      stealthTrapResult: 'error',
      isBot: null,
      error: 'No javascriptReturns payload from Firecrawl',
      javascriptReturns
    },
    metadata: {
      statusCode: response.metadata?.statusCode,
      sourceURL: response.metadata?.sourceURL,
      title: response.metadata?.title
    }
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1]?.endsWith('run-firecrawl.mjs')) {
  const result = await runFirecrawlBotDetectTest();

  if (result.skipped) {
    console.log('Firecrawl test skipped:', result.reason);
    process.exit(0);
  }

  console.log('\nFirecrawl bot detection probe on', TARGET_URL);
  console.log(formatProbeTable([result]));
  console.log('\nMetadata:', JSON.stringify(result.metadata, null, 2));
  console.log('\nProbe:\n', JSON.stringify(result.probe, null, 2));
}
