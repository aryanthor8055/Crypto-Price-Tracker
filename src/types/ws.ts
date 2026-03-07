// WebSocket message types matching the mock server (socket-custom-load)

export type TickerMessage = {
  type: "v2/ticker";
  symbol: string;
  last_price: string;
  mark_price: string;
  volume_24h: number;
  turnover_24h: number;
  open_interest: number;
  funding_rate: string;
  timestamp: number;
};

export type OrderbookLevel = [price: string, size: string];

export type OrderbookMessage = {
  type: "l2_orderbook";
  symbol: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  timestamp: number;
};

export type TradeMessage = {
  type: "all_trades";
  symbol: string;
  price: string;
  size: number;
  buyer_role: string;
  seller_role: string;
  product_id: number;
  timestamp: number;
};

export type WsMessage = TickerMessage | OrderbookMessage | TradeMessage;

export type SubscribePayload = {
  channels: Array<{ name: string; symbols: string[] }>;
};

export type SubscriptionsAck = {
  type: "subscriptions";
  payload: { channels: Array<{ name: string; symbols: string[] }> };
};
