import * as UI from './ui/ui.js';
import * as Network from './system/network.js';
import GameEngine from './core/engine.js';
import { setupControls } from './system/input.js';
import { GameConfig, updateConfig } from './core/config.js';
import { setLanguage, getText, flags } from './ui/lang.js';

// Initialisation
const engine = new GameEngine();
setupControls(engine);

// Gestion du Menu Principal
UI.DOM.btnAI.addEventListener("click", () => { 
    updateConfig({
        MAX_HP: parseInt(UI.DOM.settingHp.value),
        COST_NORMAL_ATTACK: parseInt(UI.DOM.settingAtk.value),
        COST_SPECIAL_ATTACK: parseInt(UI.DOM.settingSpe.value)
    });
    
    engine.resetGame();
    engine.startGame("ai", "p1");
});

// Affiche le menu des paramètres
UI.DOM.btnHostMenu.addEventListener("click", () => {
    UI.DOM.menuBase.style.display = "none";
    UI.DOM.menuSettings.style.display = "flex";
});

// Retour au menu de base
UI.DOM.btnBackMenu.addEventListener("click", () => {
    UI.DOM.menuSettings.style.display = "none";
    UI.DOM.menuBase.style.display = "flex";
});

// --- GESTION DE LA LANGUE ---

// Ouvrir/Fermer la liste des langues quand on clique sur le drapeau
UI.DOM.btnLang.addEventListener("click", () => {
    const menu = UI.DOM.langMenu;
    menu.style.display = menu.style.display === "none" ? "flex" : "none";
});

// Choisir une langue dans la liste
UI.DOM.langOptions.forEach(btn => {
    btn.addEventListener("click", (e) => {
        const selectedLang = e.target.getAttribute("data-lang");
        setLanguage(selectedLang);
        UI.DOM.btnLang.innerText = flags[selectedLang];
        UI.DOM.langMenu.style.display = "none";
        
        if (UI.DOM.codeDisplay.style.display === "block") {
            const currentCode = UI.DOM.codeDisplay.innerText.split(":")[1].trim();
            UI.DOM.codeDisplay.innerText = getText("code_display") + currentCode;
        }
    });
});

// Fermer le menu si le joueur clique ailleurs sur l'écran
document.addEventListener("click", (e) => {
    if (!e.target.closest("#lang-container")) {
        if (UI.DOM.langMenu) UI.DOM.langMenu.style.display = "none";
    }
});

// --- GESTION PARTIE ---
// Lancer une partie
UI.DOM.btnHostStart.addEventListener("click", () => {
    updateConfig({
        MAX_HP: parseInt(UI.DOM.settingHp.value),
        COST_NORMAL_ATTACK: parseInt(UI.DOM.settingAtk.value),
        COST_SPECIAL_ATTACK: parseInt(UI.DOM.settingSpe.value)
    });

    Network.hostGame(
        (code) => { 
            UI.DOM.codeDisplay.style.display = "block";
            UI.DOM.codeDisplay.innerText = getText("code_display") + code;
            UI.DOM.btnHostStart.style.display = "none";
            UI.DOM.btnAI.style.display = "none";
            UI.DOM.btnBackMenu.style.display = "none";
        },
        () => {
            Network.sendData({ type: "config", settings: GameConfig });
            engine.resetGame();
            engine.startGame("pvp", "p1");
        },
        (data) => engine.handleNetworkData(data)
    );
});

// Rejoindre une partie
UI.DOM.btnJoin.addEventListener("click", () => {
    if (UI.DOM.inputJoin.value) {
        Network.joinGame(
            UI.DOM.inputJoin.value, 
            () => {
                console.log("Connecté, en attente des paramètres...");
            }, 
            (data) => engine.handleNetworkData(data)
        );
    }
});

// Gestion des fins de partie
UI.DOM.btnRestart.addEventListener("click", () => {
    if (engine.gameMode === "ai") {
        engine.doRestartGame();
    } else if (engine.gameMode === "pvp") {
        engine.localRematchReady = true;
        Network.sendData({ type: "rematch" });
        UI.DOM.btnRestart.style.display = "none";
        UI.DOM.rematchWaitingMessage.style.display = "block";
        if (engine.remoteRematchReady) engine.doRestartGame();
    }
});

// Retour menu principal
UI.DOM.btnMenuPrincipal.addEventListener("click", () => {
    if (engine.gameMode === "pvp") {
        Network.sendData({ type: "menu" });
        setTimeout(() => {
            engine.returnToMainMenu();
        }, 100);
    } else {
        engine.returnToMainMenu();
    }
});