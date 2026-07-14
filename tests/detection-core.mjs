export const TARGET_URL = process.env.BOT_PROBE_URL || 'https://backona.com/';

export const BOT_AUTOMATION_STATUSES = [
  'true',
  'hidden_bot',
  'tampered_bot',
  'automation_leak',
  'headless_ua'
];

export function isBotAutomationStatus(status) {
  return BOT_AUTOMATION_STATUSES.indexOf(status) >= 0;
}

export function isAiBotStatus(status) {
  return typeof status === 'string' && status.indexOf('ai_bot:') === 0;
}

export function runBotProbe() {
  const AUTOMATION_KEY_PATTERN =
    /^(cdc_|__playwright|__pw|__puppeteer|__webdriver|__driver|__selenium|callPhantom)/;
  const AUTOMATION_SUFFIX_PATTERN =
    /^_.*_(Array|Object|Promise|Proxy|Symbol|JSON|Window)$/;

  const descriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, 'webdriver');
  const webdriver = navigator.webdriver;
  let webdriverGetterNative = null;

  if (descriptor && descriptor.get) {
    const source = Function.prototype.toString.call(descriptor.get);
    webdriverGetterNative = /\[native code\]/.test(source);
  }

  const webdriverOwnProperty = Object.prototype.hasOwnProperty.call(navigator, 'webdriver');
  const automationKeys = Object.getOwnPropertyNames(window).filter((key) =>
    AUTOMATION_KEY_PATTERN.test(key) || AUTOMATION_SUFFIX_PATTERN.test(key)
  );
  const userAgent = navigator.userAgent || '';
  const headlessUa = /HeadlessChrome/i.test(userAgent);

  let automationStatus = 'false';
  if (webdriver === undefined && !descriptor) {
    automationStatus = 'hidden_bot';
  } else if (webdriver === true) {
    automationStatus = 'true';
  } else if (webdriverGetterNative === false || webdriverOwnProperty) {
    automationStatus = 'tampered_bot';
  } else if (automationKeys.length > 0) {
    automationStatus = 'automation_leak';
  } else if (headlessUa) {
    automationStatus = 'headless_ua';
  }

  return {
    webdriver,
    webdriverType: typeof webdriver,
    hasWebdriverDescriptor: !!descriptor,
    descriptorKeys: descriptor ? Object.keys(descriptor) : null,
    webdriverGetterNative,
    webdriverOwnProperty,
    automationKeys,
    headlessUa,
    userAgent,
    languages: navigator.languages,
    platform: navigator.platform,
    vendor: navigator.vendor,
    pluginsLength: navigator.plugins ? navigator.plugins.length : null,
    chromePresent: typeof window.chrome !== 'undefined',
    automationControlled: document.documentElement.getAttribute('webdriver'),
    automationStatus,
    stealthTrapResult: automationStatus,
    isBot: automationStatus !== 'false',
    cdcProps: automationKeys
  };
}

export function getBotProbeScript() {
  return `(${runBotProbe.toString()})()`;
}
