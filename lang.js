// --- DICTIONNAIRE DES TRADUCTIONS ---
export const translations = {
    fr: {
        btn_ai: "Jouer contre l'IA",
        btn_host: "Créer une partie",
        divider: "--- OU ---",
        placeholder_join: "Code (ex: 1234)",
        btn_join: "Rejoindre",
        rules_title: "Règles du jeu",
        label_hp: "Points de vie :",
        label_atk: "Coût Attaque :",
        label_spe: "Coût Spécial :",
        btn_host_start: "Générer le code PvP",
        btn_back: "Retour",
        energy: "Énergie : ",
        action_move: "Déplacement",
        action_charge: "Recharge",
        action_attack: "Attaque",
        action_special: "Spécial",
        waiting_rematch: "En attente de l'adversaire...",
        btn_rematch: "Rejouer",
        btn_main_menu: "Menu principal",
        code_display: "Code : ",
        win: "VICTOIRE !",
        lose: "DÉFAITE..."
    },
    en: {
        btn_ai: "Play vs AI",
        btn_host: "Create Game",
        divider: "--- OR ---",
        placeholder_join: "Code (e.g: 1234)",
        btn_join: "Join",
        rules_title: "Game Rules",
        label_hp: "Health Points:",
        label_atk: "Attack Cost:",
        label_spe: "Special Cost:",
        btn_host_start: "Generate PvP Code",
        btn_back: "Back",
        energy: "Energy: ",
        action_move: "Move",
        action_charge: "Recharge",
        action_attack: "Attack",
        action_special: "Special",
        waiting_rematch: "Waiting for opponent...",
        btn_rematch: "Rematch",
        btn_main_menu: "Main Menu",
        code_display: "Code: ",
        win: "VICTORY!",
        lose: "DEFEAT..."
    }
};

export let currentLang = "fr";

// Fonction pour basculer entre FR et EN
export function toggleLanguage() {
    currentLang = currentLang === "fr" ? "en" : "fr";
    updateAllTexts();
    return currentLang;
}

// Fonction pour récupérer un texte dynamique précis (ex: Victoire/Défaite)
export function getText(key) {
    return translations[currentLang][key] || key;
}

// Fonction magique qui parcourt le HTML et traduit tout
export function updateAllTexts() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[currentLang][key]) {
            // Si c'est un input, on traduit le placeholder, sinon le texte
            if (el.tagName === "INPUT" && el.placeholder) {
                el.placeholder = translations[currentLang][key];
            } else {
                el.innerText = translations[currentLang][key];
            }
        }
    });
}

export function setLanguage(lang) {
    currentLang = lang;
    updateAllTexts();
    return currentLang;
}