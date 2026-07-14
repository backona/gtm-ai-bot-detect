(function () {
  var config = window.__backonaBotConfig || {};
  var eventName = config.eventName || 'backona_bot_detect';
  var checkUserAgent = config.checkUserAgent !== false;
  var additionalMarkers = config.additionalAiMarkers || [];

  var AI_CRAWLERS = [
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'ClaudeBot',
    'Claude-Web',
    'anthropic-ai',
    'PerplexityBot',
    'cohere-ai',
    'Bytespider',
    'CCBot',
    'meta-externalagent',
    'FacebookBot',
    'Applebot-Extended',
    'Diffbot',
    'YouBot',
    'Amazonbot',
    'Google-Extended',
    'Timpibot',
    'MindriftBot',
    'VelenPublicWebCrawler',
    'ImagesiftBot',
    'omgili'
  ];

  var AUTOMATION_KEY_PREFIXES = [
    'cdc_',
    '__playwright',
    '__pw',
    '__puppeteer',
    '__webdriver',
    '__driver',
    '__selenium',
    'callPhantom'
  ];

  var AUTOMATION_KEY_SUFFIXES = [
    '_Array',
    '_Object',
    '_Promise',
    '_Proxy',
    '_Symbol',
    '_JSON',
    '_Window'
  ];

  function matchesAutomationKey(key) {
    var i;
    for (i = 0; i < AUTOMATION_KEY_PREFIXES.length; i++) {
      if (key.indexOf(AUTOMATION_KEY_PREFIXES[i]) === 0) {
        return true;
      }
    }

    if (key.charAt(0) !== '_') {
      return false;
    }

    for (i = 0; i < AUTOMATION_KEY_SUFFIXES.length; i++) {
      var suffix = AUTOMATION_KEY_SUFFIXES[i];
      if (key.length > suffix.length && key.lastIndexOf(suffix) === key.length - suffix.length) {
        return true;
      }
    }

    return false;
  }

  function isNativeGetter(getter) {
    if (!getter) {
      return null;
    }

    var source = Function.prototype.toString.call(getter);
    if (typeof source !== 'string') {
      return null;
    }

    return source.indexOf('[native code]') >= 0;
  }

  function hasAutomationLeakKeys() {
    var propertyNames = Object.getOwnPropertyNames(window);
    var i;

    for (i = 0; i < propertyNames.length; i++) {
      if (matchesAutomationKey(propertyNames[i])) {
        return true;
      }
    }

    return false;
  }

  function detectAutomationSignals() {
    var webdriver = navigator.webdriver;
    var descriptor;
    var webdriverGetterNative = null;
    var webdriverOwnProperty = false;
    var navProto = Object.getPrototypeOf(navigator);

    if (navProto) {
      descriptor = Object.getOwnPropertyDescriptor(navProto, 'webdriver');
      if (descriptor && descriptor.get) {
        webdriverGetterNative = isNativeGetter(descriptor.get);
      }
    }

    webdriverOwnProperty = Object.prototype.hasOwnProperty.call(navigator, 'webdriver');

    if (webdriver === undefined && !descriptor) {
      return 'hidden_bot';
    }

    if (webdriver === true) {
      return 'true';
    }

    if (webdriverGetterNative === false || webdriverOwnProperty) {
      return 'tampered_bot';
    }

    if (hasAutomationLeakKeys()) {
      return 'automation_leak';
    }

    var userAgent = navigator.userAgent;
    if (typeof userAgent === 'string' && userAgent.toLowerCase().indexOf('headlesschrome') >= 0) {
      return 'headless_ua';
    }

    return 'false';
  }

  function detectAiUserAgent(userAgent) {
    if (typeof userAgent !== 'string' || userAgent === '') {
      return undefined;
    }

    var uaLower = userAgent.toLowerCase();
    var markers = AI_CRAWLERS.slice();
    var i;

    for (i = 0; i < additionalMarkers.length; i++) {
      var marker = additionalMarkers[i];
      if (typeof marker === 'string' && marker.trim() !== '') {
        markers.push(marker.trim());
      }
    }

    for (i = 0; i < markers.length; i++) {
      var bot = markers[i];
      if (uaLower.indexOf(bot.toLowerCase()) >= 0) {
        return 'ai_bot:' + bot;
      }
    }

    return undefined;
  }

  function isBotSignal(status) {
    if (
      status === 'true' ||
      status === 'hidden_bot' ||
      status === 'tampered_bot' ||
      status === 'automation_leak' ||
      status === 'headless_ua'
    ) {
      return true;
    }

    return typeof status === 'string' && status.indexOf('ai_bot:') === 0;
  }

  function buildDetailedStatus(automationStatus, aiBotStatus) {
    if (automationStatus === 'false' && aiBotStatus) {
      return aiBotStatus;
    }

    if (
      aiBotStatus &&
      (automationStatus === 'true' ||
        automationStatus === 'hidden_bot' ||
        automationStatus === 'tampered_bot' ||
        automationStatus === 'automation_leak' ||
        automationStatus === 'headless_ua')
    ) {
      return automationStatus + '|' + aiBotStatus;
    }

    return automationStatus;
  }

  function pushResult(payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }

  try {
    var automationStatus = detectAutomationSignals();
    var userAgent = typeof navigator.userAgent === 'string' ? navigator.userAgent : '';
    var aiBotStatus;

    if (checkUserAgent) {
      aiBotStatus = detectAiUserAgent(userAgent);
    }

    var detailedStatus = buildDetailedStatus(automationStatus, aiBotStatus);
    var isBot = isBotSignal(automationStatus) || !!aiBotStatus;

    pushResult({
      event: eventName,
      ai_bot_status: detailedStatus,
      ai_bot_is_bot: isBot
    });
  } catch (e) {
    pushResult({
      event: eventName,
      ai_bot_status: 'unknown',
      ai_bot_is_bot: false
    });
  }
})();
