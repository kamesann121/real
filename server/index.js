import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });
const clients = new Map(); // ws → { id, hp }

let nextId = 1;

wss.on('connection', (ws) => {
  const id = nextId++;
  clients.set(ws, { id, hp: 200 });
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
        const targetId = parsed.target;
        const targetWs = [...clients.entries()].find(([_, info]) => info.id === targetId)?.[0];

        if (targetWs && clients.has(targetWs)) {
          clients.get(targetWs).hp -= 50;

          broadcast({ type: 'hit', attacker: clients.get(ws).id, target: targetId });

          if (clients.get(targetWs).hp <= 0) {
            targetWs.send(JSON.stringify({ type: 'leave', id: targetId }));
            broadcast({ type: 'leave', id: targetId }, targetWs);
            clients.delete(targetWs);
            targetWs.close();
            console.log(`💀 プレイヤー退場 ID: ${targetId}`);
          }
        }
      }

    } catch (err) {
      console.error('❌ JSON解析エラー:', err);
    }
  });

  ws.on('close', () => {
    const info = clients.get(ws);
    if (info) {
      broadcast({ type: 'leave', id: info.id });
      clients.delete(ws);
      console.log(`👋 クライアント切断 ID: ${info.id}`);
    }
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
