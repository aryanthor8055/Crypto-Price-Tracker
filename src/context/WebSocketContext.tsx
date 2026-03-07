import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { WsMessage } from "../types/ws";

const WS_URL = "ws://localhost:8080";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

type MessageHandler = (data: WsMessage) => void;

type WebSocketContextValue = {
  status: ConnectionStatus;
  subscribe: (channels: Array<{ name: string; symbols: string[] }>) => void;
  unsubscribe: (channels: Array<{ name: string; symbols?: string[] }>) => void;
  addMessageHandler: (handler: MessageHandler) => () => void;
};

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const MAX_RECONNECT_DELAY = 10000;
const INITIAL_RECONNECT_DELAY = 1000;

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const handlersRef = useRef<Set<MessageHandler>>(new Set());
  const pendingSubscriptionsRef = useRef<Array<{ name: string; symbols: string[] }>>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      setStatus("connected");
      // Re-subscribe to whatever was requested before disconnect
      const pending = pendingSubscriptionsRef.current;
      if (pending.length > 0) {
        ws.send(JSON.stringify({ type: "subscribe", payload: { channels: pending } }));
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      setStatus("disconnected");
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsMessage;
        if (data.type === "subscriptions") return; // ack, ignore
        handlersRef.current.forEach((h) => h(data));
      } catch {
        // ignore parse errors
      }
    };
  }, []);

  const subscribe = useCallback((channels: Array<{ name: string; symbols: string[] }>) => {
    // Merge into pending so we re-sub on reconnect
    const existing = new Map(pendingSubscriptionsRef.current.map((c) => [c.name, c.symbols]));
    for (const c of channels) {
      const syms = new Set(existing.get(c.name) ?? []);
      c.symbols.forEach((s) => syms.add(s));
      existing.set(c.name, [...syms]);
    }
    pendingSubscriptionsRef.current = Array.from(existing.entries()).map(([name, symbols]) => ({
      name,
      symbols,
    }));

    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "subscribe", payload: { channels } }));
    }
  }, []);

  const unsubscribe = useCallback((channels: Array<{ name: string; symbols?: string[] }>) => {
    const existing = new Map(
      pendingSubscriptionsRef.current.map((c) => [c.name, new Set(c.symbols)])
    );
    for (const c of channels) {
      if (!c.symbols) {
        existing.delete(c.name);
      } else {
        const set = existing.get(c.name);
        if (set) {
          c.symbols.forEach((s) => set.delete(s));
          if (set.size === 0) existing.delete(c.name);
          else existing.set(c.name, set);
        }
      }
    }
    pendingSubscriptionsRef.current = Array.from(existing.entries()).map(([name, set]) => ({
      name,
      symbols: [...set],
    }));

    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "unsubscribe", payload: { channels } }));
    }
  }, []);

  const addMessageHandler = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  const value: WebSocketContextValue = {
    status,
    subscribe,
    unsubscribe,
    addMessageHandler,
  };

  return (
    <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
}
