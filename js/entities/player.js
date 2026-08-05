import { GameConfig } from '../core/config.js';

export default class Player {
    constructor(grid, col, row, color) {
        this.grid = grid;
        this.col = col;
        this.row = row;

        this.visualCol = col;
        this.visualRow = row;

        this.color = color;
        
        this.hp = GameConfig.MAX_HP;
        this.energy = 0;
    }

    // Met à jour la position logique
    moveTo(col, row) {
        this.col = col;
        this.row = row;
    }

    // Se dessine
    draw(ctx) {
        this.visualCol += (this.col - this.visualCol) * 0.15;
        this.visualRow += (this.row - this.visualRow) * 0.15;

        let centerX = this.grid.x + (this.visualCol * this.grid.cellSize) + (this.grid.cellSize / 2);
        let centerY = this.grid.y + (this.visualRow * this.grid.cellSize) + (this.grid.cellSize / 2);

        let radius = this.grid.cellSize * 0.4;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.strokeStyle = "gray";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}