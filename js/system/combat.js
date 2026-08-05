import { GameConfig } from '../core/config.js';

export function generateAIPick(p1, p2) {
    let randomPick = Math.random();
    // L'IA lit la configuration pour savoir si elle peut lancer son attaque spéciale
    if (p2.energy >= GameConfig.COST_SPECIAL_ATTACK && randomPick > 0.6) {
        return { type: "attaque_colonne", col: p1.col };
    } else if (p2.energy >= GameConfig.COST_NORMAL_ATTACK && randomPick > 0.3) {
        let targetCol = Math.random() > 0.3 ? p1.col : Math.floor(Math.random() * 3);
        let targetRow = Math.random() > 0.3 ? p1.row : Math.floor(Math.random() * 3);
        return { type: "attaque_normale", col: targetCol, row: targetRow };
    } else if (randomPick > 0.5) {
        return { type: "recharge" };
    } else {
        return { type: "mouvement", col: Math.floor(Math.random() * 3), row: Math.floor(Math.random() * 3) };
    }
}

export function executeAction(attaquant, defenseur, grilleAttaquant, grilleDefenseur, action) {
    if (!action) return;

    if (action.type === "mouvement") attaquant.moveTo(action.col, action.row);
    if (action.type === "recharge") attaquant.energy += 1;
    
    if (action.type === "attaque_normale") {
        // Déduction de l'énergie dynamique
        attaquant.energy -= GameConfig.COST_NORMAL_ATTACK;
        grilleDefenseur.flashCell(action.col, action.row);
        if (defenseur.col === action.col && defenseur.row === action.row) takeDamage(defenseur);
    }
    
    if (action.type === "attaque_colonne") {
        // Déduction de l'énergie dynamique
        attaquant.energy -= GameConfig.COST_SPECIAL_ATTACK;
        grilleDefenseur.flashCell(action.col);
        if (defenseur.col === action.col) takeDamage(defenseur);
    }
}

// Fonction interne pour gérer les dégâts et l'animation
function takeDamage(player) {
    player.hp -= 1;
    let oldColor = player.color;
    player.color = "white";
    setTimeout(() => { player.color = oldColor;}, 150);
}