import { GameConfig } from '../core/config.js';

export default class Player {
    // Par défaut, le joueur fait 1x1 pour garder la compatibilité
    constructor(grid, startCol, startRow, color, width = 1, height = 1) {
        this.grid = grid;
        this.color = color;
        this.hp = GameConfig.MAX_HP;
        this.energy = 0;
        this.specialAttack = "col";

        this.width = width;
        this.height = height;

        this.occupiedTiles = [];

        this.visualCol = startCol;
        this.visualRow = startRow;
        
        this.placeAt(startCol, startRow);
    }

    // Garde une compatibilité pour l'origine du joueur
    get col() { return this.occupiedTiles.length > 0 ? this.occupiedTiles[0].col : 0; }
    get row() { return this.occupiedTiles.length > 0 ? this.occupiedTiles[0].row : 0; }

    // Assigne le joueur à toutes les tuiles qu'il recouvre
    placeAt(col, row) {
        this.occupiedTiles.forEach(tile => {
            if (tile.occupant === this) tile.occupant = null;
        });
        this.occupiedTiles = [];

        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                let tile = this.grid.getTile(col + c, row + r);
                if (tile) {
                    tile.occupant = this;
                    this.occupiedTiles.push(tile);
                }
            }
        }
    }

    // Vérifie si TOUTES les tuiles ciblées sont valides et actives
    canMoveTo(col, row) {
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                let tile = this.grid.getTile(col + c, row + r);
                if (!tile || !tile.active) return false;
            }
        }
        return true;
    }

    moveTo(col, row) {
        // On empêche le joueur de déborder en bas ou à droite
        let targetCol = Math.min(col, this.grid.cols - this.width);
        let targetRow = Math.min(row, this.grid.rows - this.height);
        
        // Sécurité supplémentaire
        targetCol = Math.max(0, targetCol);
        targetRow = Math.max(0, targetRow);

        // On vérifie si la zone calculée est bien valide et sans trous
        if (this.canMoveTo(targetCol, targetRow)) {
            this.placeAt(targetCol, targetRow);
        }
    }

    draw(ctx) {
        if (this.occupiedTiles.length === 0) return;

        this.visualCol += (this.col - this.visualCol) * 0.15;
        this.visualRow += (this.row - this.visualRow) * 0.15;

        // Le centre visuel est calculé au milieu de TOUTES les tuiles occupées
        let centerX = this.grid.x + (this.visualCol * this.grid.cellSize) + ((this.width * this.grid.cellSize) / 2);
        let centerY = this.grid.y + (this.visualRow * this.grid.cellSize) + ((this.height * this.grid.cellSize) / 2);
        
        // On étire le rayon selon la taille
        let radiusX = (this.width * this.grid.cellSize) * 0.4;
        let radiusY = (this.height * this.grid.cellSize) * 0.4;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}