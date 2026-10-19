# Reading and access review

Version 0.6, October 19, 2026.

The previous version made most labels 8–12px and shrank them further on small screens. Fixed-height containers hid overflow. That made the page fit a screenshot at the expense of reading it. The week overview also asked people to interpret thousands of tiny marks.

This review uses WCAG 2.2 AA as its reference, with larger targets where practical. It is an implementation review, not a conformance certification. No people with disabilities have tested it yet.

## What the research changes

| Need | Guidance | Decision here |
| --- | --- | --- |
| Read without squinting | [Resize Text, 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) permits doubling text without losing content or function. WCAG does not prescribe one universal minimum font size. | 18px body text, 16px notes and controls, 14px short labels at the default setting. These are design choices. Rem units and a visible 100–200% text-size control support enlargement. No media query shrinks body copy. |
| Keep your place when enlarged | [Reflow, 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) addresses reading at 320 CSS pixels without two-direction scrolling. | One story view remains active. Its content can grow vertically. Small windows and larger text use document scrolling; other views can scroll within the main area if needed. Controls never cover the reading area. |
| See the words and boundaries | [Contrast Minimum, 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) uses 4.5:1 for normal text and 3:1 for large text. [Non-text Contrast, 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) addresses meaningful graphical cues and controls at 3:1. | Main text #151515 and secondary text #555 on white; dark-page notes #ccc on #151515. Input edges, grid outlines, and slider tracks have stronger contrast. Thin low-contrast notes are removed. |
| Read with custom spacing | [Text Spacing, 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) tests line height 1.5, paragraph spacing 2em, letter spacing .12em, and word spacing .16em. | Content heights are flexible. Forms, footer controls, tabs, and formulas wrap. The review uses a local test copy with those spacing overrides. |
| Understand charts without seeing each mark | [WAI Complex Images](https://www.w3.org/WAI/tutorials/images/complex/) recommends text descriptions that convey the chart’s information. | The weeks view starts with 52 larger marks, arranged in four rows. It gives lived and remaining-week totals as text. Each selected year has a written category breakdown. The weekly budget has named patterns, exact totals, and a descriptive accessible name. Thousands of marks do not become thousands of tab stops. |
| Select controls without precise movement | [Target Size Minimum, 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) sets a 24 CSS pixel AA target or applicable spacing exceptions. | Controls have at least a 44px default hit-area height, beyond that AA minimum. The slider has a 44px input area and a larger thumb. Numeric fields offer an alternative to dragging. Inline text-link exceptions remain inline links. |
| Navigate with a keyboard or speech | [Label in Name, 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) connects visible words to spoken commands. [Focus Not Obscured, 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) keeps keyboard position discoverable. | Visible and accessible control names match. A 3px focus outline stays distinct on light and dark pages. Each story view has a level-one heading. Native numeric inputs, selects, buttons, and ranges keep their built-in keyboard behavior. Story shortcuts ignore selects and inputs. |
| Read at your own pace | [Pause, Stop, Hide, 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) addresses moving and automatically updating content. [Animation from Interactions, 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) is a stronger AAA motion reference. | Pause, replay, and skip remain available. Starting keyboard navigation, entering footer controls, opening details, or hiding the tab pauses the walkthrough. Reduce motion gives a static explanation with all steps visible. Device reduced-motion preference is respected. |
| Explore details without getting trapped | WAI APG [modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), and [slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) patterns. | Details scroll when needed. Native dialog provides modal focus containment and Escape dismissal. Tabs support arrows, Home, and End. Closing returns focus to the opener. Typed time entries avoid depending on touch-based slider accessibility. |

## Design tradeoffs

The typeface, monochrome palette, and title-page rhythm stay. Dense overview grids remain available for visual perspective, but they are optional. A readable year and written totals provide the primary way to understand the data.

The main story normally fits a laptop window. Enlarging text or choosing a dense overview can require vertical scrolling inside the current view. Shrinking or clipping the content to preserve a strict no-scroll rule would undermine this update.

The math still computes immediately. Animation explains the result; it does not simulate a slow calculation. Population estimates, assumptions, privacy behavior, and source data are unchanged.

## Verification

- All 10 calculation and export tests pass. The daily-risk model and pinned data are unchanged.
- Browser checks covered all five views at 1280×800, with the in-app text-size setting at 200%, and at a 320×568 CSS-pixel viewport. No horizontal reading overflow was found in those checks. 320px models the reflow width associated with 400% zoom on a 1280px-wide window; it is not a claim that native browser zoom was tested.
- All five details tabs were checked at 320px with 200% in-app text. Content stayed reachable, including the source-value table. Escape closed the dialog and returned focus to its opener.
- A local copy applied the WCAG text-spacing overrides. All five story views passed the horizontal-overflow check at 320px. Test fixtures are excluded from the shipped source and page.
- axe-core 4.14.0 found no automatic violations in the five story views and five details panels after the label and heading corrections. Incomplete contrast checks around the calculation-sheet background and symbolic characters were reviewed separately; an automatic pass is not a complete accessibility finding.
- The main palette was checked by the WCAG relative-luminance formula. #555 on white is 7.46:1; #151515 on white is 18.26:1; #ccc on #151515 is 11.37:1. Control edges #767676 on white are 4.54:1. These ratios use declared colors and do not measure font rasterization or a person’s reading experience.
- The year view was checked at age 100, including its partial last year and disabled final next button. Direct numeric editing, fractional sleep, and an over-budget week were checked. Text totals report the exact allocations even when the chart stops at 168 hours.
- The keyboard review covered native controls, focus return from details, tab naming, and select controls remaining independent of story navigation. Reduced motion was tested with the app toggle. Device preference handling is implemented but was not tested by changing operating-system settings.

The default year squares are about 16px wide at the narrowest tested viewport, rather than trying to enlarge thousands of marks at once. Dense decade and life views remain optional overviews, with the same meaning available in text and the larger year view.

## Remaining work

A clean automated scan cannot establish that the whole experience is accessible. [WAI recommends involving users](https://www.w3.org/WAI/test-evaluate/involving-users/) alongside standards-based evaluation.

Before claiming WCAG conformance, arrange task-based sessions with people who use magnification, VoiceOver on Safari, NVDA with Firefox or Chrome, keyboard-only navigation, and mobile assistive technology. Include people with low vision and motor or cognitive access needs. Ask them to enter an age, explain the result, find a year, edit a budget, and return from details. Test forced-colors modes, actual browser zoom, text-only zoom, voice commands, and touch screen readers on real devices. This review does not claim those sessions have happened.
