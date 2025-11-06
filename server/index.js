import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 静的ファイルを配信（publicフォルダ）
app.use(express.static(path.join(__dirname, '../public')));

// プレイヤー管理
const players = new Map();

wss.on('connection', (ws) => {
  const id = Math.floor(Math.random() * 10000);
  players.set(id, ws);
  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'chat') {
      broadcast({ type: 'chat', id, message: data.message });
    }

    if (data.type === 'position') {
      broadcast({ type: 'position', id, x: data.x, y: data.y, z: data.z });
    }

    if (data.type === 'hit') {
      broadcast({ type: 'hit', attacker: id, target: data.target });
    }
  });

  ws.on('close', () => {
    players.delete(id);
    broadcast({ type: 'leave', id });
  });
});

// 全員に送信
function broadcast(data) {
  const json = JSON.stringify(data);
  for (const player of players.values()) {
    player.send(json);
  }
}

// ポート設定（Render用に環境変数PORTを使う）
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 サーバー起動中！ポート: ${PORT}`);
});
