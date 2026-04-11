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

const stateRecorder = {
    records: [],
    isRecording: false,
    start() {
        this.records = [];
        this.isRecording = true;
    },
    record(action) {
        if (!this.isRecording) return;
        this.records.push({ ...action, timestamp: Date.now() });
    },
    stop() {
        this.isRecording = false;
        return this.records;
    }
};

const aiEngine = {
    chooseMove(cpuPokemon, playerPokemon, difficulty) {
        if (difficulty === 'easy') {
            return cpuPokemon.moves[Math.floor(Math.random() * cpuPokemon.moves.length)];
        }
        let bestMove = cpuPokemon.moves[0];
        let maxDamage = -1;
        cpuPokemon.moves.forEach(move => {
            const mod = game.getTypeModifier(move.type, playerPokemon.types);
            let damage = move.power * mod;
            if (difficulty === 'hard') damage *= (move.accuracy / 100);
            if (damage > maxDamage) {
                maxDamage = damage;
                bestMove = move;
            }
        });
        return bestMove;
    }
};

const cacheManager = {
    get(key) {
        const item = localStorage.getItem(`poke_cache_${key}`);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (Date.now() > parsed.expiry) {
            localStorage.removeItem(`poke_cache_${key}`);
            return null;
        }
        return parsed.data;
    },
    set(key, data, ttl = 3600000) {
        const item = { data, expiry: Date.now() + ttl };
        localStorage.setItem(`poke_cache_${key}`, JSON.stringify(item));
    }
};

const statsManager = {
    get() {
        const stats = localStorage.getItem('poke_stats');
        return stats ? JSON.parse(stats) : { wins: 0, losses: 0, matches: 0, history: [] };
    },
    saveMatch(winner, loser, mode) {
        const stats = this.get();
        if (winner === 'p1') stats.wins++;
        else stats.losses++;
        stats.matches++;
        stats.history.push({ date: new Date().toISOString(), winner, loser, mode });
        localStorage.setItem('poke_stats', JSON.stringify(stats));
    }
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
            try {
                const res = await fetch(m.move.url);
                return res.json();
            } catch(e) { return null; }
        }));
        
        this.moves = moves
            .filter(m => m && m.power)
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

    setLoading(playerNum, isLoading) {
        const preview = document.getElementById(`p${playerNum}-preview`);
        if (isLoading) preview.innerHTML = `<div class="loading-spinner"></div>`;
    },

    showError(message) {
        this.log(message, "damage");
        alert(message);
    },

    showStats() {
        const stats = statsManager.get();
        const container = document.getElementById('stats-container');
        container.innerHTML = `
            <div class="stat-item"><h3>WINS</h3><p>${stats.wins}</p></div>
            <div class="stat-item"><h3>LOSSES</h3><p>${stats.losses}</p></div>
            <div class="stat-item"><h3>TOTAL</h3><p>${stats.matches}</p></div>
            <div class="stat-item"><h3>WIN %</h3><p>${stats.matches ? Math.round((stats.wins / stats.matches) * 100) : 0}%</p></div>
        `;
        this.showScreen('stats-screen');
    },

    updatePreview(playerNum, pokemon, isMystery = false) {
        const preview = document.getElementById(`p${playerNum}-preview`);
        if (isMystery) {
            preview.innerHTML = `<div class="mystery-box">?</div>`;
        } else if (pokemon) {
            preview.innerHTML = `
                <img src="${pokemon.sprites.official}" alt="${pokemon.name}">
                <div class="stats-mini">
                    <span>HP: ${pokemon.maxHp}</span> | <span>ATK: ${pokemon.attack}</span> | <span>DEF: ${pokemon.defense}</span>
                </div>
            `;
        } else {
            preview.innerHTML = `<p class="text-muted">Select a slot & search</p>`;
        }
        
        const status = document.getElementById(`p${playerNum}-ready-status`);
        const team = playerNum === 1 ? game.p1Team : game.p2Team;
        const complete = team.every(p => p !== null);
        status.textContent = complete ? "TEAM READY!" : `${team.filter(p => p !== null).length}/3 READY`;
        status.style.color = complete ? "var(--success-color)" : "var(--text-muted)";
    },

    updateSlotIcon(playerNum, slotIndex, spriteUrl, isMystery = false) {
        const slot = document.getElementById(`p${playerNum}-slot-${slotIndex}`);
        if (isMystery) slot.innerHTML = `<span style="font-size:1.5rem">?</span>`;
        else if (spriteUrl) slot.innerHTML = `<img src="${spriteUrl}" alt="pkg">`;
        else slot.innerHTML = "";
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
        if (action === "attack") {
            sprite.classList.add("shake");
            setTimeout(() => sprite.classList.remove("shake"), 500);
        } else if (action === "hit") {
            sprite.classList.add("flash");
            setTimeout(() => sprite.classList.remove("flash"), 600);
        }
    },

    initPerformanceMonitor() {
        const perfOverlay = document.createElement('div');
        perfOverlay.id = 'perf-monitor';
        document.body.appendChild(perfOverlay);
        let frames = 0, lastTime = performance.now();
        const loop = () => {
            frames++;
            const time = performance.now();
            if (time >= lastTime + 1000) {
                perfOverlay.innerText = `FPS: ${frames}`;
                frames = 0; lastTime = time;
            }
            requestAnimationFrame(loop);
        };
        loop();
    },

    initAccessibility() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('stats-screen').classList.contains('active')) {
                ui.showScreen('menu-screen');
            }
        });
        document.getElementById('battle-log').setAttribute('aria-live', 'polite');
    }
};

const game = {
    mode: 'pvp',
    p1Team: [null, null, null],
    p2Team: [null, null, null],
    activep1Slot: 0,
    activep2Slot: 0,
    p1: null,
    p2: null,
    currentTurn: 1,
    battleground: 'stadium',
    difficulty: 'medium',

    startSelection(mode) {
        this.mode = mode;
        ui.showScreen('selection-screen');
        this.p1Team = [null, null, null];
        this.p2Team = [null, null, null];
        this.updateSlotUI(1);
        this.updateSlotUI(2);
        if (mode === 'pve') {
            document.getElementById('p2-label').textContent = "CPU";
            document.getElementById('p2-search-container').style.display = 'none';
            for(let i=0; i<3; i++) ui.updateSlotIcon(2, i, null, true);
        } else {
            document.getElementById('p2-label').textContent = "Player 2";
            document.getElementById('p2-search-container').style.display = 'block';
        }
        ui.updatePreview(1, null);
        ui.updatePreview(2, null);
    },

    selectSlot(player, slot) {
        if (player === 1) this.activep1Slot = slot; else this.activep2Slot = slot;
        this.updateSlotUI(player);
        ui.updatePreview(player, player === 1 ? this.p1Team[slot] : this.p2Team[slot]);
    },

    updateSlotUI(player) {
        const activeSlot = player === 1 ? this.activep1Slot : this.activep2Slot;
        for (let i = 0; i < 3; i++) {
            document.getElementById(`p${player}-slot-${i}`).classList.toggle('active', i === activeSlot);
        }
    },

    async fetchPokemon(name, playerNum) {
        try {
            ui.setLoading(playerNum, true);
            let data = cacheManager.get(name);
            if (!data) {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
                if (!res.ok) throw new Error("Not found");
                data = await res.json();
                cacheManager.set(name, data);
            }
            const p = new Pokemon(data);
            await p.loadMoves(data.moves);
            const slot = playerNum === 1 ? this.activep1Slot : this.activep2Slot;
            if (playerNum === 1) this.p1Team[slot] = p; else this.p2Team[slot] = p;
            ui.updatePreview(playerNum, p);
            ui.updateSlotIcon(playerNum, slot, p.sprites.front);
            this.checkReady();
        } catch (e) {
            ui.showError(`Error: ${e.message}`);
        } finally {
            ui.setLoading(playerNum, false);
        }
    },

    checkReady() {
        if (this.p1Team.every(p => p !== null) && (this.mode === 'pve' || this.p2Team.every(p => p !== null))) {
            document.getElementById('start-battle-btn').style.display = 'block';
        }
    },

    async initBattle() {
        if (this.mode === 'pve') {
            ui.log("CPU Selecting Team...", "system");
            for (let i = 0; i < 3; i++) {
                this.activep2Slot = i;
                await this.fetchPokemon(Math.floor(Math.random() * 800) + 1, 2);
            }
        }
        this.p1 = this.p1Team[0];
        this.p2 = this.p2Team[0];
        ui.showScreen('battle-screen');
        stateRecorder.start();
        this.updateBattleSprites();
        document.getElementById('p1-battle-name').textContent = this.p1.name;
        document.getElementById('p2-battle-name').textContent = this.p2.name;
        ui.updateHp(1, this.p1);
        ui.updateHp(2, this.p2);
        ui.log(`BATTLE START!`, "system");
        this.startTurn();
    },

    startTurn() {
        if (this.currentTurn === 1) this.showMoveMenu(this.p1);
        else (this.mode === 'pve') ? setTimeout(() => this.cpuBrain(), 1000) : this.showMoveMenu(this.p2);
    },

    showMoveMenu(pokemon) {
        const container = document.getElementById('move-container');
        container.innerHTML = "";
        pokemon.moves.forEach(m => {
            const btn = document.createElement("button");
            btn.className = "move-btn";
            btn.innerHTML = `${m.name}<br><small>${m.type.toUpperCase()}</small>`;
            btn.onclick = () => this.executeMove(m);
            container.appendChild(btn);
        });
    },

    executeMove(move) {
        const attacker = this.currentTurn === 1 ? this.p1 : this.p2;
        const defender = this.currentTurn === 1 ? this.p2 : this.p1;
        const defenderNum = this.currentTurn === 1 ? 2 : 1;
        const attackerNum = this.currentTurn === 1 ? 1 : 2;

        ui.log(`${attacker.name.toUpperCase()} used ${move.name.toUpperCase()}!`);
        ui.animateAction(attackerNum, "attack");
        stateRecorder.record({ type: 'move', attacker: attackerNum, move: move.name, attackerName: attacker.name });

        setTimeout(() => {
            if (Math.random() * 100 > move.accuracy) {
                ui.log(`Attack missed!`, "system");
                stateRecorder.record({ type: 'miss', target: defenderNum });
            } else {
                const mod = this.getTypeModifier(move.type, defender.types);
                let damage = (((2 * 50 / 5 + 2) * move.power * (attacker.attack / defender.defense)) / 50 + 2) * mod;
                damage *= (Math.random() * 0.15 + 0.85);
                defender.hp -= damage;
                ui.animateAction(defenderNum, "hit");
                ui.updateHp(defenderNum, defender);
                stateRecorder.record({ type: 'damage', target: defenderNum, value: damage, newHp: defender.hp, mod });
            }

            if (defender.hp <= 0) this.handleFaint(defenderNum);
            else { this.currentTurn = this.currentTurn === 1 ? 2 : 1; setTimeout(() => this.startTurn(), 1000); }
        }, 800);
    },

    handleFaint(playerNum) {
        ui.log(`Pokemon fainted!`, "damage");
        stateRecorder.record({ type: 'faint', target: playerNum });
        const next = (playerNum === 1 ? this.p1Team : this.p2Team).find(p => p.hp > 0);
        if (next) {
            setTimeout(() => {
                if (playerNum === 1) this.p1 = next; else this.p2 = next;
                this.updateBattleSprites();
                ui.updateHp(playerNum, next);
                document.getElementById(`p${playerNum}-battle-name`).textContent = next.name;
                this.currentTurn = this.currentTurn === 1 ? 2 : 1;
                setTimeout(() => this.startTurn(), 1000);
            }, 1000);
        } else this.endGame(playerNum === 1 ? this.p2 : this.p1);
    },

    getTypeModifier(mType, dTypes) {
        let mod = 1;
        dTypes.forEach(t => { if (advantages[mType] && advantages[mType][t] !== undefined) mod *= advantages[mType][t]; });
        return mod;
    },

    cpuBrain() { this.executeMove(aiEngine.chooseMove(this.p2, this.p1, this.difficulty)); },

    endGame(winner) {
        stateRecorder.stop();
        statsManager.saveMatch(winner === this.p1 ? 'p1' : 'p2', winner.name, this.mode);
        setTimeout(() => {
            ui.showScreen('end-screen');
            document.getElementById('winner-text').textContent = `${winner.name.toUpperCase()} WINS!`;
            document.getElementById('last-replay-btn').style.display = 'block';
        }, 1000);
    },

    startReplay() {
        const records = [...stateRecorder.records];
        if (!records.length) return;
        ui.showScreen('battle-screen');
        ui.log("REPLAY STARTING...", "system");
        this.p1 = this.p1Team[0]; this.p2 = this.p2Team[0];
        this.p1Team.forEach(p => p.hp = p.maxHp); this.p2Team.forEach(p => p.hp = p.maxHp);
        ui.updateHp(1, this.p1); ui.updateHp(2, this.p2);
        this.updateBattleSprites();
        let i = 0;
        const itv = setInterval(() => {
            if (i >= records.length) { clearInterval(itv); ui.log("REPLAY END."); return; }
            const e = records[i++];
            if (e.type === 'move') { ui.log(`${e.attackerName.toUpperCase()} used ${e.move.toUpperCase()}!`); ui.animateAction(e.attacker, 'attack'); }
            else if (e.type === 'damage') { const p = e.target === 1 ? this.p1 : this.p2; p.hp = e.newHp; ui.animateAction(e.target, 'hit'); ui.updateHp(e.target, p); }
        }, 1500);
    },

    updateBattleSprites() {
        document.getElementById('p1-sprite').src = this.p1.sprites.back;
        document.getElementById('p2-sprite').src = this.p2.sprites.front;
    },

    reset() { location.reload(); }
};

const multiplayer = {
    init() { alert("Firebase Config Required! Lobby logic ready but awaiting configuration."); }
};

const bgAudio = new Audio('battlefields/pokemon-theme.mp3');
bgAudio.loop = true; bgAudio.volume = 0.3;

window.addEventListener('load', () => {
    bgAudio.play().catch(() => document.addEventListener('click', () => bgAudio.play(), { once: true }));
    ui.initPerformanceMonitor();
    ui.initAccessibility();
});

window.game = game; window.ui = ui; window.multiplayer = multiplayer;