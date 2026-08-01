import * as UI from './ui.js';
import * as Network from './network.js';
import GameEngine from './engine.js';
import { setupControls } from './input.js';
import { GameConfig, updateConfig } from './config.js';

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
            UI.DOM.codeDisplay.innerText = "Code : " + code;
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