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
    critTicketUsed: false,
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
    const charLeft = document.getElementById('char-left');
    const charRight = document.getElementById('char-right');
    
    // Always load these images for the demo
    charRight.style.backgroundImage = "url('assets/sena_idle.png')";
    charLeft.style.backgroundImage = "url('assets/goddess.png')";

    if (current.speaker) {
        speakerEl.textContent = current.speaker;
        speakerEl.style.display = 'block';
        
        // Both visible if anyone is speaking in this demo
        charLeft.classList.remove('hidden');
        charRight.classList.remove('hidden');

        if (current.speaker === 'Sena') {
            charRight.classList.add('active-speaker');
            charRight.classList.remove('inactive-speaker');
            charLeft.classList.remove('active-speaker');
            charLeft.classList.add('inactive-speaker');
        } else if (current.speaker === 'Goddess') {
            charLeft.classList.add('active-speaker');
            charLeft.classList.remove('inactive-speaker');
            charRight.classList.remove('active-speaker');
            charRight.classList.add('inactive-speaker');
        } else {
            charLeft.classList.remove('active-speaker');
            charLeft.classList.add('inactive-speaker');
            charRight.classList.remove('active-speaker');
            charRight.classList.add('inactive-speaker');
        }
    } else {
        speakerEl.style.display = 'none';
        charLeft.classList.add('hidden');
        charRight.classList.add('hidden');
    }
    
    textEl.textContent = current.text;
}

// --- Character Creation ---
let statPoints = 5;
let tempStats = { str: 0, dex: 0, int: 0, wis: 0 };

function initCharCreate() {
    ['str', 'dex', 'int', 'wis'].forEach(stat => {
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
        gameState.player.stats.str = tempStats.str;
        gameState.player.stats.dex = tempStats.dex;
        gameState.player.stats.int = tempStats.int;
        gameState.player.stats.wis = tempStats.wis;
        
        activeScript = postCreateScript;
        gameState.storyIndex = -1; // Reset for new script
        switchScreen('story');
        advanceStory();
    });
}

function updateCharCreateUI() {
    document.getElementById('stat-points').textContent = statPoints;
    ['str', 'dex', 'int', 'wis'].forEach(stat => {
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
        gameState.critTicketUsed = false; // Restore crit ticket on rest
        updateHomeUI();
        alert('You slept and recovered all HP! Critical Ticket restored!');
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
    document.getElementById('home-str').textContent = gameState.player.stats.str;
    document.getElementById('home-dex').textContent = gameState.player.stats.dex;
    document.getElementById('home-int').textContent = gameState.player.stats.int;
    document.getElementById('home-wis').textContent = gameState.player.stats.wis;
    
    document.getElementById('inv-orbs').textContent = gameState.inventory.orbs;
    document.getElementById('inv-pots').textContent = gameState.inventory.potions;
}

// --- DnD Battle System ---
let isPlayerTurn = false;
let isBattleProcessing = false;
let critTicketActive = false; // Ticket activated (glowing) - next action is crit

function addLog(msg, type = '') {
    const list = document.getElementById('battle-log-list');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = msg;
    list.appendChild(entry);
    list.scrollTop = list.scrollHeight;
}

// Roll dice visually in center. diceList = [{sides, result}]
function showDiceRoll(diceList, label) {
    return new Promise(resolve => {
        const display = document.getElementById('dice-display');
        const container = document.getElementById('dice-container');
        const resultText = document.getElementById('dice-result-text');
        
        container.innerHTML = '';
        resultText.textContent = 'Rolling...';
        display.classList.remove('hidden');
        
        // Create dice elements rolling
        diceList.forEach(d => {
            const die = document.createElement('div');
            die.className = `die d${d.sides} rolling`;
            die.textContent = '?';
            container.appendChild(die);
        });
        
        // After 800ms stop rolling and show results
        setTimeout(() => {
            const dies = container.querySelectorAll('.die');
            let isCrit = false;
            dies.forEach((die, i) => {
                die.classList.remove('rolling');
                die.textContent = diceList[i].result;
                if (diceList[i].sides === 20 && diceList[i].result === 20) {
                    die.classList.add('crit');
                    isCrit = true;
                }
            });
            resultText.textContent = label;
            if (isCrit) resultText.textContent = '⭐ CRITICAL HIT! ' + label;
            
            setTimeout(() => {
                display.classList.add('hidden');
                resolve(isCrit);
            }, 1200);
        }, 800);
    });
}

function initBattle() {
    document.getElementById('cmd-attack').addEventListener('click', () => handlePlayerAction('attack'));
    document.getElementById('cmd-skill-waterball').addEventListener('click', () => handlePlayerAction('waterball'));
    document.getElementById('cmd-skill-heal').addEventListener('click', () => handlePlayerAction('heal'));
    document.getElementById('cmd-item').addEventListener('click', () => handlePlayerAction('item'));
    document.getElementById('cmd-flee').addEventListener('click', () => handlePlayerAction('flee'));
    
    const critBtn = document.getElementById('cmd-crit-ticket');
    critBtn.addEventListener('click', () => {
        if (gameState.critTicketUsed || critTicketActive) return;
        critTicketActive = true;
        critBtn.classList.add('active');
        critBtn.textContent = '🎟️ ACTIVE - Next action is CRIT!';
        addLog('🎟️ Critical Ticket activated! Next action is guaranteed critical!', 'crit');
    });
}

async function startBattle(isContinue = false) {
    if (!isContinue || !gameState.enemy) {
        gameState.enemy = JSON.parse(JSON.stringify(ENEMY_SLIME));
    }
    isBattleProcessing = true;
    critTicketActive = false;
    
    // Reset crit ticket button
    const critBtn = document.getElementById('cmd-crit-ticket');
    if (gameState.critTicketUsed) {
        critBtn.classList.add('used');
        critBtn.classList.remove('active');
        critBtn.textContent = '🎟️ Critical Ticket (Used)';
        critBtn.setAttribute('disabled', 'true');
    } else {
        critBtn.classList.remove('used', 'active');
        critBtn.textContent = '🎟️ Critical Ticket';
        critBtn.removeAttribute('disabled');
    }
    
    // Clear log
    document.getElementById('battle-log-list').innerHTML = '';
    
    updateBattleUI();
    switchScreen('battle');
    
    addLog(`⚔️ A wild ${gameState.enemy.name} appeared!`, 'system');
    await new Promise(r => setTimeout(r, 800));

    // Initiative Roll
    const playerRoll = rollDice(20);
    const enemyRoll = rollDice(20);
    const playerInit = playerRoll + gameState.player.stats.dex;
    const enemyInit = enemyRoll;
    
    await showDiceRoll(
        [{sides: 20, result: playerRoll}],
        `Initiative: Sena ${playerInit} vs Slime ${enemyInit}`
    );
    
    if (playerInit >= enemyInit) {
        addLog(`Sena goes first! (${playerInit} vs ${enemyInit})`, 'system');
        isPlayerTurn = true;
    } else {
        addLog(`Slime goes first! (${enemyInit} vs ${playerInit})`, 'system');
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
    
    const usedCrit = critTicketActive;
    if (usedCrit) {
        // Consume ticket
        critTicketActive = false;
        gameState.critTicketUsed = true;
        const critBtn = document.getElementById('cmd-crit-ticket');
        critBtn.classList.remove('active');
        critBtn.classList.add('used');
        critBtn.textContent = '🎟️ Critical Ticket (Used)';
        critBtn.setAttribute('disabled', 'true');
    }

    if (action === 'flee') {
        const roll = rollDice(20);
        const total = roll + gameState.player.stats.dex;
        await showDiceRoll([{sides: 20, result: roll}], `Flee: ${roll} + DEX(${gameState.player.stats.dex}) = ${total} vs DC 5`);
        
        if (total > 5) {
            addLog(`Sena fled successfully! (${total} > 5)`, 'player');
            setTimeout(() => {
                updateHomeUI();
                switchScreen('home');
            }, 1500);
            return;
        } else {
            addLog(`Failed to flee! (${total} ≤ 5)`, 'player');
        }
    } 
    else if (action === 'attack') {
        const atkRoll = usedCrit ? 20 : rollDice(20);
        const isCrit = atkRoll === 20;
        await showDiceRoll([{sides: 20, result: atkRoll}], `Atk Roll: ${atkRoll} vs AC ${gameState.enemy.ac}`);
        
        if (atkRoll >= gameState.enemy.ac) {
            const baseDmg = rollDice(4) + gameState.player.stats.str;
            const dmg = isCrit ? baseDmg * 2 : baseDmg;
            gameState.enemy.hp -= dmg;
            if (isCrit) {
                addLog(`💥 CRITICAL HIT! Dealt ${dmg} dmg (${baseDmg} × 2)!`, 'crit');
            } else {
                addLog(`Sena hit for ${dmg} dmg (1d4+STR).`, 'player');
            }
        } else {
            addLog(`Sena missed! (${atkRoll} < AC ${gameState.enemy.ac})`, 'player');
        }
    }
    else if (action === 'waterball') {
        const r1 = usedCrit ? 8 : rollDice(8);
        const baseDmg = r1 + gameState.player.stats.int;
        const dmg = usedCrit ? baseDmg * 2 : baseDmg;
        await showDiceRoll([{sides: 8, result: r1}], `Waterball: ${r1} + INT(${gameState.player.stats.int}) = ${dmg} dmg${usedCrit ? ' ×2 CRIT' : ''}`);
        gameState.enemy.hp -= dmg;
        if (usedCrit) {
            addLog(`💥 CRIT Waterball for ${dmg} dmg!`, 'crit');
        } else {
            addLog(`Waterball hit for ${dmg} dmg!`, 'player');
        }
    }
    else if (action === 'heal') {
        const r1 = rollDice(8);
        const r2 = rollDice(8);
        const baseHeal = r1 + r2 + gameState.player.stats.wis;
        const heal = usedCrit ? baseHeal * 2 : baseHeal;
        await showDiceRoll([{sides: 8, result: r1}, {sides: 8, result: r2}], `Heal: ${r1}+${r2}+WIS(${gameState.player.stats.wis}) = ${heal} HP${usedCrit ? ' ×2 CRIT' : ''}`);
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + heal);
        if (usedCrit) {
            addLog(`💥 CRIT Heal! Sena recovered ${heal} HP!`, 'crit');
        } else {
            addLog(`Sena healed ${heal} HP (2d8+WIS).`, 'player');
        }
    }
    else if (action === 'item') {
        if (gameState.inventory.potions > 0) {
            gameState.inventory.potions--;
            gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + 10);
            addLog(`Used HP Potion! Recovered 10 HP.`, 'player');
        } else {
            addLog(`No potions left!`, 'system');
            isBattleProcessing = false;
            return;
        }
    }

    updateBattleUI();
    setTimeout(checkBattleState, 1500);
}

async function enemyTurn() {
    addLog(`Slime is attacking...`, 'enemy');
    await new Promise(r => setTimeout(r, 600));
    
    const atkRoll = rollDice(20);
    await showDiceRoll([{sides: 20, result: atkRoll}], `Slime Atk: ${atkRoll} vs AC ${gameState.player.ac}`);
    
    if (atkRoll >= gameState.player.ac) {
        const dmgRoll = rollDice(gameState.enemy.attackDie);
        await showDiceRoll([{sides: gameState.enemy.attackDie, result: dmgRoll}], `Slime Dmg: ${dmgRoll}`);
        gameState.player.hp -= dmgRoll;
        addLog(`Slime hit Sena for ${dmgRoll} dmg!`, 'enemy');
    } else {
        addLog(`Slime missed! (${atkRoll} < AC ${gameState.player.ac})`, 'enemy');
    }
    
    updateBattleUI();
    setTimeout(checkBattleState, 1000);
}

function checkBattleState() {
    if (gameState.enemy.hp <= 0) {
        addLog(`🏆 Victory! ${gameState.enemy.name} defeated! Got 1 Slime Orb.`, 'system');
        gameState.inventory.orbs++;
        setTimeout(() => {
            updateHomeUI();
            switchScreen('home');
        }, 2500);
    } else if (gameState.player.hp <= 0) {
        addLog(`💀 Sena was defeated...`, 'system');
        setTimeout(() => {
            gameState.player.hp = 1;
            updateHomeUI();
            switchScreen('home');
            alert('Sena fainted and woke up at home...');
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
