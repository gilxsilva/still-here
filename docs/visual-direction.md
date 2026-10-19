# Still Here, in black and white

Version 0.5 · October 18, 2026

The previous pass felt too much like a generic app: colored surfaces, rounded cards, a decorative orbit, and the same relationship between heading and panel. This revision follows the request for a more deliberate black-and-white visual essay.

## References

[Gwern’s design notes](https://gwern.net/design) describe a deliberately grayscale site with typography doing much of the work. The useful lesson here is a hierarchy that remains readable without an accent color. We do not copy its article layout or its interactions.

[Tufte CSS](https://edwardtufte.github.io/tufte-css/) is a reference for restrained typography, the relationship between prose and figures, and quiet supporting notes. Still Here remains a sequence of fixed views rather than a scrolling article.

[Instrument’s account of its identity](https://www.instrument.com/latest/from-old-to-bold-instrument-rebrand-signals-energetic-shift) describes a narrow serif paired with a practical sans. That pairing is useful for separating the human question from the supporting interface. The selected display face is [Instrument Serif](https://github.com/google/fonts/tree/main/ofl/instrumentserif), with its normal and italic Latin subsets bundled locally under the SIL Open Font License. Body text uses Arial/Helvetica; small annotations use the system monospace family. No runtime font service is used.

## Five compositions

1. **The question.** A centered title page. The typography carries the question; one outlined age field gives a clear starting action. A ruler of exactly 365 marks introduces the year-to-day relationship. The first mark stands for one day. The colored orbit and floating note have been removed.
2. **The working.** An open calculation sheet with a small step column and a large formula. Fine horizontal rules give the formulas a baseline. The sequence moves from a yearly value to 365 survival factors to one daily probability. The arithmetic is immediate; the animation explains it. Pause, replay, skip, and the static reduced-motion version remain available.
3. **The odds.** A dark page with large white numerals. A real 0–100% axis puts both daily probabilities at their actual positions. Tiny probabilities stay tiny; their markers are not moved apart to exaggerate the difference. The percentage, frequency per million, and survival complement remain explicit.
4. **The weeks.** An archive-like arrangement of decades. Each row contains up to 52 week marks and represents one year. Filled marks show years lived, outlined marks extend to the lower table mean, and hatching distinguishes the span between means. A diamond marks the approximate entered age. “Look closer” opens a decade with year labels and previous/next controls. The final decade ends at the higher mean; the grid is still an illustration of two means, never a predicted lifespan boundary.
5. **This week.** A ledger of 168 hour marks next to the three planning sliders. Black and two grays distinguish allocations; unallocated hours are white. The reflection is a single line at the bottom. The grid counts hours rather than promising a day-by-day calendar.

The backdrop is part of the explanation: a year ruler, a ruled calculation area, a probability axis, a decade ledger, or a weekly allocation. There is no stock texture, decorative blur, or colored wash.

## Motion and control

Views fade out for 160 milliseconds, then the next composition enters over roughly 650 milliseconds with a small vertical movement. Controls stay attached to the actual document. The first browser pass caught an interaction problem with snapshot-based page transitions, so those were replaced with a cancellable animation of the outgoing view and a normal entrance for the incoming one. Fast pause and skip actions were then tested again.

Disabling motion cancels pending movement, shows the static math, and prevents automatic math advancement. Backgrounding the tab still pauses the walkthrough. No additional motion or animation dependency has been added.

## Verification

- The ten numerical and export tests pass. The export check also verifies that both WOFF2 font files are embedded and that no local font URL remains. The complete font license is included in the HTML export.
- All five views plus the closer decade view were checked at 1440×900, 1280×800, 1366×768, 1024×768, 768×1024, 390×844, 320×568, and 844×390: 48 layout combinations. Two small-screen clips found in this pass were repaired and checked again.
- The five reference panels were checked at 1440×900, 320×568, and 844×390: 15 combinations.
- The fast path was exercised immediately after age entry: pause, skip to the result, then continue to the weeks. The new decade overview and close view were visually inspected on a laptop.
- Age validation, source inspection, conditional remaining-year calculations, privacy, and the budget model retain their existing behavior. The new design changes presentation rather than the mortality model.

These are implementation checks and self-review. The revised visual direction still needs feedback from real visitors, particularly on the interpretation of the mean endpoints and whether the typography feels right for the subject.
