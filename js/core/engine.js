import Grid from '../entities/grid.js';
import Player from '../entities/player.js';
import * as Combat from '../systems/combat.js';
import * as UI from '../ui/ui.js';
import * as Network from '../systems/network.js';
import TutorialManager from '../systems/tutorial.js';
import { GameConfig, updateConfig } from './config.js';
import AudioManager from '../systems/audio.js';

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
        this.tutorial = new TutorialManager(this);
        
        // Variable mode BPM
        this.audio = new AudioManager();
        this.bpmTimer = null;           // Le minuteur du métronome
        this.bpmBeat = 0;               // Le compte des temps (1, 2, 3 = Boom)
        this.p1ActionQueue = [];        // La pile d'attaques du J1
        this.p2ActionQueue = [];        // La pile d'attaques du J2
        this.currentP1Action = null;    // L'action choisie pendant le cycle actuel
        this.currentP2Action = null;
        this.queueSlideAnim = 0;

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
        this.audio.init();
        this.gameMode = mode;
        this.myRole = role;
        if (mode === "tutorial") {
            this.tutorial.start();
        }
        if (GameConfig.MODE_BPM && mode !== "tutorial") {
            this.startBpmLoop();
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
        this.stopBpmLoop();
        UI.resetActionButtons();
    }

    // Masquer bouttons et endscreen
    doRestartGame() {
        this.resetGame();
        UI.DOM.endScreen.style.display = "none";
        this.localRematchReady = false;
        this.remoteRematchReady = false;
        this.gameState = "playing";

        if (GameConfig.MODE_BPM && this.gameMode !== "tutorial") {
            this.startBpmLoop();
        }
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
            this.submitAction(myActionChoice);
        }
    }

    // Envoie choix d'action
    submitAction(myActionChoice) {
        this.isResolving = true;
        this.actionActuelle = null;
        UI.resetActionButtons();
        
        if (this.gameMode === "tutorial") { 
            this.tutorial.interceptAction(myActionChoice);
            this.resolveTurn();
            return;
        }
        
        if (GameConfig.MODE_BPM) {
            if (this.myRole === "p1") this.currentP1Action = myActionChoice;
            else this.currentP2Action = myActionChoice;

            if (this.gameMode === "ai") {
                this.currentP2Action = Combat.generateAIPick(this.p1, this.p2);
            }
            
            if (this.gameMode === "network") {
                Network.sendData(myActionChoice);
            }
            return;
        }

        if (this.gameMode === "ai") { 
            this.p1Action = myActionChoice;
            this.p2Action = Combat.generateAIPick(this.p1, this.p2);
            this.resolveTurn();
        } else {
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
            if (GameConfig.MODE_BPM) {

                if (this.myRole === "p1") this.currentP1Action = myActionChoice;
                else this.currentP2Action = myActionChoice;

                if (this.gameMode === "network") {
                Network.sendData(myActionChoice);
            }
            return;
            }
            else {
                if (this.myRole === "p1") this.p2Action = data;
                if (this.myRole === "p2") this.p1Action = data;
                this.remoteActionReady = true;
                this.checkBothReady();
            }
        }
    }

    // Verfie si les 2 joueurs ont validés leurs actions
    checkBothReady() {
        if (this.localActionReady && this.remoteActionReady) this.resolveTurn();
    }

    // Avancer le tutoriel
    advanceTutorial() {
        if (this.tutorial) this.tutorial.advanceClick();
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
                    if (this.gameMode === "tutorial") {
                        this.tutorial.verifyTurn();
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
        if (this.gameMode === "tutorial") {
            this.tutorial.drawHighlight(this.ctx);
        }
        // Dessin du HUD mode BPM
        if (GameConfig.MODE_BPM && this.gameMode !== "tutorial") {
            this.drawBpmUI(this.ctx);
        }
        
        UI.updateHUD(this.myRole, this.p1, this.p2, this.isResolving);
        requestAnimationFrame(this.gameLoop);
    }

    // BPM FONCTION
    // Trace les éléments pour le mode BPM
    drawBpmUI(ctx) {
        // Le feu tricolore
        let lightSize = 15;
        let spacing = 40;
        let startX = (this.canvas.width / 2) - spacing;
        let startY = 40;

        let activeLights = this.bpmBeat === 0 ? 3 : this.bpmBeat;

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
        if (this.queueSlideAnim > 0.01) {
            this.queueSlideAnim += (0 - this.queueSlideAnim) * 0.15;
        } else {
            this.queueSlideAnim = 0; // On l'arrête complètement pour éviter les calculs inutiles
        }

        // On envoie la valeur d'animation (queueSlideAnim) aux grilles
        this.gridPlayer1.drawQueue(ctx, this.p1ActionQueue, GameConfig.BPM_QUEUE_SIZE, this.p1.color, "left", this.queueSlideAnim);
        this.gridPlayer2.drawQueue(ctx, this.p2ActionQueue, GameConfig.BPM_QUEUE_SIZE, this.p2.color, "right", this.queueSlideAnim);
    }

    startBpmLoop() {
        this.bpmBeat = 0;
        this.p1ActionQueue = Array(GameConfig.BPM_QUEUE_SIZE).fill(null);
        this.p2ActionQueue = Array(GameConfig.BPM_QUEUE_SIZE).fill(null);
        this.currentP1Action = null;
        this.currentP2Action = null;

        if (this.bpmTimer) clearInterval(this.bpmTimer);
        this.bpmTimer = setInterval(() => this.bpmTick(), GameConfig.BPM_TEMPO);
    }

    // Arrêt de la boucle rythmique (à appeler en fin de partie)
    stopBpmLoop() {
        if (this.bpmTimer) {
            clearInterval(this.bpmTimer);
            this.bpmTimer = null;
        }
    }

    // Chaque battement du métronome
    bpmTick() {
        this.bpmBeat++;
        if (this.bpmBeat < 3) {
            this.audio.playTic();
        } else {
            this.audio.playBoom();
            this.bpmBeat = 0;
            this.resolveBpmTurn();
        }
    }

    resolveBpmTurn() {
        this.isResolving = true;

        if (this.gameMode === "ai" && !this.currentP2Action) {
            this.currentP2Action = Combat.generateAIPick(this.p1, this.p2);
        }

        // Récupérer les actions (Si un joueur n'a rien cliqué, il ne fait rien : "none")
        let p1Act = this.currentP1Action || { type: "none" };
        let p2Act = this.currentP2Action || { type: "none" };

        this.currentP1Action = null;
        this.currentP2Action = null;

        if (p1Act.type === "recharge") this.p1.energy++;
        if (p2Act.type === "recharge") this.p2.energy++;

        if (p1Act.type === "mouvement") this.p1.moveTo(p1Act.col, p1Act.row);
        if (p2Act.type === "mouvement") this.p2.moveTo(p2Act.col, p2Act.row);

        let p1QueuedAttack = p1Act.type.startsWith("attaque") ? p1Act : null;
        let p2QueuedAttack = p2Act.type.startsWith("attaque") ? p2Act : null;
        
        if (p1QueuedAttack && p1QueuedAttack.type === "attaque_normale") this.p1.energy -= GameConfig.COST_NORMAL_ATTACK;
        if (p1QueuedAttack && p1QueuedAttack.type === "attaque_colonne") this.p1.energy -= GameConfig.COST_SPECIAL_ATTACK;
        if (p2QueuedAttack && p2QueuedAttack.type === "attaque_normale") this.p2.energy -= GameConfig.COST_NORMAL_ATTACK;
        if (p2QueuedAttack && p2QueuedAttack.type === "attaque_colonne") this.p2.energy -= GameConfig.COST_SPECIAL_ATTACK;

        let p1IncomingAttack = this.p1ActionQueue.shift();
        let p2IncomingAttack = this.p2ActionQueue.shift();
        
        this.p1ActionQueue.push(p1QueuedAttack);
        this.p2ActionQueue.push(p2QueuedAttack);

        this.queueSlideAnim = 1.0;

        if (p1IncomingAttack) {
            if (p1IncomingAttack.type === "attaque_normale") {
                this.gridPlayer2.attackedCells.push({ col: p1IncomingAttack.col, row: p1IncomingAttack.row });
                if (this.p2.col === p1IncomingAttack.col && this.p2.row === p1IncomingAttack.row) this.p2.hp--;
            } else if (p1IncomingAttack.type === "attaque_colonne") {
                this.gridPlayer2.flashColumn(p1IncomingAttack.col);
                if (this.p2.col === p1IncomingAttack.col) this.p2.hp--;
            }
        }

        if (p2IncomingAttack) {
            if (p2IncomingAttack.type === "attaque_normale") {
                this.gridPlayer1.attackedCells.push({ col: p2IncomingAttack.col, row: p2IncomingAttack.row });
                if (this.p1.col === p2IncomingAttack.col && this.p1.row === p2IncomingAttack.row) this.p1.hp--;
            } else if (p2IncomingAttack.type === "attaque_colonne") {
                this.gridPlayer1.flashColumn(p2IncomingAttack.col);
                if (this.p1.col === p2IncomingAttack.col) this.p1.hp--;
            }
        }

        // Nettoyer l'écran après 300ms
        setTimeout(() => {
            this.gridPlayer1.attackedCells = [];
            this.gridPlayer2.attackedCells = [];
            this.isResolving = false;
            
            // Vérification Game Over
            if (this.p1.hp <= 0 || this.p2.hp <= 0) {
                this.stopBpmLoop();
                UI.showGameOver(this.myRole, this.p1, this.p2);
            } else {
                UI.resetActionButtons(); // On libère les boutons pour le cycle suivant !
            }
        }, 300);
    }
}