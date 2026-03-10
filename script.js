/**
 * Digital Worm (V-Pet Style)
 * Main Logic
 */

const CONFIG = {
    DECAY_INTERVAL: 5000,
    HP_TICK_INTERVAL: 3000,
    HUNGER_DECAY: 2,
    HAPPINESS_DECAY: 3,
    GROWTH_HP: 1,
    STABLE_HP: 0,
    DAMAGE_HP: -2,
    FOOD_RESTORE: 15,
    PET_RESTORE: 2,
    EVO_REQUIREMENT_TIME: 180, 
    EVO_HP_THRESHOLD: 90,
    SAVE_KEY: 'digital_worm_save_v1'
};

const STAGES = {
    WORMMON: 'wormmon',
    STINGMON: 'stingmon',
    DIGIOVO: 'digiovo'
};

const PET_ASSETS = {
    [STAGES.WORMMON]: 'wormmon.jpg',
    [STAGES.STINGMON]: 'stingmon.png',
    [STAGES.DIGIOVO]: 'digiovo.png'
};

let gameState = {
    stage: STAGES.WORMMON,
    hunger: 100,
    happiness: 100,
    health: 100,
    evoTimer: 0,
    isGameOver: false,
    isVictorious: false,
    isPettingMode: false,
    isEvolving: false
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
    if (gameState.isEvolving || gameState.isVictorious) return;
    
    gameState.isEvolving = true;
    elements.screen.classList.add('evolution-sequence');
    
    // Play "Evo" animation
    setTimeout(() => {
        gameState.isVictorious = true;
        gameState.stage = STAGES.STINGMON;
        gameState.isEvolving = false;
        elements.screen.classList.remove('evolution-sequence');
        showOverlay('DIGIVOLVE!', 'Missão Cumprida! Seu Wormmon agora é um Stingmon.');
        elements.btnRestart.classList.remove('hidden');
        render();
        saveGame();
    }, 4000); // 4 seconds of flash/animation
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
    
    // Clear innerHTML since we use IMG now
    elements.petContainer.innerHTML = `<img src="${PET_ASSETS[gameState.stage]}" alt="${gameState.stage}" style="width:100%; height:100%; border-radius:10px; object-fit: contain;">`;
    
    elements.petContainer.className = 'pet-sprite';
    elements.petContainer.classList.add(`idle-${mood}`);
    
    if (gameState.isEvolving) {
        elements.petContainer.classList.add('evolving-shake');
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
