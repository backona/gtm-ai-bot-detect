export function probeErrorResult(error) {
  return {
    automationStatus: 'error',
    stealthTrapResult: 'error',
    isBot: null,
    webdriver: null,
    hasWebdriverDescriptor: null,
    webdriverGetterNative: null,
    pluginsLength: null,
    automationKeys: [],
    cdcProps: [],
    headlessUa: null,
    error: error instanceof Error ? error.message : String(error)
  };
}

export async function acceptCookiesInPage(page) {
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const accept = buttons.find((button) => /accept all/i.test(button.textContent || ''));
    if (!accept) {
      return false;
    }
    accept.click();
    return true;
  });

  if (clicked) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export function isMainModule(filename) {
  return process.argv[1]?.replace(/\\/g, '/').endsWith(filename);
}
