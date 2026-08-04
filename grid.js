export default class Grid {
    // MODULARITÉ : On peut désormais définir le nombre de colonnes et de lignes
    constructor(x, y, cellSize, color, cols = 3, rows = 3) {
        this.x = x;
        this.y = y;
        this.cellSize = cellSize;
        this.color = color;
        this.cols = cols;
        this.rows = rows;

        this.selectedCol = -1;
        this.selectedRow = -1;
        
        this.attackedCells = []; 
    }

    // --- ANIMATIONS D'ATTAQUE ---
    flashCell(col, row) {
        this.attackedCells.push({ col, row });
        setTimeout(() => { this.attackedCells = []; }, 300);
    }

    flashColumn(col) {
        for (let r = 0; r < this.rows; r++) {
            this.attackedCells.push({ col, row: r });
        }
        setTimeout(() => { this.attackedCells = []; }, 300);
    }

    // Dessine la grille à l'écran
    draw(ctx) {
        // Fond de la grille
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.15;
        ctx.fillRect(this.x, this.y, this.cols * this.cellSize, this.rows * this.cellSize);
        ctx.globalAlpha = 1.0;

        // Lignes de la grille
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let caseX = this.x + (c * this.cellSize);
                let caseY = this.y + (r * this.cellSize);

                // Si la case subit une attaque, on la peint en rouge
                let isAttacked = this.attackedCells.some(cell => cell.col === c && cell.row === r);
                if (isAttacked) {
                    ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
                    ctx.fillRect(caseX, caseY, this.cellSize, this.cellSize);
                } 
                // Sinon, surbrillance blanche basique de sélection
                else if (this.selectedCol !== -1 && c === this.selectedCol && (this.selectedRow === -1 || r === this.selectedRow)) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                    ctx.fillRect(caseX, caseY, this.cellSize, this.cellSize);
                }
                
                ctx.strokeRect(caseX, caseY, this.cellSize, this.cellSize);
            }
        }
    }

    // Détecte la case sélectionnée
    getClickedCell(clickX, clickY) {
        let width = this.cols * this.cellSize;
        let height = this.rows * this.cellSize;

        if (clickX < this.x || clickX > this.x + width ||
            clickY < this.y || clickY > this.y + height) {
            return null;
        }

        let col = Math.floor((clickX - this.x) / this.cellSize);
        let row = Math.floor((clickY - this.y) / this.cellSize);
        
        return { col: col, row: row };
    }
}