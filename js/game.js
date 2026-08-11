import * as UI from './ui/ui.js';
import * as Network from './systems/network.js';
import GameEngine from './core/engine.js';
import { setupControls } from './systems/input.js';
import { GameConfig, updateConfig } from './core/config.js';
import { setLanguage, getText, flags } from './ui/lang.js';

// Initialisation
const engine = new GameEngine();
setupControls(engine);

// Gestion du Menu Principal
UI.DOM.btnAI.addEventListener("click", () => {
    // Récupération des paramètres de jeu depuis l'interface utilisateur
    let MaxHpInput = parseInt(UI.DOM.settingHp.value);
    let clampedMaxHp = Math.max(1, Math.min(10, MaxHpInput));
    let atkInput = parseInt(UI.DOM.settingAtk.value);
    let clampedAtk = Math.max(0, Math.min(5, atkInput));
    let speInput = parseInt(UI.DOM.settingSpe.value);
    let clampedSpe = Math.max(0, Math.min(10, speInput));
    
    let queueSizeInput = parseInt(UI.DOM.bpmQueueSize.value);
    let clampedQueueSize = Math.max(0, Math.min(4, queueSizeInput));
    let tempoInput = parseInt(UI.DOM.bpmTempo.value);
    let clampedTempo = Math.max(300, Math.min(3000, tempoInput));

    updateConfig({
        MAX_HP: clampedMaxHp,
        COST_NORMAL_ATTACK: clampedAtk,
        COST_SPECIAL_ATTACK: clampedSpe,
        MODE_BPM: UI.DOM.bpmCheckbox.checked,
        BPM_TEMPO: clampedTempo,
        BPM_QUEUE_SIZE: clampedQueueSize
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
        MAX_HP: clampedMaxHp,
        COST_NORMAL_ATTACK: clampedAtk,
        COST_SPECIAL_ATTACK: clampedSpe,

        MODE_BPM: UI.DOM.bpmCheckbox.checked,
        BPM_TEMPO: clampedTempo,
        BPM_QUEUE_SIZE: clampedQueueSize
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

// Lancer le tutoriel
UI.DOM.btnTutorial.addEventListener("click", () => {
    engine.resetGame();
    engine.startGame("tutorial", "p1");
});

// Cache le menu BPM
UI.DOM.bpmCheckbox.addEventListener("change", (e) => {
    UI.DOM.bpmSettings.style.display = e.target.checked ? "block" : "none";
});