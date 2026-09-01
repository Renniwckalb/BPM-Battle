import { DOM } from './ui.js';
import * as Network from '../systems/network.js';
import { GameConfig, updateConfig } from '../core/config.js';
import { setLanguage, getText, flags } from './lang.js';
import { GamePresets } from '../core/preset.js';

/**
 * Récupère et valide l'ensemble des paramètres saisis par l'utilisateur
 * @returns {Object} Objet de configuration nettoyé et borné
 */
function getSettingsFromUI() {
    const hpInput = parseInt(DOM.settingHp.value, 10) || 3;
    const atkInput = parseInt(DOM.settingAtk.value, 10) || 1;
    const speInput = parseInt(DOM.settingSpe.value, 10) || 3;
    const queueSizeInput = parseInt(DOM.bpmQueueSize.value, 10) || 2;
    const tempoInput = parseInt(DOM.bpmTempo.value, 10) || 1000;

    return {
        MAX_HP: Math.max(1, Math.min(10, hpInput)),
        COST_NORMAL_ATTACK: Math.max(0, Math.min(5, atkInput)),
        COST_SPECIAL_ATTACK: Math.max(0, Math.min(10, speInput)),
        MODE_BPM: DOM.bpmCheckbox.checked,
        BPM_TEMPO: Math.max(300, Math.min(3000, tempoInput)),
        BPM_QUEUE_SIZE: Math.max(0, Math.min(4, queueSizeInput)),
        BPM_QUEUE_DETAILED: DOM.bpmQueueDetailed.checked
    };
}

export function setupMenu(engine) {
    // --- MODE SOLO (IA) ---
    DOM.btnAI.addEventListener("click", () => {
        const settings = getSettingsFromUI();
        updateConfig(settings);
        engine.resetGame();
        engine.startGame("ai", "p1");
    });

    // --- NAVIGATION DES MENUS ---
    // Affiche le menu des paramètres
    DOM.btnHostMenu.addEventListener("click", () => {
        DOM.menuBase.style.display = "none";
        DOM.menuSettings.style.display = "flex";
        DOM.rulesContainer.style.display = "block";
        DOM.btnBackMenu.style.display = "block";
    });

    // Retour au menu de base
    DOM.btnBackMenu.addEventListener("click", () => {
        DOM.menuSettings.style.display = "none";
        DOM.menuBase.style.display = "flex";
        DOM.btnBackMenu.style.display = "none";
        DOM.btnHostStart.style.display = "block";
        DOM.btnAI.style.display = "block";
        DOM.rulesContainer.style.display = "block";
        if(DOM.codeDisplay){
            Network.closeNetwork();
            DOM.codeDisplay.style.display = "none";
        }
    });

    // Bouton tutoriel de l'écran d'accueil
    DOM.btnTutorial.addEventListener("click", () => {
        DOM.menuBase.style.display = "none";
        DOM.menuTutorial.style.display = "flex";
    });

    // Bouton retour du sous-menu tutoriel
    DOM.btnBackTut.addEventListener("click", () => {
        DOM.menuTutorial.style.display = "none";
        DOM.menuBase.style.display = "flex";
    });

    // Lancement du tutoriel de base
    DOM.btnTutBase.addEventListener("click", () => {
        engine.resetGame();
        engine.startGame("tutorial", "p1");
    });

    // Lancement du tutoriel BPM
    DOM.btnTutBpm.addEventListener("click", () => {
        updateConfig({ MODE_BPM: true, BPM_TEMPO: 1000, BPM_QUEUE_SIZE: 2 });
        engine.resetGame();
        engine.startGame("tutorial_bpm", "p1");
    });

    // --- GESTION DE LA LANGUE ---
    // Ouvrir/Fermer la liste des langues
    DOM.btnLang.addEventListener("click", () => {
        const menu = DOM.langMenu;
        menu.style.display = menu.style.display === "none" ? "flex" : "none";
    });

    // Choisir une langue dans la liste
    DOM.langOptions.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const selectedLang = e.target.getAttribute("data-lang");
            setLanguage(selectedLang);
            DOM.btnLang.innerText = flags[selectedLang];
            DOM.langMenu.style.display = "none";
            if (DOM.codeDisplay.style.display === "block") {
                const currentCode = DOM.codeDisplay.innerText.split(":")[1].trim();
                DOM.codeDisplay.innerText = getText("code_display") + currentCode;
            }
        });
    });

    // Fermer le menu langue au clic extérieur
    document.addEventListener("click", (e) => {
        if (!e.target.closest("#lang-container")) {
            if (DOM.langMenu) DOM.langMenu.style.display = "none";
        }
    });

    // --- GESTION DU MULTIJOUEUR (PVP) ---
    // Créer une partie (Host)
    DOM.btnHostStart.addEventListener("click", () => {
        const settings = getSettingsFromUI();
        updateConfig(settings);

        Network.hostGame(
            (code) => {
                DOM.codeDisplay.style.display = "block";
                DOM.codeDisplay.innerText = getText("code_display") + code;
                DOM.btnBackMenu.style.display = "block";
                DOM.btnHostStart.style.display = "none";
                DOM.btnAI.style.display = "none";
                DOM.rulesContainer.style.display = "none";
            },
            () => {
                Network.sendData({ type: "config", settings: GameConfig });
                engine.resetGame();
                engine.startGame("pvp", "p1");
            },
            (data) => engine.handleNetworkData(data)
        );
    });

    // Rejoindre une partie (Client)
    DOM.btnJoin.addEventListener("click", () => {
        if (DOM.inputJoin.value) {
            Network.joinGame(
                DOM.inputJoin.value,
                () => {
                    console.log("Connecté, en attente des paramètres...");
                },
                (data) => engine.handleNetworkData(data)
            );
        }
    });

    // --- GESTION DE FIN DE PARTIE ---
    DOM.btnRestart.addEventListener("click", () => {
        if (engine.gameMode === "ai") {
            engine.doRestartGame();
        } else if (engine.gameMode === "pvp") {
            engine.localRematchReady = true;
            Network.sendData({ type: "rematch" });
            DOM.btnRestart.style.display = "none";
            DOM.rematchWaitingMessage.style.display = "block";
            if (engine.remoteRematchReady) engine.doRestartGame();
        }
    });

    DOM.btnMenuPrincipal.addEventListener("click", () => {
        if (engine.gameMode === "pvp") {
            Network.sendData({ type: "menu" });
            setTimeout(() => {
                engine.returnToMainMenu();
            }, 100);
        } else {
            engine.returnToMainMenu();
        }
    });

    // --- GESTION DES PRÉRÉGLAGES DE RÈGLES ---
    
    DOM.btnPreset1.addEventListener("click", () => {
        applyPresetToUI(GamePresets.classique);
        DOM.customRulesContainer.style.display = "none";
        updateMenuSelection('preset1');
    });

    DOM.btnPreset2.addEventListener("click", () => {
        applyPresetToUI(GamePresets.bpmRapide);
        DOM.customRulesContainer.style.display = "none";
        updateMenuSelection('preset2');
    });

    // Afficher/Masquer le menu des règles personnalisées
    DOM.btnCustomRules.addEventListener("click", () => {
        const isHidden = DOM.customRulesContainer.style.display === "none";
        DOM.customRulesContainer.style.display = isHidden ? "block" : "none";
        if (isHidden) {
            updateMenuSelection('custom');
        } else {
            updateMenuSelection('preset1'); 
        }
    });

    // Les paramètres de taille de queue
    DOM.bpmQueueSize.addEventListener("input", (e) => {
        const size = parseInt(e.target.value, 10) || 0;
        DOM.bpmQueueDetailedContainer.style.display = size > 0 ? "flex" : "none";
    });

    // Les paramètres avancés BPM en fonction de l'état de la checkbox
    DOM.bpmCheckbox.addEventListener("change", (e) => {
        DOM.bpmSettings.style.display = e.target.checked ? "block" : "none";
    });

    // Fonction pour appliquer un preset aux éléments de l'UI
    function applyPresetToUI(preset) {
        DOM.settingHp.value = preset.hp;
        DOM.settingAtk.value = preset.atk;
        DOM.settingSpe.value = preset.spe;
        DOM.bpmCheckbox.checked = preset.bpmMode;
        DOM.bpmTempo.value = preset.bpmTempo;
        DOM.bpmQueueSize.value = preset.bpmQueue;
        DOM.bpmQueueDetailed.checked = preset.bpmQueueDetailed || false;

        // Déclencher un événement de changement pour mettre à jour l'affichage si nécessaire
        DOM.bpmCheckbox.dispatchEvent(new Event('change'));
        DOM.bpmQueueSize.dispatchEvent(new Event('input'));
    }

    // Fonction utilitaire pour gérer l'état visuel des boutons
    function updateMenuSelection(selectedBtnId) {
        // On retire la classe 'inactive' de tous les boutons pour les réinitialiser
        DOM.btnPreset1.classList.remove('inactive');
        DOM.btnPreset2.classList.remove('inactive');
        DOM.btnCustomRules.classList.remove('inactive');

        // On grise ceux qui ne sont pas sélectionnés
        if (selectedBtnId !== 'preset1') DOM.btnPreset1.classList.add('inactive');
        if (selectedBtnId !== 'preset2') DOM.btnPreset2.classList.add('inactive');
        if (selectedBtnId !== 'custom') DOM.btnCustomRules.classList.add('inactive');
    }
}

