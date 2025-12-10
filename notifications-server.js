// Simple WebSocket + HTTP notification server
// Run with: node notifications-server.js

import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import WebSocket from "ws";
import { WebSocketServer } from "ws";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Track connected clients with basic metadata
const clients = new Set();

wss.on("connection", (ws) => {
  const client = { ws, userId: null, role: null };
  clients.add(client);
  console.log(`New WebSocket client connected. Total clients: ${clients.size}`);

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`Received message from client:`, data);
      if (data.type === "identify") {
        client.userId = data.userId || null;
        client.role = data.role || null;
        console.log(`Client identified: userId=${client.userId}, role=${client.role}`);
      }
    } catch (err) {
      console.error("Invalid message from client", err);
    }
  });

  ws.on("close", () => {
    console.log(`Client disconnected: userId=${client.userId}, role=${client.role}`);
    clients.delete(client);
    console.log(`Total clients after disconnect: ${clients.size}`);
  });
});

// HTTP endpoint for PHP to send notifications
app.post("/notify", (req, res) => {
  const { user_id, data } = req.body || {};

  if (!user_id || !data) {
    return res.status(400).json({ success: false, error: "Missing user_id or data" });
  }

  console.log(`Sending notification to user ${user_id}:`, data);
  console.log(`Current connected clients: ${clients.size}`);
  
  // Log all connected clients for debugging
  clients.forEach((client, index) => {
    console.log(`Client ${index}: userId=${client.userId}, role=${client.role}, readyState=${client.ws.readyState}`);
  });

  // Send to specific user
  let sent = false;
  clients.forEach((client) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;
    
    console.log(`Checking client - userId: ${client.userId}, role: ${client.role}`);
    console.log(`Notification type: ${data.type}`);
    
    // Send to specific user or all admins for admin notifications
    if ((data.type === 'admin_borrow_update' || data.type === 'new_borrow_request') && client.role === 'admin') {
      console.log(`Sending admin notification to client ${client.userId}`);
      // Ensure the payload has the expected structure for the frontend
      const notificationPayload = {
        ...data,
        new_status: 'pending', // New requests are always pending
        borrow_id: data.request_id, // Map request_id to borrow_id for frontend compatibility
        old_status: null // Explicitly set old_status for new requests
      };
      console.log(`Final notification payload:`, JSON.stringify(notificationPayload, null, 2));
      client.ws.send(JSON.stringify({ type: "notification", payload: notificationPayload }));
      sent = true;
    } else if (data.type === 'borrow_status_update' && client.userId === user_id) {
      console.log(`Sending user notification to client ${client.userId}`);
      client.ws.send(JSON.stringify({ type: "notification", payload: data }));
      sent = true;
    }
  });

  console.log(`Notification sent: ${sent}`);
  return res.json({ success: true, sent });
});

const PORT = 8081;
server.listen(PORT, () => {
  console.log(`Notification server listening on http://localhost:${PORT} and ws://localhost:${PORT}`);
});
