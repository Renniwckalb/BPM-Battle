// --- PARAMÈTRES GLOBAUX DU JEU ---
export const GameConfig = {
    MAX_HP: 3,
    COST_NORMAL_ATTACK: 1,
    COST_SPECIAL_ATTACK: 3,
    MODE_BPM: false,
    BPM_TEMPO: 1000,     // Temps en millisecondes
    BPM_QUEUE_SIZE: 2    // Délai avant impact
};

// Mettre à jour la configuration
export function updateConfig(newSettings) {
    Object.assign(GameConfig, newSettings);
}