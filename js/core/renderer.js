import { GameConfig } from './config.js';
import * as UI from '../ui/ui.js';

export default class Renderer {
    constructor(engine) {
        this.engine = engine;
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        window.addEventListener("resize", () => this.resizeCanvas());
        this.resizeCanvas();

        // Boucle de rendu
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    // Redimensionne le canvas et ajuste les grilles en fonction de la taille de l'écran
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
                 
        let myGrid = (this.engine.myRole === "p2") ? this.engine.gridPlayer2 : this.engine.gridPlayer1;
        let oppGrid = (this.engine.myRole === "p2") ? this.engine.gridPlayer1 : this.engine.gridPlayer2;

        // Calcul dynamique de la taille de base
        let maxRows = myGrid.rows + oppGrid.rows;
        let maxCols = Math.max(myGrid.cols, oppGrid.cols);
        let baseCellSize = Math.min(this.canvas.width / (maxCols + 2.5), this.canvas.height / (maxRows + 1.5));

        // Grille du joueur
        myGrid.cellSize = baseCellSize * 0.90;
        myGrid.x = (this.canvas.width - (myGrid.cols * myGrid.cellSize)) / 2;
        myGrid.y = this.canvas.height - (myGrid.rows * myGrid.cellSize) - 100;

        // Grille de l'adversaire
        oppGrid.cellSize = baseCellSize * 0.65;
        oppGrid.x = (this.canvas.width - (oppGrid.cols * oppGrid.cellSize)) / 2;
        
        // Sécurité anti-chevauchement
        let idealOppY = Math.max(140, this.canvas.height * 0.15);
        let bottomOfOppGrid = idealOppY + (oppGrid.rows * oppGrid.cellSize);
        
        if (bottomOfOppGrid > myGrid.y - 20) {
            // Si ça se touche, on force un espace de 20px entre les deux grilles
            oppGrid.y = myGrid.y - (oppGrid.rows * oppGrid.cellSize) - 20; 
        } else {
            oppGrid.y = idealOppY;
        }
    }

    gameLoop() {
        this.ctx.fillStyle = "#1e1e1e";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.engine.gridPlayer1.draw(this.ctx);
        this.engine.gridPlayer2.draw(this.ctx);
        this.engine.p1.draw(this.ctx);
        this.engine.p2.draw(this.ctx);

        if (this.engine.gameMode && this.engine.gameMode.startsWith("tutorial")) {
            this.engine.tutorial.drawHighlight(this.ctx);
        }
        
        if (GameConfig.MODE_BPM && this.engine.gameMode !== "tutorial") {
            this.drawBpmUI(this.ctx);
        }
        
        UI.updateHUD(this.engine.myRole, this.engine.p1, this.engine.p2, this.engine.isResolving);
        requestAnimationFrame(this.gameLoop);
    }

    // Dessine l'interface utilisateur du mode BPM, y compris les lumières et les files d'attente d'actions
    drawBpmUI(ctx) {
        let lightSize = 15;
        let spacing = 40;
        let startX = (this.canvas.width / 2) - spacing;
        let startY = 40;

        let activeLights = this.engine.bpmBeat === 0 ? 3 : this.engine.bpmBeat;

        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(startX + (i * spacing), startY, lightSize, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fill();
            
            if (i < activeLights) {
                ctx.fillStyle = (i === 2) ? "#4CAF50" : "#FFEB3B";
                ctx.fill();
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0; 
            }

            ctx.lineWidth = 2;
            ctx.strokeStyle = "#FFF";
            ctx.stroke();
        }

        if (this.engine.queueSlideAnim > 0.01) {
            this.engine.queueSlideAnim += (0 - this.engine.queueSlideAnim) * 0.15;
        } else {
            this.engine.queueSlideAnim = 0;
        }

        let p1Direction = (this.engine.myRole === "p2") ? "up" : "down";
        let p2Direction = (this.engine.myRole === "p2") ? "down" : "up";

        this.engine.gridPlayer1.drawQueue(ctx, this.engine.p2ActionQueue, GameConfig.BPM_QUEUE_SIZE, this.engine.p2.color, "left", this.engine.queueSlideAnim, p1Direction);
        this.engine.gridPlayer2.drawQueue(ctx, this.engine.p1ActionQueue, GameConfig.BPM_QUEUE_SIZE, this.engine.p1.color, "left", this.engine.queueSlideAnim, p2Direction);
        if (window.highlightBpmQueue) {
            ctx.save();
            ctx.strokeStyle = "#FFEB3B";
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.4 + Math.abs(Math.sin(Date.now() / 200)) * 0.6; // Clignotement

            let targetGrid = this.engine.gridPlayer2; 
            
            // Meme calcul que DrawQueue
            let queueSpacing = 15;
            let maxAvailableHeight = ctx.canvas.height * 0.8;
            
            let maxSlotHeight = maxAvailableHeight / GameConfig.BPM_QUEUE_SIZE;
            let maxMiniGridHeight = maxSlotHeight - queueSpacing;
            let dynamicCellSize = maxMiniGridHeight / targetGrid.rows;
            
            let miniCellSize = Math.min(dynamicCellSize, targetGrid.cellSize / 4);
            miniCellSize = Math.max(10, miniCellSize);
            
            let miniGridWidth = targetGrid.cols * miniCellSize;
            let miniGridHeight = targetGrid.rows * miniCellSize;
            let slotHeight = miniGridHeight + queueSpacing;

            // X de depart
            let qX = targetGrid.x - miniGridWidth - 20;
            
            // Y de départ
            let qY = targetGrid.y;
            
            // La hauteur totale occupée du premier au dernier slot de la boucle
            let totalHighlightHeight = (GameConfig.BPM_QUEUE_SIZE - 1) * slotHeight + miniGridHeight;
            
            // On dessine le rectangle avec 5px de marge pour englober proprement les bordures blanches
            ctx.strokeRect(qX - 5, qY - 5, miniGridWidth + 10, totalHighlightHeight + 10);
            ctx.restore();
        }
    }
}