# Still Here

A little probability. A little perspective.

A private, age-only prototype that explains an estimated daily mortality probability, makes the calculation inspectable, and invites the visitor to make room for one good hour. The monochrome experience is an eight-screen story: **age → odds → annual probability → one assumption → daily probability → age curve → a week → today**. Next and Back replace the full view; the document does not scroll.

## Run locally

Requires Node.js 20 or later. There are no dependencies or installation steps.

```sh
npm start
```

Open http://127.0.0.1:4173. Use `npm run check` for syntax checks and the calculation tests. `PORT=4180 npm start` selects another local port.

For a portable preview, run `npm run export`. It generates both `dist/index.html` and `../still-here.html` as identical self-contained pages you can open directly from your computer with no server, installation, or network connection. The source data and app are embedded, and their content security policy disallows network connections. Edit the HTML template in `src/index.html`; the start command rebuilds the exports automatically.

## The numbers

- Source: [SSA 2023 period life table, used in the 2026 Trustees Report](https://www.ssa.gov/oact/STATS/table4c6.html), retrieved October 18, 2026. The Social Security area population is U.S.-based; see the source definition for its full coverage.
- Supported ages: whole-number ages 18–100. We show the two published female and male series as a range without asking for sex or gender. This range is not a confidence interval and does not bound any individual's risk.
- Let `q` be the source's probability of dying between exact age `x` and `x+1`, conditional on reaching `x`. Under constant daily conditional risk within that age-year, `(1-p)^365 = 1-q`, so `p = 1-(1-q)^(1/365)`.
- The implementation uses `-expm1(log1p(-q)/365)` for numerical stability. At age 25, the displayed range is **0.00017%–0.00044% per day**, or about **1.7–4.4 per million**.
- Age at last birthday approximates exact age. We do not model the upcoming birthday, leap years, seasons, medical history, daily activities, or individual circumstances. “Tomorrow” means the next 24 hours, conditional on being alive now.
- The chart compares attained ages with 2023 rates held fixed. It does not predict future mortality trends.
- Remaining life expectancy comes from the table's conditional `e_x` values; it is never computed by subtracting age from life expectancy at birth. It is an average under fixed period rates, not a deadline.
- Weekly time inputs are editable planning assumptions, not population averages. Sleep, work/study, and essentials are mutually exclusive buckets. Over-allocation is reported explicitly. Work, study, care, and rest can all be meaningful time.

## Structure and extension

```text
src/index.html           Editable story template and source notes
dist/index.html          Generated self-contained story
dist/styles.css         Responsive monochrome design and reduced-motion rules
dist/app.js             UI, source loading, chart, weekly budget, reflection
dist/model.js           Pure validated calculation functions and result contract
dist/data/ssa-2023.json  Pinned source values and provenance metadata
tests/model.test.mjs    Mathematical identities, source fixtures, edge cases
scripts/serve.mjs        Loopback-only static development server
scripts/export.mjs       Self-contained offline HTML export
QA.md                   Self-review, evidence, and launch gaps
```

For a new country or population, add a versioned dataset with its own provenance, definition, supported ages, and compatible probability intervals. Add a model adapter returning the existing result contract (`modelId`, `datasetId`, `age`, `series`, `annual`, `daily`, `survival`, `remainingYears`) and update the UI's population labels and assumptions. The calculation layer is separate from the narrative so this does not require rebuilding the experience.

Additional questions should have an explicit role: select an appropriate population table, change the visitor's planning assumptions, or be labeled as a playful reflection. Foods eaten yesterday or other unsupported inputs must not silently alter mortality estimates. Evidence-backed personalized modeling would be a separate validated model, not arbitrary multipliers on this one. No AI is needed for the current model.

## Privacy and access

All visitor inputs are processed in memory in the browser. No analytics, form submissions, AI requests, databases, local storage, or input-bearing URLs. Reloading clears the exploration. The hosting provider controls private-preview authentication and may retain normal access logs. App metadata does not itself enforce privacy: keep the hosting audience **owner-private** and the GitHub repository **private**.

The private hosting configuration is in `.openai/hosting.json`. `dist/` is the complete static application. No credentials belong in this repository. No public deployment or public access change is configured here.

## Design intent

One age entry begins the story. Each view occupies the available viewport with fixed Back/Next controls and a progress indicator. Only the current screen is visible or focusable. Next/Back preserve age, chart position, budget, and reflection. There is no document scrolling, scroll-triggered progression, or artificial delay.

The math is split into three focused screens. Method notes occupy five additional screens and return to the point where the visitor left the story. The full chart table is paginated into groups of five ages. There are no scrolling panels. Arrow keys navigate when focus is not on a control; sliders retain their native arrow-key behavior. Escape returns from the method pages. Each transition focuses the incoming heading, and reduced-motion preferences disable the transition.

See [QA.md](QA.md) for the private-review readiness assessment and remaining launch checks.
