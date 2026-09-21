import Tile from './tile.js';
import { SpecialAttacks } from '../core/attack.js';

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

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.needsRedraw = true;
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
            
            if (tile.flashTimer) {
                clearTimeout(tile.flashTimer);
            }
            
            tile.flashTimer = setTimeout(() => { 
                tile.isAttacked = false; 
                tile.flashTimer = null;
            }, 300);
        }
    }

    flashColumn(col) {
        for (let r = 0; r < this.rows; r++) {
            this.flashCell(col, r);
        }
    }

    cacheStaticGrid() {
        const margin = 2;
        const w = Math.ceil(this.cols * this.cellSize) + (margin * 2);
        const h = Math.ceil(this.rows * this.cellSize) + (margin * 2);

        if (w <= 0 || h <= 0) return; 

        this.offscreenCanvas.width = w;
        this.offscreenCanvas.height = h;
        this.offscreenCtx.clearRect(0, 0, w, h);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let tile = this.tiles[r][c];
                if (!tile.active) continue;
                
                let caseX = (c * this.cellSize) + margin;
                let caseY = (r * this.cellSize) + margin;

                // Fond
                this.offscreenCtx.fillStyle = this.color;
                this.offscreenCtx.globalAlpha = 0.15;
                this.offscreenCtx.fillRect(caseX, caseY, this.cellSize, this.cellSize);
                this.offscreenCtx.globalAlpha = 1.0;

                // Bordures
                this.offscreenCtx.strokeStyle = this.color;
                this.offscreenCtx.lineWidth = 3;
                this.offscreenCtx.strokeRect(caseX, caseY, this.cellSize, this.cellSize);
            }
        }
        this.needsRedraw = false;
    }

    draw(ctx) {
        if (this.needsRedraw) this.cacheStaticGrid();
        const margin = 2;

        if (this.offscreenCanvas.width > 0 && this.offscreenCanvas.height > 0) {
            ctx.drawImage(this.offscreenCanvas, this.x - margin, this.y - margin);
        }
        
        // Dessiner uniquement les états dynamiques (surbrillance/attaques)
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let tile = this.tiles[r][c];
                if (!tile.active) continue;
                
                let caseX = this.x + (c * this.cellSize);
                let caseY = this.y + (r * this.cellSize);

                if (tile.isAttacked) {
                    ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
                    ctx.fillRect(caseX, caseY, this.cellSize, this.cellSize);
                } else if (this.selectedCol === c && (this.selectedRow === -1 || this.selectedRow === r)) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                    ctx.fillRect(caseX, caseY, this.cellSize, this.cellSize);
                }
            }
        }
    }

    // Dessin de la pile BPM (Détaillée ou Simplifiée)
    drawQueueSlot(ctx, act, queueX, boxY, miniCellSize, boxWidth, boxHeight, playerColor, showMiniGrid, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (showMiniGrid) {
        // Fond des cases, actions et grille intérieure grise
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let tile = this.tiles[r][c];
                if (!tile || !tile.active) continue;
                let cellX = queueX + (c * miniCellSize);
                let cellY = boxY + (r * miniCellSize);
                
                // Fond de la case
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                ctx.fillRect(cellX, cellY, miniCellSize, miniCellSize);
                
                // Contenu de la case
                if (act) {
                    if (act.type === "attaque_normale" && act.col === c && act.row === r) {
                        ctx.fillStyle = playerColor;
                        ctx.fillRect(cellX, cellY, miniCellSize, miniCellSize);
                    } else if (act.type === "attaque_special") {
                        const attackDef = SpecialAttacks[act.id];
                        if (attackDef) {
                        // On calcule les cibles pour la case en cours
                        let targets = attackDef.getTargets(act.col, act.row, this.cols, this.rows);
                        let isTarget = targets.some(t => t.col === c && t.row === r);
            
                            if (isTarget) {
                                ctx.fillStyle = "red";
                                ctx.fillRect(cellX, cellY, miniCellSize, miniCellSize);
                            }
                        }
                    }
                }
                
                // Grille intérieure standard
                ctx.strokeStyle = "#555";
                ctx.lineWidth = 1;
                ctx.strokeRect(cellX, cellY, miniCellSize, miniCellSize);
            }
        }
        // Dessin du contour extérieur blanc
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 2;
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let tile = this.tiles[r][c];
                if (!tile || !tile.active) continue;
                let cellX = queueX + (c * miniCellSize);
                let cellY = boxY + (r * miniCellSize);
                ctx.beginPath();
                
                // Bord Haut
                if (r === 0 || !this.tiles[r - 1][c].active) {
                    ctx.moveTo(cellX, cellY);
                    ctx.lineTo(cellX + miniCellSize, cellY);
                }
                // Bord Bas
                if (r === this.rows - 1 || !this.tiles[r + 1][c].active) {
                    ctx.moveTo(cellX, cellY + miniCellSize);
                    ctx.lineTo(cellX + miniCellSize, cellY + miniCellSize);
                }
                // Bord Gauche
                if (c === 0 || !this.tiles[r][c - 1].active) {
                    ctx.moveTo(cellX, cellY);
                    ctx.lineTo(cellX, cellY + miniCellSize);
                }
                // Bord Droit
                if (c === this.cols - 1 || !this.tiles[r][c + 1].active) {
                    ctx.moveTo(cellX + miniCellSize, cellY);
                    ctx.lineTo(cellX + miniCellSize, cellY + miniCellSize);
                }
                
                ctx.stroke();
            }
        }
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
                } else if (act.type === "attaque_special") {
                    ctx.fillStyle = "red";
                    ctx.fillRect(offsetX + 4, offsetY + 4, iconSize - 8, iconSize - 8);
                }
            }
        }
        ctx.restore();
    }

    drawQueue(ctx, queue, queueSize, playerColor, side, slideAnim = 0, direction = "up", showMiniGrid = false) {
        if (!queue || queueSize === 0) return;
        
        // Récupération des dimensions
        const dims = this.getQueueDimensions(ctx.canvas.height, queueSize);
        
        let queueX = (side === "left") ? this.x - dims.boxWidth - 20 : this.x + (this.cols * this.cellSize) + 20;
        let queueY = this.y;
        
        for (let i = 0; i < queueSize; i++) {
            let act = queue[i];
            let displayIndex = (direction === "down") ? (queueSize - 1 - i) : i;
            let boxY = queueY + ((displayIndex + (direction === "down" ? -slideAnim : slideAnim)) * dims.slotHeight);
            
            let alpha = 1.0;
            if (slideAnim > 0 && i === queueSize - 1) {
                if (direction === "down" && i === 0) alpha = slideAnim;
                else if (direction === "up" && i === queueSize - 1) alpha = 1.0 - slideAnim;
            }
            
            this.drawQueueSlot(ctx, act, queueX, boxY, dims.miniCellSize, dims.boxWidth, dims.boxHeight, playerColor, showMiniGrid, alpha);
        }
    }

    // Calcule et retourne les dimensions de la pile en fonction de l'écran
    getQueueDimensions(canvasHeight, queueSize) {
        let queueSpacing = 15;
        let maxAvailableHeight = canvasHeight * 0.8;
        let maxSlotHeight = maxAvailableHeight / queueSize;
        let maxMiniGridHeight = maxSlotHeight - queueSpacing;
        let dynamicCellSize = maxMiniGridHeight / this.rows;
        let miniCellSize = Math.max(10, Math.min(dynamicCellSize, this.cellSize / 4));
        
        let boxWidth = this.cols * miniCellSize;
        let boxHeight = this.rows * miniCellSize;
        let slotHeight = boxHeight + queueSpacing;
        
        return { miniCellSize, boxWidth, boxHeight, slotHeight };
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
        
        let tile = this.getTile(col, row);

        if (tile && tile.active) {
            return tile;
        }
        
        return null;
    }
}