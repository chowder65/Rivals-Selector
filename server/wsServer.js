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
      'http://192.168.1.100:3000'
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

const HERO_ROLES = {
  vanguards: [
    "Captain America", "Doctor Strange", "Groot", "Hulk", "Magneto", 
    "The Thing", "Thor", "Venom", "Peni Parker"
  ],
  duelists: [
    "Hawkeye", "Hela", "Human Torch", "Iron Fist", "Iron Man", "Magik", 
    "Mister Fantastic", "Moon Knight", "Psylocke", "Black Panther", 
    "Scarlet Witch", "Spider-Man", "Squirrel Girl", "Star-Lord", "Storm",
    "Winter Soldier", "Wolverine", "Black Widow", "Namor", "Punisher"
  ],
  strategists: [
    "Adam Warlock", "Cloak & Dagger", "Invisible Woman", "Jeff the Land Shark", 
    "Luna Snow", "Mantis", "Rocket Raccoon", "Loki"
  ]
};

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateTeamComposition(mode, teamComp, players) {
  if (mode === 'full-random') {
    let team1Comp, team2Comp;
    do {
      const team1V = Math.floor(Math.random() * 4) + 1;
      const team1D = Math.floor(Math.random() * 4) + 1;
      const team1S = 6 - team1V - team1D;
      if (team1S >= 1 && team1S <= 4) {
        const team2V = Math.floor(Math.random() * 4) + 1;
        const team2D = Math.floor(Math.random() * 4) + 1;
        const team2S = 6 - team2V - team2D;
        if (team2S >= 1 && team2S <= 4) {
          if (team1V !== team2V || team1D !== team2D || team1S !== team2S) {
            team1Comp = { vanguards: team1V, duelists: team1D, strategists: team1S };
            team2Comp = { vanguards: team2V, duelists: team2D, strategists: team2S };
            break;
          }
        }
      }
    } while (true);
    return { team1: team1Comp, team2: team2Comp };
  } else if (mode === 'random-teams') {
    const [v, d, s] = teamComp.split('-').map(Number);
    return {
      team1: { vanguards: v, duelists: d, strategists: s },
      team2: { vanguards: v, duelists: d, strategists: s }
    };
  } else if (mode === 'role-queue') {
    const roleCounts = { vanguard: 0, duelist: 0, strategist: 0 };
    players.forEach(player => {
      const role = player.settings?.selectedRole?.toLowerCase();
      if (role) roleCounts[role]++;
    });
    return {
      team1: {
        vanguards: Math.floor(roleCounts.vanguard / 2),
        duelists: Math.floor(roleCounts.duelist / 2),
        strategists: Math.floor(roleCounts.strategist / 2)
      },
      team2: {
        vanguards: roleCounts.vanguard - Math.floor(roleCounts.vanguard / 2),
        duelists: roleCounts.duelist - Math.floor(roleCounts.duelist / 2),
        strategists: roleCounts.strategist - Math.floor(roleCounts.strategist / 2)
      }
    };
  } else {
    return {
      team1: { vanguards: 2, duelists: 2, strategists: 2 },
      team2: { vanguards: 2, duelists: 2, strategists: 2 }
    };
  }
}

function generateAssignments(mode, players, teamComposition) {
  const heroes = [
    ...HERO_ROLES.vanguards.map(name => ({ name, role: 'vanguard' })),
    ...HERO_ROLES.duelists.map(name => ({ name, role: 'duelist' })), // Deduplicate Human Torch
    ...HERO_ROLES.strategists.map(name => ({ name, role: 'strategist' }))
  ];
  const validHeroes = heroes.filter(hero => hero && hero.role && ['vanguard', 'duelist', 'strategist'].includes(hero.role.toLowerCase()));
  const shuffledHeroes = shuffleArray(validHeroes);
  const shuffledPlayers = shuffleArray([...players]);

  const assignments = {};
  let team1Count = 0;
  let team2Count = 0;
  const team1Max = Object.values(teamComposition.team1).reduce((a, b) => a + b, 0);
  const team2Max = Object.values(teamComposition.team2).reduce((a, b) => a + b, 0);

  shuffledPlayers.forEach(player => {
    if (!player) return;

    let hero = null;
    let team;

    if (team1Count < team1Max && (team2Count >= team2Max || Math.random() > 0.5)) {
      team = 'team1';
      team1Count++;
    } else {
      team = 'team2';
      team2Count++;
    }

    if (['full-random', 'random-heroes', 'role-queue'].includes(mode)) {
      if (mode === 'role-queue' && player.settings?.selectedRole) {
        const playerRole = player.settings.selectedRole.toLowerCase();
        const roleHeroes = shuffledHeroes.filter(h => h.role?.toLowerCase() === playerRole);
        hero = roleHeroes.length > 0
          ? roleHeroes[Math.floor(Math.random() * roleHeroes.length)]
          : { name: 'Default Hero', role: playerRole };
      } else {
        hero = shuffledHeroes.length > 0
          ? shuffledHeroes[Math.floor(Math.random() * shuffledHeroes.length)]
          : { name: 'Default Hero', role: 'strategist' };
      }
    }

    assignments[player.id] = {
      hero,
      team,
      role: mode === 'role-queue' ? player.settings?.selectedRole : null
    };
  });

  return assignments;
}

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
      broadcastToLobby({ type: 'player_left', playerId: connection.playerId });
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
        lobby.players = lobby.players.filter(p => p.id !== player.id);
        lobby.players.push(player);
        console.log('Player joined:', player);
        broadcastPlayerList(lobby);
      }
      else if (message.type === 'player_ready') {
        const lobby = lobbies.get('default');
        if (lobby) {
          const player = lobby.players.find(p => p.id === message.playerId);
          if (player) {
            player.isReady = message.isReady;
            console.log('Player ready status:', player);
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
        console.log('Received start_game:', message);
        const lobby = lobbies.get('default');
        if (lobby) {
          lobby.settings = message.settings;
          const teamComposition = generateTeamComposition(
            lobby.settings.modeVote,
            lobby.settings.teamCompVote || '2-2-2',
            lobby.players
          );
          const assignments = generateAssignments(lobby.settings.modeVote, lobby.players, teamComposition);
          console.log('Broadcasting game_start:', { settings: lobby.settings, players: lobby.players, teamComposition, assignments });
          broadcastToLobby({
            type: 'game_start',
            settings: lobby.settings,
            players: lobby.players,
            teamComposition,
            assignments
          });
          lobbies.delete('default');
        } else {
          console.warn('No default lobby found for start_game');
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
    console.log('Connection closed:', connectionId);
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