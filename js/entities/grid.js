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

    // Dessin de la pi
    drawHideQueue(ctx, queue, queueSize, playerColor, side) {
        if (!queue) return;

        let queueBoxSize = Math.min(30, this.cellSize * 0.8);
        let queueSpacing = 5;

        // On calcule X dynamiquement : à gauche ou à droite de la grille
        let queueX = (side === "left") 
            ? this.x - queueBoxSize - 15 
            : this.x + (this.cols * this.cellSize) + 15;
        let queueY = this.y;

        for (let i = 0; i < queueSize; i++) {
            let act = queue[i];
            let boxY = queueY + (i * (queueBoxSize + queueSpacing));
            
            // Fond de la case
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.fillRect(queueX, boxY, queueBoxSize, queueBoxSize);
            ctx.strokeStyle = "#555";
            ctx.lineWidth = 1;
            ctx.strokeRect(queueX, boxY, queueBoxSize, queueBoxSize);

            // Dessin de l'attaque
            if (act) {
                if (act.type === "attaque_normale") {
                    ctx.fillStyle = playerColor;
                    ctx.beginPath();
                    ctx.arc(queueX + queueBoxSize/2, boxY + queueBoxSize/2, queueBoxSize/3, 0, Math.PI*2);
                    ctx.fill();
                } 
                else if (act.type === "attaque_colonne") {
                    ctx.fillStyle = "red";
                    ctx.fillRect(queueX + 4, boxY + 4, queueBoxSize - 8, queueBoxSize - 8);
                }
            }
        }
    }

    // Dessin de la pile BPM
    drawQueue(ctx, queue, queueSize, playerColor, side, slideAnim = 0, direction = "up") {
        if (!queue) return;

        // Calcul des dimensions pour la mini-grille
        let miniCellSize = Math.max(10, this.cellSize / 4);
        let miniGridWidth = this.cols * miniCellSize;
        let miniGridHeight = this.rows * miniCellSize;
        let queueSpacing = 15;
        
        // Hauteur totale occupée par une case dans la file
        let slotHeight = miniGridHeight + queueSpacing;
        
        // Position X (À gauche pour J1, à droite pour J2)
        let queueX = (side === "left") 
            ? this.x - miniGridWidth - 20 
            : this.x + (this.cols * this.cellSize) + 20;
        let queueY = this.y;

        // Boucle sur la file d'attente
        for (let i = 0; i < queueSize; i++) {
            let act = queue[i];
            let displayIndex = (direction === "down") ? (queueSize - 1 - i) : i;
            let boxY = queueY + ((displayIndex + (direction === "down" ? -slideAnim : slideAnim)) * slotHeight);

            // Effet fondu
            let alpha = 1.0;
            if (slideAnim > 0 && i === queueSize - 1) {
                if (direction === "down" && i === 0) alpha = slideAnim;
                else if (direction === "up" && i === queueSize - 1) alpha = 1.0 - slideAnim;
            }
            ctx.globalAlpha = alpha;

            // Dessin de chaque case de la mini-grille
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    let cellX = queueX + (c * miniCellSize);
                    let cellY = boxY + (r * miniCellSize);

                    // Fond sombre de base pour chaque petite case
                    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                    ctx.fillRect(cellX, cellY, miniCellSize, miniCellSize);
                    
                    // Bordure de la petite case
                    ctx.strokeStyle = "#555";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(cellX, cellY, miniCellSize, miniCellSize);

                    // Si une attaque est prévue, on allume la/les bonne(s) case(s) !
                    if (act) {
                        // Attaque normale : cible une case précise
                        if (act.type === "attaque_normale" && act.col === c && act.row === r) {
                            ctx.fillStyle = playerColor;
                            ctx.fillRect(cellX, cellY, miniCellSize, miniCellSize);
                        } 
                        // Attaque spéciale : cible toute une colonne
                        else if (act.type === "attaque_colonne" && act.col === c) {
                            ctx.fillStyle = "red";
                            ctx.fillRect(cellX, cellY, miniCellSize, miniCellSize);
                        }
                    }
                }
            }

            // Bordure globale autour de la mini-grille entière pour faire propre
            ctx.strokeStyle = "#FFF";
            ctx.lineWidth = 2;
            ctx.strokeRect(queueX, boxY, miniGridWidth, miniGridHeight);
            ctx.globalAlpha = 1.0;
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