# Private prototype readiness review

Reviewed October 18, 2026. Version 0.2.0 — screen-by-screen story.

**Verdict: ready for private review.** The experience now advances with Next and Back, replacing the entire screen. It has no document scrolling or scrolling content panels. Core mathematical checks still pass. This is not a completed usability study or a WCAG conformance certification.

## Verification

| Area | Evidence | Result |
| --- | --- | --- |
| Fixed-screen story | All eight screens at 320×568, 390×844, 768×1024, 1024×768, 1440×900, and 844×390; active-screen height/width and child bounds checked | 48 screen/device combinations fit |
| Method notes | All five pages at small phone, phone, tablet, and landscape sizes; return to original story position | 20 screen/device combinations fit |
| Data table | All 17 pages traversed; all 83 distinct ages from 18 to 100 accessible; boundary controls disabled | Pass |
| No-scroll behavior | Page Down leaves document/main scroll at zero and preserves the current screen | Pass |
| Focus and keyboard | Incoming heading receives focus; chart arrows change age without advancing; Escape closes the method and returns to the curve | Pass |
| Small-screen edge states | Empty-age validation, age 100, maximum weekly allocation (116 hours over), and a 100-character reflection at 320×568 | Fit; compact over-budget layout corrected |
| Math and inputs | All-age annual/daily survival identity; source fixtures at five ages; validation and weekly budget boundaries | Pass |
| Portable export | Data/app embedded, no imports or data fetch, generated script syntax valid, CSP hash matches and network connections forbidden | Pass |
| Automated suite | Nine Node tests and JavaScript syntax checks | Pass |
| Accessibility implementation | Semantic labeled controls, native range inputs, visible focus, one active screen, focused headings, live budget/reflection/page status, reduced-motion rules | Implemented; real screen-reader validation remains |

The exact self-contained HTML served during browser testing is also saved as both `dist/index.html` and the standalone `still-here.html` output. Browser automation does not allow direct file URLs, so opening the file by that protocol remains a manual check. Neither local file needs a server to run.

## Design assessment

Each screen carries one main idea. The visible progress indicator explains where the visitor is, and consistent Back/Next controls preserve orientation. Math receives three short screens. Supplemental source notes and the complete table use pagination so they also fit within the screen. Inputs persist while navigating but clear on reload.

The daily estimate remains a population comparison, not a personal prediction. The range spans the female and male tables; it is not a confidence interval. Weekly defaults are editable planning assumptions. No input is sent to a server or stored between visits.

Before a public-production release, test VoiceOver and actual touch devices in Safari/iOS and a second browser; observe a few first-time visitors to check comprehension and navigation; test larger accessibility text settings; and assign responsibility for maintaining the pinned mortality source. Current device evidence is Chrome viewport emulation, not every physical screen or accessibility setting.

## External delivery state

The project uses the private GitHub repository `gilxsilva/still-here`. The complete application, source data, standalone export tooling, and verification notes are included in this source tree. Visitor inputs are not part of the repository.

The registered private Sites project has no deployed version because the earlier source synchronization was blocked by external network resolution. This revision updates the local prototype and exports; it does not change hosting access or attempt public publication.
