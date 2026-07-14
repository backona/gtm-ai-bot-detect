export {
  TARGET_URL,
  runBotProbe,
  getBotProbeScript,
  isBotAutomationStatus,
  isAiBotStatus
} from './detection-core.mjs';

export function formatProbeTable(results) {
  const header = [
    'Source',
    'webdriver',
    'getterNative',
    'status',
    'isBot',
    'leaks',
    'headlessUA'
  ];
  const rows = results.map((item) => [
    item.source,
    String(item.probe.webdriver),
    item.probe.webdriverGetterNative === null
      ? 'n/a'
      : item.probe.webdriverGetterNative
        ? 'yes'
        : 'no',
    item.probe.automationStatus || item.probe.stealthTrapResult || 'error',
    item.probe.isBot ? 'yes' : 'no',
    String((item.probe.automationKeys || item.probe.cdcProps || []).length),
    item.probe.headlessUa ? 'yes' : 'no'
  ]);

  const widths = header.map((col, index) =>
    Math.max(col.length, ...rows.map((row) => row[index].length))
  );

  const line = (cols) => cols.map((col, index) => col.padEnd(widths[index])).join('  ');

  return [line(header), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}
