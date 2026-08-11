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
        
        // --- SYNCHRONISATION DÉTERMINISTE (TICK-BASED) ---
        this.currentTick = 0;
        this.p1BufferedActions = new Map(); // Stocke les actions indexées par numéro de tick
        this.p2BufferedActions = new Map();

        // Réseau
        this.myRole = null;
        this.localRematchReady = false;
        this.remoteRematchReady = false;

        // Entités
        this.gridPlayer1 = new Grid(0, 0, 0, "#4CAF50");
        this.gridPlayer2 = new Grid(0, 0, 0, "#F44336");
        this.p1 = new Player(this.gridPlayer1, 1, 1, "#2196F3");
        this.p2 = new Player(this.gridPlayer2, 1, 1, "#FF9800");

        // Écran
        window.addEventListener("resize", () => this.resizeCanvas());
        this.resizeCanvas();

        // Tutoriel
        this.tutorial = new TutorialManager(this);
        
        // Mode BPM
        this.audio = new AudioManager();
        this.bpmTimer = null;
        this.bpmBeat = 0;
        this.p1ActionQueue = [];
        this.p2ActionQueue = [];
        this.currentP1Action = null;
        this.currentP2Action = null;
        this.queueSlideAnim = 0;

        // Boucle de rendu
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    // Redimensionne le canvas et ajuste les grilles en fonction de la taille de l'écran
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        let baseCellSize = Math.min(this.canvas.width / 5.5, this.canvas.height / 7.5);
        let myGrid = (this.myRole === "p2") ? this.gridPlayer2 : this.gridPlayer1;
        let oppGrid = (this.myRole === "p2") ? this.gridPlayer1 : this.gridPlayer2;

        myGrid.cellSize = baseCellSize * 0.90;
        myGrid.x = (this.canvas.width - (baseCellSize * 3)) / 2;
        myGrid.y = this.canvas.height - (baseCellSize * 3) - 100;

        oppGrid.cellSize = baseCellSize * 0.65;
        oppGrid.x = (this.canvas.width - (oppGrid.cellSize * 3)) / 2;
        oppGrid.y = 70;
    }

    // Démarre le jeu avec le mode et le rôle spécifiés
    startGame(mode, role) {
        this.audio.init();
        this.gameMode = mode;
        this.myRole = role;
        
        // Réinitialisation des Ticks de synchronisation
        this.currentTick = 0;
        this.p1BufferedActions.clear();
        this.p2BufferedActions.clear();

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

    // Réinitialise l'état du jeu pour un nouveau départ
    resetGame() {
        this.p1.hp = GameConfig.MAX_HP;
        this.p1.energy = 0;
        this.p2.hp = GameConfig.MAX_HP;
        this.p2.energy = 0;
        this.p1.moveTo(1, 1);
        this.p2.moveTo(1, 1);
        this.isResolving = false;
        
        this.currentTick = 0;
        this.p1BufferedActions.clear();
        this.p2BufferedActions.clear();
        
        this.actionActuelle = null;
        this.stopBpmLoop();
        UI.resetActionButtons();
    }

    // Redémarre le jeu après un match terminé
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

    // Retourne au menu principal après un match terminé
    returnToMainMenu() {
        this.resetGame();
        Network.closeNetwork();
        UI.showMainMenu();
        this.localRematchReady = false;
        this.remoteRematchReady = false;
        this.gameState = "menu";
        this.gameMode = null;
    }

    // Définit l'action actuelle que le joueur peut effectuer
    setAction(action) {
        this.actionActuelle = action;
        this.gridPlayer1.selectedCol = -1;
        this.gridPlayer1.selectedRow = -1;
        this.gridPlayer2.selectedCol = -1;
        this.gridPlayer2.selectedRow = -1;
    }

    // Gère les entrées du joueur en fonction de l'action actuelle et de la grille cliquée
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

    // Soumet l'action choisie par le joueur et gère la synchronisation avec l'autre joueur ou l'IA
    submitAction(myActionChoice) {
        this.isResolving = true;
        this.actionActuelle = null;
        UI.resetActionButtons();
        
        if (this.gameMode === "tutorial") { 
            this.tutorial.interceptAction(myActionChoice);
            this.resolveTurn(myActionChoice, this.p2Action);
            return;
        }
        
        if (GameConfig.MODE_BPM) {
            if (this.myRole === "p1") this.currentP1Action = myActionChoice;
            else this.currentP2Action = myActionChoice;
            return;
        }

        const targetTick = this.currentTick;

        if (this.gameMode === "ai") { 
            const p1Act = myActionChoice;
            const p2Act = Combat.generateAIPick(this.p1, this.p2);
            this.resolveTurn(p1Act, p2Act);
        } else {
            // Tamponner l'action locale
            if (this.myRole === "p1") {
                this.p1BufferedActions.set(targetTick, myActionChoice);
            } else {
                this.p2BufferedActions.set(targetTick, myActionChoice);
            }
            
            // Émettre l'action sur le réseau avec l'index de Tick
            Network.sendData({
                type: "action",
                tick: targetTick,
                action: myActionChoice
            });

            this.checkTickReady(targetTick);
        }
    }

    // Gère les données reçues du réseau et agit en conséquence
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
        else if (data.type === "action") {
            // Enregistrement de l'action distante liée à son tick respectif
            if (this.myRole === "p1") {
                this.p2BufferedActions.set(data.tick, data.action);
            } else {
                this.p1BufferedActions.set(data.tick, data.action);
            }
            this.checkTickReady(data.tick);
        }
        else if (data.type === "bpm_action") {
            if (this.myRole === "p1") this.p2BufferedActions.set(data.tick, data.action);
            if (this.myRole === "p2") this.p1BufferedActions.set(data.tick, data.action);
            this.checkBpmReady(data.tick);
        }
    }

    // Vérifie si le tick actuel contient les actions des deux joueurs
    checkTickReady(tick) {
        // Vérifie si le tick actuel contient les actions des deux joueurs
        if (tick === this.currentTick && this.p1BufferedActions.has(tick) && this.p2BufferedActions.has(tick)) {
            const p1Act = this.p1BufferedActions.get(tick);
            const p2Act = this.p2BufferedActions.get(tick);
            this.resolveTurn(p1Act, p2Act);
        }
    }

    // Vérifie si le tick actuel contient les actions des deux joueurs en mode BPM
    checkBpmReady(tick) {
        if (tick === this.currentTick && this.p1BufferedActions.has(tick) && this.p2BufferedActions.has(tick)) {
            this.resolveBpmTurn();
        }
    }

    // Avance le tutoriel si le mode tutoriel est actif
    advanceTutorial() {
        if (this.tutorial) this.tutorial.advanceClick();
    }

    // Résout un tour de jeu en exécutant les actions des deux joueurs
    resolveTurn(p1Action, p2Action) {
        if (p1Action.type === "mouvement") Combat.executeAction(this.p1, this.p2, this.gridPlayer1, this.gridPlayer2, p1Action);
        if (p2Action.type === "mouvement") Combat.executeAction(this.p2, this.p1, this.gridPlayer2, this.gridPlayer1, p2Action);

        setTimeout(() => {
            if (p1Action.type === "recharge") Combat.executeAction(this.p1, this.p2, this.gridPlayer1, this.gridPlayer2, p1Action);
            if (p2Action.type === "recharge") Combat.executeAction(this.p2, this.p1, this.gridPlayer2, this.gridPlayer1, p2Action);

            setTimeout(() => {
                if (p1Action.type === "attaque_normale" || p1Action.type === "attaque_colonne") {
                    Combat.executeAction(this.p1, this.p2, this.gridPlayer1, this.gridPlayer2, p1Action);
                }
                if (p2Action.type === "attaque_normale" || p2Action.type === "attaque_colonne") {
                    Combat.executeAction(this.p2, this.p1, this.gridPlayer2, this.gridPlayer1, p2Action);
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
                        this.currentTick++;
                    } else {
                        UI.showGameOver(this.myRole, this.p1, this.p2);
                        this.gameState = "end";
                    }
                }, 150);
            }, 150);
        }, 150);
    }

    // Boucle principale du jeu qui gère le rendu et l'affichage des éléments à l'écran
    gameLoop() {
        this.ctx.fillStyle = "#1e1e1e";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.gridPlayer1.draw(this.ctx);
        this.gridPlayer2.draw(this.ctx);
        this.p1.draw(this.ctx);
        this.p2.draw(this.ctx);

        if (this.gameMode === "tutorial") {
            this.tutorial.drawHighlight(this.ctx);
        }
        if (GameConfig.MODE_BPM && this.gameMode !== "tutorial") {
            this.drawBpmUI(this.ctx);
        }
        
        UI.updateHUD(this.myRole, this.p1, this.p2, this.isResolving);
        requestAnimationFrame(this.gameLoop);
    }

    // Dessine l'interface utilisateur du mode BPM, y compris les lumières et les files d'attente d'actions
    drawBpmUI(ctx) {
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
            this.queueSlideAnim = 0;
        }

        let p1Direction = (this.myRole === "p2") ? "up" : "down";
        let p2Direction = (this.myRole === "p2") ? "down" : "up";

        this.gridPlayer1.drawQueue(ctx, this.p2ActionQueue, GameConfig.BPM_QUEUE_SIZE, this.p2.color, "left", this.queueSlideAnim, p1Direction);
        this.gridPlayer2.drawQueue(ctx, this.p1ActionQueue, GameConfig.BPM_QUEUE_SIZE, this.p1.color, "left", this.queueSlideAnim, p2Direction);
    }

    // Démarre la boucle BPM qui gère le rythme du jeu et les actions des joueurs
    startBpmLoop() {
        this.bpmBeat = 0;
        this.p1ActionQueue = Array(GameConfig.BPM_QUEUE_SIZE).fill(null);
        this.p2ActionQueue = Array(GameConfig.BPM_QUEUE_SIZE).fill(null);
        this.currentP1Action = null;
        this.currentP2Action = null;

        if (this.bpmTimer) clearInterval(this.bpmTimer);
        this.bpmTimer = setInterval(() => this.bpmTick(), GameConfig.BPM_TEMPO);
    }

    // Arrête la boucle BPM
    stopBpmLoop() {
        if (this.bpmTimer) {
            clearInterval(this.bpmTimer);
            this.bpmTimer = null;
        }
    }

    // Gère le tick BPM, jouant les sons et résolvant les actions des joueurs lorsque nécessaire
    bpmTick() {
        this.bpmBeat++;
        if (this.bpmBeat < 3) {
            this.audio.playTic();
        } else {
            this.audio.playBoom();
            this.bpmBeat = 0;
            
            if (this.gameMode === "pvp" && GameConfig.MODE_BPM) {
                let myAction = (this.myRole === "p1") ? this.currentP1Action : this.currentP2Action;
                if (!myAction) myAction = { type: "none" };

                if (this.myRole === "p1") {
                    this.p1BufferedActions.set(this.currentTick, myAction);
                } else {
                    this.p2BufferedActions.set(this.currentTick, myAction);
                }

                Network.sendData({ 
                    type: "bpm_action", 
                    tick: this.currentTick, 
                    action: myAction 
                });

                this.checkBpmReady(this.currentTick);
            } else {
                if (!this.currentP1Action) this.currentP1Action = { type: "none" };
                if (!this.currentP2Action) this.currentP2Action = { type: "none" };
                this.resolveBpmTurn();
            }
        }
    }

    // Résout un tour de jeu en mode BPM en exécutant les actions des deux joueurs
    resolveBpmTurn() {
        this.isResolving = true;

        if (this.gameMode === "ai") {
            this.currentP2Action = Combat.generateAIPick(this.p1, this.p2);
        }

        let p1Act = this.p1BufferedActions.get(this.currentTick) || this.currentP1Action || { type: "none" };
        let p2Act = this.p2BufferedActions.get(this.currentTick) || this.currentP2Action || { type: "none" };

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

        let p1IncomingAttack = null;
        let p2IncomingAttack = null;
        
        if (GameConfig.BPM_QUEUE_SIZE === 0) {
            p1IncomingAttack = p1QueuedAttack;
            p2IncomingAttack = p2QueuedAttack;
        } else {
            p1IncomingAttack = this.p1ActionQueue.shift();
            p2IncomingAttack = this.p2ActionQueue.shift();

            this.p1ActionQueue.push(p1QueuedAttack);
            this.p2ActionQueue.push(p2QueuedAttack);
        }

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

        setTimeout(() => {
            this.gridPlayer1.attackedCells = [];
            this.gridPlayer2.attackedCells = [];
            this.isResolving = false;
            
            if (this.p1.hp <= 0 || this.p2.hp <= 0) {
                this.stopBpmLoop();
                this.gameState = "end";
                UI.showGameOver(this.myRole, this.p1, this.p2);
            } else {
                UI.resetActionButtons();
                this.currentTick++;
            }
        }, 300);
    }
}