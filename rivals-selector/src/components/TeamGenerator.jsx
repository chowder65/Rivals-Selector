import { useEffect, useState } from 'react';

export default function TeamGenerator({ 
  mode = 'normal',
  teamComp = '2-2-2',
  heroes = [],
  players = []
}) {
  const [assignments, setAssignments] = useState({});

  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    if (heroes.length > 0 && players.length > 0) {
      const shuffledHeroes = mode.includes('random') 
        ? shuffleArray([...heroes]) 
        : [...heroes];
      
      const newAssignments = {};
      players.forEach((player, i) => {
        newAssignments[player.id] = {
          hero: shuffledHeroes[i % shuffledHeroes.length],
          team: i % 2 === 0 ? 'team1' : 'team2'
        };
      });
      setAssignments(newAssignments);
    }
  }, [heroes, players, mode]);

  const team1Players = Object.entries(assignments)
    .filter(([_, a]) => a.team === 'team1')
    .map(([playerId, a]) => ({
      player: players.find(p => p.id === playerId),
      hero: a.hero
    }));

  const team2Players = Object.entries(assignments)
    .filter(([_, a]) => a.team === 'team2')
    .map(([playerId, a]) => ({
      player: players.find(p => p.id === playerId),
      hero: a.hero
    }));

  return (
    <div className="team-generator">
      <h2>Team Generator - {mode} Mode</h2>
      <div className="teams-container">
        <div className="team">
          <h3>Team 1</h3>
          {team1Players.map(({player, hero}) => (
            <div key={player.id} className="team-hero">
              <span>{player.name} as {hero.name}</span>
              <small>{hero.role}</small>
            </div>
          ))}
        </div>
        <div className="team">
          <h3>Team 2</h3>
          {team2Players.map(({player, hero}) => (
            <div key={player.id} className="team-hero">
              <span>{player.name} as {hero.name}</span>
              <small>{hero.role}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}