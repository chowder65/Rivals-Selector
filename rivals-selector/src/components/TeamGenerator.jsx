import { useEffect, useState } from 'react';

export default function TeamGenerator({ 
  mode = 'normal',
  teamComp = '2-2-2',
  heroes = [],
  players = [],
  selectedRoles = {},
  teamComposition = null,
  assignments = {}
}) {
  const [localAssignments, setLocalAssignments] = useState({});
  const [localTeamComposition, setLocalTeamComposition] = useState(null);

  const formatComposition = (comp) => {
    return `${comp.vanguards}V ${comp.duelists}D ${comp.strategists}S`;
  };

  // Function to ensure no duplicate heroes on the same team
  const ensureUniqueHeroes = (assignments) => {
    const team1Heroes = new Set();
    const team2Heroes = new Set();
    const updatedAssignments = { ...assignments };

    Object.entries(assignments).forEach(([playerId, assignment]) => {
      const { team, hero } = assignment;
      if (hero) {
        if (team === 'team1') {
          if (team1Heroes.has(hero.name)) {
            // Hero already assigned in team1, clear or reassign
            updatedAssignments[playerId] = { ...assignment, hero: null };
          } else {
            team1Heroes.add(hero.name);
          }
        } else if (team === 'team2') {
          if (team2Heroes.has(hero.name)) {
            // Hero already assigned in team2, clear or reassign
            updatedAssignments[playerId] = { ...assignment, hero: null };
          } else {
            team2Heroes.add(hero.name);
          }
        }
      }
    });

    return updatedAssignments;
  };

  useEffect(() => {
    console.log('TeamGenerator props:', { mode, teamComp, heroes, players, selectedRoles, teamComposition, assignments });
    
    if (teamComposition && Object.keys(assignments).length > 0) {
      console.log('Using server-provided team composition:', teamComposition);
      console.log('Using server-provided assignments:', assignments);
      setLocalTeamComposition(teamComposition);
      // Ensure unique heroes before setting assignments
      const uniqueAssignments = ensureUniqueHeroes(assignments);
      setLocalAssignments(uniqueAssignments);
    } else {
      console.warn('No server-provided team composition or assignments, falling back to defaults');
      setLocalTeamComposition({
        team1: { vanguards: 2, duelists: 2, strategists: 2 },
        team2: { vanguards: 2, duelists: 2, strategists: 2 }
      });
      setLocalAssignments({});
    }
  }, [teamComposition, assignments]);

  const team1Players = Object.entries(localAssignments)
    .filter(([_, a]) => a.team === 'team1')
    .map(([playerId, a]) => {
      const player = players.find(p => p.id === playerId);
      return player ? { player, hero: a.hero, role: a.role } : null;
    })
    .filter(Boolean);

  const team2Players = Object.entries(localAssignments)
    .filter(([_, a]) => a.team === 'team2')
    .map(([playerId, a]) => {
      const player = players.find(p => p.id === playerId);
      return player ? { player, hero: a.hero, role: a.role } : null;
    })
    .filter(Boolean);

  return (
    <div className="team-generator">
      <h2>Team Generator - {mode.replace('-', ' ')} Mode</h2>
      
      {localTeamComposition && (
        <div className="composition-display">
          <div className="composition-team">
            <h3>Team 1 Composition</h3>
            <p>{formatComposition(localTeamComposition.team1)}</p>
          </div>
          <div className="composition-team">
            <h3>Team 2 Composition</h3>
            <p>{formatComposition(localTeamComposition.team2)}</p>
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
                {['full-random', 'random-heroes', 'role-queue'].includes(mode) ? (
                  hero ? (
                    <span className="hero-info">
                      as <span className="hero-name">{hero.name}</span>
                      <span className="hero-role">({hero.role})</span>
                    </span>
                  ) : (
                    <span className="no-hero">No hero assigned (check server data)</span>
                  )
                ) : (
                  <span className="no-hero">No hero assigned</span>
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
                {['full-random', 'random-heroes', 'role-queue'].includes(mode) ? (
                  hero ? (
                    <span className="hero-info">
                      as <span className="hero-name">{hero.name}</span>
                      <span className="hero-role">({hero.role})</span>
                    </span>
                  ) : (
                    <span className="no-hero">No hero assigned (check server data)</span>
                  )
                ) : (
                  <span className="no-hero">No hero assigned</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}