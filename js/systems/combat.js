import { GameConfig } from '../core/config.js';

export function generateAIPick(p1, p2) {
    let randomPick = Math.random();
    // L'IA lit la configuration pour savoir si elle peut lancer son attaque spéciale
    if (p2.energy >= GameConfig.COST_SPECIAL_ATTACK && randomPick > 0.6) {
        return { type: "attaque_colonne", col: p1.col };
    } else if (p2.energy >= GameConfig.COST_NORMAL_ATTACK && randomPick > 0.3) {
        let targetCol = Math.random() > 0.3 ? p1.col : Math.floor(Math.random() * p1.grid.cols);
        let targetRow = Math.random() > 0.3 ? p1.row : Math.floor(Math.random() * p1.grid.rows);
        return { type: "attaque_normale", col: targetCol, row: targetRow };
    } else if (randomPick > 0.5) {
        return { type: "recharge" };
    } else {
        let moveCol = Math.floor(Math.random() * p2.grid.cols);
        let moveRow = Math.floor(Math.random() * p2.grid.rows);
        return { type: "mouvement", col: moveCol, row: moveRow };
    }
}

export function executeAction(attaquant, defenseur, grilleAttaquant, grilleDefenseur, action) {
    if (!action) return;
    if (action.type === "mouvement") attaquant.moveTo(action.col, action.row);
    if (action.type === "recharge") attaquant.energy += 1;
         
    // Définition de la zone d'impact et des coûts
    let cibles = [];
    
    if (action.type === "attaque_normale") {
        attaquant.energy -= GameConfig.COST_NORMAL_ATTACK;
        grilleDefenseur.flashCell(action.col, action.row);
        cibles.push({ col: action.col, row: action.row });
    }
         
    if (action.type === "attaque_colonne") {
        attaquant.energy -= GameConfig.COST_SPECIAL_ATTACK;
        grilleDefenseur.flashColumn(action.col);
        for (let r = 0; r < grilleDefenseur.rows; r++) {
            cibles.push({ col: action.col, row: r });
        }
    }

    // Résolution des dégâts 
    if (cibles.length > 0) {
        let entitesTouchees = new Set();

        cibles.forEach(cible => {
            let wCol = (cible.col % grilleDefenseur.cols + grilleDefenseur.cols) % grilleDefenseur.cols;
            let wRow = (cible.row % grilleDefenseur.rows + grilleDefenseur.rows) % grilleDefenseur.rows;
            
            let targetTile = grilleDefenseur.getTile(wCol, wRow);
            if (targetTile && targetTile.occupant) {
                entitesTouchees.add(targetTile.occupant);
            }
        });

        entitesTouchees.forEach(entite => {
            if (entite === defenseur) takeDamage(entite);
        });
    }
}

// Fonction interne pour gérer les dégâts et l'animation
function takeDamage(player) {
    player.hp -= 1;
    let oldColor = player.color;
    player.color = "white";
    setTimeout(() => { player.color = oldColor;}, 150);
}

// Fonction exportée pour le mode BPM
export function applyBpmAttack(attack, targetPlayer, targetGrid) {
    if (!attack) return;

    let cibles = [];
    
    // Définition des zones d'impact
    if (attack.type === "attaque_normale") {
        cibles.push({ col: attack.col, row: attack.row });
    } else if (attack.type === "attaque_colonne") {
        for (let r = 0; r < targetGrid.rows; r++) {
            cibles.push({ col: attack.col, row: r });
        }
    }

    // Résolution avec l'effet "Pac-Man"
    if (cibles.length > 0) {
        let entitesTouchees = new Set();
        
        cibles.forEach(cible => {
            let wCol = (cible.col % targetGrid.cols + targetGrid.cols) % targetGrid.cols;
            let wRow = (cible.row % targetGrid.rows + targetGrid.rows) % targetGrid.rows;
            
            targetGrid.flashCell(wCol, wRow);
            
            let tile = targetGrid.getTile(wCol, wRow);
            if (tile && tile.occupant) {
                entitesTouchees.add(tile.occupant);
            }
        });

        // Application des dégâts uniques
        entitesTouchees.forEach(entite => {
            if (entite === targetPlayer) targetPlayer.hp--;
        });
    }
}