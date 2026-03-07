import { useCallback } from "react";
import { getSymbolName } from "../constants/symbols";
import { getFavorites, toggleFavorite } from "../lib/favorites";
import { useTicker } from "../hooks/useTicker";
import { useOrderbook } from "../hooks/useOrderbook";
import { useTrades } from "../hooks/useTrades";
import { ConnectionStatus } from "./ConnectionStatus";
import type { ProductDetailViewProps } from "../App";

function formatVolume(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

export function ProductDetailView({
  symbol,
  onBack,
  isFavorite,
  onToggleFavorite,
}: ProductDetailViewProps) {
  const { getTicker } = useTicker([symbol]);
  const ticker = getTicker(symbol);
  const orderbook = useOrderbook(symbol);
  const trades = useTrades(symbol);

  const handleStarClick = useCallback(() => {
    onToggleFavorite(symbol);
  }, [symbol, onToggleFavorite]);

  const change = ticker.changePercent;
  const isUp = change != null && change >= 0;
  const maxTotal = Math.max(
    ...orderbook.bids.map((b) => b.total),
    ...orderbook.asks.map((a) => a.total),
    1
  );

  return (
    <div className="detail-card">
      <header className="detail-header">
        <button type="button" className="detail-back" onClick={onBack} aria-label="Back to list">
          ← Back
        </button>
        <div className="detail-title-row">
          <h1 className="detail-symbol">{symbol}</h1>
          <span className="detail-desc">{getSymbolName(symbol)} Perpetual</span>
          <button
            type="button"
            className="detail-star"
            onClick={handleStarClick}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        </div>
        <div className="detail-price-row">
          <span className="detail-price">
            ${ticker.last_price || "—"}
          </span>
          {change != null && (
            <span className={`detail-change text-${isUp ? "up" : "down"}`}>
              {isUp ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          )}
        </div>
      </header>

      <section className="detail-ticker">
        <div className="detail-ticker__grid">
          <div className="detail-ticker__item">
            <span className="detail-ticker__label">MARK PRICE</span>
            <span className="detail-ticker__value">${ticker.mark_price || "—"}</span>
          </div>
          <div className="detail-ticker__item">
            <span className="detail-ticker__label">24H VOLUME</span>
            <span className="detail-ticker__value">
              {ticker.volume_24h ? formatVolume(ticker.volume_24h) : "—"}
            </span>
          </div>
          <div className="detail-ticker__item">
            <span className="detail-ticker__label">FUNDING RATE</span>
            <span className="detail-ticker__value">
              {ticker.funding_rate ? `${ticker.funding_rate}%` : "—"}
            </span>
          </div>
        </div>
      </section>

      <div className="detail-panels">
        <section className="orderbook-panel">
          <h3 className="panel-title">Orderbook</h3>
          <div className="orderbook-table-wrap">
            <table className="orderbook-table">
              <thead>
                <tr>
                  <th>PRICE</th>
                  <th>SIZE</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {orderbook.asks.slice().reverse().map((row, i) => (
                  <tr key={`ask-${i}`} className="orderbook-row orderbook-row--ask">
                    <td className="text-down">{row.price}</td>
                    <td>{row.size}</td>
                    <td>
                      <span
                        className="orderbook-depth orderbook-depth--ask"
                        style={{
                          width: `${(row.total / maxTotal) * 100}%`,
                        }}
                      />
                      {row.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orderbook.spread != null && (
              <div className="orderbook-spread">
                Spread: ${orderbook.spread}
                {orderbook.spreadPercent != null &&
                  ` (${orderbook.spreadPercent.toFixed(3)}%)`}
              </div>
            )}
            <table className="orderbook-table">
              <tbody>
                {orderbook.bids.map((row, i) => (
                  <tr key={`bid-${i}`} className="orderbook-row orderbook-row--bid">
                    <td className="text-up">{row.price}</td>
                    <td>{row.size}</td>
                    <td>
                      <span
                        className="orderbook-depth orderbook-depth--bid"
                        style={{
                          width: `${(row.total / maxTotal) * 100}%`,
                        }}
                      />
                      {row.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="trades-panel">
          <h3 className="panel-title">Recent Trades</h3>
          <div className="trades-list-wrap">
            <table className="trades-table">
              <thead>
                <tr>
                  <th>PRICE</th>
                  <th>SIZE</th>
                  <th>SIDE</th>
                  <th>TIME</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="trades-row">
                    <td className={t.side === "BUY" ? "text-up" : "text-down"}>
                      {t.price}
                    </td>
                    <td>{t.size}</td>
                    <td className={t.side === "BUY" ? "text-up" : "text-down"}>
                      {t.side}
                    </td>
                    <td>{t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer className="detail-footer">
        <ConnectionStatus />
      </footer>
    </div>
  );
}
