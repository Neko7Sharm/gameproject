// Game State
const gameState = {
    screen: 'menu', // menu, story, battle
    storyIndex: 0,
    player: {
        hp: 100,
        maxHp: 100,
        mp: 20,
        maxMp: 20,
        attack: 15
    },
    enemy: null // Will be populated when battle starts
};

const ENEMY_SLIME = {
    name: 'Slime',
    hp: 50,
    maxHp: 50,
    attack: 5
};

// Story Data
const storyScript = [
    { speaker: '', text: 'You wake up in a peaceful green field.' },
    { speaker: 'Hero', text: 'Where am I? And why do I feel like I need to fight something?' },
    { speaker: 'System', text: 'Welcome to the world! A wild Slime approaches!' },
    { action: 'start_battle' }
];

// DOM Elements
const screens = {
    menu: document.getElementById('screen-menu'),
    story: document.getElementById('screen-story'),
    battle: document.getElementById('screen-battle')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initStory();
    initBattle();
    loadSaveData();
});

// Utility
function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    setTimeout(() => {
        Object.values(screens).forEach(s => s.classList.add('hidden'));
        screens[screenName].classList.remove('hidden');
        // Small delay to allow display:flex to apply before opacity transition
        setTimeout(() => {
            screens[screenName].classList.add('active');
        }, 50);
    }, 300); // Wait for fade out
    gameState.screen = screenName;
    saveGame();
}

function saveGame() {
    localStorage.setItem('neko7_save', JSON.stringify(gameState));
    checkContinueButton();
}

function loadSaveData() {
    const saved = localStorage.getItem('neko7_save');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Quick validation
            if (parsed.screen) {
                // For simplicity in this demo, if saved state is menu, keep it. 
                // If it was story/battle, let them continue.
            }
        } catch (e) {
            console.error("Save file corrupted");
        }
    }
    checkContinueButton();
}

function checkContinueButton() {
    const btnContinue = document.getElementById('btn-continue');
    if (localStorage.getItem('neko7_save')) {
        btnContinue.removeAttribute('disabled');
    } else {
        btnContinue.setAttribute('disabled', 'true');
    }
}

// --- Menu System ---
function initMenu() {
    document.getElementById('btn-start').addEventListener('click', () => {
        // Reset game state for new game
        gameState.storyIndex = 0;
        gameState.player.hp = gameState.player.maxHp;
        gameState.player.mp = gameState.player.maxMp;
        startStory();
    });

    document.getElementById('btn-continue').addEventListener('click', () => {
        const saved = JSON.parse(localStorage.getItem('neko7_save'));
        if (saved) {
            Object.assign(gameState, saved);
            if (gameState.screen === 'story') {
                startStory(true);
            } else if (gameState.screen === 'battle') {
                startBattle(true);
            } else {
                switchScreen('menu');
            }
        }
    });

    // Settings Modal
    const modalSettings = document.getElementById('modal-settings');
    document.getElementById('btn-settings').addEventListener('click', () => {
        modalSettings.classList.remove('hidden');
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => {
        modalSettings.classList.add('hidden');
    });
}

// --- Story System ---
function initStory() {
    document.getElementById('dialogue-box').addEventListener('click', advanceStory);
}

function startStory(isContinue = false) {
    if (!isContinue) gameState.storyIndex = 0;
    switchScreen('story');
    showDialogue();
}

function advanceStory() {
    gameState.storyIndex++;
    if (gameState.storyIndex >= storyScript.length) return;
    
    const current = storyScript[gameState.storyIndex];
    if (current.action === 'start_battle') {
        startBattle();
    } else {
        showDialogue();
        saveGame();
    }
}

function showDialogue() {
    const current = storyScript[gameState.storyIndex];
    const speakerEl = document.getElementById('speaker-name');
    const textEl = document.getElementById('dialogue-text');
    
    if (current.speaker) {
        speakerEl.textContent = current.speaker;
        speakerEl.style.display = 'block';
    } else {
        speakerEl.style.display = 'none';
    }
    
    textEl.textContent = current.text;
}

// --- Battle System ---
let isPlayerTurn = true;
let isBattleProcessing = false;

function initBattle() {
    document.getElementById('cmd-attack').addEventListener('click', () => handlePlayerAction('attack'));
    document.getElementById('cmd-skill').addEventListener('click', () => handlePlayerAction('skill'));
    document.getElementById('cmd-flee').addEventListener('click', () => handlePlayerAction('flee'));
}

function startBattle(isContinue = false) {
    if (!isContinue || !gameState.enemy) {
        gameState.enemy = JSON.parse(JSON.stringify(ENEMY_SLIME)); // Clone enemy data
    }
    isPlayerTurn = true;
    isBattleProcessing = false;
    updateBattleUI();
    switchScreen('battle');
    showBattleLog(`A wild ${gameState.enemy.name} appeared!`);
}

function updateBattleUI() {
    // Player
    document.getElementById('player-hp-text').textContent = `${gameState.player.hp}/${gameState.player.maxHp}`;
    document.getElementById('player-hp-fill').style.width = `${(gameState.player.hp / gameState.player.maxHp) * 100}%`;
    document.getElementById('player-mp-text').textContent = `${gameState.player.mp}/${gameState.player.maxMp}`;
    document.getElementById('player-mp-fill').style.width = `${(gameState.player.mp / gameState.player.maxMp) * 100}%`;
    
    // Enemy
    const enemyHpPercent = (gameState.enemy.hp / gameState.enemy.maxHp) * 100;
    document.getElementById('enemy-hp-fill').style.width = `${Math.max(0, enemyHpPercent)}%`;
}

function showBattleLog(msg) {
    const logEl = document.getElementById('battle-log');
    logEl.textContent = msg;
    logEl.classList.add('show');
    setTimeout(() => logEl.classList.remove('show'), 2000);
}

function handlePlayerAction(action) {
    if (!isPlayerTurn || isBattleProcessing) return;
    isBattleProcessing = true;

    if (action === 'attack') {
        const damage = Math.floor(Math.random() * 5) + gameState.player.attack;
        gameState.enemy.hp -= damage;
        showBattleLog(`You hit ${gameState.enemy.name} for ${damage} dmg!`);
        updateBattleUI();
        
        setTimeout(checkBattleState, 1500);
    } else if (action === 'skill') {
        if (gameState.player.mp >= 5) {
            gameState.player.mp -= 5;
            const damage = Math.floor(Math.random() * 10) + gameState.player.attack * 2;
            gameState.enemy.hp -= damage;
            showBattleLog(`You used Power Strike for ${damage} dmg!`);
            updateBattleUI();
            setTimeout(checkBattleState, 1500);
        } else {
            showBattleLog(`Not enough MP!`);
            isBattleProcessing = false;
        }
    } else if (action === 'flee') {
        showBattleLog(`You ran away...`);
        setTimeout(() => {
            switchScreen('menu');
            // clear save or handle retreat state
            localStorage.removeItem('neko7_save');
        }, 1500);
    }
}

function enemyTurn() {
    showBattleLog(`${gameState.enemy.name} attacks!`);
    setTimeout(() => {
        const damage = Math.floor(Math.random() * 3) + gameState.enemy.attack;
        gameState.player.hp -= damage;
        showBattleLog(`You took ${damage} dmg!`);
        updateBattleUI();
        
        setTimeout(checkBattleState, 1500);
    }, 1500);
}

function checkBattleState() {
    if (gameState.enemy.hp <= 0) {
        showBattleLog(`You defeated the ${gameState.enemy.name}!`);
        setTimeout(() => {
            alert('Congratulations! You completed the first demo battle.');
            localStorage.removeItem('neko7_save');
            switchScreen('menu');
        }, 2000);
    } else if (gameState.player.hp <= 0) {
        showBattleLog(`You were defeated...`);
        setTimeout(() => {
            localStorage.removeItem('neko7_save');
            switchScreen('menu');
        }, 2000);
    } else {
        // Toggle turn
        isPlayerTurn = !isPlayerTurn;
        isBattleProcessing = false;
        
        if (!isPlayerTurn) {
            isBattleProcessing = true;
            enemyTurn();
        }
    }
}
