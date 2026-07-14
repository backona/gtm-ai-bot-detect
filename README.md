# AI Bots, Crawlers, and Automated Browsers Detector by [Backona](https://backona.com)

Google Tag Manager **tag** template to detect automation and AI crawlers. Built by [Backona](https://backona.com).

Uses a **stealth trap** on `navigator.webdriver`: if the value is `undefined` and the `Navigator.prototype` descriptor is missing, the visit is flagged as `hidden_bot`. Also checks `navigator.webdriver === true`, non-native `webdriver` getters (`tampered_bot`), automation leak keys on `window` (`automation_leak`), `HeadlessChrome` in the user agent (`headless_ua`), and matches known AI crawler user agents.

Detection runs in page context via [`probe.js`](./probe.js). Results are pushed to the **data layer** — no separate variable template required.

Release history: [CHANGELOG.md](./CHANGELOG.md).

## Install

1. Import [`template.tpl`](./template.tpl).
2. **Tags** → New → **AI Bots, Crawlers, and Automated Browsers Detector by Backona**
   - Trigger: **Initialization** or **Consent Initialization**
   - Leave the default probe URL, or self-host [`probe.js`](./probe.js)
3. **Variables** → New → **Data Layer Variable** → Data Layer Variable Name: `ai_bot_status` (Data Layer Version 2)
4. **Variables** → New → **Data Layer Variable** → Data Layer Variable Name: `ai_bot_is_bot` (Data Layer Version 2)
5. **Submit/Publish** the container

> **Why a tag, not a variable?** GTM sandboxed templates cannot read `navigator.*`. The tag injects `probe.js` in page context and pushes results to the data layer. See [permissions.md](./gtm-template/ai-bot-detect/permissions.md).

## Data layer output

| Key | Type | Human visitor | Bot / crawler |
|-----|------|---------------|---------------|
| `event` | string | `backona_bot_detect` | same |
| `ai_bot_status` | string | `false` | `true`, `hidden_bot`, `tampered_bot`, `automation_leak`, `headless_ua`, `ai_bot:GPTBot`, `true\|ai_bot:GPTBot`, … |
| `ai_bot_is_bot` | boolean | `false` | `true` |

> **Important:** `ai_bot_status` uses the string `'false'` for humans, not boolean `false`. Use `ai_bot_is_bot` for boolean trigger logic.

## Trigger and tag patterns

### Wait for detection before firing downstream tags

Create a **Custom Event** trigger: Event name equals `backona_bot_detect` (or your configured **Data layer event name**).

### Exclude bots from conversion tags

- Trigger: Custom Event `backona_bot_detect`
- Condition: `ai_bot_is_bot` **equals** `false`

### Segment by bot type

| Goal | Condition |
|------|-----------|
| Humans only | `ai_bot_status` **equals** `false` |
| Stealth bots | `ai_bot_status` **equals** `hidden_bot` |
| Any AI crawler | `ai_bot_status` **contains** `ai_bot:` |

### GA4

On a downstream tag (triggered by `backona_bot_detect`):

- Event parameter `ai_bot_status` → `{{DLV - ai_bot_status}}`
- Or `ai_bot_is_bot` → `{{DLV - ai_bot_is_bot}}`

Register `ai_bot_status` in GA4 Admin as an **event-scoped custom dimension** for reporting.

### Automation-only detection

Uncheck **Check user agent for AI crawlers** in the tag to skip GPTBot-style UA matching. Automation signals still populate `ai_bot_status`.

## AI crawlers detected

GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, anthropic-ai, PerplexityBot, cohere-ai, Bytespider, CCBot, meta-externalagent, FacebookBot, Applebot-Extended, Diffbot, YouBot, Amazonbot, Google-Extended, and others. Add custom markers under **AI crawler settings**.

## Local automation probes

Optional dev scripts compare the same detection logic against [backona.com](https://backona.com/):

```powershell
cd backona-gtm-ai-bot-detect
npm install
npx playwright install chromium
npm run test:automation
```

## Support

Report bugs or request features via GitHub Issues on this repository.
