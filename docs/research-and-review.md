# Who is this for, and what changed?

October 18, 2026

This is desk research and a design review, followed by browser walkthroughs. No customer interviews, participant usability sessions, or market-size study have been conducted. The audiences below are hypotheses to test.

## Three likely reasons to visit

| Visitor | What brought them here | What they need | Design response |
| --- | --- | --- | --- |
| Someone curious after a Reel or a shared link | “What are the odds I die tomorrow?” | An obvious starting point, a quick answer, and a way to understand a tiny percentage | One prominent age field, a named action, an automatic explanation that can be skipped, percentages paired with frequencies |
| Someone thinking about how they spend time | A life calendar, a birthday, or a feeling that weeks disappear | A concrete view of time and something small they can act on | An age-conditional weeks grid, an editable 168-hour week, and a private reflection |
| A probability student, teacher, or skeptical GitHub visitor | The math or the repository | Definitions, provenance, actual source values, and assumptions they can inspect | A complete derivation, a source table with an age comparison slider, and explicit model limits |

The first group is the initial audience to test, based on the original idea and its expected shared-link entry point. We have not established their age distribution, willingness to return, or willingness to pay. The data are U.S.-based and the supported age range is 18–100.

## What adjacent products suggest

[Your Life Weekly](https://www.yourlifeweekly.com/) centers its product on a life-in-weeks canvas, journaling, goals, and reflection. Its privacy section emphasizes an input that stays on the device. This is evidence of an existing product direction, not evidence that our visitors want its full feature set.

[Tim Urban’s Your Life in Weeks](https://waitbutwhy.com/2014/05/life-weeks.html) connects a finite grid to choices about time. It is the visual precedent for the new weeks view. Our implementation uses the two SSA means conditional on reaching the entered age, rather than a universal 80- or 90-year endpoint.

[Death Clock](https://www.deathclock.ai/) positions itself around a life expectancy estimate and a longevity program. Those are the product’s claims; this project does not validate them. Still Here’s narrower opportunity is a small, inspectable probability explanation followed by reflection. We have not demonstrated a commercial market for that opportunity.

The useful distinction to test: can someone leave with both a clearer understanding of probability and one specific idea for their week? A longer health questionnaire would change that task and would require a different validated model.

## HCI decisions and their sources

- **Make the first action visible.** A labeled, bordered age field with “Your age” as the placeholder and “Find my odds” as the action. No prefilled age that looks like an answer the visitor already supplied. [NN/g: reduce cognitive load in forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/).
- **Keep the core path short.** Five views replace eight. Source definitions and detailed mathematics are available on request. [NN/g: progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/).
- **Use motion to explain a transition.** Text enters, the current calculation step is highlighted, formulas change, and the grids appear in sequence. No external animation library, tracking script, or font request is required. [Apple: Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/), [NN/g: animation purpose](https://www.nngroup.com/articles/animation-purpose-ux/).
- **Keep control with the visitor.** The approximately ten-second explanation can be paused, replayed, or skipped. Device reduced-motion preferences disable the timed sequence. The motion control also provides a static version. Backgrounding the tab pauses playback. [W3C: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).
- **Explain the numbers honestly.** Computation is immediate; the animation is explicitly a walkthrough, never a fake loading indicator. The result has a percentage, a frequency per million, and a complementary survival probability. The range compares source groups rather than expressing an individual forecast.
- **Give the subject an exit.** A brief topic note appears before age entry. “Skip to my week” opens the planner without requesting an age or showing mortality estimates. There is no forced acknowledgement or fear-based countdown.
- **Keep related content together.** The laptop layout uses a narrower shared content area, larger numerals, and deliberate color changes between probability, life weeks, and weekly planning. The result is a centered composition rather than another text-and-chart split.
- **Make the expert path usable.** Native modal focus containment, Escape to dismiss, keyboard-operated tabs, visible focus, a full math transcript, and exact table values. Comparing an age in the details does not alter the main story.

## Math review

The annual-to-daily conversion is unchanged:

```text
P(survive year | reached age x) = 1 - q
(1 - p)^365 = 1 - q
p = 1 - (1 - q)^(1 / 365)
```

The middle line applies the conditional chain rule with a constant daily rate. It does not require treating different lifetimes as independent. The implementation uses `-expm1(log1p(-q)/365)` for numerical stability. [CS109 learning goals](https://web.stanford.edu/class/archive/cs/cs109/cs109.1264/lectures/2-ConditioningAndBayes/), [SSA source and definitions](https://www.ssa.gov/oact/STATS/table4c6.html).

Weeks are an illustration at 52 weeks per year. The two future counts are `round(52 * e_x)`, using remaining life expectancy at the current age. The lived portion is `52 * age`, an approximation because no birthday is collected. The grid ends at the higher of two means. It is neither a lifespan bound nor a confidence interval, and individual lives can extend beyond it. A different pattern distinguishes the span between the two means.

Examples checked against the pinned data:

- Age 25: 0.00017%–0.00044% per day, 1.7–4.4 per million, 2,707–2,959 average weeks ahead.
- Age 100: 0.10953%–0.12502% per day, 106–116 average weeks ahead. Remaining time stays positive because the estimate is conditional on having reached 100.

## Self-review and verification

The test scenarios simulate first-time, reflective, and technically curious visitors. They are not observations of recruited users.

| Check | Evidence |
| --- | --- |
| First-time visitor | Blank, below-range, and fractional ages show a specific error; valid age begins the walkthrough; the result follows automatically |
| Impatient visitor | “See result now” bypasses the walkthrough; the result can replay it |
| Static experience | Motion off displays all three steps and does not auto-advance; the result remains immediately accessible |
| Expert inspection | Female/male annual and daily source values visible; age comparison changes its own table while preserving the main age; keyboard tab arrows and Escape work |
| Life weeks | Model test covers every supported age, verifies exact age-25 and age-100 counts, and rejects malformed remaining-year ranges |
| Week budget | Fractional sleep, adjusted work, zero allocation, and over-allocation are accounted for; the grid remains capped at 168 hours |
| Private reflection | Text is inserted as text, not HTML; reload clears inputs; no app storage, analytics, or form transmission |
| Layout | All five story views fit at 1440×900, 1280×800, 1366×768, 1024×768, 768×1024, 390×844, 320×568, and 844×390 without document scrolling: 40 combinations |
| Details | All five panels checked at 1440×900, 1280×800, 390×844, 320×568, and 844×390: 25 combinations. Small-phone and landscape clips found during review were repaired |
| Packaging | Syntax checks, pinned source fixtures, numerical identities, new weeks tests, and the self-contained CSP export check |

The laptop compositions were visually inspected. Other viewports were checked for clipping and overflow, with additional phone screenshots. Browser console errors and the public deployment are checked before release. These checks do not constitute a WCAG certification, a screen-reader study, or a representative usability study.

## Readiness and the next useful research

Suitable for another public educational prototype release after its checks and live verification pass. The age-only model is not personalized medical advice. The main unresolved product question is whether real visitors understand the range and the weeks view as population averages.

For the next round, recruit five consenting people: two who arrive cold from a shared link, two who use reflection or planning tools, and one who is comfortable with probability. Ask them to start without instructions, explain what the result means, find its source, interpret the endpoint of the weeks grid, and change a week. Record observed confusion and task completion with consent. Do not lead them with our intended answers.

Useful targets to test, not measured results: locate age entry within five seconds; reach the result without help; explain that the interval compares groups; reject the idea that the grid predicts a death date; leave with one specific thought for the week. No new analytics or recording has been added to this release.
