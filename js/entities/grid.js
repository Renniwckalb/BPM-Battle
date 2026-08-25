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

    // Dessin de la pile BPM (Détaillée ou Simplifiée)
    drawQueue(ctx, queue, queueSize, playerColor, side, slideAnim = 0, direction = "up", showMiniGrid = false) {
        if (!queue || queueSize === 0) return;

        // Tailles et Espacements
        let queueSpacing = 15;
        let maxAvailableHeight = ctx.canvas.height * 0.8;
        let maxSlotHeight = maxAvailableHeight / queueSize;
        let maxMiniGridHeight = maxSlotHeight - queueSpacing;
        
        let dynamicCellSize = maxMiniGridHeight / this.rows;
        let miniCellSize = Math.max(10, Math.min(dynamicCellSize, this.cellSize / 4));
        
        // Dimensions globales d'un "bloc" de la file
        let boxWidth = this.cols * miniCellSize;
        let boxHeight = this.rows * miniCellSize;
        let slotHeight = boxHeight + queueSpacing;

        // POSITIONNEMENT DE BASE 
        let queueX = (side === "left") 
            ? this.x - boxWidth - 20 
            : this.x + (this.cols * this.cellSize) + 20;
        let queueY = this.y;

        // BOUCLE GLOBALE
        for (let i = 0; i < queueSize; i++) {
            let act = queue[i];
            let displayIndex = (direction === "down") ? (queueSize - 1 - i) : i;
            let boxY = queueY + ((displayIndex + (direction === "down" ? -slideAnim : slideAnim)) * slotHeight);

            // Gestion de l'opacité (Fondu de l'animation)
            let alpha = 1.0;
            if (slideAnim > 0 && i === queueSize - 1) {
                if (direction === "down" && i === 0) alpha = slideAnim;
                else if (direction === "up" && i === queueSize - 1) alpha = 1.0 - slideAnim;
            }
            ctx.globalAlpha = alpha;

            // CHOIX DE L'AFFICHAGE VISUEL ---
            if (showMiniGrid) {
                // AFFICHAGE DÉTAILLÉ : La mini-grille complète
                for (let r = 0; r < this.rows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        let cellX = queueX + (c * miniCellSize);
                        let cellY = boxY + (r * miniCellSize);

                        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                        ctx.fillRect(cellX, cellY, miniCellSize, miniCellSize);
                        ctx.strokeStyle = "#555";
                        ctx.lineWidth = 1;
                        ctx.strokeRect(cellX, cellY, miniCellSize, miniCellSize);

                        if (act) {
                            if (act.type === "attaque_normale" && act.col === c && act.row === r) {
                                ctx.fillStyle = playerColor;
                                ctx.fillRect(cellX, cellY, miniCellSize, miniCellSize);
                            } else if (act.type === "attaque_colonne" && act.col === c) {
                                ctx.fillStyle = "red";
                                ctx.fillRect(cellX, cellY, miniCellSize, miniCellSize);
                            }
                        }
                    }
                }
                ctx.strokeStyle = "#FFF";
                ctx.lineWidth = 2;
                ctx.strokeRect(queueX, boxY, boxWidth, boxHeight);
                
            } else {
                // AFFICHAGE SIMPLIFIÉ : Un seul bloc centré
                let iconSize = Math.min(boxWidth, boxHeight); // On garde une taille cohérente
                let offsetX = queueX + (boxWidth - iconSize) / 2;
                let offsetY = boxY + (boxHeight - iconSize) / 2;

                ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillRect(offsetX, offsetY, iconSize, iconSize);
                ctx.strokeStyle = "#555";
                ctx.lineWidth = 1;
                ctx.strokeRect(offsetX, offsetY, iconSize, iconSize);

                if (act) {
                    if (act.type === "attaque_normale") {
                        ctx.fillStyle = playerColor;
                        ctx.beginPath();
                        ctx.arc(offsetX + iconSize/2, offsetY + iconSize/2, iconSize/3, 0, Math.PI*2);
                        ctx.fill();
                    } 
                    else if (act.type === "attaque_colonne") {
                        ctx.fillStyle = "red";
                        ctx.fillRect(offsetX + 4, offsetY + 4, iconSize - 8, iconSize - 8);
                    }
                }
            }

            // Réinitialisation de l'opacité pour le reste du canevas
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