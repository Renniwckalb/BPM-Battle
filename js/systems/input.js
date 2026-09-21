import { GameConfig } from '../core/config.js';
import * as UI from '../ui/ui.js';

export function setupControls(engine) {
    const uiContainer = document.getElementById("ui-container");
    
    if (uiContainer) {
        uiContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-action");
            if (!btn) return;

            // Sécurité Tutoriel
            if (engine.gameMode && engine.gameMode.startsWith("tutorial")) {
                let tut = engine.tutorial;
                if ((tut.mode === "tutorial" && tut.step < 9) || (tut.mode === "tutorial_bpm" && tut.step < 22)) {
                    engine.advanceTutorial();
                    return; 
                }
            }
            
            // Empêche de cliquer si le bouton est désactivé
            if (btn.classList.contains("disabled")) return; 
            
            const action = btn.getAttribute("data-action");
            engine.setAction(action);
            UI.resetActionButtons();
            btn.classList.add("actif");
        });
    }

    // Clic sur l'écran
    window.addEventListener("pointerdown", (event) => {
        if (engine.gameMode && engine.gameMode.startsWith("tutorial")) {
            let tut = engine.tutorial;
            if ((tut.mode === "tutorial" && tut.step < 9) || (tut.mode === "tutorial_bpm" && tut.step < 22)) {
                engine.advanceTutorial();
                return;
            }
        }

        if (engine.gameState !== "playing" || engine.isResolving || !engine.actionActuelle) return;
        if (event.target.closest('#ui-container')) return;

        // Détermination des grilles et du joueur selon notre rôle
        let myGrid = (engine.myRole === "p1") ? engine.gridPlayer1 : engine.gridPlayer2;
        let oppGrid = (engine.myRole === "p1") ? engine.gridPlayer2 : engine.gridPlayer1;
        let me = (engine.myRole === "p1") ? engine.p1 : engine.p2;
        
        let myActionChoice = null;
        let clickedMy = myGrid.getClickedCell(event.clientX, event.clientY);
        let clickedOpp = oppGrid.getClickedCell(event.clientX, event.clientY);

        // Validation de l'action
        if (engine.actionActuelle === "mouvement" && clickedMy) {
            myActionChoice = { type: "mouvement", col: clickedMy.col, row: clickedMy.row };
        }
        if (engine.actionActuelle === "recharge") {
            myActionChoice = { type: "recharge" };
        }
        if (engine.actionActuelle === "attaque_normale" && me.energy >= GameConfig.COST_NORMAL_ATTACK && clickedOpp) {
            myActionChoice = { type: "attaque_normale", col: clickedOpp.col, row: clickedOpp.row };
        }
        if (engine.actionActuelle === "attaque_special" && me.energy >= GameConfig.COST_SPECIAL_ATTACK && clickedOpp) {
            myActionChoice = { 
                type: "attaque_special", 
                id: me.specialAttack,
                col: clickedOpp.col, 
                row: clickedOpp.row 
            };
        }
        // Envoie de l'action si valide
        if (myActionChoice) {
            engine.submitAction(myActionChoice);
        }
    });
}