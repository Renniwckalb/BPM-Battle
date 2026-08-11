import * as UI from '../ui/ui.js';

export default class TutorialManager {
    constructor(engine) {
        this.engine = engine;
        this.step = 0;
        this.fail = false;
        this.validTarget = false;
    }

    // Lance le tutoriel
    start() {
        this.step = 1;
        this.fail = false;
        this.engine.p2.hp = 99; // Mannequin invincible
        UI.DOM.tutorialBox.style.display = "block";
        UI.updateTutorialStep(this.step, this.engine.p1.energy, false);
    }

    // Fait avancer les textes lors de la présentation visuelle (clics)
    advanceClick() {
        if (this.step < 8) {
            this.step++;
            UI.updateTutorialStep(this.step, this.engine.p1.energy, false);
        } else if (this.step === 8) {
            this.step++;
            this.engine.actionActuelle = null;
            UI.resetActionButtons();
            UI.updateTutorialStep(this.step, this.engine.p1.energy, false);
        }
    }

    // Intercepte les actions choisies (avant la résolution du tour)
    interceptAction(myActionChoice) {
        this.engine.p1Action = myActionChoice;
        this.validTarget = false;
        
        // L'IA ESQUIVE SPÉCIFIQUEMENT À L'ÉTAPE 11
        if (this.step === 11 && myActionChoice.type === "attaque_normale") {
            if (myActionChoice.col === this.engine.p2.col && myActionChoice.row === this.engine.p2.row) {
                this.validTarget = true; 
                let dodgeCol = 2; 
                let dodgeRow = 2;
                this.engine.p2Action = { type: "mouvement", col: dodgeCol, row: dodgeRow };
            } else {
                this.engine.p2Action = { type: "recharge" }; 
            }
        } else {
            this.engine.p2Action = { type: "recharge" }; 
        }
    }

    // Vérifie si l'action du joueur était la bonne (après la résolution)
    verifyTurn() {
        if (this.step < 9) return;

        let previousFail = this.fail; 
        this.fail = false; 
        
        let p1Action = this.engine.p1Action;
        let p1 = this.engine.p1;
        let p2 = this.engine.p2;

        if (this.step === 9) {
            if (p1Action.type === "mouvement") this.step++;
            else this.fail = true;
        }
        else if (this.step === 10) {
            if (p1Action.type === "recharge") this.step++;
            else this.fail = true;
        }
        else if (this.step === 11) {
            if (p1Action.type === "attaque_normale") {
                if (this.validTarget) this.step++; 
                else { this.fail = true; p1.energy++; } // Remboursement
            } else this.fail = true;
        }
        else if (this.step === 12) {
            if (p1Action.type === "recharge") this.step++; 
            else this.fail = true;
        }
        else if (this.step === 13) {
            if (p1Action.type === "attaque_normale") {
                if (p1Action.col === p2.col && p1Action.row === p2.row) this.step++; 
                else { this.fail = true; p1.energy++; } // Remboursement
            } else this.fail = true;
        }
        else if (this.step === 14) {
            if (p1Action.type === "attaque_colonne") {
                if (p1Action.col === p2.col) {
                    this.fail = false; 
                    this.step = 15;    
                    setTimeout(() => {
                        if(typeof this.engine.returnToMainMenu === "function") this.engine.returnToMainMenu();
                        else UI.showMainMenu(); 
                    }, 4000); 
                } else { this.fail = true; p1.energy += 3; } // Remboursement
            } 
            else if (p1Action.type === "recharge") this.fail = previousFail; 
            else this.fail = true;
        }
        
        UI.updateTutorialStep(this.step, p1.energy, this.fail);
    }

    // Dessine la surbrillance sur le Canvas
    drawHighlight(ctx) {
        if (this.step >= 2 && this.step <= 4) {
            ctx.save();
            ctx.strokeStyle = "#FFEB3B";
            ctx.lineWidth = 6;
            ctx.setLineDash([15, 10]);
            ctx.lineDashOffset = -(Date.now() / 100); 
            
            let grid1 = this.engine.gridPlayer1;
            let grid2 = this.engine.gridPlayer2;
            let p1 = this.engine.p1;
            let p2 = this.engine.p2;
            
            if (this.step === 2) { 
                let px = grid1.x + (p1.visualCol * grid1.cellSize) + (grid1.cellSize / 2);
                let py = grid1.y + (p1.visualRow * grid1.cellSize) + (grid1.cellSize / 2);
                ctx.beginPath(); ctx.arc(px, py, grid1.cellSize * 0.6, 0, Math.PI * 2); ctx.stroke();
            } else if (this.step === 3) { 
                ctx.strokeRect(grid1.x - 5, grid1.y - 5, (grid1.cols * grid1.cellSize) + 10, (grid1.rows * grid1.cellSize) + 10);
            } else if (this.step === 4) { 
                let px = grid2.x + (p2.visualCol * grid2.cellSize) + (grid2.cellSize / 2);
                let py = grid2.y + (p2.visualRow * grid2.cellSize) + (grid2.cellSize / 2);
                ctx.beginPath(); ctx.arc(px, py, grid2.cellSize * 0.6, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
        }
    }
}