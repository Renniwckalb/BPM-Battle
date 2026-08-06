import Grid from '../entities/grid.js';
import Player from '../entities/player.js';
import * as Combat from '../system/combat.js';
import * as UI from '../ui/ui.js';
import * as Network from '../system/network.js';
import { GameConfig, updateConfig } from './config.js';

export default class GameEngine {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        
        // État du jeu
        this.gameState = "menu";
        this.gameMode = null;
        this.actionActuelle = null;
        this.isResolving = false;
        this.p1Action = null;
        this.p2Action = null;

        // Réseau
        this.myRole = null;
        this.localActionReady = false;
        this.remoteActionReady = false;
        this.localRematchReady = false;
        this.remoteRematchReady = false;

        // Entités
        this.gridPlayer1 = new Grid(0, 0, 0, "#4CAF50");
        this.gridPlayer2 = new Grid(0, 0, 0, "#F44336");
        this.p1 = new Player(this.gridPlayer1, 1, 1, "#2196F3");
        this.p2 = new Player(this.gridPlayer2, 1, 1, "#FF9800");

        // La taille de l'écran
        window.addEventListener("resize", () => this.resizeCanvas());
        this.resizeCanvas();

        // Tutoriel
        this.tutorialStep = 0;
        this.tutorialFail = false;
        this.tutorialValidTarget = false;

        // Boucle de jeu
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    // Dessigner grille selon taille ecran
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        let baseCellSize = Math.min(this.canvas.width / 3.6, this.canvas.height / 7.5);
        let myGrid = (this.myRole === "p2") ? this.gridPlayer2 : this.gridPlayer1;
        let oppGrid = (this.myRole === "p2") ? this.gridPlayer1 : this.gridPlayer2;

        myGrid.cellSize = baseCellSize;
        myGrid.x = (this.canvas.width - (baseCellSize * 3)) / 2;
        myGrid.y = this.canvas.height - (baseCellSize * 3) - 100;

        oppGrid.cellSize = baseCellSize * 0.75;
        oppGrid.x = (this.canvas.width - (oppGrid.cellSize * 3)) / 2;
        oppGrid.y = 70;
    }

    // Lancer une partie
    startGame(mode, role) {
        this.gameMode = mode;
        this.myRole = role;
        if (mode === "tutorial") {
            this.tutorialStep = 1;
            this.tutorialFail = false;
            this.p2.hp = 99;
            UI.DOM.tutorialBox.style.display = "block";
            UI.updateTutorialStep(this.tutorialStep, this.p1.energy);
        }
        UI.prepareStartGame(this.myRole);
        this.gameState = "playing";
        this.resizeCanvas();
    }

    // Reset variables
    resetGame() {
        this.p1.hp = GameConfig.MAX_HP;
        this.p1.energy = 0;
        this.p2.hp = GameConfig.MAX_HP;
        this.p2.energy = 0;
        this.p1.moveTo(1, 1);
        this.p2.moveTo(1, 1);
        this.isResolving = false;
        this.p1Action = null;
        this.p2Action = null;
        this.localActionReady = false;
        this.remoteActionReady = false;
        this.actionActuelle = null;
        UI.resetActionButtons();
    }

    // Masquer bouttons et endscreen
    doRestartGame() {
        this.resetGame();
        UI.DOM.endScreen.style.display = "none";
        this.localRematchReady = false;
        this.remoteRematchReady = false;
        this.gameState = "playing";
    }

    // Afficher menu principal
    returnToMainMenu() {
        this.resetGame();
        Network.closeNetwork();
        UI.showMainMenu();
        this.localRematchReady = false;
        this.remoteRematchReady = false;
        this.gameState = "menu";
        this.gameMode = null;
    }

    // Choix actions des joueurs
    setAction(action) {
        this.actionActuelle = action;

        this.gridPlayer1.selectedCol = -1;
        this.gridPlayer1.selectedRow = -1;

        this.gridPlayer2.selectedCol = -1;
        this.gridPlayer2.selectedRow = -1;
    }

    // Gestion du tactile
    handleInput(clientX, clientY) {
        if (this.gameState !== "playing" || this.isResolving || !this.actionActuelle) return;

        let myGrid = (this.myRole === "p1") ? this.gridPlayer1 : this.gridPlayer2;
        let oppGrid = (this.myRole === "p1") ? this.gridPlayer2 : this.gridPlayer1;
        let me = (this.myRole === "p1") ? this.p1 : this.p2;
        let myActionChoice = null;

        let clickedMy = myGrid.getClickedCell(clientX, clientY);
        let clickedOpp = oppGrid.getClickedCell(clientX, clientY);

        if (this.actionActuelle === "mouvement" && clickedMy) myActionChoice = { type: "mouvement", col: clickedMy.col, row: clickedMy.row };
        if (this.actionActuelle === "recharge" && clickedMy) myActionChoice = { type: "recharge" };
        if (this.actionActuelle === "attaque_normale" && me.energy >= 1 && clickedOpp) myActionChoice = { type: "attaque_normale", col: clickedOpp.col, row: clickedOpp.row };
        if (this.actionActuelle === "attaque_colonne" && me.energy >= 3 && clickedOpp) myActionChoice = { type: "attaque_colonne", col: clickedOpp.col };

        if (myActionChoice) {
            this.isResolving = true;
            this.actionActuelle = null;
            UI.resetActionButtons();
            
            if (this.gameMode === "ai") { 
                this.p1Action = myActionChoice;
                this.p2Action = Combat.generateAIPick(this.p1, this.p2);
                this.resolveTurn();
            } else {
                if (this.myRole === "p1") this.p1Action = myActionChoice;else this.p2Action = myActionChoice;
                Network.sendData(myActionChoice);
                this.localActionReady = true;
                this.checkBothReady();
            }
        }
    }

    // Envoie choix d'action
    submitAction(myActionChoice) {
        this.isResolving = true;
        this.actionActuelle = null;
        UI.resetActionButtons();
        
       if (this.gameMode === "ai") { 
            this.p1Action = myActionChoice;
            this.p2Action = Combat.generateAIPick(this.p1, this.p2);
            this.resolveTurn();
        }
        else if (this.gameMode === "tutorial") { 
            this.p1Action = myActionChoice;
            this.tutorialValidTarget = false;
            
            if (this.tutorialStep === 11 && myActionChoice.type === "attaque_normale") {
                if (myActionChoice.col === this.p2.col && myActionChoice.row === this.p2.row) {
                    this.tutorialValidTarget = true;
                    let dodgeCol = (myActionChoice.col === 0) ? 2 : 0; 
                    let dodgeRow = (myActionChoice.row === 0) ? 2 : 0;
                    this.p2Action = { type: "mouvement", col: dodgeCol, row: dodgeRow };
                } else {
                    this.p2Action = { type: "recharge" }; 
                }
            } else {
                this.p2Action = { type: "recharge" }; 
            }
            
            this.resolveTurn();
        }
        else {
            if (this.myRole === "p1") this.p1Action = myActionChoice;
            else this.p2Action = myActionChoice;
            
            Network.sendData(myActionChoice);
            this.localActionReady = true;
            this.checkBothReady();
        }
    }

    // Gestion donnée en ligne
    handleNetworkData(data) {
        if (data.type === "config") {
            updateConfig(data.settings);
            this.resetGame();
            this.startGame("pvp", "p2");
        } 
        else if (data.type === "rematch") {
            this.remoteRematchReady = true;
            if (this.localRematchReady) this.doRestartGame();
        } 
        else if (data.type === "menu") {
            this.returnToMainMenu();
        } 
        else {
            if (this.myRole === "p1") this.p2Action = data;
            if (this.myRole === "p2") this.p1Action = data;
            this.remoteActionReady = true;
            this.checkBothReady();
        }
    }

    // Verfie si les 2 joueurs ont validés leurs actions
    checkBothReady() {
        if (this.localActionReady && this.remoteActionReady) this.resolveTurn();
    }

    // Avancer le tutoriel
    advanceTutorial() {
        if (this.tutorialStep < 8) {
            this.tutorialStep++;
            UI.updateTutorialStep(this.tutorialStep, this.p1.energy, false);
        } else if (this.tutorialStep === 8) {
            this.tutorialStep++;
            this.actionActuelle = null;
            UI.resetActionButtons();
            UI.updateTutorialStep(this.tutorialStep, this.p1.energy, false);
        }
    }

    // Execute les actions choisis par les joueurs
    resolveTurn() {
        if (this.p1Action.type === "mouvement") Combat.executeAction(this.p1, this.p2, this.gridPlayer1, this.gridPlayer2, this.p1Action);
        if (this.p2Action.type === "mouvement") Combat.executeAction(this.p2, this.p1, this.gridPlayer2, this.gridPlayer1, this.p2Action);

        setTimeout(() => {
            if (this.p1Action.type === "recharge") Combat.executeAction(this.p1, this.p2, this.gridPlayer1, this.gridPlayer2, this.p1Action);
            if (this.p2Action.type === "recharge") Combat.executeAction(this.p2, this.p1, this.gridPlayer2, this.gridPlayer1, this.p2Action);

            setTimeout(() => {
                if (this.p1Action.type === "attaque_normale" || this.p1Action.type === "attaque_colonne") {
                    Combat.executeAction(this.p1, this.p2, this.gridPlayer1, this.gridPlayer2, this.p1Action);
                }
                if (this.p2Action.type === "attaque_normale" || this.p2Action.type === "attaque_colonne") {
                    Combat.executeAction(this.p2, this.p1, this.gridPlayer2, this.gridPlayer1, this.p2Action);
                }

                setTimeout(() => {
                    this.gridPlayer1.selectedCol = -1;
                    this.gridPlayer1.selectedRow = -1;
                    
                    this.gridPlayer2.selectedCol = -1;
                    this.gridPlayer2.selectedRow = -1;
                    
                    if (this.gameMode === "tutorial" && this.tutorialStep >= 9) {
                        let previousFail = this.tutorialFail; 
                        this.tutorialFail = false; 

                        if (this.tutorialStep === 9) {
                            if (this.p1Action.type === "mouvement") this.tutorialStep++;
                            else this.tutorialFail = true;
                        }
                        else if (this.tutorialStep === 10) {
                            if (this.p1Action.type === "recharge") this.tutorialStep++;
                            else this.tutorialFail = true;
                        }
                        else if (this.tutorialStep === 11) {
                            if (this.p1Action.type === "attaque_normale") {
                                if (this.tutorialValidTarget) {
                                    this.tutorialStep++;
                                } else {
                                    this.tutorialFail = true;
                                    this.p1.energy++;
                                }
                            }
                            else this.tutorialFail = true;
                        }
                        else if (this.tutorialStep === 12) {
                            if (this.p1Action.type === "recharge") this.tutorialStep++; 
                            else this.tutorialFail = true;
                        }
                        else if (this.tutorialStep === 13) {
                            if (this.p1Action.type === "attaque_normale") {
                                if (this.p1Action.col === this.p2.col && this.p1Action.row === this.p2.row) {
                                    this.tutorialStep++;
                                } else {
                                    this.tutorialFail = true;
                                    this.p1.energy++;
                                }
                            }
                            else this.tutorialFail = true;
                        }
                        else if (this.tutorialStep === 14) {
                            if (this.p1Action.type === "attaque_colonne") {
                                if (this.p1Action.col === this.p2.col) {
                                    this.tutorialFail = false; 
                                    this.tutorialStep = 15;    
                                    
                                    setTimeout(() => {
                                        if(typeof this.returnToMainMenu === "function") {
                                            this.returnToMainMenu();
                                        } else {
                                            UI.showMainMenu(); 
                                        }
                                    }, 4000); 
                                } else {
                                    this.tutorialFail = true;
                                    this.p1.energy += 3;
                                }
                            } 
                            else if (this.p1Action.type === "recharge") {
                                this.tutorialFail = previousFail; 
                            }
                            else {
                                this.tutorialFail = true;
                            }
                        }
                        
                        UI.updateTutorialStep(this.tutorialStep, this.p1.energy, this.tutorialFail);
                    }
                    if (this.p1.hp > 0 && this.p2.hp > 0) {
                        this.isResolving = false;
                        this.p1Action = null;
                        this.p2Action = null;
                        if (this.gameMode === "pvp") {
                            this.localActionReady = false;
                            this.remoteActionReady = false;
                        }
                    } else {
                        UI.showGameOver(this.myRole, this.p1, this.p2);
                        this.gameState = "end";
                    }
                }, 150);
            }, 150);
        }, 150);
    }

    // Tracage de chaque frame
    gameLoop() {
        this.ctx.fillStyle = "#1e1e1e";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.gridPlayer1.draw(this.ctx);
        this.gridPlayer2.draw(this.ctx);
        this.p1.draw(this.ctx);
        this.p2.draw(this.ctx);

        // Surbrillance Tutoriel sur le Canvas
        if (this.gameMode === "tutorial" && this.tutorialStep >= 2 && this.tutorialStep <= 4) {
            this.ctx.save();
            this.ctx.strokeStyle = "#FFEB3B";
            this.ctx.lineWidth = 6;
            this.ctx.setLineDash([15, 10]);
            this.ctx.lineDashOffset = -(Date.now() / 100); 
            
            if (this.tutorialStep === 2) { // Joueur
                let px = this.gridPlayer1.x + (this.p1.visualCol * this.gridPlayer1.cellSize) + (this.gridPlayer1.cellSize / 2);
                let py = this.gridPlayer1.y + (this.p1.visualRow * this.gridPlayer1.cellSize) + (this.gridPlayer1.cellSize / 2);
                this.ctx.beginPath(); this.ctx.arc(px, py, this.gridPlayer1.cellSize * 0.6, 0, Math.PI * 2); this.ctx.stroke();
            } else if (this.tutorialStep === 3) { // Grille
                this.ctx.strokeRect(this.gridPlayer1.x - 5, this.gridPlayer1.y - 5, (this.gridPlayer1.cols * this.gridPlayer1.cellSize) + 10, (this.gridPlayer1.rows * this.gridPlayer1.cellSize) + 10);
            } else if (this.tutorialStep === 4) { // Adversaire
                let px = this.gridPlayer2.x + (this.p2.visualCol * this.gridPlayer2.cellSize) + (this.gridPlayer2.cellSize / 2);
                let py = this.gridPlayer2.y + (this.p2.visualRow * this.gridPlayer2.cellSize) + (this.gridPlayer2.cellSize / 2);
                this.ctx.beginPath(); this.ctx.arc(px, py, this.gridPlayer2.cellSize * 0.6, 0, Math.PI * 2); this.ctx.stroke();
            }
            this.ctx.restore();
        }
        
        UI.updateHUD(this.myRole, this.p1, this.p2, this.isResolving);
        requestAnimationFrame(this.gameLoop);
    }
}