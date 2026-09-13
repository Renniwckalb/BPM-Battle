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
    let hpInput = parseInt(DOM.settingHp.value, 10);
    let atkInput = parseInt(DOM.settingAtk.value, 10);
    let speInput = parseInt(DOM.settingSpe.value, 10);
    let queueSizeInput = parseInt(DOM.bpmQueueSize.value, 10);
    let tempoInput = parseInt(DOM.bpmTempo.value, 10);

    return {
        MAX_HP: Math.max(1, Math.min(10, isNaN(hpInput) ? 3 : hpInput)),
        COST_NORMAL_ATTACK: Math.max(0, Math.min(5, isNaN(atkInput) ? 1 : atkInput)),
        COST_SPECIAL_ATTACK: Math.max(0, Math.min(10, isNaN(speInput) ? 3 : speInput)),
        MODE_BPM: DOM.bpmCheckbox.checked,
        BPM_TEMPO: Math.max(300, Math.min(3000, isNaN(tempoInput) ? 1000 : tempoInput)),
        BPM_QUEUE_SIZE: Math.max(0, Math.min(4, isNaN(queueSizeInput) ? 2 : queueSizeInput)),
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
        DOM.menuBase.hidden = true;
        DOM.menuSettings.hidden = false;
        DOM.rulesContainer.hidden = false;
        DOM.btnBackMenu.hidden = false;
    });

    // Retour au menu de base
    DOM.btnBackMenu.addEventListener("click", () => {
        DOM.menuSettings.hidden = true;
        DOM.menuBase.hidden = false;
        DOM.btnBackMenu.hidden = true;
        DOM.btnHostStart.hidden = false;
        DOM.btnAI.hidden = false;
        DOM.rulesContainer.hidden = false;
        if(DOM.codeDisplay){
            Network.closeNetwork();
            DOM.codeDisplay.hidden = true;
        }
    });

    // Bouton tutoriel de l'écran d'accueil
    DOM.btnTutorial.addEventListener("click", () => {
        DOM.menuBase.hidden = true;
        DOM.menuTutorial.hidden = false;
    });

    // Bouton retour du sous-menu tutoriel
    DOM.btnBackTut.addEventListener("click", () => {
        DOM.menuTutorial.hidden = true;
        DOM.menuBase.hidden = false;
    });

    // Lancement du tutoriel de base
    DOM.btnTutBase.addEventListener("click", () => {
        updateConfig(GamePresets.classique);
        engine.resetGame();
        engine.startGame("tutorial", "p1");
    });

    // Lancement du tutoriel BPM
    DOM.btnTutBpm.addEventListener("click", () => {
        updateConfig(GamePresets.bpmTutoriel);
        engine.resetGame();
        engine.startGame("tutorial_bpm", "p1");
    });

    // --- GESTION DE LA LANGUE ---
    // Ouvrir/Fermer la liste des langues
    DOM.btnLang.addEventListener("click", () => {
        const menu = DOM.langMenu;
        menu.hidden = !menu.hidden;
    });

    // Choisir une langue dans la liste
    DOM.langOptions.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const selectedLang = e.target.getAttribute("data-lang");
            setLanguage(selectedLang);
            DOM.btnLang.innerText = flags[selectedLang];
            DOM.langMenu.hidden = true;
            if (!DOM.codeDisplay.hidden) {
                const currentCode = DOM.codeDisplay.innerText.split(":")[1].trim();
                DOM.codeDisplay.innerText = getText("code_display") + currentCode;
            }
        });
    });

    // Fermer le menu langue au clic extérieur
    document.addEventListener("click", (e) => {
        if (!e.target.closest("#lang-container")) {
            if (DOM.langMenu) DOM.langMenu.hidden = true;
        }
    });

    // --- GESTION DU MULTIJOUEUR (PVP) ---
    // Créer une partie (Host)
    DOM.btnHostStart.addEventListener("click", () => {
        const settings = getSettingsFromUI();
        updateConfig(settings);

        Network.hostGame(
            (code) => {
                DOM.codeDisplay.hidden = false;
                DOM.codeDisplay.innerText = getText("code_display") + code;
                DOM.btnBackMenu.hidden = false;
                DOM.btnHostStart.hidden = true;
                DOM.btnAI.hidden = true;
                DOM.rulesContainer.hidden = true;
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
            DOM.btnRestart.hidden = true;
            DOM.rematchWaitingMessage.hidden = false;
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
        DOM.customRulesContainer.hidden = true;
        updateMenuSelection('preset1');
    });

    DOM.btnPreset2.addEventListener("click", () => {
        applyPresetToUI(GamePresets.bpmRapide);
        DOM.customRulesContainer.hidden = true;
        updateMenuSelection('preset2');
    });

    // Afficher/Masquer le menu des règles personnalisées
    DOM.btnCustomRules.addEventListener("click", () => {
        const isCurrentlyHidden = DOM.customRulesContainer.hidden;
        DOM.customRulesContainer.hidden = !isCurrentlyHidden;
        if (isCurrentlyHidden) {
            updateMenuSelection('custom');
        } else {
            updateMenuSelection('preset1'); 
        }
    });

    // Les paramètres de taille de queue
    DOM.bpmQueueSize.addEventListener("input", (e) => {
        const size = parseInt(e.target.value, 10) || 0;
        DOM.bpmQueueDetailedContainer.hidden = size === 0;
    });

    // Les paramètres avancés BPM en fonction de l'état de la checkbox
    DOM.bpmCheckbox.addEventListener("change", (e) => {
        DOM.bpmSettings.hidden = !e.target.checked;
    });

    // Fonction pour appliquer un preset aux éléments de l'UI
    function applyPresetToUI(preset) {
        DOM.settingHp.value = preset.MAX_HP;
        DOM.settingAtk.value = preset.COST_NORMAL_ATTACK;
        DOM.settingSpe.value = preset.COST_SPECIAL_ATTACK;
        DOM.bpmCheckbox.checked = preset.MODE_BPM;
        DOM.bpmTempo.value = preset.BPM_TEMPO;
        DOM.bpmQueueSize.value = preset.BPM_QUEUE_SIZE;
        DOM.bpmQueueDetailed.checked = preset.BPM_QUEUE_DETAILED || false;
        
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

