# 🌱 Goal Tracker — Student Productivity Dashboard

A modern, responsive student productivity web application inspired by **Habitica**. Built using pure **HTML5**, **CSS3**, and vanilla **JavaScript** with zero external libraries or frameworks.

---

## ✨ Features

1. **Habitica-Inspired Dashboard**:
   - Real-time statistics: Total Goals, Completed Goals, Completion Rate (%), and Streak Counter.
   - Gamified Student Profile: Scholar Leveling system & EXP progress bar (+20 XP per completed goal).
   - Dynamic today's date formatted to your local timezone.

2. **Goal Management (CRUD)**:
   - Create, edit, and delete goals with interactive modals.
   - Strict input validation (empty title detection, 80-char limits, category checks).
   - Delete confirmation dialog to prevent accidental data loss.
   - Habitica-style custom checkboxes with celebration animations and strike-through styling.

3. **Academic & Life Categories**:
   - Categories: `Study` 📚, `Fitness` 🏋️, `Reading` 📖, `Coding` 💻, and `Personal` ✨.
   - Category filtering pills with real-time goal counters.
   - Search bar with instant filtering by title, notes, or keyword.
   - Sorting options: Newest, Alphabetical, Category, and Priority.

4. **Weekly Progress Chart**:
   - Crisp, high-DPI HTML5 Canvas bar chart displaying daily completion percentages for the last 7 days.
   - Interactive hover tooltips showing `X / Y goals completed (Z%)`.
   - Summary indicators: 7-day average completion rate, best day, and total completed goals.
   - Automatically updates immediately whenever any goal is toggled, edited, or deleted.

5. **Sensible Streak Engine**:
   - Calculates consecutive days where 100% of scheduled goals were completed.
   - If today is in progress, preserves your active streak.
   - Handles empty/rest days without unfairly penalizing students.

6. **Original Features**:
   - **Daily Motivational Message**: Curated student productivity and habit quotes with category tags, a "New Quote" randomizer, and one-click copy to clipboard.
   - **Pomodoro Focus Station**: Circular progress ring timer with Focus (25m), Short Break (5m), Long Break (15m), and Custom duration. Start, Pause, and Reset controls. Includes built-in synthesizer chime sound (via Web Audio API) and active goal linking.

7. **Local Persistence & Data Privacy**:
   - Automatically saves goals, completion history, XP, and settings to `localStorage`.
   - Zero servers, cookies, or tracking. Data survives page refreshes and browser restarts.
   - Includes Export to JSON and Import from JSON for simple backups.

8. **First-Launch Seeding**:
   - Seeds 5 realistic student goals and past 5 days of history on first launch only.
   - Never overwrites existing user data.

---

## 🚀 How to Run Locally

Because Goal Tracker is built with vanilla HTML, CSS, and JavaScript, you can run it directly:

### Option 1: Direct Browser Launch (Easiest)
Simply double-click `index.html` or drag and drop it into any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, Brave).

### Option 2: Local HTTP Server
If you prefer running via a local development server:

#### Using Python:
```bash
python -m http.server 3000
```
Open `http://localhost:3000` in your browser.

#### Using Node.js (npx):
```bash
npx serve .
```

#### Using VS Code:
Right-click `index.html` and choose **"Open with Live Server"**.

---

## 🌐 How to Deploy to GitHub Pages

1. **Initialize Git repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Goal Tracker Student Productivity Website"
   ```

2. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new) and name your repository (e.g., `goal-tracker`).
   - Leave it public and do not initialize with README (we already have one).

3. **Push your code**:
   ```bash
   git remote add origin https://github.com/<your-username>/goal-tracker.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**:
   - In your GitHub repository, go to **Settings** > **Pages** (in the left sidebar).
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and folder `/ (root)`, then click **Save**.
   - Within 1-2 minutes, your website will be live at:
     `https://<your-username>.github.io/goal-tracker/`

---

## ⚡ How to Deploy to Vercel

Vercel provides free, instant global hosting with zero configuration for static sites:

### Method A: Deploy via Vercel Website (No CLI required)
1. Push your repository to GitHub (steps above).
2. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
3. Click **"Add New..."** > **"Project"**.
4. Find your `goal-tracker` repository and click **"Import"**.
5. Keep all default settings (Framework Preset: Other / Root Directory: `./`).
6. Click **"Deploy"**. Your site will be live on a `*.vercel.app` URL in seconds!

### Method B: Deploy using Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. In the project folder, run:
   ```bash
   vercel
   ```
3. Follow the prompts (press Enter to accept defaults).
4. Run `vercel --prod` to deploy to production.

---

## 🧪 Testing

The repository includes an automated in-browser test suite (`test.html`) covering:
- 39 automated assertions verifying Goal CRUD, Category filtering, Streak calculation, Canvas chart rendering, Focus Timer states, and LocalStorage persistence.
- Verified 100% passing on Google Chrome and Microsoft Edge.
