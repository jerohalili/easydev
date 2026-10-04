# EasyDev - Week 3

## Week of: August 30 - September 5, 2026

## My goal this week

Make the MVP feel like a real app: cleaner UI, better interactivity, consistent buttons and hovers, and a proper favicon.

## What I did

- I did cleanup and interactivity passes (`d01f59e`, `e02ab04`, `6870240`).
- I built the hover system (`95ae0a9`, `d9effc2`, `c751ad3`) and reworked buttons including dark-mode hover (`0c9ae5b`, `015343e`, `072830e`, `988dc61`).
- I fixed light-mode borders and spacing (`dbcad43`, `891dbe3`, `38d2f3f`).
- I fixed the favicon twice (`cdd038a`, `8cce1b8`).

## What blocked me

- My Comparison and Results views drifted apart (I even noted it in `client/src/categoryStyles.js:2`). Fixing each screen separately was slow and I could see I needed one shared `CATEGORY_STYLES` map.
- I had no single token for borders and hovers, so every fix was per-component. That pushed me to plan the Week 4 design system.
- This was a CSS-only week with no backend changes, which confirmed my stuck points were theming, not my data model.

## What I learned

- Per-component polish without tokens just creates drift. I need one shared style map before touching more screens.
- Small stuff like favicon and button hover really changes whether the app reads as finished or not.
