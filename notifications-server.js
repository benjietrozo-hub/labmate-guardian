// Simple WebSocket + HTTP notification server
// Run with: node notifications-server.js

const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Track connected clients with basic metadata
const clients = new Set();

wss.on("connection", (ws) => {
  const client = { ws, userId: null, role: null };
  clients.add(client);

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "identify") {
        client.userId = data.userId || null;
        client.role = data.role || null;
      }
    } catch (err) {
      console.error("Invalid message from client", err);
    }
  });

  ws.on("close", () => {
    clients.delete(client);
  });
});

// HTTP endpoint for PHP to send notifications
app.post("/notify", (req, res) => {
  const { type, title, message, target } = req.body || {};

  if (!type || !title) {
    return res.status(400).json({ success: false, error: "Missing type or title" });
  }

  const payload = {
    type,
    title,
    message: message || "",
    timestamp: new Date().toISOString(),
  };

  // Broadcast based on target
  clients.forEach((client) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;

    if (target === "admin" && client.role !== "admin") return;
    // target === 'all' or undefined -> send to everyone

    client.ws.send(JSON.stringify({ type: "notification", payload }));
  });

  return res.json({ success: true });
});

const PORT = 8081;
server.listen(PORT, () => {
  console.log(`Notification server listening on http://localhost:${PORT} and ws://localhost:${PORT}`);
});
