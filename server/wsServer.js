const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      connections: connections.size,
      memoryUsage: process.memoryUsage()
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

const wss = new WebSocket.Server({
  noServer: true,
  clientTracking: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    }
  }
});

server.on('upgrade', (request, socket, head) => {
  const allowedOrigins = [
    'http://67.169.249.206:3000',
    'http://localhost:3000'
  ];
  
  const origin = request.headers.origin;
  if (allowedOrigins.includes(origin)) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

const lobbies = new Map();
const connections = new Map();

wss.on('connection', (ws, req) => {
  const connectionId = req.headers['sec-websocket-key'];
  
  connections.set(connectionId, {
    ws,
    lastActivity: Date.now(),
    playerId: null
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'join_lobby') {
        connections.get(connectionId).playerId = message.player.id;
        
        if (!lobbies.has('default')) {
          lobbies.set('default', {
            players: [],
            settings: null
          });
        }
        
        const lobby = lobbies.get('default');
        lobby.players.push(message.player);
        broadcastPlayerList(lobby);
      }
      else if (message.type === 'player_ready') {
        const lobby = lobbies.get('default');
        if (lobby) {
          const player = lobby.players.find(p => p.id === message.playerId);
          if (player) {
            player.isReady = message.isReady;
            broadcastPlayerList(lobby);
            
            if (lobby.players.every(p => p.isReady)) {
              wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'all_ready'
                  }));
                }
              });
            }
          }
        }
      }
      else if (message.type === 'start_game') {
        const lobby = lobbies.get('default');
        if (lobby) {
          lobby.settings = message.settings;
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'game_start',
                settings: lobby.settings,
                players: lobby.players
              }));
            }
          });
          lobbies.delete('default');
        }
      }
      
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  ws.on('close', () => {
    const connection = connections.get(connectionId);
    if (connection && connection.playerId) {
      const lobby = lobbies.get('default');
      if (lobby) {
        lobby.players = lobby.players.filter(p => p.id !== connection.playerId);
        broadcastPlayerList(lobby);
      }
    }
    connections.delete(connectionId);
  });

  ws.on('error', (error) => {
    console.error(`Connection error:`, error);
  });
});

function broadcastPlayerList(lobby) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'player_list_update',
        players: lobby.players
      }));
    }
  });
}

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on ws://localhost:${PORT}`);
});