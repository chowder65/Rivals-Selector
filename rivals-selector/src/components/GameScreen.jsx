import { useState, useEffect, useMemo, Component } from 'react';
import TeamGenerator from './TeamGenerator';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}

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

export default function GameScreen({ lobbySettings, players }) {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const stablePlayers = useMemo(() => players, [players]);

  useEffect(() => {
    const loadHeroes = async () => {
      try {
        // Convert HERO_ROLES to array of { name, role } objects
        const mockHeroes = [
          ...HERO_ROLES.vanguards.map(name => ({ name, role: 'vanguard' })),
          ...HERO_ROLES.duelists.map(name => ({ name, role: 'duelist' })),
          ...HERO_ROLES.strategists.map(name => ({ name, role: 'strategist' }))
        ];
        console.log('Using mock heroes:', mockHeroes);
        setHeroes(mockHeroes);
      } catch (err) {
        console.error('Hero load error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadHeroes();
  }, []);

  console.log('GameScreen props:', { lobbySettings, players });

  if (loading) return <div>Loading heroes...</div>;
  if (error) return <div>Error: {error}. Please try again later.</div>;

  return (
    <ErrorBoundary>
      <div className="game-screen">
        <header>
          <h1>Marvel Team Game</h1>
          <p>Mode: {lobbySettings?.modeVote || 'Unknown'}</p>
        </header>
        
        <TeamGenerator 
          mode={lobbySettings?.modeVote || 'normal'}
          teamComp={lobbySettings?.teamCompVote || '2-2-2'}
          heroes={heroes}
          players={stablePlayers}
          selectedRoles={Object.fromEntries(
            stablePlayers
              .filter(p => p.settings?.selectedRole)
              .map(p => [p.id, p.settings.selectedRole])
          )}
        />
      </div>
    </ErrorBoundary>
  );
}