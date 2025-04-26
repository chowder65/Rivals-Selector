import { useState, useEffect, useMemo } from 'react';
import { connectWebSocket, sendWebSocketMessage } from './services/socket';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function App() {
  const [lobbySettings, setLobbySettings] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Memoize players array to prevent unnecessary re-renders
  const stablePlayers = useMemo(() => players, [JSON.stringify(players)]);

  const handleReadyUp = (playerId) => {
    sendWebSocketMessage({
      type: 'player_ready',
      playerId,
      isReady: true
    });
  };

  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname === 'localhost' ? 'localhost:8080' : 'your-server-url:8080'}`;
    console.log('Attempting to connect to:', wsUrl);
    
    const cleanup = connectWebSocket(wsUrl, (message) => {
      switch (message.type) {
        case 'connection_ack':
          setConnectionStatus('connected');
          break;
        case 'player_joined':
          setPlayers(prev => [...prev, message.player]);
          break;
        case 'player_left':
          setPlayers(prev => prev.filter(p => p.id !== message.playerId));
          break;
        case 'game_start':
          setLobbySettings(message.settings);
          setCurrentScreen('game');
          break;
        case 'initial_state':
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
        default:
          console.warn('Unhandled message type:', message.type);
      }
    });

    return cleanup;
  }, []);

  const handleJoinLobby = (data) => {
    const player = {
      id: uuidv4(),
      name: data.playerName,
      settings: data,
      isReady: false
    };
    sendWebSocketMessage({
      type: 'join_lobby',
      player
    });
    setLobbySettings(data);
  };

  return (
    <div className="app">
      <div className={`connection-status ${connectionStatus}`}>
        Status: {connectionStatus}
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