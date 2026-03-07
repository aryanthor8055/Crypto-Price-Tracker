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
