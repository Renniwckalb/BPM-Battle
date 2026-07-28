import Grid from './grid.js';
import Player from './player.js';

// --- INITIALISATION DU CANVAS ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- VARIABLES GLOBALES DU JEU ---
let gameState = "menu"; // "menu", "playing", "end"
let gameMode = null;    // "ai" ou "pvp"
let actionActuelle = null;
let isResolving = false;
let p1Action = null;
let p2Action = null;

// Variables Réseau (PeerJS)
let peer = null;
let conn = null;
let myRole = null; 
let localActionReady = false;
let remoteActionReady = false;

// --- CRÉATION DES GRILLES ET JOUEURS ---
let myCellSize = canvas.width / 5;
let oppCellSize = canvas.width / 7;
let myGridX = (canvas.width - (myCellSize * 3)) / 2;
let oppGridX = (canvas.width - (oppCellSize * 3)) / 2;
let myGridY = canvas.height - (myCellSize * 3) - ((canvas.height/100) * 15);
let oppGridY = canvas.height - ((canvas.height/100) * 90);

let gridPlayer1 = new Grid(myGridX, myGridY, myCellSize, "#4CAF50");
let gridPlayer2 = new Grid(oppGridX, oppGridY, oppCellSize, "#F44336");
let p1 = new Player(gridPlayer1, 1, 1, "#2196F3");
let p2 = new Player(gridPlayer2, 1, 1, "#FF9800");

// --- ELEMENTS DU DOM ---
const mainMenu = document.getElementById("main-menu");
const endScreen = document.getElementById("end-screen");
const endMessage = document.getElementById("end-message");
const btnRestart = document.getElementById("btn-restart");
const boutons = document.querySelectorAll(".btn-action");

const btnAI = document.getElementById("btn-ai");
const btnHost = document.getElementById("btn-host");
const btnJoin = document.getElementById("btn-join");
const codeDisplay = document.getElementById("room-code-display");
const inputJoin = document.getElementById("input-join-code");

// --- GESTION DU MENU ---
btnAI.addEventListener("click", () => {
    gameMode = "ai";
    startGame("p1");
});

btnHost.addEventListener("click", () => {
    gameMode = "pvp";
    let code = Math.floor(1000 + Math.random() * 9000).toString(); 
    peer = new Peer('bpm-' + code);
    
    peer.on('open', (id) => {
        codeDisplay.style.display = "block";
        codeDisplay.innerText = "Code de la salle : " + code + "\nEn attente d'un adversaire...";
        btnHost.style.display = "none";
        btnAI.style.display = "none"; // Cache les autres options
    });

    peer.on('connection', (connection) => {
        conn = connection;
        setupNetworkListener();
        startGame("p1");
    });
});

btnJoin.addEventListener("click", () => {
    gameMode = "pvp";
    let code = inputJoin.value;
    if (!code) return;

    peer = new Peer();
    peer.on('open', (id) => {
        conn = peer.connect('bpm-' + code);
        conn.on('open', () => {
            setupNetworkListener();
            startGame("p2");
        });
    });
});

btnRestart.addEventListener("click", () => {
    resetGame();
    endScreen.style.display = "none";
    
    if (gameMode === "pvp") {
        // En PvP, on attend que l'autre soit prêt ou on relance direct
        gameState = "playing"; 
    } else {
        gameState = "playing";
    }
});

function startGame(role) {
    myRole = role;
    mainMenu.style.display = "none";
    gameState = "playing";
    console.log("Connecté en tant que : " + myRole);
}

function setupNetworkListener() {
    conn.on('data', (data) => {
        if (myRole === "p1") p2Action = data; 
        if (myRole === "p2") p1Action = data;
        remoteActionReady = true;
        checkBothReady();
    });
}

// --- GESTION DE L'INTERFACE EN JEU ---
boutons.forEach(bouton => {
    bouton.addEventListener("click", (e) => {
        boutons.forEach(b => b.classList.remove("actif"));
        e.target.classList.add("actif");
        actionActuelle = e.target.getAttribute("data-action");

        gridPlayer1.selectedCol = -1;
        gridPlayer1.selectedRow = -1;
        gridPlayer2.selectedCol = -1;
        gridPlayer2.selectedRow = -1;
    });
});

function updateUI() {
    document.getElementById("energy-p1").innerText = p1.energy;
    document.getElementById("energy-p2").innerText = p2.energy;

    const p1Hearts = document.querySelectorAll("#stats-p1 .heart");
    p1Hearts.forEach((heart, index) => {
        heart.style.display = (index < p1.hp) ? "block" : "none";
    });

    const p2Hearts = document.querySelectorAll("#stats-p2 .heart");
    p2Hearts.forEach((heart, index) => {
        heart.style.display = (index < p2.hp) ? "block" : "none";
    });

    const btnAttack = document.querySelector('[data-action="attaque_normale"]');
    const btnSpecial = document.querySelector('[data-action="attaque_colonne"]');
    
    // Si c'est p2 (le client), il regarde sa propre énergie pour l'UI, sinon p1
    let myEnergy = (myRole === "p2") ? p2.energy : p1.energy;

    if (myEnergy < 1 || isResolving) {
        btnAttack.classList.add("disabled");
    } else {
        btnAttack.classList.remove("disabled");
    }

    if (myEnergy < 3 || isResolving) {
        btnSpecial.classList.add("disabled");
    } else {
        btnSpecial.classList.remove("disabled");
    }
}

// --- GESTION DU TACTILE / CHOIX DES ACTIONS ---
window.addEventListener("pointerdown", (event) => {
    if (gameState !== "playing" || isResolving) return;
    if (event.target.closest('#ui-container')) return;
    if (!actionActuelle) return;

    let myGrid = (myRole === "p1") ? gridPlayer1 : gridPlayer2;
    let oppGrid = (myRole === "p1") ? gridPlayer2 : gridPlayer1;
    let me = (myRole === "p1") ? p1 : p2;

    let hasPlayed = false;
    let myActionChoice = null;

    if (actionActuelle === "mouvement") {
        let clicked = myGrid.getClickedCell(event.clientX, event.clientY);
        if (clicked) {
            myActionChoice = { type: "mouvement", col: clicked.col, row: clicked.row };
            hasPlayed = true;
        }
    }

    if (actionActuelle === "recharge") {
        let clicked = myGrid.getClickedCell(event.clientX, event.clientY);
        if (clicked) {
            myActionChoice = { type: "recharge" };
            hasPlayed = true;
        }
    }

    if (actionActuelle === "attaque_normale" && me.energy >= 1) {
        let clicked = oppGrid.getClickedCell(event.clientX, event.clientY);
        if (clicked) {
            myActionChoice = { type: "attaque_normale", col: clicked.col, row: clicked.row };
            hasPlayed = true;
        }
    }

    if (actionActuelle === "attaque_colonne" && me.energy >= 3) {
        let clicked = oppGrid.getClickedCell(event.clientX, event.clientY);
        if (clicked) {
            myActionChoice = { type: "attaque_colonne", col: clicked.col };
            hasPlayed = true;
        }
    }

    if (hasPlayed) {
        isResolving = true;
        actionActuelle = null;
        boutons.forEach(b => b.classList.remove("actif"));
        
        if (gameMode === "ai") {
            p1Action = myActionChoice;
            generateAIPick();
            resolveTurn();
            
        } else if (gameMode === "pvp") {
            if (myRole === "p1") p1Action = myActionChoice;
            if (myRole === "p2") p2Action = myActionChoice;
            
            conn.send(myActionChoice);
            localActionReady = true;
            checkBothReady();
        }
    }
});

function generateAIPick() {
    let randomPick = Math.random();
    if (p2.energy >= 3 && randomPick > 0.6) {
        p2Action = { type: "attaque_colonne", col: p1.col };
    } else if (p2.energy >= 1 && randomPick > 0.3) {
        let targetCol = Math.random() > 0.3 ? p1.col : Math.floor(Math.random() * 3);
        let targetRow = Math.random() > 0.3 ? p1.row : Math.floor(Math.random() * 3);
        p2Action = { type: "attaque_normale", col: targetCol, row: targetRow };
    } else if (randomPick > 0.5) {
        p2Action = { type: "recharge" };
    } else {
        p2Action = { type: "mouvement", col: Math.floor(Math.random() * 3), row: Math.floor(Math.random() * 3) };
    }
}

function checkBothReady() {
    if (localActionReady && remoteActionReady) {
        resolveTurn();
    }
}

// --- LECTURE DES ACTIONS ---
function resolveTurn() {
    // PHASE 1 : DÉPLACEMENTS
    if (p1Action.type === "mouvement") executeAction(p1, p2, gridPlayer1, gridPlayer2, p1Action);
    if (p2Action.type === "mouvement") executeAction(p2, p1, gridPlayer2, gridPlayer1, p2Action);

    // PHASE 2 : RECHARGEMENT
    setTimeout(() => {
        if (p1Action.type === "recharge") executeAction(p1, p2, gridPlayer1, gridPlayer2, p1Action);
        if (p2Action.type === "recharge") executeAction(p2, p1, gridPlayer2, gridPlayer1, p2Action);

        // PHASE 3 : ATTAQUES
        setTimeout(() => {
            if (p1Action.type === "attaque_normale" || p1Action.type === "attaque_colonne") {
                executeAction(p1, p2, gridPlayer1, gridPlayer2, p1Action);
            }
            if (p2Action.type === "attaque_normale" || p2Action.type === "attaque_colonne") {
                executeAction(p2, p1, gridPlayer2, gridPlayer1, p2Action);
            }

            // PHASE 4 : NETTOYAGE
            setTimeout(() => {
                gridPlayer1.selectedCol = -1; gridPlayer1.selectedRow = -1;
                gridPlayer2.selectedCol = -1; gridPlayer2.selectedRow = -1;
                
                if (p1.hp > 0 && p2.hp > 0) {
                    isResolving = false;
                    p1Action = null;
                    p2Action = null;
                    if (gameMode === "pvp") {
                        localActionReady = false;
                        remoteActionReady = false;
                    }
                }
            }, 150);
        }, 150);
    }, 150);
}

function executeAction(attaquant, defenseur, grilleAttaquant, grilleDefenseur, action) {
    if (action.type === "mouvement") {
        attaquant.moveTo(action.col, action.row);
    }
    
    if (action.type === "recharge") {
        attaquant.energy += 1;
    }
    
    if (action.type === "attaque_normale") {
        attaquant.energy -= 1;
        grilleDefenseur.selectedCol = action.col;
        grilleDefenseur.selectedRow = action.row;
        
        if (defenseur.col === action.col && defenseur.row === action.row) {
            defenseur.hp -= 1;
            let oldColor = defenseur.color; defenseur.color = "white"; setTimeout(() => { defenseur.color = oldColor; }, 150);
        }
    }
    
    if (action.type === "attaque_colonne") {
        attaquant.energy -= 3;
        grilleDefenseur.selectedCol = action.col;
        grilleDefenseur.selectedRow = -1;
        
        if (defenseur.col === action.col) {
            defenseur.hp -= 1;
            let oldColor = defenseur.color; defenseur.color = "white"; setTimeout(() => { defenseur.color = oldColor; }, 150);
        }
    }
}

function resetGame() {
    p1.hp = 3;
    p1.energy = 0;
    p2.hp = 3;
    p2.energy = 0;
    
    p1.moveTo(1, 1);
    p2.moveTo(1, 1);

    isResolving = false;
    p1Action = null;
    p2Action = null;
    localActionReady = false;
    remoteActionReady = false;

    actionActuelle = null;
    boutons.forEach(b => b.classList.remove("actif"));
}

function gameOver() {
    gameState = "end";
    endScreen.style.display = "flex";
}

// --- LA BOUCLE DE JEU ---
function gameLoop() {
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    gridPlayer1.draw(ctx);
    gridPlayer2.draw(ctx);
    p1.draw(ctx);
    p2.draw(ctx);

    updateUI();

    if (gameState === "playing") {
        if (p1.hp <= 0 && p2.hp <= 0) {
            endMessage.innerText = "Égalité !";
            endMessage.style.color = "white";
            gameOver();
        } else if (p1.hp <= 0) {
            endMessage.innerText = (myRole === "p1") ? "Défaite..." : "Victoire !";
            endMessage.style.color = (myRole === "p1") ? "#F44336" : "#4CAF50";
            gameOver();
        } else if (p2.hp <= 0) {
            endMessage.innerText = (myRole === "p1") ? "Victoire !" : "Défaite...";
            endMessage.style.color = (myRole === "p1") ? "#4CAF50" : "#F44336"; 
            gameOver();
        }
    }
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);