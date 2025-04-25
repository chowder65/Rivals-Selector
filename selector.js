const readline = require('readline');

const vanguards = [
  "Captain America", "Doctor Strange", "Groot", "Hulk", "Magneto", "The Thing", "Thor", "Venom", "Peni Parker"
];

const duelists = [
  "Hawkeye", "Hela", "Human Torch", "Iron Fist", "Iron Man", "Magik", "Mister Fantastic", "Moon Knight",
  "Psylocke", "Black Panther", "Scarlet Witch", "Spider-Man", "Squirrel Girl", "Star-Lord", "Storm",
  "Winter Soldier", "Wolverine", "Black Widow", "Namor", "Human Torch", "Punisher"
];

const strategists = [
  "Adam Warlock", "Cloak & Dagger", "Invisible Woman", "Jeff the Land Shark", "Luna Snow", "Mantis",
  "Rocket Raccoon", "Loki"
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let vanguardNumber = 2;
let damageNumber = 2;
let strategistsNumber = 2;
let peoplePlaying = [];

rl.question('Who is playing?', (person) => {
    peoplePlaying = person.split(" ");
    console.log("You Entered: " + person);
    console.log('The teams are:', peoplePlaying);
    let team1 = randomizeTeams();
    let team2 = randomizeTeams();
    console.log("Team 1: " + team1);
    console.log("Team 2: " + team2);

    rl.question('How Many Vanguards Do You Want Team 1?: ', (vanguardAnswer) => {
        vanguardNumber = parseInt(vanguardAnswer) || 0;
        console.log(`You entered: ${vanguardNumber}`);

        rl.question('How Many Duelists Do You Want Team 1?: ', (duelistAnswer) => {
            damageNumber = parseInt(duelistAnswer) || 0;
            console.log(`You entered: ${damageNumber}`);

            rl.question('How Many Strategists Do You Want Team 1?: ', (strategistAnswer) => {
                strategistsNumber = parseInt(strategistAnswer) || 0;
                console.log(`You entered: ${strategistsNumber}`);

                rl.question('How Many Vanguards Do You Want Team 2?: ', (vanguardAnswer) => {
                    vanguardNumber = parseInt(vanguardAnswer) || 2;
                    console.log(`You entered: ${vanguardNumber}`);
                
                    rl.question('How Many Duelists Do You Want Team 2?: ', (duelistAnswer) => {
                        damageNumber = parseInt(duelistAnswer) || 2;
                        console.log(`You entered: ${damageNumber}`);
                
                        rl.question('How Many Strategists Do You Want Team 2?: ', (strategistAnswer) => {
                            strategistsNumber = parseInt(strategistAnswer) || 2;
                            console.log(`You entered: ${strategistsNumber}`);
                
                            let team1Comp = randomizeTeamComp(team1);
                            let team2Comp = randomizeTeamComp(team2);
                            
                            console.log("\nTeam 1 Composition:");
                            for (let player in team1Comp) {
                                console.log(`${player} is playing ${team1Comp[player]}`);
                            }
                            
                            console.log("\nTeam 2 Composition:");
                            for (let player in team2Comp) {
                                console.log(`${player} is playing ${team2Comp[player]}`);
                            }
                            
                            rl.close();
                        });
                    });
                });
            });
        });
    });
});

function addHeroes(arry, amount, roleArry) {
    for (let i = 0; i < amount; ) {
        let randomNumber = Math.floor(Math.random() * roleArry.length);
        if (!arry.includes(roleArry[randomNumber])) {
            arry.push(roleArry[randomNumber]);
            i++;
        }
    }
}

function randomizeTeams() {
    let team = [];
    for (let i = 0; i < 6; ) {
        let randomNumber = Math.floor(Math.random() * peoplePlaying.length);
        if (!team.includes(peoplePlaying[randomNumber])) {
            team.push(peoplePlaying[randomNumber]);
            peoplePlaying.splice(randomNumber, 1);
            i++;
        }
    }
    return team;
}

function randomizeTeamComp(team) {
    let teamComp = [];
    
    addHeroes(teamComp, vanguardNumber, vanguards);
    addHeroes(teamComp, damageNumber, duelists);
    addHeroes(teamComp, strategistsNumber, strategists);
    
    let teamDict = {};
    for (let i = 0; i < team.length && i < teamComp.length; i++) {
        teamDict[team[i]] = teamComp[i];
    }
    
    return teamDict;
}


// add a function to have weights on the people playing
//should also add a file of people that play so it makes it easier

//every now and then everyone gets their mains

// should be selectable game states 
// examples: preferences, no preferences, fucked comps, other game settings too that im unsure about right now