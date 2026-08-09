export default class AudioManager {
    constructor() {
        this.ctx = null;
    }

    // Le navigateur oblige le joueur à interagir avec la page avant d'autoriser le son
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Fonction de base pour créer un son (fréquence, forme d'onde, durée, volume)
    playTone(frequency, type, duration, vol) {
        if (!this.ctx) return;
        
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        oscillator.type = type; // 'sine', 'square', 'triangle', etc.
        oscillator.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        // Effet de "fade out" très rapide pour que le son soit percutant
        gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        oscillator.start();
        oscillator.stop(this.ctx.currentTime + duration);
    }

    // Le son des cercles qui s'allument
    playTic() {
        this.playTone(800, 'sine', 0.1, 0.5); // Aigu et très court
    }

    // Le son de la résolution du tour (Le feu passe au vert)
    playBoom() {
        this.playTone(200, 'square', 0.3, 0.7); // Grave, plus long et plus agressif
    }
}