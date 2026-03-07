import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import type { TickerMessage } from "../types/ws";

export type TickerState = {
  last_price: string;
  mark_price: string;
  volume_24h: number;
  turnover_24h: number;
  funding_rate: string;
  changePercent: number | null; // session-based % change from first price
};

const emptyTicker: TickerState = {
  last_price: "",
  mark_price: "",
  volume_24h: 0,
  turnover_24h: 0,
  funding_rate: "",
  changePercent: null,
};

export function useTicker(symbols: string[]) {
  const { subscribe, unsubscribe, addMessageHandler } = useWebSocket();
  const [tickers, setTickers] = useState<Record<string, TickerState>>({});
  const openPriceRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (symbols.length === 0) return;
    const channels = [{ name: "v2/ticker", symbols }];
    subscribe(channels);

    const remove = addMessageHandler((data) => {
      if (data.type !== "v2/ticker" || !symbols.includes(data.symbol)) return;
      const msg = data as TickerMessage;
      const last = parseFloat(msg.last_price);
      const open = openPriceRef.current[msg.symbol];
      if (open == null) openPriceRef.current[msg.symbol] = last;
      const openPrice = open ?? last;
      const changePercent = openPrice !== 0 ? ((last - openPrice) / openPrice) * 100 : 0;

      setTickers((prev) => ({
        ...prev,
        [msg.symbol]: {
          last_price: msg.last_price,
          mark_price: msg.mark_price,
          volume_24h: msg.volume_24h,
          turnover_24h: msg.turnover_24h,
          funding_rate: msg.funding_rate,
          changePercent,
        },
      }));
    });

    return () => {
      remove();
      unsubscribe(channels);
    };
  }, [symbols.join(","), subscribe, unsubscribe, addMessageHandler]);

  const getTicker = useCallback(
    (symbol: string): TickerState => tickers[symbol] ?? emptyTicker,
    [tickers]
  );

  return { tickers, getTicker };
}
