import { useWebSocket, type ConnectionStatus } from "../context/WebSocketContext";

const labels: Record<ConnectionStatus, string> = {
  connecting: "Connecting…",
  connected: "WebSocket connected",
  disconnected: "Disconnected — Reconnecting…",
  error: "Connection error — Reconnecting…",
};

export function ConnectionStatus() {
  const { status } = useWebSocket();

  return (
    <div className="connection-status" data-status={status}>
      <span className="connection-status__dot" aria-hidden />
      <span className="connection-status__label">{labels[status]}</span>
    </div>
  );
}
