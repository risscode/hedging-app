# HedgeBot Pro — Workspace

## Overview

Full-stack monorepo with a Binance-inspired dark/light trading tool: HedgeBot Pro.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React 18 + Vite + Tailwind CSS v4 + Framer Motion
- **UI Components**: shadcn/ui (Radix UI)
- **Router**: Wouter
- **Fonts**: IBM Plex Mono, Inter, Outfit, Cormorant Garamond

## Structure

```text
artifacts/
├── api-server/         # Express API server (health check)
├── hedgebot-pro/       # Main React + Vite app (previewPath: /)
│   └── src/
│       ├── App.tsx           # Root app with auth guard
│       ├── index.css         # Binance-style design system
│       ├── lib/
│       │   ├── auth.ts       # SessionStorage auth, lockout logic
│       │   ├── theme.ts      # Dark/light mode persistence (localStorage)
│       │   ├── format.ts     # Number formatters (USD, IDR, %)
│       │   ├── hedgeCalc.ts  # Full hedge calculation engine
│       │   └── goldCalc.ts   # Gold price calculation engine
│       ├── hooks/
│       │   └── useTheme.ts   # Theme hook
│       ├── components/
│       │   ├── Navbar.tsx    # Top navigation bar
│       │   └── ThemeToggle.tsx # Dark/light toggle pill
│       └── pages/
│           ├── LoginPage.tsx   # Login with show/hide password + lockout
│           ├── HedgebotPage.tsx # Full hedge calculator with 8 output tabs
│           └── GoldPage.tsx    # Gold converter with 5 output tabs
└── mockup-sandbox/     # Design prototyping
```

## Features

### Auth System
- Username: `alpha` / Password: `tester`
- SessionStorage (auto-logout on refresh)
- Max 5 failed attempts → 5 min lockout with countdown
- Show/hide password toggle

### Theme System
- Dark mode (default, Binance dark palette)
- Light mode (Binance light palette)
- Persists in localStorage
- Toggle available on login page AND in navbar

### HedgeBot Calculator
**Inputs:**
- Pair selector chips (BTC/ETH/BNB/SOL/XRP/DOGE/WIF/PEPE + custom)
- USDT/IDR rate (manual override)
- Entry Long, SL Long, Exposure, Leverage (1-125x slider + manual)
- Account Balance, Risk %
- TP1/TP2/TP3 in R (sliders + manual)
- Partial close % at TP1 and TP2
- Hedge: Entry Short, SL Short, TP Short, Exposure Short, Hedge Leverage, Trigger RR (all with sliders)

**Output tabs (8 tabs):**
1. Summary - 8 key metric cards
2. Detail Table - Long vs Hedge vs Combined
3. Scenarios - Bear/Bull/Full Bull P&L
4. Partial Close - TP1/TP2/TP3 partial close analysis
5. Price Map - All price levels with distance & P&L impact
6. Waterfall - Hedge efficiency visual bar chart
7. All Params - 30+ detailed parameters (grouped by category)
8. Bot Code - Binance WebSocket pseudocode with timestamp

### Gold Converter
- Auto-fetch USD/IDR from open.er-api.com + frankfurter.app fallback
- Manual override for both USD/IDR rate and gold spot price
- Auto-calculates on input change

**Output tabs (5 tabs):**
1. Summary - 8 weight cards
2. Weight Table - 14-row table from mg to 10kg
3. Custom Calc - Gram + purity calculator with formula
4. Purity - 5 purity grades comparison (24K/22K/18K/14K/9K)
5. All Params - 25+ detailed parameters across 4 categories

### Design System (Binance-inspired)
- Dark bg: `hsl(220 13% 8%)`, Yellow accent: `#F0B90B`
- Light mode: clean white with yellow accents
- CSS grid background pattern
- Custom scrollbars, range sliders, animations
- Ticker strip (auto-scrolling)
- Staggered children animation
- Card hover effects with yellow glow
- Page enter animation (slide from right)
- Gradient text (shimmer animation)

## Routes
- `/` → HedgeBot Pro page (with auth guard)
- `/hedgebot` → HedgeBot Pro page
- `/gold` → Gold Converter page
- `/api/healthz` → API health check
