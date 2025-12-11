import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  const client = { ws, userId: null, role: null };
  clients.add(client);
  console.log('New WebSocket client connected. Total clients:', clients.size);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      if (data.type === 'identify') {
        client.userId = data.userId || null;
        client.role = data.role || null;
        console.log(`Client identified: userId=${client.userId}, role=${client.role}`);
      }
    } catch (err) {
      console.error('Invalid message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(client);
    console.log('Total clients after disconnect:', clients.size);
  });
});

app.post('/notify', (req, res) => {
  const { user_id, data } = req.body || {};

  if (!user_id || !data) {
    return res.status(400).json({ success: false, error: 'Missing user_id or data' });
  }

  console.log('Sending notification:', data);
  
  let sent = false;
  clients.forEach((client) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;
    
    if (user_id === 'admin_broadcast' && client.role === 'admin') {
      // Send to all admins for admin broadcasts
      const notificationPayload = {
        ...data,
        new_status: 'pending',
        borrow_id: data.request_id,
        old_status: null
      };
      client.ws.send(JSON.stringify({ type: 'notification', payload: notificationPayload }));
      sent = true;
    } else if ((data.type === 'admin_borrow_update' || data.type === 'new_borrow_request') && client.role === 'admin') {
      const notificationPayload = {
        ...data,
        new_status: 'pending',
        borrow_id: data.request_id,
        old_status: null
      };
      client.ws.send(JSON.stringify({ type: 'notification', payload: notificationPayload }));
      sent = true;
    } else if ((data.type === 'borrow_status_update' || data.type === 'borrow_request_submitted') && client.userId === user_id) {
      client.ws.send(JSON.stringify({ type: 'notification', payload: data }));
      sent = true;
    }
  });

  console.log('Notification sent:', sent);
  return res.json({ success: true, sent });
});

const PORT = 8081;
server.listen(PORT, () => {
  console.log(`Notification server running on http://localhost:${PORT}`);
});
