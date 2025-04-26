import { useState, useEffect, useMemo, useCallback } from 'react';
import { connectWebSocket, sendWebSocketMessage, getSocketStatus } from './services/socket';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function App() {
  const [lobbySettings, setLobbySettings] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Memoize players to prevent unnecessary re-renders
  const stablePlayers = useMemo(() => players, [players]);

  const handleReadyUp = useCallback((playerId) => {
    sendWebSocketMessage({
      type: 'player_ready',
      playerId,
      isReady: true
    });
  }, []);

  const handleWebSocketMessage = useCallback((message) => {
    console.log('Processing message:', message);
    setLastUpdate(Date.now());
    
    switch (message.type) {
      case 'connection_ack':
        setConnectionStatus('connected');
        sendWebSocketMessage({ type: 'request_state' });
        break;
      case 'player_joined':
        setPlayers(prev => [...prev.filter(p => p.id !== message.player.id), message.player]);
        break;
      case 'player_left':
        setPlayers(prev => prev.filter(p => p.id !== message.playerId));
        break;
      case 'game_start':
        setLobbySettings(message.settings);
        setCurrentScreen('game');
        break;
      case 'initial_state':
      case 'state_update':
        setPlayers(message.players || []);
        if (message.settings) {
          setLobbySettings(message.settings);
        }
        break;
      case 'player_ready':
        setPlayers(prev => prev.map(player => 
          player.id === message.playerId 
            ? {...player, isReady: message.isReady} 
            : player
        ));
        break;
      case 'player_list_update':
        setPlayers(message.players);
        break;
      case 'heartbeat':
        sendWebSocketMessage({ type: 'heartbeat_response' });
        break;
      default:
        console.warn('Unhandled message type:', message.type);
    }
  }, []);

  useEffect(() => {
    console.log('Setting up WebSocket connection');
    const wsUrl = `ws://${window.location.hostname === 'localhost' ? 'localhost:8080/ws' : '67.169.249.206:8080/ws'}`;
    console.log('Attempting to connect to:', wsUrl);
    
    const cleanup = connectWebSocket(wsUrl, handleWebSocketMessage);

    return () => {
      console.log('Cleaning up WebSocket connection');
      cleanup();
    };
  }, [handleWebSocketMessage]);

  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastUpdate > 30000) {
        console.log('No recent updates, reconnecting...');
        setConnectionStatus('reconnecting');
        const wsUrl = `ws://${window.location.hostname === 'localhost' ? 'localhost:8080/ws' : '67.169.249.206:8080/ws'}`;
        const cleanup = connectWebSocket(wsUrl, handleWebSocketMessage);
        return () => cleanup();
      } else if (getSocketStatus() === WebSocket.OPEN) {
        sendWebSocketMessage({ type: 'heartbeat' });
      }
    }, 5000);

    return () => clearInterval(heartbeatInterval);
  }, [lastUpdate, handleWebSocketMessage]);

  const handleJoinLobby = useCallback((data) => {
    const player = {
      id: uuidv4(),
      name: data.playerName,
      settings: data,
      isReady: false,
      deviceType: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };
    sendWebSocketMessage({
      type: 'join_lobby',
      player
    });
    setLobbySettings(data);
  }, []);

  return (
    <div className="app">
      <div className={`connection-status ${connectionStatus}`}>
        Status: {connectionStatus}
        {connectionStatus === 'reconnecting' && <div className="reconnecting-spinner"></div>}
      </div>
      
      {currentScreen === 'lobby' ? (
        <LobbyScreen 
          onJoinLobby={handleJoinLobby} 
          players={stablePlayers}
          onReadyUp={handleReadyUp}
        />
      ) : (
        <GameScreen 
          lobbySettings={lobbySettings} 
          players={stablePlayers}
        />
      )}
    </div>
  );
}

export default App;