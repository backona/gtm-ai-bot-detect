# Changelog

All the project changes should be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Do not edit the NEW_VERSION and VERSION_DATE fields, they will be updated automatically by the Github Action script.

## [<NEW_VERSION>] - <VERSION_DATE>
### Added
### Changed
### Fixed
- Gallery metadata.yaml versions list is valid YAML, and later releases keep that list valid

## [0.1.6] - 2026-11-20 (by @slazak)
### Added
- README: meaning of each ai_bot_status value, including combined automation and AI crawler statuses
### Changed
- ai_bot_status reports `webdriver` when navigator.webdriver is true, instead of the string `true`
- Data layer event name is always visible in the GTM tag summary
- Predefined AI crawler user agents include Cursor; config-page markers are appended and each built-in user agent still resolves to its own ai_bot name

## [0.1.5] - 2026-07-15 (by @slazak)
### Changed
- Removed GA4 User Properties hint label from template tag configuration UI

## [0.1.4] - 2026-07-15 (by @slazak)
### Changed
- Template UI: GA4 User Properties hint in tag config, data layer event name always visible

## [0.1.3] - 2026-07-15 (by @slazak)
### Changed
- Removed optional gtag output from template and probe.js; use data layer variables with GTM GA4 tag event parameters or user properties instead
- README: suggested GA4 page_view configuration with user-scoped properties; Google Tag auto page_view hint and custom definition descriptions

## [0.1.2] - 2026-07-14 (by @slazak)
### Changed
- gtag user properties and events run before the data layer push so GTM tags on backona_bot_detect receive user properties on the same hit

## [0.1.1] - 2026-07-14 (by @slazak)
### Added
- Optional Google tag (gtag) output: user properties and custom event with ai_bot_status and ai_bot_is_bot, configurable measurement ID
### Changed
### Fixed

## [0.1.0] - 2026-07-14 (by @slazak)
### Added
- AI Bots, Crawlers, and Automated Browsers Detector by Backona single GTM tag template: page-context detection via probe.js from backona/gtm-ai-bot-detect on jsDelivr, data layer push with ai_bot_status and ai_bot_is_bot, custom event trigger support, AI crawler matching, and GA4 guidance
- Playwright (plain and stealth), Puppeteer (plain and stealth), Selenium, and Firecrawl probe scripts to compare automation signals on backona.com
