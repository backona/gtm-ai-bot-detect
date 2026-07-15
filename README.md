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

## Data layer output

| Key | Type | Human visitor | Bot / crawler |
|-----|------|---------------|---------------|
| `event` | string | `backona_bot_detect` | same |
| `ai_bot_status` | string | `false` | `true`, `hidden_bot`, `tampered_bot`, `automation_leak`, `headless_ua`, `ai_bot:GPTBot`, `true\|ai_bot:GPTBot`, … |
| `ai_bot_is_bot` | boolean | `false` | `true` |

> **Important:** `ai_bot_status` uses the string `'false'` for humans, not boolean `false`. Use `ai_bot_is_bot` for boolean trigger logic.

## Suggested configuration for GA4 bot tracking

Use **user-scoped properties** on a delayed `page_view` tag. Once set, GA4 attaches `up.ai_bot_status` and `up.ai_bot_is_bot` to that hit and to later events (scroll, click, conversion, etc.) without mapping bot fields on every tag. Register user-scoped custom dimensions in GA4 Admin for reporting and audiences.

### Flow

```
Initialization          →  Detector tag injects probe.js
backona_bot_detect    →  dataLayer: ai_bot_status, ai_bot_is_bot
                        →  GA4 page_view fires (user properties set)
Later events          →  carry up.ai_bot_* on subsequent hits
```

### 1. Data Layer Variables

Create two **Data Layer Variables** (Version 2):

| Variable name | Data Layer Variable Name |
|---------------|--------------------------|
| `DLV - ai_bot_status` | `ai_bot_status` |
| `DLV - ai_bot_is_bot` | `ai_bot_is_bot` |

### 2. Trigger

**Triggers → New → Custom Event**

| Field | Value |
|-------|-------|
| Event name | `backona_bot_detect` |

### 3. GA4 Page View tag

**Tags → New** (or repurpose your existing `page_view` tag)

| Field | Value |
|-------|-------|
| Tag type | Google Analytics: GA4 Event |
| Configuration tag | Your GA4 config tag |
| Event name | `page_view` |
| Trigger | Custom Event `backona_bot_detect` |

**User Properties**

| Property name | Value |
|---------------|-------|
| `ai_bot_status` | `{{DLV - ai_bot_status}}` |
| `ai_bot_is_bot` | `{{DLV - ai_bot_is_bot}}` |

### 4. Disable the early page_view

If you already fire `page_view` on **All Pages** or **Container Loaded**, disable or remove it. That hit runs before detection and will not include bot data. Keep only the delayed `page_view` on `backona_bot_detect`.

### 5. GA4 Admin custom definitions

**Admin → Data display → Custom definitions**

| Display name | Scope | Field name |
|--------------|-------|------------|
| AI Bot Status | User | `ai_bot_status` |
| AI Bot Is Bot | User | `ai_bot_is_bot` |

### 6. Verify in GTM Preview

1. Select **`backona_bot_detect`** in the event timeline.
2. **Variables** tab — confirm DLV values (e.g. `ai_bot_status` = `false` on a normal browser).
3. **Tags** tab — confirm the `page_view` tag fired.
4. **Hit Details** — look for `up.ai_bot_status` and `up.ai_bot_is_bot`.

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

See [Suggested configuration for GA4 bot tracking](#suggested-configuration-for-ga4-bot-tracking) for the recommended `page_view` + user property setup.

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
