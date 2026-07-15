# Browser compatibility baseline

Audit date: 2026-07-15
Scope: repository configuration and existing test evidence only. No product code was changed and no browser result is promoted to "passed" merely because a Playwright project can be listed.

## Executive finding

The repository has meaningful Chromium automation, including mobile viewport emulation, but it does **not** currently provide a cross-engine release baseline. The default Playwright configuration defines one project, **chromium**, and CI installs only Chromium. The iPhone 13 and iPad projects in playwright.stage2-visual.config.ts inherit device descriptors but do not set browserName to WebKit; they therefore still run on Chromium.

The current evidence supports "Chromium automation declared". It does not support "Safari, iOS Safari, Firefox, Edge, Chrome Android, or WebKit verified".

## Evidence inventory

| Evidence | What is declared | What it proves | Limitation |
|---|---:|---|---|
| playwright.config.ts | 1 project: Desktop Chrome profile on Chromium | Main E2E suite is Chromium-based | No Firefox, WebKit, or Edge projects |
| npx playwright test --list | 229 tests in 11 files | Tests are discoverable in the current tree | Listing is not execution |
| playwright.ux-audit.config.ts | 375x812 Pixel 5 and 1280x800 Desktop Chrome profiles | 326 UX checks are declared across mobile and desktop sizes | Both projects use Chromium |
| playwright.stage2-visual.config.ts | 390x844 iPhone profile, 768x1024 iPad profile, 1440x900 desktop | 42 visual acceptance scenarios are declared | All default to Chromium; the config is currently untracked |
| tests/e2e/flights-mobile.spec.ts | 320x568, 390x844, 412x915, 768x1024 | Flight widget geometry is explicitly checked at four sizes | Chromium and Shadow DOM only; no real mobile browser |
| .github/workflows/ci.yml | Playwright installs Chromium with dependencies | CI provisions Chromium | UX and Stage 2 jobs use continue-on-error, so they do not gate release |
| var/ops/e2e-ux-audit-last.json | run at 2026-07-15T02:04:04Z; total 326; passed 0; failed 6; 8 violations | A run started and recorded mobile overflow evidence | Summary is incomplete because 0 + 6 does not equal 326 |

## Required browser and device matrix

| Target | Repository coverage | Status | Evidence or exception |
|---|---|---|---|
| Chromium desktop | Automated project exists | DECLARED; latest complete pass not evidenced here | playwright.config.ts |
| Google Chrome desktop | Approximated by Desktop Chrome profile | NOT VERIFIED AS CHANNEL BINARY | No Google Chrome channel project |
| Microsoft Edge desktop | None | NOT VERIFIED | No Edge channel project |
| Firefox desktop | None | NOT VERIFIED | No Firefox project or CI installation |
| WebKit | None | NOT VERIFIED | No WebKit project or CI installation |
| Safari desktop | None | NOT VERIFIED | Neither WebKit nor manual Safari evidence is recorded |
| iOS Safari current major | Chromium device emulation only | NOT VERIFIED | iPhone descriptor is not a Safari engine or real device |
| iOS Safari previous major | None | NOT VERIFIED | No device-lab or manual evidence |
| Chrome Android | Chromium device emulation only | NOT VERIFIED ON REAL BROWSER | Pixel profile does not prove Android Chrome behavior |
| touch and coarse pointer | Device emulation exists | PARTIAL; DECLARED | No real touch hardware; maps, drag/drop, and partner widgets remain high risk |
| keyboard and fine pointer | Some semantic source and tests | PARTIAL | No full keyboard-only crawl or focus-order report |
| reduced motion | Screenshots disable animations | NOT VERIFIED | Screenshot animation suppression is not a reduced-motion preference test |
| zoom 200% | None | NOT VERIFIED | No automated or manual evidence |
| no JavaScript | None | NOT VERIFIED | No JavaScript-disabled project |
| offline or slow network | None | NOT VERIFIED | No offline context or throttled browser project |
| landscape mobile | None | NOT VERIFIED | No landscape viewport or project |

## Viewport coverage against the master prompt

| Required viewport | Evidence | Status |
|---|---|---|
| 320x568 | Flight page only | PARTIAL |
| 360x800 | None | MISSING |
| 375x812 | UX route crawl declared | DECLARED; Chromium |
| 390x844 | Flight and Stage 2 visual declared | DECLARED; Chromium |
| 412x915 | Flight page only | PARTIAL |
| 1024x768 | None | MISSING |
| 1280x720 | None; nearest is 1280x800 | MISSING |
| 1440x900 | Stage 2 visual declared | DECLARED; Chromium |
| 768x1024 tablet | Flight and Stage 2 visual declared | EXTRA; Chromium |

## Interaction and rendering risks

1. **Travelpayouts flight search:** FlightsWhitelabelWidgetCore.tsx and flights-mobile.spec.ts inspect external Shadow DOM. The existing assertion is useful but Chromium-specific. WebKit and Safari loading, focus, keyboard, blocked third-party resources, and fallback UI remain unverified.
2. **MapLibre and Leaflet maps:** canvas or WebGL, geolocation, popups, wheel and gesture handling, plus the accessible list need WebKit, Safari, Firefox, and real-touch checks.
3. **Sticky UI and nested scrolling:** header, catalog toolbar, mobile booking bars, drawers, and dialogs need iOS Safari viewport, safe-area, and software-keyboard checks.
4. **Dialogs, popovers, and menus:** source uses semantic roles, but focus trap, Escape, outside click, scroll lock, and focus restoration lack cross-engine evidence.
5. **Upload and rich editors:** admin media upload and page builder are not covered on Safari or Firefox and are inaccessible to the guest-only crawl.
6. **Authenticated states:** generic UX tests prove only the unauthenticated boundary for profile, organizer, and admin routes. They do not prove protected UI in any browser.

## Existing UX-run exception

The latest JSON report records overflow samples for the home page and /account/update-password at 375 px, plus several "Test ended" failures. Because the summary reports 326 total tests but only 6 failed and 0 passed, it is not a complete run and must not be used as a release pass or fail result. The concrete overflow samples remain useful reproduction evidence until a clean rerun supersedes them.

## Minimum release-closing work

- Add explicit Firefox and WebKit Playwright projects for public critical routes.
- Add Chrome and Edge channel smoke projects where those binaries are available.
- Run the required 360x800, 1024x768, and 1280x720 viewports.
- Add reduced-motion, 200% zoom, keyboard-only, offline, and slow-network scenarios.
- Run at least one current and one previous iOS Safari version on real devices or a documented device-cloud service.
- Add authenticated storage states for tourist, organizer, and admin, then verify allowed and insufficient-permission states.
- Remove continue-on-error only after the suites are stable. Until then, document failures as release exceptions.

## Honest baseline status

**NOT CROSS-BROWSER READY.** Chromium test discovery is substantial, but complete execution evidence and every non-Chromium browser/device target are missing.
