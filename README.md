# Live Hard Tracker

A clean, Apple-styled tracker for Andy Frisella's [75 HARD and Live Hard program](https://andyfrisella.com/blogs/articles/live-hard).

Single-page web app, no build step, no dependencies. Stores progress in your browser's `localStorage`.

## Features

- All four stages: **75 HARD** (75 days) → **Phase 1** (30) → mandatory 30-day rest → **Phase 2** (30) → **Phase 3** (30)
- Per-phase task lists per the official rules (cold shower, power list, visualization, conversation with a stranger, random act of kindness)
- Light, dark, and auto themes
- Per-phase calendar with completion heatmap
- Reset controls for today, the current phase, any individual phase, or the entire journey
- Export / import progress as JSON for backup
- Auto-advance between phases with the mandatory 30-day rest enforced between Phase 1 and Phase 2

## Run locally

Just open `index.html` in a browser. No server or build step required.

```bash
open index.html
```

## Deploy to GitHub Pages

1. Push this folder to a new GitHub repo.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose `main` and `/ (root)`, then save.
5. After ~30 seconds your site is live at `https://<username>.github.io/<repo-name>/`.

## Files

- `index.html` — markup and structure
- `styles.css` — design system (Apple light/dark palette, glassmorphism, motion)
- `app.js` — state, persistence, phase logic, rendering

## Rules reference

- Miss any task during 75 HARD, Phase 1, or Phase 2 → restart that phase from Day 1.
- Miss any task during **Phase 3** → restart the **entire** Live Hard program.
- Phase 3 must finish on or before the one-year anniversary of starting 75 HARD.
