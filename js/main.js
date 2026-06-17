// --- Game State ---
const defaultState = {
    screen: 'menu',
    storyIndex: 0,
    player: {
        hp: 20,
        maxHp: 20,
        ac: 1,
        stats: {
            str: 0,
            dex: 0,
            int: 0,
            wis: 0,
            con: 0
        },
        element: 'Water'
    },
    inventory: {
        orbs: 0,
        potions: 0
    },
    enemy: null
};

let gameState = JSON.parse(JSON.stringify(defaultState));

const ENEMY_SLIME = {
    name: 'Slime',
    hp: 10,
    maxHp: 10,
    ac: 1,
    attackDie: 4,
    drop: { item: 'orb', amount: 1 }
};

// --- Story Data ---
const storyScript = [
    { speaker: '', text: 'You slowly open your eyes. Everything is bright and hazy...' },
    { speaker: 'Sena', text: 'Where... where am I? Am I... dead?' },
    { speaker: 'Goddess', text: 'Welcome, gentle soul. You have been chosen to be reborn in a new world.' },
    { speaker: 'Goddess', text: 'Before you go, you must configure your new body and choose your magic.' },
    { action: 'char_create' }
];

const postCreateScript = [
    { speaker: 'Goddess', text: 'It is done. I have gifted you an abandoned house near the forest as a starting point.' },
    { speaker: 'Goddess', text: 'May you find peace and joy in this new life, Sena.' },
    { action: 'go_home' }
];

let activeScript = storyScript;

// --- DOM Elements ---
const screens = {
    menu: document.getElementById('screen-menu'),
    story: document.getElementById('screen-story'),
    charCreate: document.getElementById('screen-char-create'),
    home: document.getElementById('screen-home'),
    battle: document.getElementById('screen-battle')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initStory();
    initCharCreate();
    initHome();
    initBattle();
    loadSaveData();
});

// --- Utility & Systems ---
function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    setTimeout(() => {
        Object.values(screens).forEach(s => s.classList.add('hidden'));
        screens[screenName].classList.remove('hidden');
        setTimeout(() => {
            screens[screenName].classList.add('active');
        }, 50);
    }, 300);
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
        checkContinueButton();
    }
}

function checkContinueButton() {
    const btnContinue = document.getElementById('btn-continue');
    if (localStorage.getItem('neko7_save')) {
        btnContinue.removeAttribute('disabled');
    } else {
        btnContinue.setAttribute('disabled', 'true');
    }
}

// DnD Dice Roller
function rollDice(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

function showDiceRoll(text, duration = 1500) {
    return new Promise(resolve => {
        const overlay = document.getElementById('dice-overlay');
        const textEl = document.getElementById('dice-text');
        
        overlay.classList.remove('hidden');
        overlay.classList.remove('resolved');
        textEl.textContent = 'Rolling...';
        
        setTimeout(() => {
            overlay.classList.add('resolved');
            textEl.textContent = text;
            setTimeout(() => {
                overlay.classList.add('hidden');
                resolve();
            }, duration);
        }, 800); // 800ms rolling animation
    });
}

function showLog(msg, isBattle = false) {
    const logEl = isBattle ? document.getElementById('battle-log') : document.getElementById('battle-log'); // Using same for now
    logEl.textContent = msg;
    logEl.classList.add('show');
    setTimeout(() => logEl.classList.remove('show'), 2000);
}

// --- Menu System ---
function initMenu() {
    document.getElementById('btn-start').addEventListener('click', () => {
        gameState = JSON.parse(JSON.stringify(defaultState));
        activeScript = storyScript;
        startStory();
    });

    document.getElementById('btn-continue').addEventListener('click', () => {
        const saved = JSON.parse(localStorage.getItem('neko7_save'));
        if (saved) {
            gameState = saved;
            if (gameState.screen === 'story') {
                activeScript = storyScript; // In a real game, save which script is active
                startStory(true);
            } else if (gameState.screen === 'home') {
                updateHomeUI();
                switchScreen('home');
            } else if (gameState.screen === 'battle') {
                startBattle(true);
            } else {
                switchScreen('menu');
            }
        }
    });

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
    if (gameState.storyIndex >= activeScript.length) return;
    
    const current = activeScript[gameState.storyIndex];
    if (current.action === 'char_create') {
        switchScreen('charCreate');
    } else if (current.action === 'go_home') {
        updateHomeUI();
        switchScreen('home');
    } else {
        showDialogue();
        saveGame();
    }
}

function showDialogue() {
    const current = activeScript[gameState.storyIndex];
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

// --- Character Creation ---
let statPoints = 5;
let tempStats = { dex: 0, int: 0, wis: 0 };

function initCharCreate() {
    ['dex', 'int', 'wis'].forEach(stat => {
        document.getElementById(`btn-inc-${stat}`).addEventListener('click', () => {
            if (statPoints > 0) {
                tempStats[stat]++;
                statPoints--;
                updateCharCreateUI();
            }
        });
        document.getElementById(`btn-dec-${stat}`).addEventListener('click', () => {
            if (tempStats[stat] > 0) {
                tempStats[stat]--;
                statPoints++;
                updateCharCreateUI();
            }
        });
    });

    document.getElementById('btn-confirm-char').addEventListener('click', () => {
        gameState.player.stats.dex = tempStats.dex;
        gameState.player.stats.int = tempStats.int;
        gameState.player.stats.wis = tempStats.wis;
        
        activeScript = postCreateScript;
        gameState.storyIndex = -1; // Reset for new script
        advanceStory();
    });
}

function updateCharCreateUI() {
    document.getElementById('stat-points').textContent = statPoints;
    ['dex', 'int', 'wis'].forEach(stat => {
        document.getElementById(`val-${stat}`).textContent = tempStats[stat];
    });
    
    const confirmBtn = document.getElementById('btn-confirm-char');
    if (statPoints === 0) {
        confirmBtn.removeAttribute('disabled');
    } else {
        confirmBtn.setAttribute('disabled', 'true');
    }
}

// --- Home Base ---
function initHome() {
    document.getElementById('btn-home-sleep').addEventListener('click', () => {
        gameState.player.hp = gameState.player.maxHp;
        updateHomeUI();
        alert('You slept and recovered all HP!');
        saveGame();
    });

    const modalCrafting = document.getElementById('modal-crafting');
    document.getElementById('btn-home-craft').addEventListener('click', () => {
        document.getElementById('craft-orbs').textContent = gameState.inventory.orbs;
        modalCrafting.classList.remove('hidden');
    });

    document.getElementById('btn-close-crafting').addEventListener('click', () => {
        modalCrafting.classList.add('hidden');
    });

    document.getElementById('btn-craft-potion').addEventListener('click', () => {
        if (gameState.inventory.orbs > 0) {
            gameState.inventory.orbs--;
            gameState.inventory.potions++;
            document.getElementById('craft-orbs').textContent = gameState.inventory.orbs;
            updateHomeUI();
            saveGame();
            alert('Crafted 1 HP Potion!');
        } else {
            alert('Not enough Slime Orbs!');
        }
    });

    document.getElementById('btn-home-forest').addEventListener('click', () => {
        startBattle();
    });
}

function updateHomeUI() {
    document.getElementById('home-hp').textContent = `${gameState.player.hp}/${gameState.player.maxHp}`;
    document.getElementById('home-dex').textContent = gameState.player.stats.dex;
    document.getElementById('home-int').textContent = gameState.player.stats.int;
    document.getElementById('home-wis').textContent = gameState.player.stats.wis;
    
    document.getElementById('inv-orbs').textContent = gameState.inventory.orbs;
    document.getElementById('inv-pots').textContent = gameState.inventory.potions;
}

// --- DnD Battle System ---
let isPlayerTurn = false;
let isBattleProcessing = false;

function initBattle() {
    document.getElementById('cmd-attack').addEventListener('click', () => handlePlayerAction('attack'));
    document.getElementById('cmd-skill-waterball').addEventListener('click', () => handlePlayerAction('waterball'));
    document.getElementById('cmd-skill-heal').addEventListener('click', () => handlePlayerAction('heal'));
    document.getElementById('cmd-item').addEventListener('click', () => handlePlayerAction('item'));
    document.getElementById('cmd-flee').addEventListener('click', () => handlePlayerAction('flee'));
}

async function startBattle(isContinue = false) {
    if (!isContinue || !gameState.enemy) {
        gameState.enemy = JSON.parse(JSON.stringify(ENEMY_SLIME));
    }
    isBattleProcessing = true;
    updateBattleUI();
    switchScreen('battle');
    
    showLog(`A wild ${gameState.enemy.name} appeared!`, true);
    await new Promise(r => setTimeout(r, 1500));

    // Initiative Roll
    const playerInit = rollDice(20) + gameState.player.stats.dex;
    const enemyInit = rollDice(20); // Slime dex 0
    
    await showDiceRoll(`Init: Sena(${playerInit}) vs Slime(${enemyInit})`);
    
    if (playerInit >= enemyInit) {
        showLog('Sena goes first!', true);
        isPlayerTurn = true;
    } else {
        showLog('Slime goes first!', true);
        isPlayerTurn = false;
    }
    
    isBattleProcessing = false;
    if (!isPlayerTurn) enemyTurn();
}

function updateBattleUI() {
    // Player
    document.getElementById('player-hp-text').textContent = `${gameState.player.hp}/${gameState.player.maxHp}`;
    document.getElementById('player-hp-fill').style.width = `${(gameState.player.hp / gameState.player.maxHp) * 100}%`;
    document.getElementById('battle-potions').textContent = gameState.inventory.potions;
    
    // Enemy
    document.getElementById('enemy-hp-text').textContent = `${gameState.enemy.hp}/${gameState.enemy.maxHp}`;
    const enemyHpPercent = (gameState.enemy.hp / gameState.enemy.maxHp) * 100;
    document.getElementById('enemy-hp-fill').style.width = `${Math.max(0, enemyHpPercent)}%`;
}

async function handlePlayerAction(action) {
    if (!isPlayerTurn || isBattleProcessing) return;
    isBattleProcessing = true;

    if (action === 'flee') {
        const roll = rollDice(20);
        const total = roll + gameState.player.stats.dex;
        await showDiceRoll(`Flee: d20(${roll}) + DEX(${gameState.player.stats.dex}) = ${total}`);
        
        if (total > 5) {
            showLog('Escaped successfully!', true);
            setTimeout(() => {
                updateHomeUI();
                switchScreen('home');
            }, 1500);
            return;
        } else {
            showLog('Failed to escape!', true);
        }
    } 
    else if (action === 'attack') {
        const atkRoll = rollDice(20);
        await showDiceRoll(`Atk Roll: d20(${atkRoll}) vs AC ${gameState.enemy.ac}`);
        
        if (atkRoll >= gameState.enemy.ac) {
            const dmg = rollDice(4); // Basic dagger/weapon
            gameState.enemy.hp -= dmg;
            showLog(`Hit! Dealt ${dmg} dmg.`, true);
        } else {
            showLog('Missed!', true);
        }
    }
    else if (action === 'waterball') {
        // Assume magic hits automatically or needs save, let's say it just hits for now
        const dmg = rollDice(8) + gameState.player.stats.int;
        await showDiceRoll(`Waterball: d8 + INT = ${dmg} dmg`);
        gameState.enemy.hp -= dmg;
        showLog(`Waterball hit for ${dmg} dmg!`, true);
    }
    else if (action === 'heal') {
        const heal = rollDice(8) + rollDice(8) + gameState.player.stats.wis;
        await showDiceRoll(`Heal: 2d8 + WIS = ${heal} HP`);
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + heal);
        showLog(`Sena recovered ${heal} HP!`, true);
    }
    else if (action === 'item') {
        if (gameState.inventory.potions > 0) {
            gameState.inventory.potions--;
            gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + 10);
            showLog(`Used Potion! Recovered 10 HP.`, true);
        } else {
            showLog(`No potions left!`, true);
            isBattleProcessing = false;
            return; // Don't end turn
        }
    }

    updateBattleUI();
    setTimeout(checkBattleState, 1500);
}

async function enemyTurn() {
    showLog(`${gameState.enemy.name} attacks!`, true);
    await new Promise(r => setTimeout(r, 1000));
    
    const atkRoll = rollDice(20);
    await showDiceRoll(`Slime Atk: d20(${atkRoll}) vs AC ${gameState.player.ac}`);
    
    if (atkRoll >= gameState.player.ac) {
        const dmg = rollDice(gameState.enemy.attackDie);
        gameState.player.hp -= dmg;
        showLog(`Slime hit Sena for ${dmg} dmg!`, true);
    } else {
        showLog(`Slime missed!`, true);
    }
    
    updateBattleUI();
    setTimeout(checkBattleState, 1500);
}

function checkBattleState() {
    if (gameState.enemy.hp <= 0) {
        showLog(`Victory! Slime dropped 1 Slime Orb.`, true);
        gameState.inventory.orbs++;
        setTimeout(() => {
            updateHomeUI();
            switchScreen('home');
        }, 2000);
    } else if (gameState.player.hp <= 0) {
        showLog(`Sena was defeated...`, true);
        setTimeout(() => {
            // Respawn at home with 1 HP for this demo
            gameState.player.hp = 1;
            updateHomeUI();
            switchScreen('home');
            alert('You fainted and woke up at home...');
        }, 2000);
    } else {
        isPlayerTurn = !isPlayerTurn;
        isBattleProcessing = false;
        
        if (!isPlayerTurn) {
            isBattleProcessing = true;
            enemyTurn();
        }
    }
}
