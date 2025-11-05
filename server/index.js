import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });
const clients = new Map(); // ws → id

let nextId = 1;

wss.on('connection', (ws) => {
  const id = nextId++;
  clients.set(ws, id);
  console.log(`🌐 クライアント接続！ID: ${id}`);

  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', (message) => {
    const data = message.toString();
    try {
      const parsed = JSON.parse(data);

      if (parsed.type === 'chat') {
        broadcast({ type: 'chat', id, message: parsed.message });
      }

      if (parsed.type === 'position') {
        broadcast({ type: 'position', id, x: parsed.x, y: parsed.y, z: parsed.z }, ws);
      }

      if (parsed.type === 'hit') {
        broadcast({ type: 'hit', attacker: id, target: parsed.target });
      }

    } catch (err) {
      console.error('❌ JSON解析エラー:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    broadcast({ type: 'leave', id });
    console.log(`👋 クライアント切断 ID: ${id}`);
  });
});

function broadcast(data, exclude) {
  const json = JSON.stringify(data);
  for (const client of clients.keys()) {
    if (client.readyState === client.OPEN && client !== exclude) {
      client.send(json);
    }
  }
}
