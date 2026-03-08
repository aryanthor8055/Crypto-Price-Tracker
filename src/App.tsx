import { useCallback, useState } from "react";
import { WebSocketProvider } from "./context/WebSocketContext";
import { getFavorites, toggleFavorite } from "./lib/favorites";
import { ProductListView } from "./components/ProductListView";
import { ProductDetailView } from "./components/ProductDetailView";
import { ConnectionStatus } from "./components/ConnectionStatus";
import "./App.css";

export type ProductListViewProps = {
  onSelectProduct: (symbol: string) => void;
};

export type ProductDetailViewProps = {
  symbol: string;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
};

function AppContent() {
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [favorites, setFavoritesState] = useState(getFavorites);

  const handleSelectProduct = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setView("detail");
  }, []);

  const handleBack = useCallback(() => {
    setView("list");
    setSelectedSymbol(null);
  }, []);

  const handleToggleFavorite = useCallback((symbol: string) => {
    setFavoritesState(toggleFavorite(symbol));
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Crypto Price Tracker</h1>
        <div className="app-view-toggles">
          <button
            type="button"
            className={`app-view-btn ${view === "list" ? "app-view-btn--active" : ""}`}
            onClick={() => setView("list")}
          >
            Product List View
          </button>
          <button
            type="button"
            className={`app-view-btn ${view === "detail" ? "app-view-btn--active" : ""}`}
            onClick={() => view === "list" && selectedSymbol && setView("detail")}
            disabled={!selectedSymbol && view === "list"}
          >
            Product Detail View
          </button>
        </div>
      </header>

      <main className="app-main">
        {view === "list" && (
          <>
            <ProductListView onSelectProduct={handleSelectProduct} />
            <div className="app-footer-status">
              <ConnectionStatus />
            </div>
          </>
        )}
        {view === "detail" && selectedSymbol && (
          <ProductDetailView
            symbol={selectedSymbol}
            onBack={handleBack}
            isFavorite={favorites.has(selectedSymbol)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <WebSocketProvider>
      <AppContent />
    </WebSocketProvider>
  );
}
