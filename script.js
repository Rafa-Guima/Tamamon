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
    [STAGES.WORMMON]: {
        happy: 'Joyfull-Wormmon.png',
        stable: 'Neutral-Wormmon.png',
        sad: 'Sad-Wormmon.png'
    },
    [STAGES.STINGMON]: 'Stingmon.png',
    [STAGES.DIGIOVO]: 'DigiOvo.png'
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
    clickFeedback: document.getElementById('click-feedback'),
    evoTimerDisplay: document.getElementById('evo-timer-display'),
    notification: document.getElementById('notification'),
    gameArea: document.getElementById('game-area'),
    bgMusic: document.getElementById('bg-music')
};

// Initialization
function init() {
    loadGame();
    setupEventListeners();
    setupAudio();
    startGameLoops();
    render();
}

function setupAudio() {
    // Attempt to play audio on the first user interaction anywhere on the screen
    const playAudio = () => {
        elements.bgMusic.volume = 0.3; // Make it a bit lower volume so it's not deafening
        elements.bgMusic.play().catch(e => console.log('Audio autoplay prevented'));
        document.body.removeEventListener('click', playAudio);
    };
    document.body.addEventListener('click', playAudio);
}

function setupEventListeners() {
    // Buttons
    elements.btnFeed.addEventListener('click', spawnFood);
    elements.btnPet.addEventListener('click', enterPettingMode);
    elements.btnRestart.addEventListener('click', restartGame);

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
        
        if (gameState.hunger <= 0 || gameState.happiness <= 0) {
            triggerGameOver();
        }

        render();
        saveGame();
    }, CONFIG.DECAY_INTERVAL);

    // HP Logic & Evo Timer (every 3s)
    setInterval(() => {
        if (gameState.isGameOver || gameState.isVictorious) return;
        
        if (gameState.hunger <= 0 || gameState.happiness <= 0) {
            triggerGameOver();
            render();
            saveGame();
            return;
        }

        let hpChange = 0;
        if (gameState.hunger > 85 && gameState.happiness > 85) {
            hpChange = CONFIG.GROWTH_HP;
        } else if (gameState.hunger < 50 || gameState.happiness < 50) {
            let penalty = 0;
            if (gameState.hunger < 50) penalty += Math.floor((50 - gameState.hunger) / 10) + 1;
            if (gameState.happiness < 50) penalty += Math.floor((50 - gameState.happiness) / 10) + 1;
            hpChange = -penalty;
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

function spawnFood() {
    if (gameState.isGameOver || gameState.isVictorious) return;
    
    const food = document.createElement('div');
    food.className = 'food-item';
    food.innerHTML = `
        <svg viewBox="0 0 100 100" width="40" height="40">
            <circle cx="50" cy="60" r="30" fill="#f39c12" />
            <rect x="35" y="30" width="30" height="30" fill="#e67e22" rx="5" />
            <circle cx="45" cy="45" r="5" fill="#d35400" />
            <circle cx="55" cy="50" r="5" fill="#d35400" />
        </svg>
    `;
    
    const randomX = Math.floor(Math.random() * 80) + 10;
    const randomY = Math.floor(Math.random() * 60) + 20;
    
    food.style.left = `${randomX}%`;
    food.style.top = `${randomY}%`;
    
    food.addEventListener('click', (e) => {
        if (gameState.isGameOver || gameState.isVictorious) return;
        updateStat('hunger', CONFIG.FOOD_RESTORE);
        spawnFeedback('DELÍCIA!', e.clientX, e.clientY);
        food.remove();
        saveGame();
        render();
    });
    
    elements.gameArea.appendChild(food);
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
        elements.btnRestart.title = "Reiniciar"; // Ensures tooltip still shows
        render();
        saveGame();
    }, 4000); // 4 seconds of flash/animation
}

function triggerGameOver() {
    gameState.isGameOver = true;
    gameState.stage = STAGES.DIGIOVO;
    showNotification('GAME OVER<br>SEU WORMMON RETORNOU AO ESTADO DE OVO.');
}

function showNotification(message) {
    elements.notification.innerHTML = message;
    elements.notification.classList.remove('hidden');
}

function restartGame() {
    if (!gameState.isGameOver && !gameState.isVictorious) {
        if (!confirm("Tem certeza que deseja reiniciar o jogo? O progresso será perdido.")) {
            return;
        }
    }
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
    elements.notification.classList.add('hidden');
    document.querySelectorAll('.food-item').forEach(el => el.remove());
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
    
    // Get correct image source based on stage and mood
    let imgSrc = PET_ASSETS[gameState.stage];
    if (gameState.stage === STAGES.WORMMON) {
        imgSrc = PET_ASSETS[STAGES.WORMMON][mood];
    }

    // Clear innerHTML since we use IMG now
    elements.petContainer.innerHTML = `<img src="${imgSrc}" alt="${gameState.stage}" style="width:100%; height:100%; border-radius:10px; object-fit: contain;">`;
    
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
        if (gameState.isEvolving) {
            gameState.isEvolving = false;
        }
        if (gameState.isGameOver || gameState.isVictorious) {
            // Keep game over state rendered instead of handling button visibility here
        }
    }
}

// Kick off the game
init();
