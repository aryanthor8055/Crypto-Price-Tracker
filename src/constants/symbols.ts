// Symbols supported by the mock server (must match server config)

export const SYMBOLS = [
  "BTCUSD",
  "ETHUSD",
  "XRPUSD",
  "SOLUSD",
  "PAXGUSD",
  "DOGEUSD",
] as const;

export type Symbol = (typeof SYMBOLS)[number];

export const SYMBOL_NAMES: Record<string, string> = {
  BTCUSD: "Bitcoin",
  ETHUSD: "Ethereum",
  XRPUSD: "XRP",
  SOLUSD: "Solana",
  PAXGUSD: "PAX Gold",
  DOGEUSD: "Dogecoin",
};

export function getSymbolName(symbol: string): string {
  return SYMBOL_NAMES[symbol] ?? symbol;
}
