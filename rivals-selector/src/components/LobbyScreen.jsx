import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendWebSocketMessage } from '../services/socket';

function LobbyScreen({ onJoinLobby, players = [], onReadyUp }) {
  const [playerName, setPlayerName] = useState('');
  const [modeVote, setModeVote] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [teamCompVote, setTeamCompVote] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  const gameModes = [
    { id: 'normal', label: 'Normal Mode (2-2-2)' },
    { id: 'full-random', label: 'Full Random (Random Teams & Heroes)' },
    { id: 'random-heroes', label: 'Random Heroes Only (2-2-2)' },
    { id: 'random-teams', label: 'Random Team Comps Only' },
    { id: 'role-queue', label: 'Role Queue (Choose Your Role)' }
  ];

  const teamComps = [
    { id: '2-2-2', label: '2 Vanguards / 2 Duelists / 2 Strategists' },
    { id: '3-1-2', label: '3 Vanguards / 1 Duelist / 2 Strategists' },
    { id: '2-3-1', label: '2 Vanguards / 3 Duelists / 1 Strategist' }
  ];

  const roles = [
    { id: 'vanguard', label: 'Vanguard' },
    { id: 'duelist', label: 'Duelist' },
    { id: 'strategist', label: 'Strategist' }
  ];

  const handleStartGame = () => {
    console.log('Sending start_game message:', { modeVote, teamCompVote, selectedRole });
    sendWebSocketMessage({
      type: 'start_game',
      settings: {
        modeVote,
        teamCompVote: modeVote === 'random-teams' ? teamCompVote : '2-2-2',
        selectedRole: modeVote === 'role-queue' ? selectedRole : null
      }
    });
  };

  const handleSubmit = () => {
    if (!playerName || !modeVote) return;
    if (modeVote === 'role-queue' && !selectedRole) return;
    
    const playerId = uuidv4();
    onJoinLobby({
      playerName,
      modeVote,
      teamCompVote: modeVote === 'random-teams' ? teamCompVote : '2-2-2',
      selectedRole: modeVote === 'role-queue' ? selectedRole : null
    });
    setIsReady(true);
    onReadyUp(playerId);
  };

  return (
    <div className="lobby-container">
      <h1>Marvel Team Generator Lobby</h1>
      
      <div className="player-input">
        <label>Your Name:</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          disabled={isReady}
        />
      </div>

      <div className="mode-selection">
        <h2>Vote for Game Mode:</h2>
        {gameModes.map(mode => (
          <div key={mode.id} className="mode-option">
            <input
              type="radio"
              id={mode.id}
              name="gameMode"
              checked={modeVote === mode.id}
              onChange={() => {
                setModeVote(mode.id);
                setSelectedRole(null);
              }}
              disabled={isReady}
            />
            <label htmlFor={mode.id}>{mode.label}</label>
          </div>
        ))}
      </div>

      {modeVote === 'random-teams' && (
        <div className="team-comp-selection">
          <h2>Vote for Team Composition:</h2>
          {teamComps.map(comp => (
            <div key={comp.id} className="comp-option">
              <input
                type="radio"
                id={comp.id}
                name="teamComp"
                checked={teamCompVote === comp.id}
                onChange={() => setTeamCompVote(comp.id)}
                disabled={isReady}
              />
              <label htmlFor={comp.id}>{comp.label}</label>
            </div>
          ))}
        </div>
      )}

      {modeVote === 'role-queue' && (
        <div className="role-selection">
          <h2>Select Your Role:</h2>
          {roles.map(role => (
            <div key={role.id} className="role-option">
              <input
                type="radio"
                id={role.id}
                name="playerRole"
                checked={selectedRole === role.id}
                onChange={() => setSelectedRole(role.id)}
                disabled={isReady}
              />
              <label htmlFor={role.id}>{role.label}</label>
            </div>
          ))}
        </div>
      )}

      <div className="action-buttons">
        {!isReady ? (
          <button 
            onClick={handleSubmit}
            disabled={!playerName || !modeVote || (modeVote === 'role-queue' && !selectedRole)}
            className="ready-button"
          >
            Ready Up
          </button>
        ) : (
          <p className="ready-message">You're ready!</p>
        )}
        
        <button 
          onClick={handleStartGame}
          disabled={players.length < 1}
          className="start-game-button"
        >
          Start Game
        </button>
      </div>

      <div className="players-list">
        <h3>Connected Players ({players.length})</h3>
        <ul>
          {players.map(player => (
            <li 
              key={player.id} 
              data-ready={player.isReady}
              className="player-item"
            >
              <span className="player-name">{player.name}</span>
              {player.settings?.selectedRole && (
                <span className="player-role">({player.settings.selectedRole})</span>
              )}
              {player.isReady && (
                <span className="ready-indicator">✓ Ready</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default LobbyScreen;