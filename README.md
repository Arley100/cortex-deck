# Cortex Deck

A local-first, browser-based focus-recovery console. You arrive with a feed-fried brain and unable to lock onto anything; Cortex Deck gives you six short cognitive drills with honest scoring, tracks a personal baseline per faculty, shows which faculties are scoring below your own baseline today, and prescribes targeted reps.

Everything runs on-device. No accounts, no network calls, no analytics.

## The six drills

| Drill | Faculty | Headline metric |
| --- | --- | --- |
| N-Back (2-back / 3-back) | working memory | accuracy % plus d-prime |
| Stroop | attention, inhibition | correct answers in 45 s |
| Sequence | memory span | longest chain |
| Math Sprint | processing speed | correct answers in 60 s |
| Reaction | response time | fastest tap in ms |
| Go / No-Go | response inhibition | accuracy % plus d-prime |

Scoring is honest: hits, misses, and false alarms are always reported separately, never collapsed into a flattering single number.

## Baselines

Every completed run is stored locally (IndexedDB via Dexie). The baseline for a drill and variant is the rolling median of your last 10 runs; it exists once you have 3 runs. Today's run is compared against it: within 10 percent is "at baseline", more than 10 percent better is "above", more than 10 percent worse is "below". For Reaction, lower is better and the comparison inverts. All comparisons are against your own history, nobody else's.

## Pre/Post mode

Run a short battery (default: Stroop 30 s, Reaction 3 trials, Go/No-Go 20 trials, under 3 minutes total), go do whatever you were going to do, then run the same battery again. The result is a neutral side-by-side delta per drill, for example "Stroop: 31 → 24 correct, -23%". The session survives page reloads. A shareable PNG summary card is planned; it currently ships as a placeholder.

## What this is not

- Not a medical device. It does not diagnose, detect, or measure anything clinical.
- Not an intelligence test or booster. It measures task performance relative to your own history, nothing more.
- Training these drills makes you better at these drills. Transfer to anything else is limited; that is what the research on practiced-task training generally shows.

## Stack

- Vite, React 18, TypeScript (strict)
- Tailwind CSS 4 for styling
- Zustand for state, Dexie (IndexedDB) for persistence
- Vitest and React Testing Library for tests
- Deployed as a static site on Vercel

## Development

```
npm install
npm run dev        # dev server
npm run test       # vitest, single run
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # typecheck + production build
```

CI runs typecheck, lint, tests, and the build on every push.

## Data and privacy

All data lives in your browser's IndexedDB. Settings has a one-file JSON export and import, and a wipe-all-data action with a confirm step. Nothing ever leaves your device unless you move the export file yourself.

## Repository

github.com/Arley100/cortex-deck
