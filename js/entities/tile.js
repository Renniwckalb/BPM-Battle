export default class Tile {
    constructor(col, row, active = true) {
        this.col = col;
        this.row = row;
        this.active = active;     // Si false case bloquer
        this.occupant = null;     // Pointeur player
        this.isAttacked = false;  // Annimation d'attaque
        this.flashTimer = null;
    }
}