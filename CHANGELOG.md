# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [0.2.1](https://github.com/HappyManuDev/celestial-arc-card/compare/v0.2.0...v0.2.1) (2026-10-31)


### Bug Fixes

* steady sun marker at sunrise/sunset, bound update_interval, ignore key repeat ([89a0c9e](https://github.com/HappyManuDev/celestial-arc-card/commit/89a0c9ec7dce4bf8c83c151fd07298714b662b2b))

## [0.2.0](https://github.com/HappyManuDev/celestial-arc-card/compare/v0.1.0...v0.2.0) (2026-10-27)


### Features

* add a visual editor ([9372c9b](https://github.com/HappyManuDev/celestial-arc-card/commit/9372c9bdd22fbaec55e9e6f89b36fbb3df184b58))


### Documentation

* add contributing guide ([e5a0bb3](https://github.com/HappyManuDev/celestial-arc-card/commit/e5a0bb3e7632e1866aebd583073e97c129509226))
* add screenshots and document the visual editor ([49c6be1](https://github.com/HappyManuDev/celestial-arc-card/commit/49c6be1af46904007fdd79544ec5a8de03ef8a44))

## [0.1.0] - 2026-10-27

First public release.

### Added

- Sun travelling along an arc from the last sunrise to the next sunset.
- Moon travelling from the last sunset to the next sunrise, drawn with its real phase and mirrored in the southern hemisphere.
- Start of the current period computed astronomically from the Home Assistant location, with a fallback when no location is set.
- Automatic refresh every `update_interval` seconds (default 60), and no re-render for unrelated state changes.
- Options: `entity`, `title`, `night_mode`, `show_times`, `show_day_length`, `show_moon_phase`, `background`, `update_interval`, `colors`, `tap_action`, `hold_action`, all validated with clear error messages.
- Theming: transparent by default, text colors from the Home Assistant theme (light and dark), `--cac-*` CSS variables.
- Tap, hold and keyboard actions.
- English and French translations.
- Screen reader description.

[0.1.0]: https://github.com/HappyManuDev/celestial-arc-card/releases/tag/v0.1.0
