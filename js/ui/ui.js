import { GameConfig } from '../core/config.js';
import { getText } from './lang.js';
// --- GESTION DE L'INTERFACE UTILISATEUR (HTML/CSS) ---
// Variable cache
let lastState = {
    p1Energy: -1,
    p2Energy: -1,
    p1Hp: -1,
    p2Hp: -1,
    isResolving: null
};

export function resetHUDState() {
    lastState = {
        p1Energy: -1,
        p2Energy: -1,
        p1Hp: -1,
        p2Hp: -1,
        isResolving: null
    };
}

// Récupération de tous les éléments du DOM
export const DOM = {
    // Écran titre
    mainMenu: document.getElementById("main-menu"),
    menuBase: document.getElementById("menu-base"),
    btnCampaign: document.getElementById("btn-campaign"),
    
    // Menu multijoueur
    menuMultiplayer: document.getElementById("menu-multiplayer"),
    btnMultiplayer: document.getElementById("btn-multiplayer"),
    btnHost: document.getElementById("btn-host"),
    btnJoin: document.getElementById("btn-join"),
    btnPersoMenu: document.getElementById("btn-perso-menu"),
    btnBackMultiplayer: document.getElementById("btn-back-multiplayer"),
    codeDisplay: document.getElementById("room-code-display"),
    inputJoin: document.getElementById("input-join-code"),
    
    // Menu de personnalisation
    menuPersonalization: document.getElementById("menu-personalization"),
    btnBackPersoPortrait: document.getElementById("btn-back-perso-portrait"),
    btnBackPersoLandscape: document.getElementById("btn-back-perso-landscape"),
    btnAtkCol: document.getElementById("btn-atk-col"),
    btnAtkRow: document.getElementById("btn-atk-row"),
    btnSavePerso: document.getElementById("btn-save-perso"),
    persoGridCells: document.querySelectorAll("#perso-grid-preview .grid-cell"),
    
    // Menu de création de partie
    menuSettings: document.getElementById("menu-settings"),
    rulesContainer: document.getElementById("rules-container"),
    btnPreset1: document.getElementById("btn-preset-1"),
    btnPreset2: document.getElementById("btn-preset-2"),
    btnCustomRules: document.getElementById("btn-custom-rules"),
    customRulesContainer: document.getElementById("custom-rules-container"),
    btnAI: document.getElementById("btn-ai"),

    // Menu des paramètres de partie
    btnHostMenu: document.getElementById("btn-host-menu"),
    btnHostStart: document.getElementById("btn-host-start"),
    btnBackMenu: document.getElementById("btn-back-menu"),
    settingHp: document.getElementById("setting-hp"),
    settingAtk: document.getElementById("setting-atk"),
    settingSpe: document.getElementById("setting-spe"),

    // Ecran de fin
    endScreen: document.getElementById("end-screen"),
    endMessage: document.getElementById("end-message"),
    btnRestart: document.getElementById("btn-restart"),
    btnMenuPrincipal: document.getElementById("btn-menu-principal"),
    rematchWaitingMessage: document.getElementById("rematch-waiting-message"),
    endButtons: document.getElementById("end-buttons"),
    
    // Écran de combat
    boutons: document.querySelectorAll(".btn-action"),
    energyP1Container: document.getElementById("energy-p1").parentElement,
    energyP2Container: document.getElementById("energy-p2").parentElement,
    energyP1Text: document.getElementById("energy-p1"),
    energyP2Text: document.getElementById("energy-p2"),
    btnMove: document.querySelector('[data-action="mouvement"]'),
    btnRecharge: document.querySelector('[data-action="recharge"]'),
    btnAttack: document.querySelector('[data-action="attaque_normale"]'),
    btnSpecial: document.querySelector('[data-action="attaque_special"]'),

    // Menu de langues
    langMenu: document.getElementById("lang-menu"),
    langOptions: document.querySelectorAll(".lang-option"),
    btnLang: document.getElementById("btn-lang"),

    // Écran de tutoriel
    btnTutorial: document.getElementById("btn-tutorial"),
    tutorialBox: document.getElementById("tutorial-box"),
    tutorialMessage: document.getElementById("tutorial-message"),

    // Menu des tutoriels
    menuTutorial: document.getElementById("menu-tutorial"),
    btnTutBase: document.getElementById("btn-tut-base"),
    btnTutBpm: document.getElementById("btn-tut-bpm"),
    btnBackTut: document.getElementById("btn-back-tut"),

    // Menu BPM
    bpmCheckbox: document.getElementById("setting-bpm-mode"),
    bpmSettings: document.getElementById("bpm-advanced-settings"),
    bpmQueueSize: document.getElementById("setting-bpm-queue"),
    bpmQueueDetailed: document.getElementById("setting-queue-detailed"),
    bpmQueueDetailedContainer: document.getElementById("setting-queue-detailed-container"),
    
    bpmTempo: document.getElementById("setting-bpm-tempo")
};

// Fonction interne pour gérer un joueur spécifique
function updatePlayerHearts(playerId, hp) {
    const hearts = document.querySelectorAll(`#stats-${playerId} .heart`);
    const extraHpSpan = document.querySelector(`#stats-${playerId} .extra-hp`);
    
    hearts.forEach((heart, index) => {
        heart.style.display = (index < hp) ? "block" : "none";
    });
    
    if (hp > 3) {
        extraHpSpan.hidden = false;
        extraHpSpan.innerText = "+" + (hp - 3);
    } else {
        extraHpSpan.hidden = true;
    }
}

// Met à jour l'interface des joueurs
export function updateHUD(myRole, p1, p2, isResolving) {
    // Mise à jour de l'énergie
    let energyChanged = false;
    
    if (lastState.p1Energy !== p1.energy) {
        DOM.energyP1Text.innerText = p1.energy;
        lastState.p1Energy = p1.energy;
        energyChanged = true;
    }
    if (lastState.p2Energy !== p2.energy) {
        DOM.energyP2Text.innerText = p2.energy;
        lastState.p2Energy = p2.energy;
        energyChanged = true;
    }

    // Affichage des containers selon le rôle
    if (myRole === "p2") {
        DOM.energyP2Container.hidden = false;
        DOM.energyP1Container.hidden = true;
    } else {
        DOM.energyP1Container.hidden = false;
        DOM.energyP2Container.hidden = true;
    }

    // Mise à jour des cœurs
    if (lastState.p1Hp !== p1.hp) {
        updatePlayerHearts("p1", p1.hp);
        lastState.p1Hp = p1.hp;
    }
    if (lastState.p2Hp !== p2.hp) {
        updatePlayerHearts("p2", p2.hp);
        lastState.p2Hp = p2.hp;
    }

    // Mise à jour des boutons
    let myEnergy = (myRole === "p2") ? p2.energy : p1.energy;
    
    if (isResolving) {
        if (lastState.isResolving !== true) {
            lockAllActions();
            lastState.isResolving = true;
        }
    } else {
        if (lastState.isResolving !== false || energyChanged) {
            DOM.btnMove.classList.remove("disabled");
            DOM.btnRecharge.classList.remove("disabled");
            
            if (myEnergy < GameConfig.COST_NORMAL_ATTACK) DOM.btnAttack.classList.add("disabled");
            else DOM.btnAttack.classList.remove("disabled");
            
            if (myEnergy < GameConfig.COST_SPECIAL_ATTACK) DOM.btnSpecial.classList.add("disabled");
            else DOM.btnSpecial.classList.remove("disabled");
            
            lastState.isResolving = false;
        }
    }
}

// Fonction pour verrouiller tous les boutons d'un coup
export function lockAllActions() {
    DOM.boutons.forEach(b => b.classList.add("disabled"));
}

// Actualise l'état des boutons d'actions
export function resetActionButtons() {
    DOM.boutons.forEach(b => b.classList.remove("actif"));
}

// Affiche écran de fin
export function showGameOver(myRole, p1, p2) {
    DOM.endScreen.hidden = false;
    DOM.btnRestart.hidden = false; 
    DOM.rematchWaitingMessage.hidden = true;
    
    if(p1.hp <= 0 && p2.hp <= 0){
        DOM.endMessage.innerHTML = getText("draw");
    }
    else {
        if (myRole === "p1") {
            DOM.endMessage.innerText = (p1.hp > 0) ? getText("win") : getText("lose");
        } else {
            DOM.endMessage.innerText = (p2.hp > 0) ? getText("win") : getText("lose");
        }
    }
}

// Affiche l'ecran titre
export function showMainMenu(targetMenu = "base") {
    DOM.endScreen.hidden = true;
    DOM.mainMenu.hidden = false;
    
    // Cacher
    DOM.menuBase.hidden = true;
    DOM.menuMultiplayer.hidden = true;
    DOM.menuSettings.hidden = true;
    DOM.menuTutorial.hidden = true;
    if (DOM.menuPersonalization) DOM.menuPersonalization.hidden = true;
    
    // Afficher
    if (targetMenu === "multiplayer") {
        DOM.menuMultiplayer.hidden = false;
    } else {
        DOM.menuBase.hidden = false;
    }
    
    DOM.codeDisplay.hidden = true;
    DOM.btnHostStart.hidden = false;
    DOM.btnAI.hidden = false;
    DOM.btnBackMenu.hidden = true;
    DOM.inputJoin.value = "";
    DOM.tutorialBox.hidden = true;
    updateTutorialStep(0, 0);
}
// Prépare les éléments pour la début de partie
export function prepareStartGame(myRole) {
    DOM.mainMenu.hidden = true;
    if (myRole === "p2") {
        document.getElementById("stats-p2").className = "stats-container player-stats";
        document.getElementById("stats-p1").className = "stats-container opponent-stats";
    } else {
        document.getElementById("stats-p1").className = "stats-container player-stats";
        document.getElementById("stats-p2").className = "stats-container opponent-stats";
    }
}

// Gère le texte et la surbrillance dynamique
export function updateTutorialStep(stepNumber, p1Energy = 0, isFail = false) {
    if ((stepNumber > 0 && stepNumber <= 15) || (stepNumber >= 20 && stepNumber <= 25)) {
        let textKey = isFail ? `tut_fail_${stepNumber}` : `tut_${stepNumber}`;
        DOM.tutorialMessage.innerText = getText(textKey);
    }

    document.querySelectorAll('.highlight-ui').forEach(el => el.classList.remove("highlight-ui"));
    DOM.boutons.forEach(btn => btn.classList.remove("btn-tutorial-highlight"));
    window.highlightBpmQueue = false;

    switch (stepNumber) {
        case 5:
            document.querySelectorAll('.hearts').forEach(el => el.classList.add("highlight-ui"));
            break;
        case 6:
            document.querySelectorAll('.energy-text').forEach(el => el.classList.add("highlight-ui"));
            break;
        case 7:
            DOM.boutons.forEach(btn => btn.classList.add("btn-tutorial-highlight"));
            break;
        case 9:
        case 22:
            document.querySelector('[data-action="mouvement"]').classList.add("btn-tutorial-highlight");
            break;
        case 10:
        case 12:
        case 23:
            document.querySelector('[data-action="recharge"]').classList.add("btn-tutorial-highlight");
            break;
        case 11:
        case 13:
            document.querySelectorAll('.energy-text').forEach(el => el.classList.add("highlight-ui"));
            document.querySelector('[data-action="attaque_normale"]').classList.add("btn-tutorial-highlight");
            break;
        case 14:
            if (p1Energy < 3) document.querySelector('[data-action="recharge"]').classList.add("btn-tutorial-highlight");
            else document.querySelector('[data-action="attaque_special"]').classList.add("btn-tutorial-highlight");
            document.querySelectorAll('.energy-text').forEach(el => el.classList.add("highlight-ui"));
            break;
        case 24:
            document.querySelectorAll('.energy-text').forEach(el => el.classList.add("highlight-ui"));
            document.querySelector('[data-action="attaque_normale"]').classList.add("btn-tutorial-highlight");
            window.highlightBpmQueue = true;
            break;
        case 25:
            window.highlightBpmQueue = true;
            break;
    }
}

/**
 * Crée un bouton d'action contenant un sprite SVG centré.
 * @param {string} actionName - L'action rattachée (ex: "attaque_normale")
 * @param {string} iconId - L'ID du symbol SVG (ex: "icon-sword")
 * @returns {HTMLButtonElement} Le bouton prêt à être inséré dans le DOM
 */
export function createSvgButton(actionName, iconId) {
    // Création du bouton classique
    const btn = document.createElement('button');
    btn.className = 'btn-action';
    btn.setAttribute('data-action', actionName);

    // Création de la balise <svg>
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'btn-icon-svg');

    // Création de la balise <use>
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#${iconId}`);

    // Assemblage
    svg.appendChild(use);
    btn.appendChild(svg);

    return btn;
}