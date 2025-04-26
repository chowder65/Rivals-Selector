let socket = null;
let reconnectAttempts = 0;
const MAX_RETRIES = 5;
const BASE_DELAY = 1000;
let isManualClose = false;
let connectionId = null;

const createSocket = (url, messageHandler) => {
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.close();
    }
  
    console.log(`Connecting to ${url} (attempt ${reconnectAttempts + 1}/${MAX_RETRIES})`);
    socket = new WebSocket(url);
  
    socket.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts = 0;
      isManualClose = false;
      // Send initial handshake
      socket.send(JSON.stringify({
        type: 'client_connect',
        device: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      }));
    };
  
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
        if (message.type === 'connection_ack') {
          connectionId = message.connectionId;
        }
        messageHandler(message);
      } catch (error) {
        console.error('Message parse error:', error);
      }
    };
  
    socket.onclose = (event) => {
      console.log(`Disconnected (code: ${event.code}, reason: ${event.reason})`);
      if (!isManualClose && event.code !== 1000 && reconnectAttempts < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        setTimeout(() => createSocket(url, messageHandler), delay);
      }
    };
  
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (error && error.code === 'ECONNREFUSED' && reconnectAttempts < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        setTimeout(() => createSocket(url, messageHandler), delay);
      }
    };
};

export const connectWebSocket = (url, messageHandler) => {
  reconnectAttempts = 0;
  isManualClose = false;
  createSocket(url, messageHandler);

  return () => {
    isManualClose = true;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.close(1000, 'Normal closure');
    }
  };
};

export const sendWebSocketMessage = (message) => {
  if (socket?.readyState === WebSocket.OPEN) {
    const fullMessage = {
      ...message,
      connectionId,
      timestamp: Date.now(),
      deviceType: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };
    console.log('Sending message:', fullMessage);
    socket.send(JSON.stringify(fullMessage));
  } else {
    console.warn('Cannot send - WebSocket not connected');
    // Queue message for when connection is restored
    if (message.type !== 'heartbeat') {
      setTimeout(() => sendWebSocketMessage(message), 1000);
    }
  }
};

export const getSocketStatus = () => {
  return socket?.readyState || WebSocket.CLOSED;
};