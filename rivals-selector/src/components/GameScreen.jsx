import { useState, useEffect, useMemo } from 'react';
import TeamGenerator from './TeamGenerator';
import { fetchAllHeroesWithImages } from '../services/marvelApi';

export default function GameScreen({ lobbySettings, players }) {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize players to prevent unnecessary re-renders
  const stablePlayers = useMemo(() => players, [JSON.stringify(players)]);

  useEffect(() => {
    const loadHeroes = async () => {
      try {
        const data = await fetchAllHeroesWithImages();
        setHeroes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadHeroes();
  }, []);

  if (loading) return <div>Loading heroes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="game-screen">
      <header>
        <h1>Marvel Team Game</h1>
        <p>Mode: {lobbySettings.modeVote}</p>
      </header>
      
      <TeamGenerator 
        mode={lobbySettings.modeVote}
        teamComp={lobbySettings.teamCompVote || '2-2-2'}
        heroes={heroes}
        players={stablePlayers}
        selectedRoles={Object.fromEntries(
          stablePlayers
            .filter(p => p.settings?.selectedRole)
            .map(p => [p.id, p.settings.selectedRole])
        )}
      />
    </div>
  );
}