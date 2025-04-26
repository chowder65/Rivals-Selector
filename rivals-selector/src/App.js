import { useState, useEffect } from 'react';
import { connectWebSocket, sendWebSocketMessage } from './services/socket';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';
import './App.css';

function App() {
  const [lobbySettings, setLobbySettings] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    const wsUrl = `ws://localhost:8080/ws`;
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
        default:
          console.warn('Unhandled message type:', message.type);
      }
    });

    return cleanup;
  }, []);

  const handleJoinLobby = (data) => {
    sendWebSocketMessage({
      type: 'join_lobby',
      player: {
        id: crypto.randomUUID(),
        name: data.playerName,
        settings: data
      }
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
          players={players}
        />
      ) : (
        <GameScreen 
          lobbySettings={lobbySettings} 
          players={players}
        />
      )}
    </div>
  );
}

export default App;