// Regles de jeu
export const GamePresets = {
    classique: {
        hp: 3,
        atk: 1,
        spe: 3,
        bpmMode: false,
        bpmTempo: 1000,
        bpmQueue: 2
    },
    bpmRapide: {
        hp: 3,
        atk: 0,
        spe: 1,
        bpmMode: true,
        bpmTempo: 750,
        bpmQueue: 1
    }
};

// Map de jeu
export const LayoutPresets = {
    classicLayout : [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
    ],
    customLayout : [
        [0, 1, 1, 1, 0],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0]
    ],
    squareLayout : generateSquareLayout(5)
}

export function generateSquareLayout(size){
    return Array(size).fill().map(() => Array(size).fill(1));
}