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

export default function GameScreen({ lobbySettings, players, teamComposition, assignments }) {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const stablePlayers = useMemo(() => players, [players]);

  useEffect(() => {
    const loadHeroes = async () => {
      try {
        const mockHeroes = Object.values(assignments)
          .filter(a => a.hero)
          .map(a => a.hero);
        console.log('Using heroes from assignments:', mockHeroes);
        setHeroes(mockHeroes);
      } catch (err) {
        console.error('Hero load error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadHeroes();
  }, [assignments]);

  console.log('GameScreen props:', { lobbySettings, players, teamComposition, assignments });

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
          teamComposition={teamComposition}
          assignments={assignments}
        />
      </div>
    </ErrorBoundary>
  );
}