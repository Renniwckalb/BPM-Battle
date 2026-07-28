export default class Grid {
    constructor(x, y, cellSize, color) {
        this.x = x;
        this.y = y;
        this.cellSize = cellSize;
        this.color = color;
        this.rows = 3;
        this.cols = 3;

        this.selectedCol = -1;
        this.selectedRow = -1;
    }

    // La méthode qui dessine la grille à l'écran
    draw(ctx) {
        ctx.strokeStyle = this.color; 
        ctx.lineWidth = 3;            

        // On fait une boucle pour dessiner les 9 cases (3 lignes x 3 colonnes)
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Position exacte de chaque petite case
                let caseX = this.x + (c * this.cellSize);
                let caseY = this.y + (r * this.cellSize);

                if (this.selectedCol !== -1 && c === this.selectedCol && (this.selectedRow === -1 || r === this.selectedRow)) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                    ctx.fillRect(caseX, caseY, this.cellSize, this.cellSize);
                }
                // On dessine le contour de la case
                ctx.strokeRect(caseX, caseY, this.cellSize, this.cellSize);
            }
        }
    }

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