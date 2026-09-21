// js/core/attacks.js

export const SpecialAttacks = {
    col: {
        id: "col",
        name: "Colonne",
        getTargets: (col, row, gridCols, gridRows) => {
            let targets = [];
            for (let r = 0; r < gridRows; r++) {
                targets.push({ col: col, row: r });
            }
            return targets;
        }
    },
    row: {
        id: "row",
        name: "Ligne",
        getTargets: (col, row, gridCols, gridRows) => {
            let targets = [];
            for (let c = 0; c < gridCols; c++) {
                targets.push({ col: c, row: row });
            }
            return targets;
        }
    },
    diag1: {
        id: "diag1",
        name: "Diagonale 1",
        getTargets: (col, row, gridCols, gridRows) => {
            let targets = [];
            let r = row; let c = col;
            for (let i = 0; i < gridCols; i++) {
                targets.push({ col: c, row: r });
                r++;
                c++;
            }
            return targets;
        }
    },
    diag2: {
        id: "diag2",
        name: "Diagonale 2",
        getTargets: (col, row, gridCols, gridRows) => {
            let targets = [];
            let r = row; let c = col;
            for (let i = 0; i < gridCols; i++) {
                targets.push({ col: c, row: r });
                r++;
                c--;
            }
            return targets;
        }
    }
};