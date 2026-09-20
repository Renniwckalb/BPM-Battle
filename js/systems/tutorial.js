import * as UI from '../ui/ui.js';
import { updateConfig } from '../core/config.js';
import { GamePresets } from '../core/preset.js';

export default class TutorialManager {
    constructor(engine) {
        this.engine = engine;
        this.step = 0;
        this.fail = false;
        this.validTarget = false;
    }

    // Lance le tutoriel
    start(mode) {
        this.mode = mode;
        this.step = (mode === "tutorial_bpm") ? 20 : 1; // 20 pour le tuto BPM
        this.fail = false;
        this.engine.p2.hp = 99;
        UI.DOM.tutorialBox.hidden = false;
        UI.updateTutorialStep(this.step, this.engine.p1.energy, false);
    }

    // Fait avancer les textes lors de la présentation visuelle
    advanceClick() {
        if (this.mode === "tutorial_bpm") {
            if (this.step < 21) {
                this.step++;
                UI.updateTutorialStep(this.step, this.engine.p1.energy, false);
            } else if (this.step === 21) {
                this.step++;
                this.engine.actionActuelle = null;
                UI.resetActionButtons();
                UI.updateTutorialStep(this.step, this.engine.p1.energy, false);
            }
        } else {
            // Tuto classique
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
    }

    // Intercepte les actions choisies (avant la résolution du tour)
    interceptAction(myActionChoice) {
        this.engine.p1Action = myActionChoice;
        this.validTarget = false;
    
        if (this.mode === "tutorial_bpm") {
            if (this.step === 24 && myActionChoice.type === "attaque_normale") {
                if (myActionChoice.col === this.engine.p2.col && myActionChoice.row === this.engine.p2.row) {
                    this.validTarget = true;
                }
            }
            this.engine.p2Action = { type: "recharge" }; 
            return;
        }
        
        // L'ia esquive à l'etape 11
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

    // Vérifie si l'action du joueur était bonne
    verifyTurn() {
        let p1Action = this.engine.p1Action;
        let p1 = this.engine.p1;
        let p2 = this.engine.p2;

        if (this.mode === "tutorial_bpm") {
            this.verifyBpmTurn(p1Action, p1, p2);
        } else {
            this.verifyClassicTurn(p1Action, p1, p2);
        }
    }

    // Vérfication pour le mode BPM
    verifyBpmTurn(p1Action, p1, p2) {
        this.fail = false;
        if (this.step < 22) return;

        if (this.step === 22) {
            if (p1Action.type === "mouvement") this.step++;
            else this.fail = true;
        }
        else if (this.step === 23) {
            if (p1Action.type === "recharge") this.step++;
            else this.fail = true;
        }
        else if (this.step === 24) {
            if (p1Action.type === "attaque_normale") {
                if (this.validTarget) {
                    this.step = 25;
                    this.fail = false;
                } else { 
                    this.fail = true; 
                    p1.energy++; 
                } 
            } else {
                this.fail = true;
            }
        }
        else if (this.step === 25) {
            if (p2.hp < 99) {
                window.highlightBpmQueue = false;
                this.step = 26;
                setTimeout(() => {
                    UI.DOM.tutorialBox.hidden = true;
                    updateConfig(GamePresets.bpmTutoriel);
                    this.engine.resetGame();
                    this.engine.startGame("ai", "p1");
                }, 3000); 
            }
        } else {
            this.fail = true;
        }
        UI.updateTutorialStep(this.step, p1.energy, this.fail);
    }

    // Vérification pour le mode classique
    verifyClassicTurn(p1Action, p1, p2) {
        let previousFail = this.fail;
        this.fail = false;

        // Dictionnaire des conditions de reussite
        const stepsConfig = {
            9: () => p1Action.type === "mouvement",
            10: () => p1Action.type === "recharge",
            11: () => {
                if (p1Action.type === "attaque_normale" && this.validTarget) return true;
                p1.energy++; return false;
            },
            12: () => p1Action.type === "recharge",
            13: () => {
                if (p1Action.type === "attaque_normale" && p1Action.col === p2.col && p1Action.row === p2.row) return true;
                p1.energy++; return false;
            },
            14: () => {
                if ((p1Action.type === "attaque_colonne" && p1Action.col === p2.col) ||
                    (p1Action.type === "attaque_ligne" && p1Action.row === p2.row)) {
                    setTimeout(() => {
                        UI.DOM.tutorialBox.hidden = true;
                        updateConfig(GamePresets.classique);
                        this.engine.resetGame();
                        this.engine.startGame("ai", "p1");
                    }, 4000);
                    return true;
                }
                if (p1Action.type === "recharge") {
                    this.fail = previousFail;
                    return null;
                }
                p1.energy += 3; return false;
            }
        };

        // Exécution d'etape
        if (stepsConfig[this.step]) {
            const result = stepsConfig[this.step]();
            if (result === true) {
                this.step++;
                if (this.step === 15) this.fail = false; // Transition final
            } else if (result === false) {
                this.fail = true;
            }
        } else {
            this.fail = true;
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