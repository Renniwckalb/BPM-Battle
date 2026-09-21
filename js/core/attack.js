// js/core/attacks.js

export const SpecialAttacks = {
    colonne: {
        id: "colonne",
        name: "Colonne",
        // Fonction qui retourne la liste des cases touchées
        getTargets: (col, row, gridCols, gridRows) => {
            let targets = [];
            for (let r = 0; r < gridRows; r++) {
                targets.push({ col: col, row: r });
            }
            return targets;
        }
    },
    ligne: {
        id: "ligne",
        name: "Ligne",
        getTargets: (col, row, gridCols, gridRows) => {
            let targets = [];
            for (let c = 0; c < gridCols; c++) {
                targets.push({ col: c, row: row });
            }
            return targets;
        }
    }
};