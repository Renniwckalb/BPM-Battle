import { GameConfig } from './config.js';
import * as UI from './ui.js';

export function setupControls(engine) {
    // Choix de l'action
    UI.DOM.boutons.forEach(b => b.addEventListener("click", (e) => {
        UI.resetActionButtons();
        e.target.classList.add("actif");
        engine.setAction(e.target.getAttribute("data-action"));
    }));

    // Clic sur la grille de jeu
    window.addEventListener("pointerdown", (event) => {
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
        if (engine.actionActuelle === "recharge" && clickedMy) {
            myActionChoice = { type: "recharge" };
        }
        if (engine.actionActuelle === "attaque_normale" && me.energy >= GameConfig.COST_NORMAL_ATTACK && clickedOpp) {
            myActionChoice = { type: "attaque_normale", col: clickedOpp.col, row: clickedOpp.row };
        }
        if (engine.actionActuelle === "attaque_colonne" && me.energy >= GameConfig.COST_SPECIAL_ATTACK && clickedOpp) {
            myActionChoice = { type: "attaque_colonne", col: clickedOpp.col };
        }

        // Envoie de l'action si valide
        if (myActionChoice) {
            engine.submitAction(myActionChoice);
        }
    });
}