# Best Day Senior Assessment

A digital movement and independence evaluation tool built for personal trainers and physical therapists at **Best Day Fitness** (St. Petersburg, FL). Replaces paper-based senior scorecards with a tablet-friendly app featuring built-in timers, auto-scoring, and client progress tracking.

Based on the **AFIT (Advanced Functional Independence Testing)** protocol from occupational therapy, adapted for the fitness and wellness setting.

---

## Features

### Assessment Form
- **11 test categories**: Posture, Flexibility, Static Balance, Dynamic Balance, Endurance, Strength, Function, Core, and Bonus tests
- **Built-in timers**: Count-up timers for timed tests and countdown timers for the 2-Minute Step Test and 30-second Sit to Stand; enter step/repetition counts manually when those timers finish
- **Smart inputs**: Y/N toggle buttons, number inputs, and dropdowns designed for fast tablet entry
- **Live scoring**: Sticky header shows real-time point total as data is entered

### Clinical Reference
- **Collapsible info bubbles** on every test with:
  - How to administer the test
  - Equipment needed
  - Age/gender reference standards from AFIT research
  - Common errors to watch for
  - Clinical significance and fall risk implications

### Results & Reporting
- **Bar charts** comparing client performance against age/gender norms (powered by Recharts)
- **Risk summary** with green/red badges for each fall risk factor

### Data Persistence
- **IndexedDB** local storage for offline tablet use
- **Supabase** integration ready for cloud sync across devices
- **Session history** to track multiple assessments per client over time
- **Optional GoHighLevel push** for contact identity and the latest assessment summary

### Design
- Clean, minimal UI optimized for tablet use
- Dark/light theme toggle
- Responsive layout works on tablets, laptops, and desktops

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Charts | Recharts |
| Local Storage | IndexedDB (via `idb`) |
| Cloud DB | Supabase (optional) |
| Production Server | Express 5 |
| Hosting | Railway |

## GoHighLevel Setup

The app can push a saved assessment to an existing GoHighLevel contact using the client's email address. Local IndexedDB remains the source of truth, so a GoHighLevel outage does not prevent saving.

Create a GoHighLevel Private Integration with the minimum contact write scope, then configure these server environment variables:

```text
GHL_PRIVATE_INTEGRATION_TOKEN=      # keep this server-side; never use a VITE_ variable
GHL_LOCATION_ID=                    # the GoHighLevel sub-account/location ID
GHL_ASSESSMENT_FIELD_KEY=           # optional large-text contact custom-field key
```

The optional custom field stores the assessment date, point total, and test results as JSON. If it is omitted, the contact and `best-day-assessment` tag still sync. An email address is required to avoid creating duplicate contacts by name alone.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install & Run Locally

```bash
 git clone https://github.com/Best-Day-Fitness-and-Wellness/best-day-movement-eval-app.git
 cd best-day-movement-eval-app
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm start
```

Serves the built app on `http://localhost:3000`.

---

## Deployment (Railway)

The app includes a `railway.json` configuration for one-click deployment:

1. Push to GitHub
2. Connect the repo in [Railway](https://railway.app)
3. Railway auto-detects the config, runs `npm run build`, then `npm start`
4. Generate a public domain under **Settings → Networking**

---

## Project Structure

```
src/
├── App.jsx                 # Main app with form + results views
├── ThemeContext.jsx         # Dark/light theme provider
├── components/
│   ├── Badge.jsx           # Risk indicator badges
│   ├── BarChart.jsx        # Performance vs norms chart
│   ├── InfoBubble.jsx      # Collapsible clinical reference
│   ├── NumberInput.jsx     # Numeric input with labels
│   ├── Row.jsx             # Form row layout
│   ├── Section.jsx         # Collapsible test category
│   ├── ThemeToggle.jsx     # Theme switcher
│   ├── Timer.jsx           # Count-up/countdown timer
│   └── YesNo.jsx           # Toggle button pair
├── data/
│   ├── norms.js            # Age/gender reference standards
│   ├── protocols.js        # Test procedures & equipment
│   └── trainerTips.js      # Clinical tips per test
├── db/
│   ├── local.js            # IndexedDB operations
│   ├── store.js            # Unified data access layer
│   └── supabase.js         # Supabase client config
├── utils/
│   └── scoring.js          # Point calculation & risk logic
└── views/
    └── TrainerTips.jsx     # Trainer reference view
```

---

## Roadmap

- [ ] Trend graphs across multiple re-tests per client
- [ ] PDF export for client reports
- [ ] Digital signature capture for consent form
- [ ] PWA support for offline tablet use
- [ ] Multi-trainer login with Supabase Auth
- [ ] Client management dashboard

---

## About

Built for **Best Day Fitness** — 6619 1st Ave South, St. Petersburg, FL.

📞 727-334-1472 | [Book a Free Consultation](https://bestdayfitness.com)

---

## License

Proprietary — Best Day Fitness. All rights reserved.
