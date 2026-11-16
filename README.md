# Journal App — ELI5 setup guide

This is step 1 only: a working UI with fake (dummy) data. No Firebase, no
Cloudinary yet — that comes next. Right now the goal is just: "does this
run on my computer and look right?"

## Step A — Install Node.js (one-time, skip if you already have it)

1. Go to https://nodejs.org
2. Download the **LTS** version for your OS and install it (click Next,
   Next, Finish — default options are fine).
3. Open a terminal (Command Prompt / PowerShell on Windows, Terminal on
   Mac) and type:
   ```
   node -v
   ```
   If it prints a version number like `v20.x.x`, you're good.

## Step B — Run this project locally

1. Unzip this folder somewhere, e.g. `Desktop/journal-app`.
2. Open a terminal **inside that folder** (on Windows: open the folder in
   File Explorer, click the address bar, type `cmd`, press Enter).
3. Run:
   ```
   npm install
   ```
   (this downloads the libraries — takes a minute, only needed once)
4. Run:
   ```
   npm run dev
   ```
5. It will print a link like `http://localhost:5173` — open that in your
   browser (or phone's browser if on the same WiFi, using your PC's local
   IP instead of `localhost`).
6. You should see the same layout as the design preview: section tabs on
   top, page list on the right, page content in the middle.

Nothing is saved yet — the data in `src/data/sampleData.js` is fake and
hardcoded. That's expected at this stage.

## Step C — Push this to GitHub (so it's backed up + easy to deploy)

1. Go to https://github.com and create a free account if you don't have
   one (same as TimeLogger's `T2Fuz` account, or a new one — your choice).
2. Click the **+** icon (top right) → **New repository**. Name it
   `journal-app`. Leave it empty (no README, no .gitignore — we already
   have them). Click **Create repository**.
3. GitHub will show you a page with commands. Easiest path if you don't
   want to use git commands: on the repo page, click **uploading an
   existing file**, then drag this whole folder's contents in and commit.
   (This is the same "upload via web UI" approach you used for
   TimeLogger.)

## Step D — Deploy to Vercel (get a live link)

1. Go to https://vercel.com, sign up using your GitHub account.
2. Click **Add New → Project**, pick the `journal-app` repo.
3. Vercel auto-detects Vite — just click **Deploy**.
4. In ~1 minute you'll get a live URL like `journal-app-xyz.vercel.app`.

## Step E — Firebase (done in v0.2)

1. Firebase Console > Authentication > Sign-in method > **Email/Password** = ON.
2. Firebase Console > Firestore Database > **Create database** (production mode).
3. Firestore > **Rules** tab > paste everything from `firestore.rules` > **Publish**.
4. Fill the 6 values in `src/firebaseConfig.js`.

## Step F — Cloudinary (image/audio upload)

1. Make a free account at https://cloudinary.com (no card needed).
2. Settings > Upload > **Add upload preset** > Signing mode = **Unsigned**. Save its name.
3. Fill `cloud name` and `upload preset` in `src/cloudinaryConfig.js`.

## What's NOT done yet

1. Cloudinary account + preset (image/audio insert shows a friendly message until then).
2. Mobile 3-level drill-down layout.
