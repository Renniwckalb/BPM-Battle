import { GameConfig } from '../core/config.js';
import { SpecialAttacks } from '../core/attack.js';

export function generateAIPick(p1, p2) {
    let randomPick = Math.random();
    // L'IA lit la configuration pour savoir si elle peut lancer son attaque spéciale
    if (p2.energy >= GameConfig.COST_SPECIAL_ATTACK && randomPick > 0.6) {
        // L'IA utilise dynamiquement l'attaque qu'elle a d'équipée
        return { type: "attaque_special", id: p2.specialAttack, col: p1.col, row: p1.row };
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

// Fonction execute les actions
export function executeAction(attaquant, defenseur, grilleDefenseur, action) {
    if (!action) return;
    
    if (action.type === "mouvement") attaquant.moveTo(action.col, action.row);
    if (action.type === "recharge") attaquant.energy += 1;
    
    if (action.type === "attaque_normale") {
        attaquant.energy -= GameConfig.COST_NORMAL_ATTACK;
        resolveImpact(action, grilleDefenseur, defenseur);
    }
    
    if (action.type === "attaque_special") {
        attaquant.energy -= GameConfig.COST_SPECIAL_ATTACK;
        resolveImpact(action, grilleDefenseur, defenseur);
    }
}

// Fonction exportée pour le mode BPM
export function applyBpmAttack(attack, targetPlayer, targetGrid) {
    if (!attack) return;
    resolveImpact(attack, targetGrid, targetPlayer);
}

// Nouvelle fonction commune pour cibler et appliquer les dégâts
function resolveImpact(attack, targetGrid, targetPlayer) {
    let cibles = [];
    
    if (attack.type === "attaque_normale") {
        cibles.push({ col: attack.col, row: attack.row });
    } else if (attack.type === "attaque_special") {
        const attackDef = SpecialAttacks[attack.id];
        if (attackDef) {
            cibles = attackDef.getTargets(attack.col, attack.row, targetGrid.cols, targetGrid.rows);
        }
    }
    
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
        
        entitesTouchees.forEach(entite => {
            if (entite === targetPlayer) takeDamage(targetPlayer);
        });
    }
}

// Fonction interne pour gérer les dégâts et l'animation
function takeDamage(player) {
    player.hp -= 1;
    let oldColor = player.color;
    player.color = "white";
    setTimeout(() => { player.color = oldColor; }, 150);
}