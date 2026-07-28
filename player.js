export default class Player {
    constructor(grid, col, row, color) {
        this.grid = grid; // La grille sur laquelle il se trouve
        this.col = col;   // Sa position X logique (0, 1 ou 2)
        this.row = row;   // Sa position Y logique (0, 1 ou 2)
        this.color = color;
        
        // Statistiques de base
        this.hp = 3;      
        this.energy = 0;  
    }

    // Met à jour la position logique
    moveTo(col, row) {
        this.col = col;
        this.row = row;
    }

    // Se dessine au centre de sa case actuelle
    draw(ctx) {
        // 1. Calcul du centre de la case
        let centerX = this.grid.x + (this.col * this.grid.cellSize) + (this.grid.cellSize / 2);
        let centerY = this.grid.y + (this.row * this.grid.cellSize) + (this.grid.cellSize / 2);
        
        // 2. Le rayon du joueur (légèrement plus petit que la case)
        let radius = this.grid.cellSize * 0.4;

        // 3. Dessin du cercle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Petit contour blanc pour faire joli
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}