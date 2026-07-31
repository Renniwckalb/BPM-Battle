import { GameConfig } from './config.js';
// --- GESTION DE L'INTERFACE UTILISATEUR (HTML/CSS) ---

// Récupération de tous les éléments du DOM
export const DOM = {
    mainMenu: document.getElementById("main-menu"),
    menuBase: document.getElementById("menu-base"),
    menuSettings: document.getElementById("menu-settings"),
    btnHostMenu: document.getElementById("btn-host-menu"),
    btnHostStart: document.getElementById("btn-host-start"),
    btnBackMenu: document.getElementById("btn-back-menu"),
    settingHp: document.getElementById("setting-hp"),
    settingAtk: document.getElementById("setting-atk"),
    settingSpe: document.getElementById("setting-spe"),
    endScreen: document.getElementById("end-screen"),
    endMessage: document.getElementById("end-message"),
    btnRestart: document.getElementById("btn-restart"),
    btnMenuPrincipal: document.getElementById("btn-menu-principal"),
    rematchWaitingMessage: document.getElementById("rematch-waiting-message"),
    endButtons: document.getElementById("end-buttons"),
    btnAI: document.getElementById("btn-ai"),
    btnHost: document.getElementById("btn-host"),
    btnJoin: document.getElementById("btn-join"),
    codeDisplay: document.getElementById("room-code-display"),
    inputJoin: document.getElementById("input-join-code"),
    boutons: document.querySelectorAll(".btn-action")
};

// Fonction interne pour gérer un joueur spécifique
function updatePlayerHearts(playerId, hp) {
    const hearts = document.querySelectorAll(`#stats-${playerId} .heart`);
    const extraHpSpan = document.querySelector(`#stats-${playerId} .extra-hp`);

    hearts.forEach((heart, index) => {
        heart.style.display = (index < hp) ? "block" : "none";
    });

    if (hp > 3) {
        extraHpSpan.style.display = "block";
        extraHpSpan.innerText = "+" + (hp - 3);
    } else {
        extraHpSpan.style.display = "none";
    }
}

// Met à jour l'interface des joueurs
export function updateHUD(myRole, p1, p2, isResolving) {
    if (myRole === "p2") {
        document.getElementById("energy-p2").innerText = p2.energy;
        document.getElementById("energy-p2").parentElement.hidden = false;
        document.getElementById("energy-p1").parentElement.hidden = true;
    } else {
        document.getElementById("energy-p1").innerText = p1.energy;
        document.getElementById("energy-p1").parentElement.hidden = false;
        document.getElementById("energy-p2").parentElement.hidden = true;
    }

    updatePlayerHearts("p1", p1.hp);
    updatePlayerHearts("p2", p2.hp);

    const btnAttack = document.querySelector('[data-action="attaque_normale"]');
    const btnSpecial = document.querySelector('[data-action="attaque_colonne"]');
    let myEnergy = (myRole === "p2") ? p2.energy : p1.energy;

    if (myEnergy < GameConfig.COST_NORMAL_ATTACK || isResolving) btnAttack.classList.add("disabled");
    else btnAttack.classList.remove("disabled");

    if (myEnergy < GameConfig.COST_SPECIAL_ATTACK || isResolving) btnSpecial.classList.add("disabled");
    else btnSpecial.classList.remove("disabled");
}

// Affiche écran de fin
export function showGameOver(myRole, p1, p2) {
    DOM.endScreen.style.display = "flex";
    DOM.endButtons.style.display = "flex";
    DOM.rematchWaitingMessage.style.display = "none";
    
    if (p1.hp <= 0 && p2.hp <= 0) {
        DOM.endMessage.innerText = "Égalité !";
        DOM.endMessage.style.color = "white";
    } else if (p1.hp <= 0) {
        DOM.endMessage.innerText = (myRole === "p1") ? "Défaite..." : "Victoire !";
        DOM.endMessage.style.color = (myRole === "p1") ? "#F44336" : "#4CAF50";
    } else if (p2.hp <= 0) {
        DOM.endMessage.innerText = (myRole === "p1") ? "Victoire !" : "Défaite...";
        DOM.endMessage.style.color = (myRole === "p1") ? "#4CAF50" : "#F44336";
    }
}

// Affiche l'ecran titre
export function showMainMenu() {
    DOM.endScreen.style.display = "none";
    DOM.mainMenu.style.display = "flex";
    DOM.menuBase.style.display = "flex";
    DOM.menuSettings.style.display = "none";
    DOM.codeDisplay.style.display = "none";
    DOM.btnHostStart.style.display = "block";
    DOM.btnAI.style.display = "block";
    DOM.btnBackMenu.style.display = "block";
    DOM.inputJoin.value = "";
}

// Prépare les éléments pour la début de partie
export function prepareStartGame(myRole) {
    DOM.mainMenu.style.display = "none";
    if (myRole === "p2") {
        document.getElementById("stats-p2").className = "stats-container player-stats";
        document.getElementById("stats-p1").className = "stats-container opponent-stats";
    } else {
        document.getElementById("stats-p1").className = "stats-container player-stats";
        document.getElementById("stats-p2").className = "stats-container opponent-stats";
    }
}

// Actualise l'état des bouttons d'actions
export function resetActionButtons() {
    DOM.boutons.forEach(b => b.classList.remove("actif"));
}