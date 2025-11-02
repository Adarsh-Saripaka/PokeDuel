const advantages = {
    normal:["fighting"],
    fire:["grass","ice","bug","steel"],
    water:["fire","ground","rock"],
    grass:["water","ground","rock"],
    electric:["water","flying"],
    ground:["fire","electric","poison","rock","steel"],
    rock:["fire","ice","flying","bug"],
    steel:["ice","rock","fairy"],
    fighting:["normal","ice","rock","dark","steel"],
    poison:["grass","fairy"],
    flying:["grass","fighting","bug"],
    psychic:["fighting","poison"],
    dark:["psychic","ghost"],
    ghost:["psychic","ghost"],
    dragon:["dragon"],
    fairy:["fighting","dragon","dark"],
    bug:["grass","psychic","dark"],
    ice:["grass","ground","flying","dragon"]
};

let player1Types = [];
let player2Types = [];
let player1Ready = false;
let player2Ready = false;
let battlefieldSelected = false;

function changeBattlefield(type) {
    const arena = document.querySelector('.battle-arena');
    const buttons = document.querySelector('.battlefield');

    const images = {
        rock: "battlefields/Rockarena.jpg",
        forest: "battlefields/Forestarena.jpg",
        water: "battlefields/Waterarena.jpeg",
        grass: "battlefields/Grassarena.jpg"
    };

    arena.style.backgroundImage = `url('${images[type]}')`;
    buttons.style.display = "none";
    battlefieldSelected = true;

    document.getElementById("Question").textContent = type.charAt(0).toUpperCase() + type.slice(1) + " Battlefield Selected!";
            
    checkBattleReady();
}

async function fetchData(player) {
    if(!battlefieldSelected){
        alert("Please select a battlefield first!");
        return;
    }

     const pokeName = document.getElementById(`PokemonName${player}`).value.toLowerCase();
    if(!pokeName){
        alert("Please enter a Pokémon name!");
        return;
    }

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeName}`);
        if(!response.ok) throw new Error("Pokémon not found");
                
            const data = await response.json();
            const img = document.getElementById(`pokemon${player}`);
            let poke_img 
            if(player==1){
                poke_img = data.sprites.back_default;
            }
            else{
                poke_img = data.sprites.front_default;
            }
                
            img.src = poke_img;
            img.style.display = "block";
                
            if(player === 1){
                player1Types = data.types.map(t => t.type.name);
                player1Ready = true;
                document.getElementById("ready1").textContent = "Ready!";
                document.getElementById("ready1").classList.add("is-ready");
            }
            else {
                player2Types = data.types.map(t => t.type.name);
                player2Ready = true;
                document.getElementById("ready2").textContent = "Ready!";
                document.getElementById("ready2").classList.add("is-ready");
            }

        console.log(`Player ${player} types:`, (player === 1 ? player1Types : player2Types).join(", "));
        checkBattleReady();
    } 
    catch (e) {
        console.error(e);
        alert(`Error: Pokémon not found! Please check the spelling.`);
    }
}

function checkBattleReady(){
    if(player1Ready && player2Ready && battlefieldSelected){
    document.querySelector(".battle-button").style.display = "block";
    document.getElementById("Question").textContent = "Both Players Ready! Start the Battle!";
    }
}

function startBattle(){
    if(!player1Ready || !player2Ready){
    alert("Both players must select a Pokémon first!");
    return;
}

    winPrediction();
}

function winPrediction() {
    const resultDiv = document.getElementById("result");
    const battleBtn = document.querySelector(".battle-button");
                
    const p1Adv = player1Types.flatMap(t => advantages[t] || []);
    const p2Adv = player2Types.flatMap(t => advantages[t] || []);
                
    const p1Wins = player2Types.some(t => p1Adv.includes(t));
    const p2Wins = player1Types.some(t => p2Adv.includes(t));
                
    let result = "";
    if(p1Wins && !p2Wins){
    result = "🏆 Player 1 Wins! 🏆";
    } else if(p2Wins && !p1Wins){
    result = "🏆 Player 2 Wins! 🏆";
    } else if(p1Wins && p2Wins){
    result = "⚔️ It's a Draw! Both have advantages! ⚔️";
    } else {
    result = "⚔️ It's a Draw! No type advantages! ⚔️";
    }

    battleBtn.style.display = "none";
    resultDiv.textContent = result;
    resultDiv.style.display = "block";
    document.getElementById("Question").textContent = "Battle Complete!";
}

const bgAudio = new Audio('battlefields/pokemon-theme.mp3');
    bgAudio.loop = true;  
    bgAudio.autoplay = true;
    bgAudio.volume = 0.5;  
    bgAudio.play().catch(() => {
        const start = () => {
            bgAudio.play();
            document.removeEventListener('click', start);
        };
        document.addEventListener('click', start);
    });

window.fetchData = fetchData;