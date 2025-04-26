const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

const wss = new WebSocket.Server({
  noServer: true, // Handle upgrades manually
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

// Handle HTTP -> WS upgrade
server.on('upgrade', (request, socket, head) => {
  // Add origin verification if needed
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

const lobbies = new Map();

// Connection tracking
const connections = new Map();

wss.on('connection', (ws, req) => {
  const connectionId = req.headers['sec-websocket-key'];
  console.log(`New connection: ${connectionId} from ${req.socket.remoteAddress}`);
  
  connections.set(connectionId, {
    ws,
    lastActivity: Date.now()
  });

  // Send immediate ack with connection ID
  ws.send(JSON.stringify({
    type: 'connection_ack',
    connectionId,
    timestamp: Date.now()
  }));

  // Message handler
  ws.on('message', (data) => {
    connections.get(connectionId).lastActivity = Date.now();
    try {
      const message = JSON.parse(data);
      console.log(`Message from ${connectionId}:`, message);
      
      // Your existing message handling...
    } catch (error) {
      console.error(`Message error from ${connectionId}:`, error);
    }
  });

  // Close handler
  ws.on('close', () => {
    console.log(`Connection ${connectionId} closed`);
    connections.delete(connectionId);
  });

  // Error handler
  ws.on('error', (error) => {
    console.error(`Connection ${connectionId} error:`, error);
  });
});

// Health check endpoint
server.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: connections.size,
    memoryUsage: process.memoryUsage()
  });
});

const PORT = 8080;
server.listen(PORT, '127.0.0.1', () => { // Explicit IPv4
  console.log(`Server running on ws://localhost:${PORT}`);
});