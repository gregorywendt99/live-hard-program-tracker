# Live Hard Tracker

A clean, Apple-styled tracker for Andy Frisella's [75 HARD and Live Hard program](https://andyfrisella.com/blogs/articles/live-hard).

Single-page web app with email/password accounts and cross-device sync via Firebase. The app is unopinionated about devices — sign in on your laptop, your phone, an iPad, all see the same data in real time.

## Features

- All four stages: **75 HARD** (75 days) → **Phase 1** (30) → mandatory 30-day rest → **Phase 2** (30) → **Phase 3** (30)
- Per-phase task lists per the official rules (cold shower, power list, visualization, conversation with a stranger, random act of kindness)
- Email/password accounts with cross-device sync (Firebase Auth + Firestore)
- Real-time updates — check a task on your phone, watch it tick on your laptop
- Daily progress photos with a built-in "Then vs Now" timeline carousel
- Light, dark, and auto themes
- Per-phase calendar with a completion heatmap
- Reset controls for today, the current phase, any individual phase, or the entire journey
- Export / import progress as JSON for backup
- Auto-advance between phases with the mandatory 30-day rest enforced between Phase 1 and Phase 2
- Works offline — Firestore caches locally and syncs when you're back online

## Run locally

Just open `index.html` in a browser. No server or build step required.

```bash
open index.html
```

## Firebase setup (5 minutes, one-time)

The tracker needs a free Firebase project to store account data. Free tier easily handles personal use.

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com).
2. Click **Add project**, give it a name (e.g. "live-hard-tracker"), skip Google Analytics.

### 2. Enable Email/Password authentication

1. In the left sidebar, click **Authentication** → **Get started**.
2. Click the **Email/Password** provider, toggle **Enable**, click **Save**.

### 3. Create a Firestore database

1. In the left sidebar, click **Firestore Database** → **Create database**.
2. Choose **Production mode**, pick a region close to you (e.g. `us-central1`), and create.
3. Once it loads, go to the **Rules** tab and replace the default rules with the contents of [`firestore.rules`](firestore.rules), then **Publish**.

### 4. Authorize your domain

1. **Authentication** → **Settings** tab → **Authorized domains**.
2. Add your GitHub Pages domain (e.g. `gregorywendt99.github.io`). `localhost` should already be there for local development.

### 5. Add a web app and copy the config

1. **Project settings** (gear icon) → **General** tab → scroll to **Your apps**.
2. Click the web icon (`</>`) to add a web app. Give it any nickname; skip Hosting.
3. Copy the six values from the `firebaseConfig` snippet.
4. Paste them into [`firebase-config.js`](firebase-config.js), replacing the `YOUR_*` placeholders.
5. Commit and push — GitHub Pages will redeploy in ~30 seconds.

That's it. Visit your site, create an account, and your progress will sync to any device you log in on.

## Deploy to GitHub Pages

1. Push this folder to a new GitHub repo.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose `main` and `/ (root)`, then save.
5. After ~30 seconds your site is live at `https://<username>.github.io/<repo-name>/`.

## Files

- `index.html` — markup and structure
- `styles.css` — design system (Apple light/dark palette, glassmorphism, motion)
- `app.js` — state, persistence, phase logic, rendering, Firebase auth + Firestore sync
- `firebase-config.js` — your Firebase project credentials (safe to commit publicly)
- `firestore.rules` — Firestore security rules to paste into Firebase Console

## Privacy

- Each user can only read/write their own document under `/users/{uid}` in Firestore (enforced by the security rules).
- Firebase web config values are public by design — they identify your project but don't grant access. Auth domain whitelist + security rules are what actually protect data.
- No third-party analytics. No tracking. Your progress data lives in your own Firebase project.

## Rules reference

- Miss any task during 75 HARD, Phase 1, or Phase 2 → restart that phase from Day 1.
- Miss any task during **Phase 3** → restart the **entire** Live Hard program.
- Phase 3 must finish on or before the one-year anniversary of starting 75 HARD.
