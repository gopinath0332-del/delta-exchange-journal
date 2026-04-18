# 📋 Project Instructions — delta-exchange-journal

> This file gives an AI assistant (or new developer) everything needed to work effectively on this project without re-analyzing the codebase from scratch.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue.js 3 (Options API style, `setup()` function) |
| Build Tool | Vite 7 |
| Database | Firebase Firestore (real-time via `onSnapshot`) |
| Charts | Chart.js + vue-chartjs |
| Date Handling | Luxon (`DateTime`) |
| Styling | Vanilla CSS with CSS custom properties (no Tailwind) |
| Dev Server | `npm run dev` → http://localhost:5173 |

---

## 🗂️ Project Structure

```
delta-exchange-journal/
├── src/
│   ├── App.vue                   # Root component — navigation + global trade subscription
│   ├── main.js                   # App entry point
│   ├── style.css                 # Global CSS design tokens (CSS variables)
│   ├── components/
│   │   ├── Dashboard.vue         # Main dashboard — KPI stats + recent trades
│   │   ├── AllTrades.vue         # Full trade list page — subscribes independently to Firestore
│   │   ├── TradeList.vue         # Reusable trade table with filters, sorting, modal
│   │   ├── TradeCard.vue         # Trade detail card (shown in modal popup)
│   │   ├── Analytics.vue         # Analytics page — charts and metrics
│   │   ├── StrategyPerformance.vue # Strategy comparison chart
│   │   ├── PnLChart.vue          # Cumulative PnL line chart
│   │   ├── CalendarHeatmap.vue   # Daily PnL heatmap (last 365 days)
│   │   ├── TimeAnalysis.vue      # Performance by day-of-week and hour
│   │   └── StatsCard.vue         # Reusable stat display card
│   ├── firebase/
│   │   ├── config.js             # Firebase init using VITE_ env vars
│   │   └── trades.js             # All Firestore query functions
│   └── utils/
│       ├── calculations.js       # All trade math (PnL, win rate, drawdown, etc.)
│       └── formatters.js         # Display formatters (currency, date, %, side)
├── docs/
│   ├── README.md                 # Setup & deployment guide
│   ├── IMPROVEMENTS.md           # Feature backlog
│   ├── FEATURE_STREAK_TRACKING.md
│   └── REFACTORING_ANALYTICS.md
├── .env                          # Firebase credentials (gitignored — never commit)
├── .env.example                  # Template for .env
├── vite.config.js
└── package.json
```

---

## 🔥 Firebase / Firestore

### Project Details
- **Project ID**: `crypto-journal-b2298`
- **Auth Domain**: `crypto-journal-b2298.firebaseapp.com`
- **Collection**: `trades` (top-level Firestore collection)

### Environment Variables (`.env`)
All prefixed with `VITE_` so Vite exposes them to the browser:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

> ⚠️ If the dev server was already running when `.env` was updated, it **must be restarted** to pick up new values (`Ctrl+C` → `npm run dev`).

### Firestore Trade Document Schema
```javascript
{
  symbol: "ETHUSD",                  // string — e.g. "BTCUSD", "SOLUSD"
  strategy_name: "donchian_channel", // string — EXACT value matters for filtering
  status: "OPEN" | "CLOSED",         // string — always uppercase
  mode: "paper" | "live",            // string — lowercase
  entry_side: "buy" | "sell",        // string — lowercase
  exit_side: "buy" | "sell",         // string — lowercase
  entry_price: 3400,                 // number
  exit_price: 3570,                  // number
  entry_timestamp: Timestamp,        // Firestore Timestamp object
  exit_timestamp: Timestamp,         // Firestore Timestamp object (null if OPEN)
  pnl: 850,                          // number (only meaningful when CLOSED)
  pnl_percentage: 50,                // number
  trading_fees: 12.5,                // number
  funding_charges: -5.25,            // number
  margin_used: 1700,                 // number
  leverage: 10,                      // number
  order_size: 5,                     // number
  product_id: 27,                    // number
  entry_reason: "...",               // string
  exit_reason: "...",                // string
}
```

### Known Strategy Names in Firestore (as of April 2026)
Values stored in the `strategy_name` field — these are **case-sensitive**:
- `donchian_channel` ← primary / default strategy
- `cci-ema`
- `ema-cross`
- `macd_psar_100ema`
- `Calc Fields Test` (test data)
- `Single Doc Test` (test data)
- `Test Strategy (Linked)` (test data)
- `TestStrategy` (test data)

> ⚠️ **Critical**: When setting a default or hardcoded strategy filter value, always use the exact `strategy_name` string from Firestore. Mismatch = blank dropdown + "No trades found". The dropdown `v-model` does a strict `===` comparison.

---

## 🧩 Key Components — Patterns & Gotchas

### `TradeList.vue` — The Core Filter Component
- Located at `src/components/TradeList.vue`
- Used in both `Dashboard.vue` (with `:limit="5"`) and `AllTrades.vue` (no limit)
- Filters: search, status, symbol, strategy, date range
- **Default strategy filter** is set by `const strategyFilter = ref('donchian_channel')`
- `uniqueStrategies` computed is built from `props.trades` dynamically — if trades haven't loaded yet, the dropdown will have no options and the v-model won't resolve → dropdown appears **blank**
- **Fix pattern**: When setting a default filter value, ensure the option always exists by seeding it into `uniqueStrategies`
- `clearFilters()` resets `strategyFilter` back to `'donchian_channel'` (not empty string) so the default is restored

### `AllTrades.vue`
- Has its **own** `subscribeToTrades()` call independent of `App.vue`
- Does NOT use the global trades prop — fetches fresh from Firestore

### `App.vue`
- Global Firestore subscription → passes `trades` as prop to `Dashboard` and `Analytics`
- Navigation is hash-based (`currentView` ref): `'dashboard'`, `'analytics'`, `'trades'`
- No Vue Router — navigation is `@click` driven

### Timestamp Handling
- Firestore timestamps are `Timestamp` objects with `.toDate()` method
- Always use the pattern: `timestamp?.toDate?.() || new Date(timestamp)`
- Formatters in `src/utils/formatters.js` handle this automatically via Luxon

---

## 🧮 Calculations (`src/utils/calculations.js`)

All functions take an `Array` of trade objects:

| Function | Returns |
|----------|---------|
| `calculateTotalPnL(trades)` | Sum of PnL for CLOSED trades |
| `calculateWinRate(trades)` | Win % (0–100) |
| `calculateAverageProfit(trades)` | Avg PnL of winning trades |
| `calculateAverageLoss(trades)` | Avg PnL of losing trades (negative) |
| `calculateStrategyStats(trades)` | Object keyed by strategy_name |
| `calculateCumulativePnL(trades)` | Array of `{date, cumulativePnL, trade}` |
| `calculateDailyPerformance(trades, days)` | Calendar heatmap data |
| `calculateTimeBasedPerformance(trades)` | `{byDay, byHour}` arrays |
| `calculateMaxDrawdown(trades)` | Max drawdown value |
| `calculateRiskRewardRatio(trades)` | Avg Win / Avg Loss |
| `calculateProfitFactor(trades)` | Gross Profit / Gross Loss |
| `calculateStreaks(trades)` | `{currentStreak, type, longestWin, longestLoss}` |

> All functions filter internally for `status === 'CLOSED'` unless noted.

---

## 🎨 Design System

CSS custom properties defined in `src/style.css` / global styles:

```css
/* Key variables */
--color-primary          /* Purple */
--color-bg-secondary     /* Card backgrounds */
--color-bg-tertiary      /* Nested card backgrounds */
--glass-border           /* Semi-transparent border */
--gradient-primary       /* Purple-blue gradient (text fills) */
--gradient-success       /* Green gradient */
--gradient-danger        /* Red gradient */
--color-text-primary / secondary / tertiary / muted
--spacing-xs / sm / md / lg / xl / 2xl
--font-size-xs / sm / base / lg / xl / 2xl / 3xl
--radius-md / lg
--transition-base / fast
--shadow-lg
```

CSS utility classes available globally:
- `.glass-card` — frosted glass card
- `.btn`, `.btn-primary`, `.btn-secondary`
- `.input`, `.select`
- `.badge`, `.badge-open`, `.badge-closed`, `.badge-paper`, `.badge-live`
- `.profit`, `.loss`, `.neutral` — PnL color classes
- `.side-buy`, `.side-sell`
- `.grid`, `.grid-cols-2`, `.grid-cols-4`
- `.fade-in` — entry animation
- `.container`, `.flex`, `.flex-col`, `.items-center`, `.justify-between`
- `.mb-xl`, `.mt-md`, `.mt-lg`, `.mb-lg`, `.p-xl` etc.

---

## 🏗️ Development Workflow

```bash
# Install deps
npm install

# Start dev server
npm run dev        # → http://localhost:5173

# Build production
npm run build

# Preview production build
npm run preview
```

### Git Branching
- Main branch: `main`
- Feature branches: `feature/<description>` (e.g. `feature/all-trades-page-update`)

### Deployment
- Hosted on GitHub Pages via GitHub Actions
- Firebase credentials injected at build time via GitHub Secrets
- Workflow triggered on push to `main`

---

## ⚡ Common Task Patterns

### Adding a new filter default
1. Update `ref('')` → `ref('exact_firestore_value')` in `TradeList.vue`
2. Update `clearFilters()` to reset to same value (not `''`)
3. If data might not be loaded yet, seed the value into the computed options list

### Adding a new computed stat
1. Add function to `src/utils/calculations.js`
2. Import and call it inside the relevant component's `setup()`
3. Return it from `setup()` and use in template

### Adding a new filter (e.g. by mode)
1. Add `const modeFilter = ref('')` in `TradeList.vue setup()`
2. Add `uniqueModes` computed
3. Add `<select v-model="modeFilter">` in template
4. Add filter step inside `filteredTrades` computed
5. Add to `hasActiveFilters` and `clearFilters()`

### Working with Firestore timestamps in templates
```vue
{{ formatDate(trade.entry_timestamp) }}       <!-- Full date + time -->
{{ formatShortDate(trade.entry_timestamp) }}  <!-- Date only -->
```

---

## 🚨 Known Gotchas

1. **Dropdown shows blank** — The `v-model` value doesn't match any `<option>` value. Always verify the exact `strategy_name` string in Firestore (case-sensitive, snake_case).

2. **"No trades found" after env update** — Restart the dev server after editing `.env`. Vite doesn't hot-reload env changes.

3. **Timestamps on Windows** — Firestore Timestamps must use `.toDate()`. Direct `new Date(timestamp)` on a Firestore Timestamp object returns `Invalid Date` on Windows. Always use `timestamp?.toDate?.() || new Date(timestamp)`.

4. **`AllTrades` has own subscription** — It doesn't receive the global `trades` prop from `App.vue`. Changes to the global subscription won't affect `AllTrades.vue` unless it's also updated.

5. **`TradeList` with `:limit`** — When `limit` prop is set, filtering still applies to all trades but only the first N are displayed. The `hasActiveFilters` and filter UI are hidden when `limit` is set.

6. **PnL on OPEN trades** — Never display `trade.pnl` for open trades. The field is undefined/0 until the trade closes. Use `trade.status === 'CLOSED' ? formatCurrency(trade.pnl) : 'OPEN'`.
