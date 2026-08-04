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
    },
    zh: {
        btn_ai: "与AI对战",
        btn_host: "创建游戏",
        divider: "--- 或 ---",
        placeholder_join: "房间号 (例: 1234)",
        btn_join: "加入",
        rules_title: "游戏规则",
        label_hp: "生命值：",
        label_atk: "攻击消耗：",
        label_spe: "特殊攻击消耗：",
        btn_host_start: "生成对战房间号",
        btn_back: "返回",
        energy: "能量：",
        action_move: "移动",
        action_charge: "充能",
        action_attack: "攻击",
        action_special: "特殊攻击",
        waiting_rematch: "等待对手...",
        btn_rematch: "再来一局",
        btn_main_menu: "主菜单",
        code_display: "房间号：",
        win: "胜利！",
        lose: "失败..."
    }
};

export const flags = {
    fr: "🇫🇷",
    en: "🇬🇧",
    zh: "🇨🇳"
};

export let currentLang = "fr";

// Fonction pour changer de langue
export function toggleLanguage() {
    currentLang = flags[currentLang];
    updateAllTexts();
    return currentLang;
}

// Fonction pour récupérer un texte dynamique
export function getText(key) {
    return translations[currentLang][key] || key;
}

// Fonction qui traduit tout
export function updateAllTexts() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[currentLang][key]) {
            if (el.tagName === "INPUT" && el.placeholder) {
                el.placeholder = translations[currentLang][key];
            } else {
                el.innerText = translations[currentLang][key];
            }
        }
    });
}

// Choix d'une langue
export function setLanguage(lang) {
    currentLang = lang;
    updateAllTexts();
    return currentLang;
}