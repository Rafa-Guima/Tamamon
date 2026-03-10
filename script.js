/**
 * Digital Worm (V-Pet Style)
 * Main Logic
 */

const CONFIG = {
    DECAY_INTERVAL: 5000, // 5 seconds
    HP_TICK_INTERVAL: 3000, // 3 seconds
    HUNGER_DECAY: 2,
    HAPPINESS_DECAY: 3,
    GROWTH_HP: 1,
    STABLE_HP: 0,
    DAMAGE_HP: -2,
    FOOD_RESTORE: 15,
    PET_RESTORE: 2,
    EVO_REQUIREMENT_TIME: 180, // 180 seconds (3 mins)
    EVO_HP_THRESHOLD: 90,
    SAVE_KEY: 'digital_worm_save_v1'
};

const STAGES = {
    WORMMON: 'wormmon',
    STINGMON: 'stingmon',
    DIGIOVO: 'digiovo'
};

const PET_SVG_MAP = {
    [STAGES.WORMMON]: {
        happy: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#2ecc71"/><circle cx="35" cy="40" r="5" fill="#fff"/><circle cx="65" cy="40" r="5" fill="#fff"/><path d="M 30 60 Q 50 80 70 60" stroke="#000" stroke-width="3" fill="none"/><path d="M 20 50 Q 10 30 30 20" stroke="#27ae60" stroke-width="5" fill="none"/></svg>`,
        stable: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#27ae60"/><circle cx="35" cy="45" r="4" fill="#000"/><circle cx="65" cy="45" r="4" fill="#000"/><path d="M 40 65 L 60 65" stroke="#000" stroke-width="2" fill="none"/></svg>`,
        sad: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#2c3e50"/><circle cx="35" cy="50" r="3" fill="#fff"/><circle cx="65" cy="50" r="3" fill="#fff"/><path d="M 35 70 Q 50 60 65 70" stroke="#fff" stroke-width="2" fill="none"/></svg>`
    },
    [STAGES.STINGMON]: {
        complete: `<svg viewBox="0 0 100 100"><rect x="30" y="20" width="40" height="60" fill="#2ecc71" rx="10"/><path d="M 20 40 L 40 20 M 80 40 L 60 20" stroke="#27ae60" stroke-width="8"/><circle cx="50" cy="30" r="15" fill="#2c3e50"/><path d="M 40 30 L 45 35 M 60 30 L 55 35" stroke="#f1c40f" stroke-width="2"/></svg>`
    },
    [STAGES.DIGIOVO]: {
        dead: `<svg viewBox="0 0 100 100"><path d="M 50 10 C 20 10 10 50 10 70 C 10 90 30 95 50 95 C 70 95 90 90 90 70 C 90 50 80 10 50 10" fill="#2ecc71"/><path d="M 20 40 L 80 40 M 15 60 L 85 60 M 20 80 L 80 80" stroke="#27ae60" stroke-width="5"/></svg>`
    }
};

let gameState = {
    stage: STAGES.WORMMON,
    hunger: 100,
    happiness: 100,
    health: 100,
    evoTimer: 0,
    isGameOver: false,
    isVictorious: false,
    isPettingMode: false
};

// DOM elements
const elements = {
    screen: document.getElementById('vpet-screen'),
    hungerBar: document.getElementById('hunger-bar'),
    happinessBar: document.getElementById('happiness-bar'),
    healthBar: document.getElementById('health-bar'),
    petContainer: document.getElementById('pet'),
    btnFeed: document.getElementById('btn-feed'),
    btnPet: document.getElementById('btn-pet'),
    btnRestart: document.getElementById('btn-restart'),
    foodItem: document.getElementById('food-item'),
    clickFeedback: document.getElementById('click-feedback'),
    evoTimerDisplay: document.getElementById('evo-timer-display'),
    overlay: document.getElementById('overlay'),
    overlayTitle: document.getElementById('overlay-title'),
    overlayMessage: document.getElementById('overlay-message'),
    btnOverlayRestart: document.getElementById('btn-overlay-restart'),
    gameArea: document.getElementById('game-area')
};

// Initialization
function init() {
    loadGame();
    setupEventListeners();
    startGameLoops();
    render();
}

function setupEventListeners() {
    // Buttons
    elements.btnFeed.addEventListener('click', toggleFeedingMode);
    elements.btnPet.addEventListener('click', enterPettingMode);
    elements.btnRestart.addEventListener('click', restartGame);
    elements.btnOverlayRestart.addEventListener('click', restartGame);

    // Drag & Drop
    elements.foodItem.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'food');
    });

    elements.petContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    elements.petContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.foodItem.classList.add('hidden');
        if (gameState.isGameOver || gameState.isVictorious) return;
        
        updateStat('hunger', CONFIG.FOOD_RESTORE);
        spawnFeedback('DELÍCIA!', e.clientX, e.clientY);
        saveGame();
        render();
    });

    // Petting Clicker
    elements.petContainer.addEventListener('click', (e) => {
        if (gameState.isPettingMode && !gameState.isGameOver && !gameState.isVictorious) {
            updateStat('happiness', CONFIG.PET_RESTORE);
            spawnFeedback('+2%', e.clientX, e.clientY);
            saveGame();
        }
    });
}

function startGameLoops() {
    // Passive Decay (every 5s)
    setInterval(() => {
        if (gameState.isGameOver || gameState.isVictorious) return;
        updateStat('hunger', -CONFIG.HUNGER_DECAY);
        updateStat('happiness', -CONFIG.HAPPINESS_DECAY);
        render();
        saveGame();
    }, CONFIG.DECAY_INTERVAL);

    // HP Logic & Evo Timer (every 3s)
    setInterval(() => {
        if (gameState.isGameOver || gameState.isVictorious) return;
        
        let hpChange = 0;
        if (gameState.hunger > 85 && gameState.happiness > 85) {
            hpChange = CONFIG.GROWTH_HP;
        } else if (gameState.hunger < 50 || gameState.happiness < 50) {
            hpChange = CONFIG.DAMAGE_HP;
        } else {
            hpChange = CONFIG.STABLE_HP;
        }

        updateStat('health', hpChange);

        // Evolution logic
        if (gameState.health >= CONFIG.EVO_HP_THRESHOLD) {
            gameState.evoTimer += 3;
            if (gameState.evoTimer >= CONFIG.EVO_REQUIREMENT_TIME) {
                triggerEvolution();
            }
        } else {
            gameState.evoTimer = 0; // Reset timer if health falls below
        }

        // Death logic
        if (gameState.health <= 0) {
            triggerGameOver();
        }

        render();
        saveGame();
    }, CONFIG.HP_TICK_INTERVAL);
}

function updateStat(stat, amount) {
    gameState[stat] = Math.max(0, Math.min(100, gameState[stat] + amount));
}

function toggleFeedingMode() {
    if (gameState.isGameOver || gameState.isVictorious) return;
    elements.foodItem.classList.toggle('hidden');
}

function enterPettingMode() {
    if (gameState.isGameOver || gameState.isVictorious || gameState.isPettingMode) return;
    
    gameState.isPettingMode = true;
    elements.screen.classList.add('petting-active');
    
    setTimeout(() => {
        gameState.isPettingMode = false;
        elements.screen.classList.remove('petting-active');
    }, 3000);
}

function triggerEvolution() {
    gameState.isVictorious = true;
    gameState.stage = STAGES.STINGMON;
    showOverlay('DIGIVOLVE!', 'Missão Cumprida! Seu Wormmon agora é um Stingmon.');
    elements.btnRestart.classList.remove('hidden');
}

function triggerGameOver() {
    gameState.isGameOver = true;
    gameState.stage = STAGES.DIGIOVO;
    showOverlay('GAME OVER', 'Seu Wormmon retornou ao estado de ovo.');
    elements.btnRestart.classList.remove('hidden');
}

function showOverlay(title, message) {
    elements.overlayTitle.innerText = title;
    elements.overlayMessage.innerText = message;
    elements.overlay.classList.remove('hidden');
}

function restartGame() {
    gameState = {
        stage: STAGES.WORMMON,
        hunger: 100,
        happiness: 100,
        health: 100,
        evoTimer: 0,
        isGameOver: false,
        isVictorious: false,
        isPettingMode: false
    };
    elements.overlay.classList.add('hidden');
    elements.btnRestart.classList.add('hidden');
    elements.foodItem.classList.add('hidden');
    saveGame();
    render();
}

function render() {
    // Update Bars
    elements.hungerBar.style.width = gameState.hunger + '%';
    elements.happinessBar.style.width = gameState.happiness + '%';
    elements.healthBar.style.width = gameState.health + '%';

    // Update Evo Timer display
    elements.evoTimerDisplay.innerText = `EVO: ${gameState.evoTimer}s / ${CONFIG.EVO_REQUIREMENT_TIME}s`;

    // Update Pet Animation & Sprite
    let avg = (gameState.hunger + gameState.happiness) / 2;
    let mood = avg >= 85 ? 'happy' : (avg >= 50 ? 'stable' : 'sad');
    
    elements.petContainer.className = 'pet-sprite';
    
    if (gameState.stage === STAGES.WORMMON) {
        elements.petContainer.innerHTML = PET_SVG_MAP[STAGES.WORMMON][mood];
        elements.petContainer.classList.add(`idle-${mood}`);
    } else if (gameState.stage === STAGES.STINGMON) {
        elements.petContainer.innerHTML = PET_SVG_MAP[STAGES.STINGMON].complete;
        elements.petContainer.classList.add('idle-happy');
    } else if (gameState.stage === STAGES.DIGIOVO) {
        elements.petContainer.innerHTML = PET_SVG_MAP[STAGES.DIGIOVO].dead;
        elements.petContainer.classList.add('idle-sad');
    }
}

function spawnFeedback(text, x, y) {
    const feedback = document.createElement('div');
    feedback.className = 'click-feedback';
    feedback.innerText = text;
    feedback.style.left = `50%`;
    feedback.style.top = `30%`;
    elements.gameArea.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 1000);
}

function saveGame() {
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem(CONFIG.SAVE_KEY);
    if (saved) {
        gameState = JSON.parse(saved);
        if (gameState.isGameOver || gameState.isVictorious) {
            elements.btnRestart.classList.remove('hidden');
        }
    }
}

// Kick off the game
init();
