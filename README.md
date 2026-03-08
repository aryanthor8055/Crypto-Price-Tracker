# Crypto Price Tracker

A React + TypeScript web app that displays live crypto market data via a mock WebSocket server. Built for the Mid Software Engineer take-home assignment.

## Features

- **Product List View** — All symbols with live last price, 24h change (session-based), and volume. Search/filter by name or symbol. All / Favorites tabs.
- **Product Detail View** — Ticker (mark price, volume, funding rate), live orderbook with depth bars, and recent trades with buy/sell styling. New trades animate in.
- **Favorites** — Star toggles persisted in `localStorage`; Favorites tab shows only favorited products.
- **WebSocket lifecycle** — Single connection, subscribe on mount / unsubscribe on unmount. Reconnect with backoff. Connection status shown at bottom of list and detail views.
- **Error handling** — Connection status (connecting / connected / disconnected / error); reconnection is automatic.

## Setup

### 1. Mock WebSocket server

The app expects the mock server from [socket-custom-load](https://github.com/saxenanickk/socket-custom-load) running at `ws://localhost:8080`.

**Option A — Clone and run the server in a separate terminal:**

```bash
git clone https://github.com/saxenanickk/socket-custom-load.git server
cd server
bun install   # or: npm install (if you use Node)
bun start    # or: node index.js
```

**Option B — Docker:**

```bash
cd /path/to/socket-custom-load
docker compose up
```

See `server/README.md` (in that repo) for ports (WebSocket 8080, HTTP config 3000), channels, and message formats.

### 2. This app

```bash
npm install
npm start
```

Then open http://localhost:5173 (or the URL Vite prints). Ensure the mock server is running first.

## Deployment

### Frontend only (static)

Deploy the built app to any static host. The app will try to connect to `ws://localhost:8080` by default, so it will show "Disconnected" unless you also run the mock server locally or set a production WebSocket URL.

**Vercel (recommended)**

1. Push your repo to GitHub (you already have it).
2. Go to [vercel.com](https://vercel.com) → Sign in with GitHub → **Add New Project** → Import `aryanthor8055/Crypto-Price-Tracker`.
3. **Build and Output Settings:** Build Command `npm run build`, Output Directory `dist`, leave the rest default.
4. **Deploy.** Your app will be at `https://your-project.vercel.app`.

**Netlify**

1. [netlify.com](https://netlify.com) → Add new site → Import from Git → choose the repo.
2. Build command: `npm run build`, Publish directory: `dist`.
3. Deploy.

**Optional: use a production WebSocket URL**

If you deploy the mock server somewhere (see below), set the env var when building the frontend:

- **Vercel:** Project → Settings → Environment Variables → add `VITE_WS_URL` = `wss://your-ws-server.example.com`.
- **Netlify:** Site settings → Environment variables → add `VITE_WS_URL` = `wss://...`.

Redeploy the frontend so the build picks up the variable.

### Mock server (optional, for a full live demo)

To have live data on the deployed site, host the mock server somewhere that supports WebSockets and Node:

- **Railway:** New project → Deploy from GitHub (clone [socket-custom-load](https://github.com/saxenanickk/socket-custom-load)) or use Railway’s “Deploy from repo”. Set start command to `node index.js`. Copy the public URL and use the **WebSocket** URL (e.g. `wss://your-app.railway.app`) as `VITE_WS_URL` for the frontend.
- **Render:** New Web Service → connect the server repo, build `npm install`, start `node index.js`. Use the service URL as `VITE_WS_URL` (with `wss://` if Render serves WS on the same host).
- **Fly.io:** `fly launch` in the server repo, then `fly deploy`. Use the app’s URL as `VITE_WS_URL`.

After the server is deployed, set `VITE_WS_URL` in your frontend project and redeploy the frontend.

## Approach

- **Single WebSocket connection** in a React context (`WebSocketContext`). Components subscribe/unsubscribe by channel and symbol; the context merges subscriptions and re-subscribes on reconnect.
- **Channel-specific hooks** — `useTicker(symbols)`, `useOrderbook(symbol)`, `useTrades(symbol)` — handle subscribe/unsubscribe and message handling in one place, so list and detail views stay simple and unmount cleans up cleanly.
- **24h change** — The mock ticker doesn’t send open/high/low; the app uses the first `last_price` in the session as “open” and shows percent change from that.
- **Orderbook** — Top 10 bids/asks with cumulative total and a visual depth bar (width = total / max total). Asks above, spread row, bids below.
- **Trades** — Side inferred from `buyer_role === "taker"` → BUY. New rows prepended with a short highlight animation.
- **Favorites** — Stored in `localStorage` under `crypto-tracker-favorites`; read on load and on toggle.

## If I had more time

- **Stress test mode** — UI control (e.g. slider) to call the server’s POST `/intervals` and increase update frequency; document throttling/batching/RAF/memoization used to keep the UI smooth.
- **24h high/low** — Either from a richer ticker payload or by tracking min/max of `last_price` over the session.
- **Unit tests** — e.g. for `useTicker` / `useOrderbook` / `useTrades` with a mock WebSocket, and for favorites persistence.
- **Mini chart** — Optional candlestick view using the server’s `candlestick_*` channels (e.g. GET /v2/history/candles if the server exposes it, or streamed candles).
- **Accessibility** — More robust focus management and screen reader labels for the orderbook and trades tables.

## Tech stack

- React 19, TypeScript, Vite 7
- No external UI or state libraries; CSS in `App.css` and `index.css`
