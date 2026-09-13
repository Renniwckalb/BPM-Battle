// Regles de jeu
export const GamePresets = {
    classique: {
        MAX_HP: 3,
        COST_NORMAL_ATTACK: 1,
        COST_SPECIAL_ATTACK: 3,
        MODE_BPM: false,
        BPM_TEMPO: 1000,
        BPM_QUEUE_SIZE: 0,
        BPM_QUEUE_DETAILED: false
    },
    bpmRapide: {
        MAX_HP: 3,
        COST_NORMAL_ATTACK: 0,
        COST_SPECIAL_ATTACK: 1,
        MODE_BPM: true,
        BPM_TEMPO: 750,
        BPM_QUEUE_SIZE: 1,
        BPM_QUEUE_DETAILED: false
    },
    bpmTutoriel: {
        MAX_HP: 3,
        COST_NORMAL_ATTACK: 1,
        COST_SPECIAL_ATTACK: 3,
        MODE_BPM: true,
        BPM_TEMPO: 1000,
        BPM_QUEUE_SIZE: 2,
        BPM_QUEUE_DETAILED: false
    }
};

// Map de jeu
export const LayoutPresets = {
    classicLayout : generateSquareLayout(3),
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