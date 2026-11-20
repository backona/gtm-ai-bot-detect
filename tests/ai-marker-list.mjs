import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const probeSource = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'probe.js'),
  'utf8'
);

function runProbe({ userAgent, additionalAiMarkers }) {
  const dataLayer = [];
  const navProto = {};
  Object.defineProperty(navProto, 'webdriver', { value: false });

  const navigator = Object.create(navProto);
  Object.defineProperty(navigator, 'userAgent', { value: userAgent });

  const sandbox = {
    navigator,
    Object,
    Function
  };
  sandbox.window = sandbox;
  sandbox.window.dataLayer = dataLayer;
  sandbox.window.__backonaBotConfig = {
    eventName: 'backona_bot_detect',
    checkUserAgent: true,
    additionalAiMarkers
  };

  vm.createContext(sandbox);
  vm.runInContext(probeSource, sandbox);
  return dataLayer[dataLayer.length - 1];
}

function assertStatus(label, actual, expected) {
  if (!actual || actual.ai_bot_status !== expected || actual.ai_bot_is_bot !== true) {
    throw new Error(
      label +
        ' expected ' +
        expected +
        ' but got ' +
        JSON.stringify(actual)
    );
  }
}

function readBuiltInMarkers(source) {
  const block = source.match(/var AI_CRAWLERS = \[([\s\S]*?)\];/);
  if (!block) {
    throw new Error('AI_CRAWLERS list not found in probe.js');
  }

  return [...block[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

const builtInMarkers = readBuiltInMarkers(probeSource);
const configPageMarkers = ['Cursor', 'Bot', 'GPT', 'MyAIBot'];

for (let i = 0; i < builtInMarkers.length; i++) {
  const marker = builtInMarkers[i];
  const markerLower = marker.toLowerCase();

  for (let j = 0; j < i; j++) {
    const earlier = builtInMarkers[j];
    if (markerLower.indexOf(earlier.toLowerCase()) >= 0) {
      throw new Error(
        'Built-in marker "' +
          earlier +
          '" is contained in later marker "' +
          marker +
          '", so a ' +
          marker +
          ' user agent would be reported as ai_bot:' +
          earlier
      );
    }
  }

  const result = runProbe({
    userAgent: 'Mozilla/5.0 (' + marker + '/1.0)',
    additionalAiMarkers: configPageMarkers
  });
  assertStatus('built-in ' + marker + ' with config-page markers', result, 'ai_bot:' + marker);
}

const cursorAgain = runProbe({
  userAgent: 'Mozilla/5.0 Cursor/1.2.0',
  additionalAiMarkers: ['Cursor']
});
assertStatus('config-page Cursor', cursorAgain, 'ai_bot:Cursor');

const customOnly = runProbe({
  userAgent: 'Mozilla/5.0 MyAIBot/1.0',
  additionalAiMarkers: ['Cursor', 'MyAIBot']
});
assertStatus('config-page custom marker', customOnly, 'ai_bot:MyAIBot');

const earlierBuiltinWins = runProbe({
  userAgent: 'Mozilla/5.0 GPTBot/1.0 Cursor/1.2.0',
  additionalAiMarkers: ['Cursor']
});
assertStatus('earlier built-in marker', earlierBuiltinWins, 'ai_bot:GPTBot');

console.log('ai marker list: ok');
