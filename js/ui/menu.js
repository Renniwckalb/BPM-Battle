import { DOM } from './ui.js';
import * as Network from '../systems/network.js';
import { GameConfig, updateConfig } from '../core/config.js';
import { setLanguage, getText, flags } from './lang.js';
import { GamePresets } from '../core/preset.js';
import { SpecialAttacks } from '../core/attack.js';

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

    /// --- NAVIGATION DES MENUS ---
    // Accès Multijoueur
    DOM.btnMultiplayer.addEventListener("click", () => {
        DOM.menuBase.hidden = true;
        DOM.menuMultiplayer.hidden = false;
        if(DOM.codeDisplay && !DOM.codeDisplay.hidden){
            Network.closeNetwork();
            DOM.codeDisplay.hidden = true;
        }
    });

    // Retour du Multijoueur vers Racine
    DOM.btnBackMultiplayer.addEventListener("click", () => {
        DOM.menuMultiplayer.hidden = true;
        DOM.menuBase.hidden = false;
    });

    // Accès aux Paramètres de salle
    DOM.btnHostMenu.addEventListener("click", () => {
        DOM.menuMultiplayer.hidden = true;
        DOM.menuSettings.hidden = false;
        DOM.rulesContainer.hidden = false;
        DOM.btnBackMenu.hidden = false;
        DOM.btnHostStart.hidden = false;
        DOM.btnAI.hidden = false;
    });

    // Retour des Paramètres vers Multijoueur
    DOM.btnBackMenu.addEventListener("click", () => {
        DOM.menuSettings.hidden = true;
        DOM.menuMultiplayer.hidden = false;
        DOM.btnBackMenu.hidden = true;
        if(DOM.codeDisplay && !DOM.codeDisplay.hidden){
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
        DOM.langMenu.hidden = !DOM.langMenu.hidden;
    });

    // Choisir une langue dans la liste
    DOM.langOptions.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const selectedLang = e.target.getAttribute("data-lang");
            setLanguage(selectedLang);
            DOM.btnLang.innerText = flags[selectedLang];
            DOM.langMenu.hidden = true;
            if (!DOM.codeDisplay.hidden && DOM.codeDisplay.dataset.code) {
                DOM.codeDisplay.innerText = getText("code_display") + DOM.codeDisplay.dataset.code;
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
                DOM.codeDisplay.dataset.code = code;
                DOM.codeDisplay.innerText = getText("code_display") + code;
                DOM.btnBackMenu.hidden = false;
                DOM.btnHostStart.hidden = true;
                DOM.btnAI.hidden = true;
                DOM.rulesContainer.hidden = true;
            },
            () => {
                // Initialisation sécurisée
                let p1Special = "colonne";
                let saved = localStorage.getItem("bpm_custom_data");
                
                if (saved) {
                    try { 
                        p1Special = JSON.parse(saved).attack || "colonne"; 
                    } catch (e) { 
                        console.warn("Données corrompues.", e); 
                    }
                }
                
                Network.sendData({ 
                    type: "config", 
                    settings: GameConfig,
                    p1Special: p1Special 
                });
                
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
                engine.returnToMainMenu("multiplayer");
            }, 100);
        } else {
            engine.returnToMainMenu("base");
        }
    });

    // --- LOGIQUE DE PERSONNALISATION ---
    let defaultAttackId = Object.keys(SpecialAttacks)[0];
    let selectedAttack = defaultAttackId;

    // Génération automatique des boutons
    function generateAttackButtons() {
        DOM.attackTypesContainer.innerHTML = "";
    
        for (const key in SpecialAttacks) {
            const attack = SpecialAttacks[key];
            const btn = document.createElement("button");
            btn.className = "btn-menu btn-green inactive";

            btn.dataset.attackId = key; 
            const i18nKey = "btn_atk_" + key; 

            btn.setAttribute("data-i18n", i18nKey);
            btn.innerText = getText(i18nKey) || attack.name;

            btn.addEventListener("click", () => {
                selectedAttack = key;
                updatePersoGrid();
            });

            DOM.attackTypesContainer.appendChild(btn);
        }
    }

    // Mise à jour de l'aperçu 3x3 dynamique
    function updatePersoGrid() {
        if (!DOM.persoGridCells) return;
        
        // Netoyage
        DOM.persoGridCells.forEach(c => c.classList.remove('active-atk'));
        
        // Preview 3x3
        const gridCols = 3;
        const gridRows = 3;
        const centerCol = 1;
        const centerRow = 1;
        
        // Determine les cases colorier grâce au registre
        const attackDef = SpecialAttacks[selectedAttack];
        if (attackDef) {
            const targets = attackDef.getTargets(centerCol, centerRow, gridCols, gridRows);
            
            targets.forEach(target => {
                let wCol = (target.col % gridCols + gridCols) % gridCols;
                let wRow = (target.row % gridRows + gridRows) % gridRows;
                
                const index = wRow * gridCols + wCol;
                if (DOM.persoGridCells[index]) {
                    DOM.persoGridCells[index].classList.add('active-atk');
                }
            });
        }

        // Mise à jour visuelle des boutons
        const allButtons = DOM.attackTypesContainer.querySelectorAll('.btn-menu');
        allButtons.forEach(btn => {
            if (btn.dataset.attackId === selectedAttack) {
                btn.classList.remove('inactive');
            } else {
                btn.classList.add('inactive');
            }
        });
    }

    // On génère les boutons une seule fois au chargement du menu
    generateAttackButtons();

    DOM.btnPersoMenu.addEventListener("click", () => {
        DOM.menuMultiplayer.hidden = true;
        DOM.menuPersonalization.hidden = false;
        
        let saved = localStorage.getItem("bpm_custom_data");
        if (saved) {
            try {
                selectedAttack = JSON.parse(saved).attack || defaultAttackId;
            } catch (e) {
                console.warn("Données de personnalisation illisibles.", e);
                selectedAttack = defaultAttackId;
            }
        }
        updatePersoGrid();
    });

    const closePersoMenu = () => {
        DOM.menuPersonalization.hidden = true;
        DOM.menuMultiplayer.hidden = false;
    };
    
    DOM.btnBackPersoPortrait.addEventListener("click", closePersoMenu);
    DOM.btnBackPersoLandscape.addEventListener("click", closePersoMenu);
    
    DOM.btnSavePerso.addEventListener("click", () => {
        const customData = { attack: selectedAttack };
        localStorage.setItem("bpm_custom_data", JSON.stringify(customData));
        closePersoMenu();
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

