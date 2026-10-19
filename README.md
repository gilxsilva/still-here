# Still Here

What are the odds I die tomorrow?

I’m taking a probability class, and a Reel about having “9,000 days left” got me wondering what the numbers actually say.

This is a small website to work through that question. Enter your age, see the daily estimate, and follow the math. Then take a look at how you spend a week.

## Run it

You need Node.js 20 or later. There’s nothing to install.

```sh
npm start
```

Open http://127.0.0.1:4173. Use Next and Back to move through the screens. Your inputs stay in place as you go.

```sh
npm run build  # Make a standalone HTML file
npm run check  # Check syntax and run the tests
```

The build creates `dist/index.html`. You can open that file directly, without a server or an internet connection. Rebuild after changing the source. `PORT=4180 npm start` uses a different preview port.

## The math

The numbers come from the [SSA’s 2023 period life table](https://www.ssa.gov/oact/STATS/table4c6.html), used in the 2026 Trustees Report and retrieved October 18, 2026. It covers the U.S.-based Social Security area population; the source lists everyone included.

For someone who reaches exact age `x`, the table gives `q`: the chance of dying before age `x + 1`. Assume the daily risk stays constant within that year, then solve:

```text
(1 - p)^365 = 1 - q
p = 1 - (1 - q)^(1 / 365)
```

At age 25, the two tables give about **0.00017%–0.00044% per day**, or **1.7–4.4 per million**.

The range compares the female and male tables, so the first version can ask for age alone. It isn’t a confidence interval or a personal prediction. We use age at last birthday to choose a row and leave out health, behavior, seasons, leap years, and the timing of the next birthday. The full assumptions are in the app’s “How it works” pages.

The weekly sliders are a separate exercise. Their defaults are starting values, not population averages. Change them to match your week.

## What’s in the repo

- `src/`: the pages, styles, calculations, and pinned source data.
- `scripts/`: the build and local preview.
- `tests/`: checks for the calculations, source values, and HTML export.
- `.openai/hosting.json`: the optional Sites hosting configuration.

`dist/` is generated and stays out of Git, along with local review notes, logs, secrets, and dependency folders. Keep the source data and tests tracked so someone else can check the result.

Your age, slider settings, and final answer stay in browser memory. The app doesn’t send or save them. Reloading clears them. A hosting provider may keep its own access logs.

## Where I’d like to take it

Eventually I’d like to try more inputs: where someone lives, maybe even what they ate yesterday. Those questions need evidence before they change the estimate.

For the writing, keep it close to the original question. Explain the math like you’re talking to someone in class. Use actual numbers. Skip the slogans. Use commas, periods, or colons instead of long dashes.
