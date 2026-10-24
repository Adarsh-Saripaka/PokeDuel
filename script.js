/* ==========================================================================
   POKÉMON DUEL | ELITE ARENA - GAME ENGINE & LOGIC
   ========================================================================== */

const popularPokemon = [
    "pikachu", "charizard", "bulbasaur", "squirtle", "mewtwo", "lucario", "greninja", "gengar", "eevee", "snorlax",
    "dragonite", "gyarados", "arcanine", "blastoise", "venusaur", "gardevoir", "rayquaza", "garchomp", "mudkip", "umbreon",
    "tyranitar", "scizor", "alazakam", "gengar", "machamp", "sceptile", "blaziken", "swampert", "salamence", "metagross"
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

/* Web Audio Synthesizer for SFX & BGM Management */
const soundFx = {
    ctx: null,
    sfxEnabled: true,
    musicEnabled: false,

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleMusic() {
        this.init();
        const btn = document.getElementById('music-toggle-btn');
        const eq = document.getElementById('audio-eq');
        const icon = document.getElementById('music-icon');
        
        if (bgAudio.paused) {
            bgAudio.play().then(() => {
                this.musicEnabled = true;
                if (btn) btn.classList.add('audio-playing');
                if (eq) eq.style.display = 'flex';
                if (icon) icon.textContent = '🎶';
            }).catch(() => {});
        } else {
            bgAudio.pause();
            this.musicEnabled = false;
            if (btn) btn.classList.remove('audio-playing');
            if (icon) icon.textContent = '🎵';
        }
    },

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        const icon = document.getElementById('sfx-icon');
        const btn = document.getElementById('sfx-toggle-btn');
        if (icon) icon.textContent = this.sfxEnabled ? '🔊' : '🔇';
        if (btn) btn.style.opacity = this.sfxEnabled ? '1' : '0.6';
        if (this.sfxEnabled) this.playTone(520, 'sine', 0.1);
    },

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;
        
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    },

    playClick() {
        this.playTone(800, 'triangle', 0.05, 0.1);
    },

    playAttack() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.25);
            gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.25);
        } catch(e) {}
    },

    playHit(isSuper = false) {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            const baseFreq = isSuper ? 240 : 140;
            osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.22);
            gain.gain.setValueAtTime(isSuper ? 0.25 : 0.18, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.22);
            if (isSuper) {
                setTimeout(() => this.playTone(720, 'sine', 0.15, 0.2), 60);
            }
        } catch(e) {}
    },

    playFaint() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.6);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.6);
        } catch(e) {}
    },

    playVictory() {
        if (!this.sfxEnabled) return;
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 'triangle', 0.2, 0.2), idx * 120);
        });
    }
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
        try {
            const parsed = JSON.parse(item);
            if (Date.now() > parsed.expiry) {
                localStorage.removeItem(`poke_cache_${key}`);
                return null;
            }
            return parsed.data;
        } catch(e) {
            return null;
        }
    },
    set(key, data, ttl = 3600000) {
        try {
            const item = { data, expiry: Date.now() + ttl };
            localStorage.setItem(`poke_cache_${key}`, JSON.stringify(item));
        } catch(e) {}
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
        if (!stats.history) stats.history = [];
        stats.history.unshift({
            date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            winner,
            loser,
            mode
        });
        if (stats.history.length > 20) stats.history.pop();
        localStorage.setItem('poke_stats', JSON.stringify(stats));
    },
    clear() {
        localStorage.removeItem('poke_stats');
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

        // Official Showdown animated GIF sprites with fallback
        const showdown = data.sprites.other?.showdown || {};
        const official = data.sprites.other?.["official-artwork"]?.front_default || data.sprites.front_default;

        this.sprites = {
            front: showdown.front_default || data.sprites.front_default || official,
            back: showdown.back_default || data.sprites.back_default || showdown.front_default || official,
            official: official
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
                power: m.power || 50,
                type: m.type.name,
                accuracy: m.accuracy || 100
            }));
        
        if (this.moves.length === 0) {
            this.moves.push({ name: "Tackle", power: 45, type: "normal", accuracy: 100 });
            this.moves.push({ name: "Quick Attack", power: 40, type: "normal", accuracy: 100 });
        }
    }
}

const ui = {
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
        soundFx.playClick();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    setLoading(playerNum, isLoading) {
        const preview = document.getElementById(`p${playerNum}-preview`);
        if (!preview) return;
        if (isLoading) {
            preview.innerHTML = `<div class="loading-spinner"></div><p style="margin-top:0.8rem; font-size:0.85rem; color:var(--text-muted)">Summoning Pokémon...</p>`;
        }
    },

    showError(message) {
        this.log(message, "damage");
    },

    toggleTypeModal(show) {
        const modal = document.getElementById('type-guide-modal');
        if (modal) modal.classList.toggle('active', show);
        soundFx.playClick();
    },

    toggleMultiplayerModal(show) {
        const modal = document.getElementById('multiplayer-modal');
        if (modal) modal.classList.toggle('active', show);
        soundFx.playClick();
    },

    showStats() {
        const stats = statsManager.get();
        const container = document.getElementById('stats-container');
        const winPercent = stats.matches ? Math.round((stats.wins / stats.matches) * 100) : 0;
        
        container.innerHTML = `
            <div class="stat-item"><h3>VICTORIES</h3><p style="color:var(--success-color)">${stats.wins}</p></div>
            <div class="stat-item"><h3>DEFEATS</h3><p style="color:var(--danger-color)">${stats.losses}</p></div>
            <div class="stat-item"><h3>TOTAL MATCHES</h3><p>${stats.matches}</p></div>
            <div class="stat-item"><h3>WIN RATE</h3><p style="color:var(--primary-color)">${winPercent}%</p></div>
        `;

        const historyContainer = document.getElementById('match-history-list');
        if (historyContainer) {
            if (!stats.history || stats.history.length === 0) {
                historyContainer.innerHTML = `<p class="text-muted" style="text-align: center; padding: 1.5rem;">No battles fought yet. Enter the arena!</p>`;
            } else {
                historyContainer.innerHTML = stats.history.map(h => {
                    const isWin = h.winner === 'p1';
                    return `
                        <div class="history-item">
                            <span class="result-chip ${isWin ? 'win' : 'loss'}">${isWin ? 'VICTORY' : 'DEFEAT'}</span>
                            <span style="font-weight:700; text-transform:uppercase;">${h.loser}</span>
                            <span class="text-muted" style="font-size:0.75rem;">${h.mode === 'pve' ? 'VS AI' : 'PVP'} • ${h.date}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        this.showScreen('stats-screen');
    },

    updatePreview(playerNum, pokemon, isMystery = false) {
        const preview = document.getElementById(`p${playerNum}-preview`);
        if (!preview) return;

        if (isMystery) {
            preview.innerHTML = `<div class="mystery-box">?</div><p style="margin-top:0.6rem; font-weight:700;">Secret Rival Pokémon</p>`;
        } else if (pokemon) {
            const typePills = pokemon.types.map(t => `<span class="type-pill type-${t}">${t}</span>`).join('');
            const hpWidth = Math.min(100, Math.round((pokemon.maxHp / 300) * 100));
            const atkWidth = Math.min(100, Math.round((pokemon.attack / 180) * 100));
            const defWidth = Math.min(100, Math.round((pokemon.defense / 180) * 100));
            const spdWidth = Math.min(100, Math.round((pokemon.speed / 180) * 100));

            preview.innerHTML = `
                <img src="${pokemon.sprites.official}" alt="${pokemon.name}" class="preview-pokemon-image">
                <h3 style="font-size:1.2rem; font-weight:800; text-transform:uppercase; margin-top:0.4rem;">${pokemon.name}</h3>
                <div class="preview-types-row">${typePills}</div>
                <div class="preview-stats-bars">
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">HP</span>
                        <div class="mini-stat-bar-bg"><div class="mini-stat-bar-val" style="width:${hpWidth}%; background:#00f076;"></div></div>
                        <span class="mini-stat-num">${pokemon.maxHp}</span>
                    </div>
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">ATK</span>
                        <div class="mini-stat-bar-bg"><div class="mini-stat-bar-val" style="width:${atkWidth}%; background:#ff5722;"></div></div>
                        <span class="mini-stat-num">${pokemon.attack}</span>
                    </div>
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">DEF</span>
                        <div class="mini-stat-bar-bg"><div class="mini-stat-bar-val" style="width:${defWidth}%; background:#3a86ff;"></div></div>
                        <span class="mini-stat-num">${pokemon.defense}</span>
                    </div>
                    <div class="mini-stat-row">
                        <span class="mini-stat-label">SPD</span>
                        <div class="mini-stat-bar-bg"><div class="mini-stat-bar-val" style="width:${spdWidth}%; background:#ffd000;"></div></div>
                        <span class="mini-stat-num">${pokemon.speed}</span>
                    </div>
                </div>
            `;
        } else {
            preview.innerHTML = `<p class="text-muted">Select a slot & search or pick a Pokémon</p>`;
        }
        
        const status = document.getElementById(`p${playerNum}-ready-status`);
        if (status) {
            const team = playerNum === 1 ? game.p1Team : game.p2Team;
            const complete = team.every(p => p !== null);
            const count = team.filter(p => p !== null).length;
            status.textContent = complete ? "TEAM READY!" : `${count}/3 READY`;
            status.style.color = complete ? "var(--success-color)" : "var(--text-muted)";
            status.style.borderColor = complete ? "var(--success-color)" : "var(--glass-border)";
        }
    },

    updateSlotIcon(playerNum, slotIndex, spriteUrl, isMystery = false) {
        const slot = document.getElementById(`p${playerNum}-slot-${slotIndex}`);
        if (!slot) return;
        if (isMystery) {
            slot.innerHTML = `<span style="font-size:1.5rem; font-weight:900; color:var(--text-muted)">?</span>`;
            slot.classList.add('filled');
        } else if (spriteUrl) {
            slot.innerHTML = `<img src="${spriteUrl}" alt="pokemon">`;
            slot.classList.add('filled');
        } else {
            slot.innerHTML = "";
            slot.classList.remove('filled');
        }
    },

    handleSearch(event, playerNum) {
        const query = event.target.value.toLowerCase().trim();
        const autocomplete = document.getElementById(`p${playerNum}-autocomplete`);
        autocomplete.innerHTML = "";
        if (query.length < 2) return;
        
        const matches = popularPokemon.filter(p => p.startsWith(query)).slice(0, 6);
        matches.forEach(p => {
            const div = document.createElement("div");
            div.className = "autocomplete-item";
            div.innerHTML = `<span>${p}</span><span style="font-size:0.75rem; color:var(--text-muted)">Select ↵</span>`;
            div.onclick = () => {
                event.target.value = p;
                autocomplete.innerHTML = "";
                game.fetchPokemon(p, playerNum);
            };
            autocomplete.appendChild(div);
        });

        if (event.key === "Enter" && query) {
            game.fetchPokemon(query, playerNum);
            autocomplete.innerHTML = "";
        }
    },

    log(message, type = "info") {
        const logBox = document.getElementById('battle-log');
        if (!logBox) return;
        const p = document.createElement("p");
        
        if (type === "damage") {
            p.style.color = "var(--danger-color)";
            p.style.fontWeight = "700";
            p.innerHTML = `<span style="color:#ff3366">💥</span> ${message}`;
        } else if (type === "effective") {
            p.style.color = "var(--success-color)";
            p.style.fontWeight = "800";
            p.innerHTML = `<span style="color:#00f076">⚡</span> ${message}`;
        } else if (type === "system") {
            p.style.color = "var(--primary-color)";
            p.style.fontWeight = "800";
            p.innerHTML = `<span style="color:#ffd000">🏆</span> ${message}`;
        } else {
            p.innerHTML = `> ${message}`;
        }

        logBox.appendChild(p);
        logBox.scrollTop = logBox.scrollHeight;
    },

    updateHp(playerNum, pokemon) {
        const fill = document.getElementById(`p${playerNum}-hp-fill`);
        const text = document.getElementById(`p${playerNum}-hp-text`);
        if (!fill || !text) return;

        const currentHp = Math.max(0, pokemon.hp);
        const percent = Math.max(0, (currentHp / pokemon.maxHp) * 100);
        fill.style.width = `${percent}%`;
        text.textContent = `${Math.ceil(currentHp)} / ${pokemon.maxHp} HP`;
        
        if (percent < 25) {
            fill.style.background = "linear-gradient(90deg, #ff0055, #ff3366)";
            fill.style.boxShadow = "0 0 10px rgba(255, 0, 85, 0.7)";
        } else if (percent < 50) {
            fill.style.background = "linear-gradient(90deg, #ff9500, #ffb703)";
            fill.style.boxShadow = "0 0 10px rgba(255, 183, 3, 0.5)";
        } else {
            fill.style.background = "linear-gradient(90deg, #00f076, #4ade80)";
            fill.style.boxShadow = "0 0 10px rgba(0, 240, 118, 0.5)";
        }
    },

    updatePartyPips(playerNum, team) {
        const container = document.getElementById(`p${playerNum}-party-pips`);
        if (!container) return;
        container.innerHTML = team.map(p => {
            const isFainted = !p || p.hp <= 0;
            return `<span class="party-pip ${isFainted ? 'fainted' : ''}" title="${p ? p.name : 'Empty'}"></span>`;
        }).join('');
    },

    showFloatingDamage(targetPlayerNum, text, isSuper = false) {
        const container = document.getElementById('floating-damage-container');
        if (!container) return;
        const targetArea = document.getElementById(`p${targetPlayerNum}-area`);
        if (!targetArea) return;

        const rect = targetArea.getBoundingClientRect();
        const arenaRect = document.getElementById('arena-main').getBoundingClientRect();

        const box = document.createElement('div');
        box.className = 'floating-damage-box';
        box.textContent = text;
        box.style.left = `${rect.left - arenaRect.left + 80}px`;
        box.style.top = `${rect.top - arenaRect.top + 50}px`;
        box.style.color = isSuper ? '#ffd000' : '#ff3366';

        container.appendChild(box);
        setTimeout(() => box.remove(), 1000);
    },

    setTurnBanner(text) {
        const bannerText = document.getElementById('turn-banner-text');
        if (bannerText) bannerText.textContent = text;
    },

    animateAction(playerNum, action) {
        const sprite = document.getElementById(`p${playerNum}-sprite`);
        if (!sprite) return;
        if (action === "attack") {
            sprite.classList.add("shake");
            setTimeout(() => sprite.classList.remove("shake"), 500);
        } else if (action === "hit") {
            sprite.classList.add("flash");
            setTimeout(() => sprite.classList.remove("flash"), 500);
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
            if (e.key === 'Escape') {
                ui.toggleTypeModal(false);
                ui.toggleMultiplayerModal(false);
            }
        });
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
        this.activep1Slot = 0;
        this.activep2Slot = 0;
        this.updateSlotUI(1);
        this.updateSlotUI(2);

        const p2RandomBtn = document.getElementById('p2-random-btn');
        const p2QuickPicks = document.getElementById('p2-quick-picks');

        if (mode === 'pve') {
            document.getElementById('p2-label').textContent = "CPU Rival";
            document.getElementById('p2-search-container').style.display = 'none';
            if (p2RandomBtn) p2RandomBtn.style.display = 'none';
            if (p2QuickPicks) p2QuickPicks.style.display = 'none';
            for (let i = 0; i < 3; i++) ui.updateSlotIcon(2, i, null, true);
            ui.updatePreview(2, null, true);
        } else {
            document.getElementById('p2-label').textContent = "Player 2";
            document.getElementById('p2-search-container').style.display = 'block';
            if (p2RandomBtn) p2RandomBtn.style.display = 'inline-flex';
            if (p2QuickPicks) p2QuickPicks.style.display = 'flex';
            ui.updatePreview(2, null);
        }
        ui.updatePreview(1, null);
        this.selectBattleground(this.battleground);
        this.checkReady();
    },

    selectSlot(player, slot) {
        soundFx.playClick();
        if (player === 1) this.activep1Slot = slot; else this.activep2Slot = slot;
        this.updateSlotUI(player);
        const currentPoke = player === 1 ? this.p1Team[slot] : this.p2Team[slot];
        ui.updatePreview(player, currentPoke, this.mode === 'pve' && player === 2 && !currentPoke);
    },

    updateSlotUI(player) {
        const activeSlot = player === 1 ? this.activep1Slot : this.activep2Slot;
        for (let i = 0; i < 3; i++) {
            const slot = document.getElementById(`p${player}-slot-${i}`);
            if (slot) slot.classList.toggle('active', i === activeSlot);
        }
    },

    selectBattleground(bg) {
        this.battleground = bg;
        const bgMap = {
            stadium: 'battlefields/Grassarena.jpg',
            forest: 'battlefields/Forestarena.jpg',
            rock: 'battlefields/Rockarena.jpg',
            water: 'battlefields/Waterarena.jpeg'
        };
        const arena = document.getElementById('arena-main');
        if (arena && bgMap[bg]) {
            arena.style.backgroundImage = `url('${bgMap[bg]}')`;
        }
        document.querySelectorAll('.battleground-card').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.bg === bg);
        });
        soundFx.playClick();
    },

    quickSelect(name, playerNum) {
        soundFx.playClick();
        this.fetchPokemon(name, playerNum);
    },

    async randomizeTeam(playerNum) {
        soundFx.playClick();
        const available = [...popularPokemon].sort(() => 0.5 - Math.random());
        for (let i = 0; i < 3; i++) {
            if (playerNum === 1) this.activep1Slot = i;
            else this.activep2Slot = i;
            this.updateSlotUI(playerNum);
            await this.fetchPokemon(available[i], playerNum);
        }
    },

    async quickStart() {
        this.mode = 'pve';
        this.startSelection('pve');
        await this.randomizeTeam(1);
        this.initBattle();
    },

    async fetchPokemon(name, playerNum) {
        try {
            ui.setLoading(playerNum, true);
            let data = cacheManager.get(name);
            if (!data) {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
                if (!res.ok) throw new Error("Pokémon not found");
                data = await res.json();
                cacheManager.set(name, data);
            }
            const p = new Pokemon(data);
            await p.loadMoves(data.moves);
            
            const slot = playerNum === 1 ? this.activep1Slot : this.activep2Slot;
            if (playerNum === 1) this.p1Team[slot] = p; else this.p2Team[slot] = p;
            
            ui.updatePreview(playerNum, p);
            ui.updateSlotIcon(playerNum, slot, p.sprites.front);

            // Advance to next unfilled slot automatically
            const team = playerNum === 1 ? this.p1Team : this.p2Team;
            const nextSlot = team.findIndex(poke => poke === null);
            if (nextSlot !== -1) {
                this.selectSlot(playerNum, nextSlot);
            }

            this.checkReady();
        } catch (e) {
            ui.showError(`Error loading Pokémon: ${e.message}`);
        } finally {
            ui.setLoading(playerNum, false);
        }
    },

    checkReady() {
        const startBtn = document.getElementById('start-battle-btn');
        const p1Ready = this.p1Team.every(p => p !== null);
        const p2Ready = this.mode === 'pve' || this.p2Team.every(p => p !== null);

        if (p1Ready && p2Ready) {
            if (startBtn) startBtn.style.display = 'inline-flex';
        } else {
            if (startBtn) startBtn.style.display = 'none';
        }
    },

    async initBattle() {
        soundFx.playClick();
        if (this.mode === 'pve') {
            ui.log("AI Rival assembling mystery roster...", "system");
            const randomList = [...popularPokemon].sort(() => 0.5 - Math.random());
            for (let i = 0; i < 3; i++) {
                this.activep2Slot = i;
                await this.fetchPokemon(randomList[i], 2);
            }
        }

        // Reset HP for fresh battle
        this.p1Team.forEach(p => { if (p) p.hp = p.maxHp; });
        this.p2Team.forEach(p => { if (p) p.hp = p.maxHp; });

        this.p1 = this.p1Team[0];
        this.p2 = this.p2Team[0];
        this.currentTurn = 1;

        ui.showScreen('battle-screen');
        stateRecorder.start();

        this.updateBattleSprites();
        document.getElementById('p1-battle-name').textContent = this.p1.name;
        document.getElementById('p2-battle-name').textContent = this.p2.name;
        
        ui.updateHp(1, this.p1);
        ui.updateHp(2, this.p2);
        ui.updatePartyPips(1, this.p1Team);
        ui.updatePartyPips(2, this.p2Team);

        ui.log(`=== BATTLE STARTED IN THE ARENA ===`, "system");
        ui.log(`${this.p1.name.toUpperCase()} enters the arena!`);
        ui.log(`Opponent sends out ${this.p2.name.toUpperCase()}!`);
        
        this.startTurn();
    },

    startTurn() {
        const attackerName = this.currentTurn === 1 ? this.p1.name : this.p2.name;
        const turnLabel = this.currentTurn === 1 
            ? `TRAINER 1 TURN • CHOOSE MOVE` 
            : (this.mode === 'pve' ? `AI RIVAL IS THINKING...` : `TRAINER 2 TURN • CHOOSE MOVE`);
        
        ui.setTurnBanner(turnLabel);

        if (this.currentTurn === 1) {
            this.showMoveMenu(this.p1);
        } else {
            if (this.mode === 'pve') {
                const moveContainer = document.getElementById('move-container');
                if (moveContainer) {
                    moveContainer.innerHTML = `<p class="text-muted" style="grid-column: span 2; text-align: center; margin: auto;">AI opponent is evaluating type matchup...</p>`;
                }
                setTimeout(() => this.cpuBrain(), 1000);
            } else {
                this.showMoveMenu(this.p2);
            }
        }
    },

    showMoveMenu(pokemon) {
        const container = document.getElementById('move-container');
        if (!container) return;
        container.innerHTML = "";

        const defender = this.currentTurn === 1 ? this.p2 : this.p1;

        pokemon.moves.forEach(m => {
            const btn = document.createElement("button");
            btn.className = `move-btn type-${m.type}`;
            
            const mod = this.getTypeModifier(m.type, defender.types);
            let effBadge = "";
            if (mod >= 2) effBadge = `<span class="eff-badge super">2x Super!</span>`;
            else if (mod === 0) effBadge = `<span class="eff-badge immune">0x Immune</span>`;
            else if (mod <= 0.5) effBadge = `<span class="eff-badge weak">0.5x Weak</span>`;

            btn.innerHTML = `
                <div class="move-btn-header">
                    <span class="move-name">${m.name}</span>
                    <span class="move-type-badge">${m.type}</span>
                </div>
                <div class="move-btn-footer">
                    <span class="move-meta">PWR ${m.power} • ACC ${m.accuracy}%</span>
                    ${effBadge}
                </div>
            `;
            btn.onclick = () => {
                soundFx.playClick();
                this.executeMove(m);
            };
            container.appendChild(btn);
        });
    },

    executeMove(move) {
        // Disable action buttons during attack animation
        const buttons = document.querySelectorAll('.move-btn');
        buttons.forEach(b => b.disabled = true);

        const attacker = this.currentTurn === 1 ? this.p1 : this.p2;
        const defender = this.currentTurn === 1 ? this.p2 : this.p1;
        const defenderNum = this.currentTurn === 1 ? 2 : 1;
        const attackerNum = this.currentTurn === 1 ? 1 : 2;

        ui.log(`${attacker.name.toUpperCase()} unleashes ${move.name.toUpperCase()}!`);
        ui.animateAction(attackerNum, "attack");
        soundFx.playAttack();
        stateRecorder.record({ type: 'move', attacker: attackerNum, move: move.name, attackerName: attacker.name });

        setTimeout(() => {
            if (Math.random() * 100 > move.accuracy) {
                ui.log(`The attack missed the target!`, "system");
                ui.showFloatingDamage(defenderNum, "MISSED!");
                stateRecorder.record({ type: 'miss', target: defenderNum });
            } else {
                const mod = this.getTypeModifier(move.type, defender.types);
                let damage = (((2 * 50 / 5 + 2) * move.power * (attacker.attack / defender.defense)) / 50 + 2) * mod;
                damage *= (Math.random() * 0.15 + 0.85);
                damage = Math.max(1, Math.round(damage));
                
                defender.hp -= damage;
                ui.animateAction(defenderNum, "hit");
                soundFx.playHit(mod >= 2);
                ui.updateHp(defenderNum, defender);

                let hitText = `-${damage}`;
                if (mod >= 2) hitText += " CRIT!";
                ui.showFloatingDamage(defenderNum, hitText, mod >= 2);

                if (mod >= 2) ui.log(`It's super effective! (${damage} DMG)`, "effective");
                else if (mod === 0) ui.log(`It had no effect! (0 DMG)`);
                else if (mod <= 0.5) ui.log(`It's not very effective... (${damage} DMG)`);
                else ui.log(`Dealt ${damage} damage!`, "damage");

                stateRecorder.record({ type: 'damage', target: defenderNum, value: damage, newHp: defender.hp, mod });
            }

            if (defender.hp <= 0) {
                this.handleFaint(defenderNum);
            } else {
                this.currentTurn = this.currentTurn === 1 ? 2 : 1;
                setTimeout(() => this.startTurn(), 1000);
            }
        }, 700);
    },

    handleFaint(playerNum) {
        soundFx.playFaint();
        ui.log(`The Pokémon fainted!`, "damage");
        stateRecorder.record({ type: 'faint', target: playerNum });

        const team = playerNum === 1 ? this.p1Team : this.p2Team;
        ui.updatePartyPips(playerNum, team);

        const next = team.find(p => p.hp > 0);
        if (next) {
            setTimeout(() => {
                if (playerNum === 1) this.p1 = next; else this.p2 = next;
                this.updateBattleSprites();
                ui.updateHp(playerNum, next);
                document.getElementById(`p${playerNum}-battle-name`).textContent = next.name;
                ui.log(`Trainer sends out ${next.name.toUpperCase()}!`, "system");
                this.currentTurn = this.currentTurn === 1 ? 2 : 1;
                setTimeout(() => this.startTurn(), 1000);
            }, 1200);
        } else {
            this.endGame(playerNum === 1 ? this.p2 : this.p1);
        }
    },

    getTypeModifier(mType, dTypes) {
        let mod = 1;
        dTypes.forEach(t => {
            if (advantages[mType] && advantages[mType][t] !== undefined) {
                mod *= advantages[mType][t];
            }
        });
        return mod;
    },

    cpuBrain() {
        this.executeMove(aiEngine.chooseMove(this.p2, this.p1, this.difficulty));
    },

    endGame(winner) {
        stateRecorder.stop();
        soundFx.playVictory();
        statsManager.saveMatch(winner === this.p1 ? 'p1' : 'p2', winner.name, this.mode);
        
        setTimeout(() => {
            ui.showScreen('end-screen');
            document.getElementById('winner-text').textContent = `${winner.name.toUpperCase()} WINS!`;
            
            const previewContainer = document.getElementById('winner-preview');
            if (previewContainer) {
                previewContainer.innerHTML = `<img src="${winner.sprites.official}" alt="${winner.name}">`;
            }

            const replayBtn = document.getElementById('last-replay-btn');
            if (replayBtn) replayBtn.style.display = 'inline-flex';
        }, 1000);
    },

    startReplay() {
        const records = [...stateRecorder.records];
        if (!records.length) return;
        ui.showScreen('battle-screen');
        ui.log("=== REPLAY PLAYBACK COMMENCING ===", "system");

        this.p1 = this.p1Team[0];
        this.p2 = this.p2Team[0];
        this.p1Team.forEach(p => { if (p) p.hp = p.maxHp; });
        this.p2Team.forEach(p => { if (p) p.hp = p.maxHp; });

        ui.updateHp(1, this.p1);
        ui.updateHp(2, this.p2);
        ui.updatePartyPips(1, this.p1Team);
        ui.updatePartyPips(2, this.p2Team);
        this.updateBattleSprites();

        let i = 0;
        const itv = setInterval(() => {
            if (i >= records.length) {
                clearInterval(itv);
                ui.log("=== REPLAY CONCLUDED ===", "system");
                return;
            }
            const e = records[i++];
            if (e.type === 'move') {
                ui.log(`${e.attackerName.toUpperCase()} used ${e.move.toUpperCase()}!`);
                ui.animateAction(e.attacker, 'attack');
                soundFx.playAttack();
            } else if (e.type === 'damage') {
                const p = e.target === 1 ? this.p1 : this.p2;
                p.hp = e.newHp;
                ui.animateAction(e.target, 'hit');
                soundFx.playHit(e.mod >= 2);
                ui.updateHp(e.target, p);
                ui.showFloatingDamage(e.target, `-${Math.round(e.value)}`, e.mod >= 2);
            } else if (e.type === 'faint') {
                soundFx.playFaint();
                ui.log("Pokémon fainted in replay!", "damage");
            }
        }, 1400);
    },

    updateBattleSprites() {
        const p1Img = document.getElementById('p1-sprite');
        const p2Img = document.getElementById('p2-sprite');
        if (p1Img && this.p1) p1Img.src = this.p1.sprites.back;
        if (p2Img && this.p2) p2Img.src = this.p2.sprites.front;
    },

    reset() {
        this.startSelection(this.mode);
    }
};

const multiplayer = {
    init() {
        ui.toggleMultiplayerModal(true);
    }
};

const bgAudio = new Audio('battlefields/pokemon-theme.mp3');
bgAudio.loop = true;
bgAudio.volume = 0.25;

// Initialization
window.addEventListener('load', () => {
    // Autoplay handling
    const startAudio = () => {
        bgAudio.play().then(() => {
            soundFx.musicEnabled = true;
            const btn = document.getElementById('music-toggle-btn');
            const eq = document.getElementById('audio-eq');
            const icon = document.getElementById('music-icon');
            if (btn) btn.classList.add('audio-playing');
            if (eq) eq.style.display = 'flex';
            if (icon) icon.textContent = '🎶';
        }).catch(() => {});
        document.removeEventListener('click', startAudio);
    };
    document.addEventListener('click', startAudio, { once: true });

    ui.initPerformanceMonitor();
    ui.initAccessibility();
});

// Global exports
window.game = game;
window.ui = ui;
window.multiplayer = multiplayer;
window.soundFx = soundFx;
window.statsManager = statsManager;