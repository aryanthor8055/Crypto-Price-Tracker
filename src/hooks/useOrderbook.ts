import { useEffect, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import type { OrderbookMessage } from "../types/ws";

const LEVELS = 10;

export type OrderbookState = {
  bids: Array<{ price: string; size: string; total: number }>;
  asks: Array<{ price: string; size: string; total: number }>;
  spread: string | null;
  spreadPercent: number | null;
};

function processLevels(
  levels: [string, string][],
  count: number
): Array<{ price: string; size: string; total: number }> {
  const sorted = [...levels]
    .map(([p, s]) => ({ price: p, size: s, sizeNum: parseFloat(s) }))
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); // bids high first
  let total = 0;
  return sorted.slice(0, count).map(({ price, size, sizeNum }) => {
    total += sizeNum;
    return { price, size, total };
  });
}

function processAsks(levels: [string, string][], count: number): Array<{ price: string; size: string; total: number }> {
  const sorted = [...levels]
    .map(([p, s]) => ({ price: p, size: s, sizeNum: parseFloat(s) }))
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); // asks low first
  let total = 0;
  return sorted.slice(0, count).map(({ price, size, sizeNum }) => {
    total += sizeNum;
    return { price, size, total };
  });
}

export function useOrderbook(symbol: string | null): OrderbookState {
  const { subscribe, unsubscribe, addMessageHandler } = useWebSocket();
  const [state, setState] = useState<OrderbookState>({
    bids: [],
    asks: [],
    spread: null,
    spreadPercent: null,
  });

  useEffect(() => {
    if (!symbol) {
      setState({ bids: [], asks: [], spread: null, spreadPercent: null });
      return;
    }

    const channels = [{ name: "l2_orderbook", symbols: [symbol] }];
    subscribe(channels);

    const remove = addMessageHandler((data) => {
      if (data.type !== "l2_orderbook" || data.symbol !== symbol) return;
      const msg = data as OrderbookMessage;
      const bids = processLevels(msg.bids, LEVELS);
      const asks = processAsks(msg.asks, LEVELS);
      const bestAsk = asks[0]?.price;
      const bestBid = bids[0]?.price;
      let spread: string | null = null;
      let spreadPercent: number | null = null;
      if (bestAsk != null && bestBid != null) {
        const askNum = parseFloat(bestAsk);
        const bidNum = parseFloat(bestBid);
        spread = (askNum - bidNum).toFixed(2);
        spreadPercent = bidNum !== 0 ? ((askNum - bidNum) / bidNum) * 100 : null;
      }

      setState({
        bids,
        asks,
        spread,
        spreadPercent,
      });
    });

    return () => {
      remove();
      unsubscribe(channels);
    };
  }, [symbol, subscribe, unsubscribe, addMessageHandler]);

  return state;
}
