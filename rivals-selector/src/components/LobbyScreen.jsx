import { useState } from 'react';
import { sendWebSocketMessage } from '../services/socket';

function LobbyScreen({ onJoinLobby, players = [] }) {
  const [playerName, setPlayerName] = useState('');
  const [modeVote, setModeVote] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [teamCompVote, setTeamCompVote] = useState(null);

  const gameModes = [
    { id: 'normal', label: 'Normal Mode' },
    { id: 'full-random', label: 'Full Random (Random Teams & Heroes)' },
    { id: 'random-heroes', label: 'Random Heroes Only' },
    { id: 'random-teams', label: 'Random Team Comps Only' }
  ];

  const teamComps = [
    { id: '2-2-2', label: '2 Vanguards / 2 Duelists / 2 Strategists' },
    { id: '3-1-2', label: '3 Vanguards / 1 Duelist / 2 Strategists' },
    { id: '2-3-1', label: '2 Vanguards / 3 Duelists / 1 Strategist' }
  ];

  const handleStartGame = () => {
    sendWebSocketMessage({
      type: 'start_game',
      settings: {
        modeVote,
        teamCompVote: modeVote === 'random-teams' ? teamCompVote : '2-2-2'
      }
    });
  };

  const handleSubmit = () => {
    if (!playerName || !modeVote) return;
    onJoinLobby({
      playerName,
      modeVote,
      teamCompVote: modeVote === 'random-teams' ? teamCompVote : '2-2-2'
    });
    setIsReady(true);
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
              checked={modeVote === mode.id}
              onChange={() => setModeVote(mode.id)}
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

        {isReady && (
        <button onClick={handleStartGame}>
            Start Game
        </button>
        )}

      <button 
        onClick={handleSubmit}
        disabled={!playerName || !modeVote || isReady}
      >
        {isReady ? 'Waiting for others...' : 'Ready Up'}
      </button>

      <div className="players-list">
        <h3>Connected Players ({players.length})</h3>
        <ul>
          {players.map(player => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default LobbyScreen;