import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { logger } from "./logger";

let wss: WebSocketServer | null = null;

const clients = new Map<string, Set<WebSocket>>();

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = req.url || "";
    const match = url.match(/\/ws\?customerId=([^&]+)/);
    const customerId = match ? decodeURIComponent(match[1]).toUpperCase() : null;

    if (!customerId) {
      ws.close(1008, "Missing customerId");
      return;
    }

    if (!clients.has(customerId)) {
      clients.set(customerId, new Set());
    }
    clients.get(customerId)!.add(ws);
    logger.info({ customerId }, "WebSocket client connected");

    ws.send(JSON.stringify({ type: "connected", customerId }));

    ws.on("close", () => {
      const set = clients.get(customerId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) clients.delete(customerId);
      }
      logger.info({ customerId }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.error({ err, customerId }, "WebSocket error");
    });
  });

  logger.info("WebSocket server initialized");
}

export function broadcastMenuUpdate(customerId: string, payload: object): void {
  const set = clients.get(customerId.toUpperCase());
  if (!set || set.size === 0) return;
  const message = JSON.stringify({ type: "menu_update", ...payload });
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
  logger.info({ customerId, clients: set.size }, "Broadcasted menu update");
}
