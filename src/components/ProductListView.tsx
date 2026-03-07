import { useCallback, useMemo, useState } from "react";
import { SYMBOLS, getSymbolName } from "../constants/symbols";
import { getFavorites, toggleFavorite } from "../lib/favorites";
import { useTicker } from "../hooks/useTicker";
import type { ProductListViewProps } from "../App";

function formatVolume(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

export function ProductListView({ onSelectProduct }: ProductListViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [search, setSearch] = useState("");
  const [favorites, setFavoritesState] = useState<Set<string>>(getFavorites);

  const { getTicker } = useTicker([...SYMBOLS]);

  const toggleFav = useCallback((e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setFavoritesState(toggleFavorite(symbol));
  }, []);

  const symbolsToShow = useMemo(() => {
    let list = activeTab === "favorites" ? [...favorites] : [...SYMBOLS];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.toLowerCase().includes(q) || getSymbolName(s).toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, favorites, search]);

  return (
    <div className="markets-card">
      <h2 className="markets-card__title">Markets</h2>
      <div className="markets-card__tabs">
        <button
          type="button"
          className={`markets-card__tab ${activeTab === "all" ? "markets-card__tab--active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          type="button"
          className={`markets-card__tab ${activeTab === "favorites" ? "markets-card__tab--active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          ★ Favorites
        </button>
      </div>
      <input
        type="search"
        className="markets-card__search"
        placeholder="Search by name or symbol..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search products"
      />
      <div className="markets-table-wrap">
        <table className="markets-table">
          <thead>
            <tr>
              <th>SYMBOL</th>
              <th>LAST PRICE</th>
              <th>24H CHANGE</th>
              <th>VOLUME</th>
            </tr>
          </thead>
          <tbody>
            {symbolsToShow.length === 0 ? (
              <tr>
                <td colSpan={4} className="markets-table__empty">
                  {activeTab === "favorites"
                    ? "No favorites yet. Click the star on a product to add it."
                    : "No products match your search."}
                </td>
              </tr>
            ) : (
              symbolsToShow.map((symbol) => {
                const ticker = getTicker(symbol);
                const change = ticker.changePercent;
                const isUp = change != null && change >= 0;
                const isFav = favorites.has(symbol);
                return (
                  <tr
                    key={symbol}
                    className={`markets-table__row ${isFav ? "markets-table__row--favorite" : ""}`}
                    onClick={() => onSelectProduct(symbol)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectProduct(symbol);
                      }
                    }}
                  >
                    <td>
                      <button
                        type="button"
                        className="markets-table__star"
                        onClick={(e) => toggleFav(e, symbol)}
                        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                        title={isFav ? "Remove from favorites" : "Add to favorites"}
                      >
                        {isFav ? "★" : "☆"}
                      </button>
                      <span className="markets-table__symbol">{symbol}</span>{" "}
                      <span className="markets-table__name">{getSymbolName(symbol)}</span>
                    </td>
                    <td>
                      {ticker.last_price ? `$${ticker.last_price}` : "—"}
                    </td>
                    <td>
                      {change != null ? (
                        <span className={isUp ? "text-up" : "text-down"}>
                          {isUp ? "+" : ""}
                          {change.toFixed(2)}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{ticker.volume_24h ? formatVolume(ticker.volume_24h) : "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
