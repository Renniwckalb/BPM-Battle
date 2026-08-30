import Tile from './tile.js';

export default class Grid {
    constructor(x, y, cellSize, color, layout) {
        this.x = x;
        this.y = y;
        this.cellSize = cellSize;
        this.color = color;
        
        // Matrice
        this.rows = layout.length;
        this.cols = layout[0].length;
        
        // Création du réseau de tuiles
        this.tiles = [];
        for (let r = 0; r < this.rows; r++) {
            let rowTiles = [];
            for (let c = 0; c < this.cols; c++) {
                let isActive = layout[r][c] === 1;
                rowTiles.push(new Tile(c, r, isActive));
            }
            this.tiles.push(rowTiles);
        }
        
        this.selectedCol = -1;
        this.selectedRow = -1;
    }

    // Récupère le pointeur de la tuile
    getTile(col, row) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.tiles[row][col];
        }
        return null;
    }

    flashCell(col, row) {
        let tile = this.getTile(col, row);
        if (tile && tile.active) {
            tile.isAttacked = true;
            setTimeout(() => { tile.isAttacked = false; }, 300);
        }
    }

    flashColumn(col) {
        for (let r = 0; r < this.rows; r++) {
            this.flashCell(col, r);
        }
    }

    draw(ctx) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let tile = this.tiles[r][c];
                
                // On ne dessine pas les tuiles désactivées (trous)
                if (!tile.active) continue;

                let caseX = this.x + (c * this.cellSize);
                let caseY = this.y + (r * this.cellSize);

                // Fond
                ctx.fillStyle = this.color;
                ctx.globalAlpha = 0.15;
                ctx.fillRect(caseX, caseY, this.cellSize, this.cellSize);
                ctx.globalAlpha = 1.0;

                // Surbriallance
                if (tile.isAttacked) {
                    ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
                    ctx.fillRect(caseX, caseY, this.cellSize, this.cellSize);
                } else if (this.selectedCol === c && (this.selectedRow === -1 || this.selectedRow === r)) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                    ctx.fillRect(caseX, caseY, this.cellSize, this.cellSize);
                }

                // Bordures
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.strokeRect(caseX, caseY, this.cellSize, this.cellSize);
            }
        }
    }

    getClickedCell(clickX, clickY) {
        let col = Math.floor((clickX - this.x) / this.cellSize);
        let row = Math.floor((clickY - this.y) / this.cellSize);
        let tile = this.getTile(col, row);
        
        // Retourne la tuile uniquement si elle existe et est active
        if (tile && tile.active) return tile; 
        return null;
    }

    // Dessin de la pile BPM (Détaillée ou Simplifiée)
    drawQueueSlot(ctx, act, queueX, boxY, miniCellSize, boxWidth, boxHeight, playerColor, showMiniGrid, alpha) {
        ctx.globalAlpha = alpha;
        
        if (showMiniGrid) {
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
            let iconSize = Math.min(boxWidth, boxHeight);
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
                } else if (act.type === "attaque_colonne") {
                    ctx.fillStyle = "red";
                    ctx.fillRect(offsetX + 4, offsetY + 4, iconSize - 8, iconSize - 8);
                }
            }
        }
        ctx.globalAlpha = 1.0;
    }

    drawQueue(ctx, queue, queueSize, playerColor, side, slideAnim = 0, direction = "up", showMiniGrid = false) {
        if (!queue || queueSize === 0) return;
        
        let queueSpacing = 15;
        let maxAvailableHeight = ctx.canvas.height * 0.8;
        let maxSlotHeight = maxAvailableHeight / queueSize;
        let maxMiniGridHeight = maxSlotHeight - queueSpacing;
        let dynamicCellSize = maxMiniGridHeight / this.rows;
        let miniCellSize = Math.max(10, Math.min(dynamicCellSize, this.cellSize / 4));
        
        let boxWidth = this.cols * miniCellSize;
        let boxHeight = this.rows * miniCellSize;
        let slotHeight = boxHeight + queueSpacing;
        
        let queueX = (side === "left") ? this.x - boxWidth - 20 : this.x + (this.cols * this.cellSize) + 20;
        let queueY = this.y;

        for (let i = 0; i < queueSize; i++) {
            let act = queue[i];
            let displayIndex = (direction === "down") ? (queueSize - 1 - i) : i;
            let boxY = queueY + ((displayIndex + (direction === "down" ? -slideAnim : slideAnim)) * slotHeight);
            
            let alpha = 1.0;
            if (slideAnim > 0 && i === queueSize - 1) {
                if (direction === "down" && i === 0) alpha = slideAnim;
                else if (direction === "up" && i === queueSize - 1) alpha = 1.0 - slideAnim;
            }
            
            // Appel de la méthode extraite
            this.drawQueueSlot(ctx, act, queueX, boxY, miniCellSize, boxWidth, boxHeight, playerColor, showMiniGrid, alpha);
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