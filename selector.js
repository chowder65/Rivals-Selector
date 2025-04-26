const readline = require('readline');

// Hero data
const HERO_ROLES = {
  vanguards: [
    "Captain America", "Doctor Strange", "Groot", "Hulk", "Magneto", 
    "The Thing", "Thor", "Venom", "Peni Parker"
  ],
  duelists: [
    "Hawkeye", "Hela", "Human Torch", "Iron Fist", "Iron Man", "Magik", 
    "Mister Fantastic", "Moon Knight", "Psylocke", "Black Panther", 
    "Scarlet Witch", "Spider-Man", "Squirrel Girl", "Star-Lord", "Storm",
    "Winter Soldier", "Wolverine", "Black Widow", "Namor", "Human Torch", 
    "Punisher"
  ],
  strategists: [
    "Adam Warlock", "Cloak & Dagger", "Invisible Woman", "Jeff the Land Shark", 
    "Luna Snow", "Mantis", "Rocket Raccoon", "Loki"
  ]
};

// Game state
const gameState = {
  players: [],
  team1: [],
  team2: [],
  team1Composition: {
    vanguards: 2,
    duelists: 2,
    strategists: 2
  },
  team2Composition: {
    vanguards: 2,
    duelists: 2,
    strategists: 2
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function main() {
  promptForPlayers();
}

function promptForPlayers() {
  rl.question('Who is playing? (Enter names separated by spaces): ', (answer) => {
    gameState.players = answer.split(" ");
    console.log(`\nPlayers entered: ${gameState.players.join(", ")}`);
    
    splitIntoTeams();
    promptForTeamComposition();
  });
}

function splitIntoTeams() {
  gameState.team1 = selectRandomPlayers(6);
  gameState.team2 = gameState.players.filter(player => !gameState.team1.includes(player));
  
  console.log('\nTeams generated:');
  console.log('Team 1:', gameState.team1.join(", "));
  console.log('Team 2:', gameState.team2.join(", "));
}

function selectRandomPlayers(count) {
  const shuffled = [...gameState.players].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function promptForTeamComposition() {
  askTeamComposition('Team 1', (team1Comp) => {
    gameState.team1Composition = team1Comp;
    askTeamComposition('Team 2', (team2Comp) => {
      gameState.team2Composition = team2Comp;
      generateFinalTeams();
      rl.close();
    });
  });
}

function askTeamComposition(teamName, callback) {
  const composition = { vanguards: 0, duelists: 0, strategists: 0 };
  
  rl.question(`\nHow many Vanguards for ${teamName}? (Default: 2): `, (answer) => {
    composition.vanguards = parseInt(answer) || 2;
    
    rl.question(`How many Duelists for ${teamName}? (Default: 2): `, (answer) => {
      composition.duelists = parseInt(answer) || 2;
      
      rl.question(`How many Strategists for ${teamName}? (Default: 2): `, (answer) => {
        composition.strategists = parseInt(answer) || 2;
        callback(composition);
      });
    });
  });
}

function generateFinalTeams() {
  gameState.team1Heroes = generateTeamComposition(gameState.team1, gameState.team1Composition);
  gameState.team2Heroes = generateTeamComposition(gameState.team2, gameState.team2Composition);
  
  displayTeamResults('Team 1', gameState.team1Heroes);
  displayTeamResults('Team 2', gameState.team2Heroes);
}

function generateTeamComposition(players, composition) {
  const heroes = {
    vanguards: selectRandomHeroes(composition.vanguards, HERO_ROLES.vanguards),
    duelists: selectRandomHeroes(composition.duelists, HERO_ROLES.duelists),
    strategists: selectRandomHeroes(composition.strategists, HERO_ROLES.strategists)
  };
  
  const allHeroes = [
    ...heroes.vanguards,
    ...heroes.duelists,
    ...heroes.strategists
  ];
  
  const teamComp = {};
  for (let i = 0; i < players.length && i < allHeroes.length; i++) {
    teamComp[players[i]] = allHeroes[i];
  }
  
  return teamComp;
}

function selectRandomHeroes(count, heroPool) {
  const selected = [];
  const pool = [...heroPool];
  
  while (selected.length < count && pool.length > 0) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    selected.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }
  
  return selected;
}

function displayTeamResults(teamName, teamComposition) {
  console.log(`\n${teamName} Composition:`);
  for (const [player, hero] of Object.entries(teamComposition)) {
    console.log(`${player} is playing ${hero}`);
  }
}

main();