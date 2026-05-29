# Micro-Habit Roulette 🎲

A minimalist, single-page web app that helps users overcome procrastination through tiny, 2-minute micro-habits. Built with vanilla HTML, CSS, and JavaScript — zero dependencies, no build step required.

> **Live demo:** [theycallmebrye11.github.io/micro-habit-roulette-web](https://theycallmebrye11.github.io/micro-habit-roulette-web)

---

## Features

- **🎰 Roulette Spin** — Randomly selects a micro-habit with a 1.5-second cycling animation. Press the spin button and let fate decide what 2-minute task you'll tackle.
- **⏱️ 2-Minute Timer** — A clean countdown timer starts automatically after each spin. Complete the habit or skip it.
- **✅ Habit Management (CRUD)** — Add, view, and delete custom micro-habits. Validates for empty inputs and duplicates. Pre-populated with 5 default habits on first launch.
- **🔥 Daily Streak Tracker** — Tracks consecutive days of completed habits. Resets if a day is skipped — and stays put if you complete multiple habits in one day.
- **📊 Total Habits Counter** — Every completed habit increments a lifetime counter.
- **🌓 Dark / Light Theme** — Toggle between adaptive themes with smooth CSS transitions. Persists across sessions.
- **💾 Local Persistence** — All data (habits, streak, completion history) is stored in `localStorage`. Survives page refreshes and browser restarts.
- **♿ Accessible** — Keyboard shortcuts (Space to spin, Escape to close forms), semantic HTML, ARIA labels, and responsive design.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **HTML** | Semantic HTML5 with ARIA attributes |
| **CSS** | Custom properties, Flexbox, CSS animations, `backdrop-filter` blur |
| **JavaScript** | Vanilla ES6+ (no frameworks, no libraries) |
| **Persistence** | `localStorage` API |
| **Fonts** | Inter (via Google Fonts) |
| **Deployment** | GitHub Pages, any static host |

The entire application is **~480 lines of CSS and ~450 lines of JS** — no build tools, bundlers, or package managers required.

---

## Project Structure

```
micro-habit-roulette-web/
├── index.html       # SPA shell with three screens + navigation
├── style.css        # Full dark/light theme, responsive layout, animations
├── app.js           # State management, timer logic, CRUD, persistence
└── README.md
```

---

## How It Works

### State Management
A single `state` object holds all application data. The `saveState()` function serializes it to `localStorage` as JSON, and `loadState()` restores it on page load. Every mutation calls `saveState()` immediately, ensuring data is never lost.

### Roulette Animation
The spin cycles through random habit names every 80ms for 1.5 seconds (~18 ticks). On completion, the final displayed habit is selected. A `setInterval` drives the animation, and a separate `setInterval` manages the 2-minute countdown.

### Streak Logic
```js
// Simplified streak calculation
if no previous completion → streak = 1
if last completion was yesterday → streak++
if last completion was >1 day ago → streak = 1
if same day → streak unchanged
```

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/theycallmebrye11/micro-habit-roulette-web.git

# Open in browser (no server needed)
open index.html
```

Or serve locally with any HTTP server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node
npx serve .
```

---

## Why This Project Stands Out

- **Zero Dependencies** — Demonstrates strong fundamentals without relying on frameworks.
- **Production-Quality UI** — Material-inspired design system with dark/light themes, smooth transitions, haptic-like feedback.
- **Accessible by Default** — Keyboard navigation, screen reader support, responsive to all screen sizes.
- **Single-File Simplicity** — The entire app logic lives in one JS file with a clear, documented state machine.

---

## License

MIT
