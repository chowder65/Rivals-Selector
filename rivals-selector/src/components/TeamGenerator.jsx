import { useEffect, useState, useRef } from 'react';

export default function TeamGenerator({ 
  mode = 'normal',
  teamComp = '2-2-2',
  heroes = [],
  players = [],
  selectedRoles = {}
}) {
  const [assignments, setAssignments] = useState({});
  const [teamComposition, setTeamComposition] = useState(null);
  const prevDataRef = useRef({ players: [], heroes: [] });

  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const generateTeamComposition = () => {
    if (mode === 'full-random') {
      let team1Comp, team2Comp;
      
      do {
        const team1V = Math.floor(Math.random() * 4) + 1;
        const team1D = Math.floor(Math.random() * 4) + 1;
        const team1S = 6 - team1V - team1D;
        
        if (team1S >= 1 && team1S <= 4) {
          const team2V = Math.floor(Math.random() * 4) + 1;
          const team2D = Math.floor(Math.random() * 4) + 1;
          const team2S = 6 - team2V - team2D;
          
          if (team2S >= 1 && team2S <= 4) {
            if (team1V !== team2V || team1D !== team2D || team1S !== team2S) {
              team1Comp = { vanguards: team1V, duelists: team1D, strategists: team1S };
              team2Comp = { vanguards: team2V, duelists: team2D, strategists: team2S };
              break;
            }
          }
        }
      } while (true);

      return { team1: team1Comp, team2: team2Comp };
    } else if (mode === 'random-teams') {
      const [v, d, s] = teamComp.split('-').map(Number);
      return {
        team1: { vanguards: v, duelists: d, strategists: s },
        team2: { vanguards: v, duelists: d, strategists: s }
      };
    } else if (mode === 'role-queue') {
      const roleCounts = { vanguard: 0, duelist: 0, strategist: 0 };
      Object.values(selectedRoles).forEach(role => {
        if (role) roleCounts[role]++;
      });
      
      return {
        team1: {
          vanguards: Math.floor(roleCounts.vanguard / 2),
          duelists: Math.floor(roleCounts.duelist / 2),
          strategists: Math.floor(roleCounts.strategist / 2)
        },
        team2: {
          vanguards: roleCounts.vanguard - Math.floor(roleCounts.vanguard / 2),
          duelists: roleCounts.duelist - Math.floor(roleCounts.duelist / 2),
          strategists: roleCounts.strategist - Math.floor(roleCounts.strategist / 2)
        }
      };
    }
    return {
      team1: { vanguards: 2, duelists: 2, strategists: 2 },
      team2: { vanguards: 2, duelists: 2, strategists: 2 }
    };
  };

  const formatComposition = (comp) => {
    return `${comp.vanguards}V ${comp.duelists}D ${comp.strategists}S`;
  };

  useEffect(() => {
    const playersChanged = JSON.stringify(players) !== JSON.stringify(prevDataRef.current.players);
    const heroesChanged = JSON.stringify(heroes) !== JSON.stringify(prevDataRef.current.heroes);

    if (heroes.length > 0 && players.length > 0 && (playersChanged || heroesChanged)) {
      const comp = generateTeamComposition();
      setTeamComposition(comp);
      
      const newAssignments = {};
      let team1Count = 0;
      let team2Count = 0;
      const team1Max = Object.values(comp.team1).reduce((a, b) => a + b, 0);
      const team2Max = Object.values(comp.team2).reduce((a, b) => a + b, 0);

      // Filter out any undefined heroes and ensure they have roles
      const validHeroes = heroes.filter(hero => hero && hero.role);
      const shuffledHeroes = shuffleArray(validHeroes);

      const sortedPlayers = mode === 'role-queue'
        ? [...players].sort((a, b) => {
            const roleOrder = { vanguard: 1, duelist: 2, strategist: 3 };
            const roleA = selectedRoles[a.id] || '';
            const roleB = selectedRoles[b.id] || '';
            return roleOrder[roleA] - roleOrder[roleB];
          })
        : shuffleArray([...players]);

      sortedPlayers.forEach((player) => {
        if (!player) return;

        let hero;
        let team;
        
        if (team1Count < team1Max && (team2Count >= team2Max || Math.random() > 0.5)) {
          team = 'team1';
          team1Count++;
        } else {
          team = 'team2';
          team2Count++;
        }

        if (mode === 'role-queue' && selectedRoles[player.id]) {
          const playerRole = selectedRoles[player.id]?.toLowerCase();
          const roleHeroes = shuffledHeroes.filter(h => 
            h.role?.toLowerCase() === playerRole
          );
          hero = roleHeroes.length > 0 
            ? roleHeroes[Math.floor(Math.random() * roleHeroes.length)]
            : shuffledHeroes[0];
        } else {
          hero = shuffledHeroes.length > 0
            ? shuffledHeroes[Math.floor(Math.random() * shuffledHeroes.length)]
            : null;
        }

        newAssignments[player.id] = {
          hero,
          team,
          role: mode === 'role-queue' ? selectedRoles[player.id] : null
        };
      });

      setAssignments(newAssignments);
      prevDataRef.current = { players, heroes };
    }
  }, [players, heroes, mode, teamComp, selectedRoles]);

  const team1Players = Object.entries(assignments)
    .filter(([_, a]) => a.team === 'team1')
    .map(([playerId, a]) => {
      const player = players.find(p => p.id === playerId);
      return player ? { player, hero: a.hero, role: a.role } : null;
    })
    .filter(Boolean);

  const team2Players = Object.entries(assignments)
    .filter(([_, a]) => a.team === 'team2')
    .map(([playerId, a]) => {
      const player = players.find(p => p.id === playerId);
      return player ? { player, hero: a.hero, role: a.role } : null;
    })
    .filter(Boolean);

  return (
    <div className="team-generator">
      <h2>Team Generator - {mode.replace('-', ' ')} Mode</h2>
      
      {teamComposition && (
        <div className="composition-display">
          <div className="composition-team">
            <h3>Team 1 Composition</h3>
            <p>{formatComposition(teamComposition.team1)}</p>
          </div>
          <div className="composition-team">
            <h3>Team 2 Composition</h3>
            <p>{formatComposition(teamComposition.team2)}</p>
          </div>
        </div>
      )}

      <div className="teams-container">
        <div className="team team-1">
          <h3>Team 1 Players</h3>
          {team1Players.map(({player, hero, role}) => (
            <div key={player.id} className="player-card">
              <div className="player-info">
                <span className="player-name">{player.name}</span>
                {mode === 'role-queue' && role && (
                  <span className="selected-role">({role})</span>
                )}
                {hero && (
                  <span className="hero-info">
                    as <span className="hero-name">{hero.name}</span>
                    <span className="hero-role">{hero.role}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="team team-2">
          <h3>Team 2 Players</h3>
          {team2Players.map(({player, hero, role}) => (
            <div key={player.id} className="player-card">
              <div className="player-info">
                <span className="player-name">{player.name}</span>
                {mode === 'role-queue' && role && (
                  <span className="selected-role">({role})</span>
                )}
                {hero && (
                  <span className="hero-info">
                    as <span className="hero-name">{hero.name}</span>
                    <span className="hero-role">{hero.role}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}