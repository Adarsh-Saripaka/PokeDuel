const popularPokemon = [
    "pikachu", "charizard", "bulbasaur", "squirtle", "mewtwo", "lucario", "greninja", "gengar", "eevee", "snorlax",
    "dragonite", "gyarados", "arcanine", "blastoise", "venusaur", "gardevoir", "rayquaza", "garchomp", "mudkip", "umbreon"
];

const advantages = {
    normal: { fighting: 2, ghost: 0 },
    fire: { grass: 2, ice: 2, bug: 2, steel: 2, water: 0.5, fire: 0.5, rock: 0.5, dragon: 0.5 },
    water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
    grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
    electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
    ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
    fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
    poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
    ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
    flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
    bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
    ghost: { psychic: 2, ghost: 2, normal: 0, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
    steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
    fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 }
};

class Pokemon {
    constructor(data) {
        this.name = data.name;
        this.id = data.id;
        this.hp = data.stats[0].base_stat * 2;
        this.maxHp = this.hp;
        this.attack = data.stats[1].base_stat;
        this.defense = data.stats[2].base_stat;
        this.speed = data.stats[5].base_stat;
        this.types = data.types.map(t => t.type.name);
        this.sprites = {
            front: data.sprites.front_default,
            back: data.sprites.back_default,
            official: data.sprites.other["official-artwork"].front_default
        };
        this.moves = [];
    }

    async loadMoves(moveUrls) {
        const movesToFetch = moveUrls.slice(0, 10);
        const moves = await Promise.all(movesToFetch.map(async (m) => {
            const res = await fetch(m.move.url);
            return res.json();
        }));
        
        this.moves = moves
            .filter(m => m.power)
            .slice(0, 4)
            .map(m => ({
                name: m.name.replace("-", " "),
                power: m.power || 40,
                type: m.type.name,
                accuracy: m.accuracy || 100
            }));
        
        if (this.moves.length === 0) {
            this.moves.push({ name: "Tackle", power: 40, type: "normal", accuracy: 100 });
        }
    }
}

const ui = {
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    updatePreview(playerNum, pokemon, isMystery = false) {
        const preview = document.getElementById(`p${playerNum}-preview`);
        if (isMystery) {
            preview.innerHTML = `<div class="mystery-box">?</div>`;
        } else {
            preview.innerHTML = pokemon 
                ? `<img src="${pokemon.sprites.official}" alt="${pokemon.name}">`
                : `<p class="text-muted">Wait for search...</p>`;
        }
        
        const status = document.getElementById(`p${playerNum}-ready-status`);
        status.textContent = pokemon || isMystery ? "READY!" : "Not Ready";
        status.style.color = (pokemon || isMystery) ? "var(--success-color)" : "var(--text-muted)";
    },

    handleSearch(event, playerNum) {
        const query = event.target.value.toLowerCase();
        const autocomplete = document.getElementById(`p${playerNum}-autocomplete`);
        autocomplete.innerHTML = "";
        
        if (query.length < 2) return;

        const matches = popularPokemon.filter(p => p.startsWith(query));
        matches.forEach(p => {
            const div = document.createElement("div");
            div.className = "autocomplete-item";
            div.textContent = p;
            div.onclick = () => {
                event.target.value = p;
                autocomplete.innerHTML = "";
                game.fetchPokemon(p, playerNum);
            };
            autocomplete.appendChild(div);
        });

        if (event.key === "Enter") {
            game.fetchPokemon(query, playerNum);
            autocomplete.innerHTML = "";
        }
    },

    log(message, type = "info") {
        const logBox = document.getElementById('battle-log');
        const p = document.createElement("p");
        p.textContent = `> ${message}`;
        if (type === "damage") p.style.color = "var(--danger-color)";
        if (type === "system") {
            p.style.background = "linear-gradient(to bottom, var(--primary-color), #b3a125)";
            p.style.backgroundClip = "text";
            p.style.webkitBackgroundClip = "text";
            p.style.webkitTextFillColor = "transparent";
        }
        logBox.appendChild(p);
        logBox.scrollTop = logBox.scrollHeight;
    },

    updateHp(playerNum, pokemon) {
        const fill = document.getElementById(`p${playerNum}-hp-fill`);
        const text = document.getElementById(`p${playerNum}-hp-text`);
        const percent = Math.max(0, (pokemon.hp / pokemon.maxHp) * 100);
        
        fill.style.width = `${percent}%`;
        text.textContent = `${Math.ceil(pokemon.hp)} / ${pokemon.maxHp}`;
        
        if (percent < 20) fill.style.background = "var(--danger-color)";
        else if (percent < 50) fill.style.background = "#fbbf24";
        else fill.style.background = "var(--success-color)";
    },

    animateAction(playerNum, action) {
        const sprite = document.getElementById(`p${playerNum}-sprite`);
        const opponentNum = playerNum === 1 ? 2 : 1;
        const opponentSprite = document.getElementById(`p${opponentNum}-sprite`);

        if (action === "attack") {
            sprite.classList.add("shake");
            setTimeout(() => sprite.classList.remove("shake"), 500);
        } else if (action === "hit") {
            sprite.classList.add("flash");
            setTimeout(() => sprite.classList.remove("flash"), 600);
        }
    }
};

const game = {
    mode: 'pvp',
    p1: null,
    p2: null,
    currentTurn: 1,
    battleground: 'stadium',

    startSelection(mode) {
        this.mode = mode;
        ui.showScreen('selection-screen');
        this.p1 = null;
        this.p2 = null;
        document.getElementById('start-battle-btn').style.display = 'none';
        if (mode === 'pve') {
            document.getElementById('p2-label').textContent = "CPU";
            document.getElementById('p2-search-container').style.display = 'none';
            ui.updatePreview(2, null, true);
        } else {
            document.getElementById('p2-label').textContent = "Player 2";
            document.getElementById('p2-search-container').style.display = 'block';
            ui.updatePreview(2, null);
        }
        ui.updatePreview(1, null);
    },

    async fetchPokemon(name, playerNum) {
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            if (!res.ok) throw new Error("Not found");
            const data = await res.json();
            const p = new Pokemon(data);
            await p.loadMoves(data.moves);
            
            if (playerNum === 1) this.p1 = p;
            else this.p2 = p;
            
            ui.updatePreview(playerNum, p);
            
            if (this.p1 && (this.p2 || this.mode === 'pve')) {
                document.getElementById('start-battle-btn').style.display = 'block';
            }
        } catch (e) {
            console.error(e);
            alert("Pokemon not found!");
        }
    },

    selectBattleground(bg) {
        this.battleground = bg;
        ui.log(`Battleground set to ${bg}`, "system");
        const bgs = {
            forest: "battlefields/Forestarena.jpg",
            rock: "battlefields/Rockarena.jpg",
            water: "battlefields/Waterarena.jpeg",
            stadium: "battlefields/Grassarena.jpg"
        };
        document.getElementById('arena-main').style.backgroundImage = `url('${bgs[bg]}')`;
    },

    async initBattle() {
        if (this.p1 === null) {
            alert("Please select your Pokémon first!");
            return;
        }

        if (this.mode === 'pve') {
            const randomId = Math.floor(Math.random() * 1008) + 1;
            await this.fetchPokemon(randomId, 2);
        }

        ui.showScreen('battle-screen');
        
        document.getElementById('p1-sprite').src = this.p1.sprites.back;
        document.getElementById('p2-sprite').src = this.p2.sprites.front;
        
        document.getElementById('p1-battle-name').textContent = this.p1.name;
        document.getElementById('p2-battle-name').textContent = this.p2.name;
        
        ui.updateHp(1, this.p1);
        ui.updateHp(2, this.p2);
        
        ui.log(`A wild ${this.p2.name.toUpperCase()} appeared!`, "system");
        ui.log(`Go! ${this.p1.name.toUpperCase()}!`, "system");
        
        this.startTurn();
    },

    startTurn() {
        if (this.currentTurn === 1) {
            this.showMoveMenu(this.p1);
        } else {
            if (this.mode === 'pve') {
                setTimeout(() => this.cpuBrain(), 1000);
            } else {
                this.showMoveMenu(this.p2);
            }
        }
    },

    showMoveMenu(pokemon) {
        const container = document.getElementById('move-container');
        container.innerHTML = "";
        pokemon.moves.forEach(m => {
            const btn = document.createElement("button");
            btn.className = "move-btn";
            btn.innerHTML = `${m.name}<br><small style="font-size:0.7rem; opacity:0.7">${m.type.toUpperCase()}</small>`;
            btn.onclick = () => this.executeMove(m);
            container.appendChild(btn);
        });
    },

    executeMove(move) {
        const attacker = this.currentTurn === 1 ? this.p1 : this.p2;
        const defender = this.currentTurn === 1 ? this.p2 : this.p1;
        const defenderNum = this.currentTurn === 1 ? 2 : 1;
        const attackerNum = this.currentTurn === 1 ? 1 : 2;

        document.getElementById('move-container').innerHTML = `<p class="text-muted" style="grid-column: span 2; text-align: center;">${attacker.name.toUpperCase()} used ${move.name.toUpperCase()}!</p>`;
        
        ui.animateAction(attackerNum, "attack");
        ui.log(`${attacker.name.toUpperCase()} used ${move.name.toUpperCase()}!`);

        setTimeout(() => {
            if (Math.random() * 100 > move.accuracy) {
                ui.log(`${attacker.name.toUpperCase()}'s attack missed!`, "system");
            } else {
                const typeMod = this.getTypeModifier(move.type, defender.types);
                let damage = (((2 * 50 / 5 + 2) * move.power * (attacker.attack / defender.defense)) / 50 + 2) * typeMod;
                damage *= (Math.random() * (1 - 0.85) + 0.85);

                defender.hp -= damage;
                ui.animateAction(defenderNum, "hit");
                ui.updateHp(defenderNum, defender);
                
                if (typeMod > 1) ui.log("It's super effective!", "system");
                if (typeMod < 1 && typeMod > 0) ui.log("It's not very effective...", "system");
                if (typeMod === 0) ui.log(`It doesn't affect ${defender.name.toUpperCase()}...`, "system");
            }

            if (defender.hp <= 0) {
                this.endGame(attacker);
            } else {
                this.currentTurn = this.currentTurn === 1 ? 2 : 1;
                setTimeout(() => this.startTurn(), 1000);
            }
        }, 800);
    },

    getTypeModifier(moveType, defenderTypes) {
        let mod = 1;
        defenderTypes.forEach(t => {
            if (advantages[moveType] && advantages[moveType][t] !== undefined) {
                mod *= advantages[moveType][t];
            }
        });
        return mod;
    },

    cpuBrain() {
        const move = this.p2.moves[Math.floor(Math.random() * this.p2.moves.length)];
        this.executeMove(move);
    },

    endGame(winner) {
        setTimeout(() => {
            ui.showScreen('end-screen');
            document.getElementById('winner-text').textContent = `${winner.name.toUpperCase()} WINS!`;
        }, 1000);
    },

    reset() {
        location.reload();
    }
};

const bgAudio = new Audio('battlefields/pokemon-theme.mp3');
bgAudio.loop = true;
bgAudio.volume = 0.3;

function startAudio() {
    bgAudio.play().catch(() => {
        document.addEventListener('click', () => {
            bgAudio.play();
        }, { once: true });
    });
}

window.addEventListener('load', startAudio);

window.game = game;
window.ui = ui;