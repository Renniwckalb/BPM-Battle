import Grid from '../entities/grid.js';
import Player from '../entities/player.js';
import * as Combat from '../systems/combat.js';
import * as UI from '../ui/ui.js';
import Renderer from './renderer.js';
import * as Network from '../systems/network.js';
import TutorialManager from '../systems/tutorial.js';
import { GameConfig, updateConfig } from './config.js';
import AudioManager from '../systems/audio.js';
import { LayoutPresets } from './preset.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export default class GameEngine {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        
        // État du jeu
        this.gameState = "menu";
        this.gameMode = null;
        this.actionActuelle = null;
        this.isResolving = false;
        
        // --- SYNCHRONISATION DÉTERMINISTE ---
        this.currentTick = 0;
        this.p1BufferedActions = new Map(); // Stocke les actions indexées par numéro de tick
        this.p2BufferedActions = new Map();
        
        // Réseau
        this.myRole = null;
        this.localRematchReady = false;
        this.remoteRematchReady = false;
        
        // Entités
        this.gridPlayer1 = new Grid(0, 0, 0, "#4CAF50", LayoutPresets.classicLayout);
        this.gridPlayer2 = new Grid(0, 0, 0, "#F44336", LayoutPresets.classicLayout);

        let startCol = Math.floor(this.gridPlayer1.cols / 2);
        let startRow = Math.floor(this.gridPlayer1.rows / 2);

        this.p1 = new Player(this.gridPlayer1, startCol, startRow, "#2196F3");
        this.p2 = new Player(this.gridPlayer2, startCol, startRow, "#FF9800");
        
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
        
        this.renderer = new Renderer(this);
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

        if (mode.startsWith("tutorial")) {
            this.tutorial.start(mode);
        }
        
        if ((GameConfig.MODE_BPM && mode !== "tutorial") || mode === "tutorial_bpm") {
            this.startBpmLoop();
        }

        UI.prepareStartGame(this.myRole);
        this.gameState = "playing";
        this.renderer.resizeCanvas();
    }

    // Réinitialise l'état du jeu pour un nouveau départ
    resetGame() {
        let startCol = Math.floor(this.gridPlayer1.cols / 2);
        let startRow = Math.floor(this.gridPlayer1.rows / 2);

        // Variables des joueurs
        this.p1.hp = GameConfig.MAX_HP;
        this.p1.energy = 0;
        this.p2.hp = GameConfig.MAX_HP;
        this.p2.energy = 0;
        this.p1.moveTo(startCol, startRow);
        this.p2.moveTo(startCol, startRow);
        this.isResolving = false;
        
        // Variables BPM
        this.currentTick = 0;
        this.p1BufferedActions.clear();
        this.p2BufferedActions.clear();
        
        // Variables de l'interface
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

        if (this.gameMode === "tutorial_bpm") {
            this.tutorial.interceptAction(myActionChoice);
            this.currentP1Action = myActionChoice;
            this.currentP2Action = this.p2Action;
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
    async resolveTurn(p1Action, p2Action) {
        if (p1Action.type === "mouvement") Combat.executeAction(this.p1, this.p2, this.gridPlayer1, this.gridPlayer2, p1Action);
        if (p2Action.type === "mouvement") Combat.executeAction(this.p2, this.p1, this.gridPlayer2, this.gridPlayer1, p2Action);

        await wait(150);

        if (p1Action.type === "recharge") Combat.executeAction(this.p1, this.p2, this.gridPlayer1, this.gridPlayer2, p1Action);
        if (p2Action.type === "recharge") Combat.executeAction(this.p2, this.p1, this.gridPlayer2, this.gridPlayer1, p2Action);

        await wait(150);
        
        if (p1Action.type === "attaque_normale" || p1Action.type === "attaque_colonne") {
            Combat.executeAction(this.p1, this.p2, this.gridPlayer1, this.gridPlayer2, p1Action);
        }
        if (p2Action.type === "attaque_normale" || p2Action.type === "attaque_colonne") {
            Combat.executeAction(this.p2, this.p1, this.gridPlayer2, this.gridPlayer1, p2Action);
        }

        await wait(150);

        this.gridPlayer1.selectedCol = -1;
        this.gridPlayer1.selectedRow = -1;
        this.gridPlayer2.selectedCol = -1;
        this.gridPlayer2.selectedRow = -1;

        if (this.gameMode === "tutorial") this.tutorial.verifyTurn();

        if (this.p1.hp > 0 && this.p2.hp > 0) {
            this.isResolving = false;
            this.currentTick++;
        } else {
            UI.showGameOver(this.myRole, this.p1, this.p2);
            this.gameState = "end";
        }
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
        Combat.applyBpmAttack(p1IncomingAttack, this.p2, this.gridPlayer2);
        Combat.applyBpmAttack(p2IncomingAttack, this.p1, this.gridPlayer1);

        setTimeout(() => {
            this.gridPlayer1.attackedCells = [];
            this.gridPlayer2.attackedCells = [];
            this.isResolving = false;

            if (this.gameMode === "tutorial_bpm") {
                this.tutorial.verifyTurn();
            }
            
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