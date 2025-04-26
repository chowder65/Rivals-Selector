const WebSocket = require('ws');
const http = require('http');
const url = require('url');

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
  const parsedUrl = url.parse(request.url);
  if (parsedUrl.pathname === '/ws') {
    const allowedOrigins = [
      'http://67.169.249.206:3000',
      'http://localhost:3000',
      'http://192.168.1.100:3000' // Add local network IP for mobile testing
    ];
    
    const origin = request.headers.origin;
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } else {
    socket.destroy();
  }
});

const lobbies = new Map();
const connections = new Map();

// Heartbeat check
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.isAlive === false) {
      const connectionId = Array.from(connections.entries())
        .find(([_, conn]) => conn.ws === client)?.[0];
      if (connectionId) {
        handleDisconnect(connectionId);
      }
      return client.terminate();
    }
    client.isAlive = false;
    client.ping();
  });
}, 30000);

function handleDisconnect(connectionId) {
  const connection = connections.get(connectionId);
  if (connection && connection.playerId) {
    const lobby = lobbies.get('default');
    if (lobby) {
      lobby.players = lobby.players.filter(p => p.id !== connection.playerId);
      broadcastPlayerList(lobby);
    }
  }
  connections.delete(connectionId);
}

wss.on('connection', (ws, req) => {
  const connectionId = req.headers['sec-websocket-key'];
  const ip = req.socket.remoteAddress;
  
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  connections.set(connectionId, {
    ws,
    ip,
    lastActivity: Date.now(),
    playerId: null,
    deviceType: null
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      connections.get(connectionId).lastActivity = Date.now();
      
      if (message.type === 'client_connect') {
        connections.get(connectionId).deviceType = message.device;
        ws.send(JSON.stringify({
          type: 'connection_ack',
          connectionId,
          timestamp: Date.now()
        }));
      }
      else if (message.type === 'join_lobby') {
        const player = message.player;
        connections.get(connectionId).playerId = player.id;
        
        if (!lobbies.has('default')) {
          lobbies.set('default', {
            players: [],
            settings: null
          });
        }
        
        const lobby = lobbies.get('default');
        // Remove if player already exists (reconnect case)
        lobby.players = lobby.players.filter(p => p.id !== player.id);
        lobby.players.push(player);
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
              broadcastToLobby({
                type: 'all_ready'
              });
            }
          }
        }
      }
      else if (message.type === 'start_game') {
        const lobby = lobbies.get('default');
        if (lobby) {
          lobby.settings = message.settings;
          broadcastToLobby({
            type: 'game_start',
            settings: lobby.settings,
            players: lobby.players
          });
          lobbies.delete('default');
        }
      }
      else if (message.type === 'request_state') {
        const lobby = lobbies.get('default');
        if (lobby) {
          ws.send(JSON.stringify({
            type: 'state_update',
            players: lobby.players,
            settings: lobby.settings
          }));
        }
      }
      else if (message.type === 'heartbeat') {
        ws.send(JSON.stringify({
          type: 'heartbeat_response'
        }));
      }
      
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  ws.on('close', () => {
    handleDisconnect(connectionId);
  });

  ws.on('error', (error) => {
    console.error(`Connection error:`, error);
    handleDisconnect(connectionId);
  });
});

function broadcastPlayerList(lobby) {
  broadcastToLobby({
    type: 'player_list_update',
    players: lobby.players
  });
}

function broadcastToLobby(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on ws://0.0.0.0:${PORT}/ws`);
});