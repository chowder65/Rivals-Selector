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
    };
  
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
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
    socket.send(JSON.stringify({
      ...message,
      connectionId,
      timestamp: Date.now()
    }));
  } else {
    console.warn('Cannot send - WebSocket not connected');
  }
};