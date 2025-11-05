import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('🌐 クライアント接続！');

  ws.on('message', (message) => {
    console.log('💬 受信:', message.toString());

    // 全クライアントにブロードキャスト
    for (const client of clients) {
      if (client.readyState === ws.OPEN) {
        client.send(message.toString());
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('👋 クライアント切断');
  });
});
