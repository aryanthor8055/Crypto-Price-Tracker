import { useEffect, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import type { TradeMessage } from "../types/ws";

const MAX_TRADES = 30;

export type TradeRow = {
  price: string;
  size: number;
  side: "BUY" | "SELL";
  time: string;
  id: string;
};

// Infer side from taker: if buyer is taker it's a buy (aggressor bought)
function inferSide(msg: TradeMessage): "BUY" | "SELL" {
  return msg.buyer_role === "taker" ? "BUY" : "SELL";
}

function formatTime(ts: number): string {
  const ms = typeof ts === "number" && ts > 1e12 ? ts / 1000 : ts;
  const d = new Date(ms);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function useTrades(symbol: string | null): TradeRow[] {
  const { subscribe, unsubscribe, addMessageHandler } = useWebSocket();
  const [trades, setTrades] = useState<TradeRow[]>([]);

  useEffect(() => {
    if (!symbol) {
      setTrades([]);
      return;
    }

    const channels = [{ name: "all_trades", symbols: [symbol] }];
    subscribe(channels);

    const remove = addMessageHandler((data) => {
      if (data.type !== "all_trades" || data.symbol !== symbol) return;
      const msg = data as TradeMessage;
      const row: TradeRow = {
        price: msg.price,
        size: msg.size,
        side: inferSide(msg),
        time: formatTime(msg.timestamp),
        id: `${msg.timestamp}-${msg.price}-${msg.size}`,
      };

      setTrades((prev) => {
        const next = [row, ...prev].slice(0, MAX_TRADES);
        return next;
      });
    });

    return () => {
      remove();
      unsubscribe(channels);
    };
  }, [symbol, subscribe, unsubscribe, addMessageHandler]);

  return trades;
}
