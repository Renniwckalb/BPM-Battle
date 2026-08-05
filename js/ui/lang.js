// --- DICTIONNAIRE DES TRADUCTIONS ---
export const translations = {
    fr: {
        // Ecran Titre
        btn_ai: "Jouer contre l'IA",
        btn_host: "Créer une partie",
        divider: "--- OU ---",
        placeholder_join: "Code (ex: 1234)",
        btn_join: "Rejoindre",

        // Menu de création de partie
        rules_title: "Règles du jeu",
        label_hp: "Points de vie :",
        label_atk: "Coût Attaque :",
        label_spe: "Coût Spécial :",
        btn_host_start: "Générer le code PvP",
        btn_back: "Retour",
        code_display: "Code : ",

        // Ecran de combat
        energy: "Énergie : ",
        action_move: "Déplacement",
        action_charge: "Recharge",
        action_attack: "Attaque",
        action_special: "Spécial",

        // Ecran de fin
        waiting_rematch: "En attente de l'adversaire...",
        btn_rematch: "Rejouer",
        btn_main_menu: "Menu principal",
        win: "VICTOIRE !",
        lose: "DÉFAITE...",
        draw: "ÉGALITÉ !",

        // Ecran de tutoriel
        btn_tutorial: "Tutoriel",
        tut_step1: "Bienvenue ! Tu es représenté par la boule bleue. Clique sur le bouton DÉPLACEMENT puis choisis une case verte sur la grille pour te déplacer.",
        tut_step2: "Parfait ! Maintenant, clique sur le bouton RECHARGE puis sur la grille vert pour gagner de l'énergie.",
        tut_step3: "Super ! Avec 1 d'énergie, clique sur le bouton ATTAQUE puis sur l'ennemi (boule orange).",
        tut_step4: "Touché ! Recharge jusqu'à 3 d'énergie, puis lance une attaque SPÉCIALE pour une attaque surpuissante !",
        tut_step5: "Félicitations ! Tu es prêt pour le combat. Retour au menu..."
    },
    en: {
        // Ecran Titre
        btn_ai: "Play vs AI",
        btn_host: "Create Game",
        divider: "--- OR ---",
        placeholder_join: "Code (e.g: 1234)",
        btn_join: "Join",

        // Menu de création de partie
        rules_title: "Game Rules",
        label_hp: "Health Points:",
        label_atk: "Attack Cost:",
        label_spe: "Special Cost:",
        btn_host_start: "Generate PvP Code",
        btn_back: "Back",
        code_display: "Code: ",
        
        // Ecran de combat
        energy: "Energy: ",
        action_move: "Move",
        action_charge: "Recharge",
        action_attack: "Attack",
        action_special: "Special",

        // Ecran de fin
        waiting_rematch: "Waiting for opponent...",
        btn_rematch: "Rematch",
        btn_main_menu: "Main Menu",
        win: "VICTORY!",
        lose: "DEFEAT...",
        draw: "DRAW!",

        // Ecran de tutoriel
        btn_tutorial: "Tutorial",
        tut_step1: "Welcome! You are the blue ball. Click the MOVE button then choose a green cell on the grid to move.",
        tut_step2: "Perfect! Now, click the RECHARGE button then on the green grid to gain energy.",
        tut_step3: "Great! With 1 energy, click the ATTACK button then on the enemy (orange ball).",
        tut_step4: "Hit! Recharge up to 3 energy, then launch a SPECIAL attack for a devastating strike!",
        tut_step5: "Congratulations! You are ready to fight. Returning to menu..."
    },
    zh: {
        // Ecran Titre
        btn_ai: "与AI对战",
        btn_host: "创建游戏",
        divider: "--- 或 ---",
        placeholder_join: "房间号 (例: 1234)",
        btn_join: "加入",

        // Menu de création de partie
        rules_title: "游戏规则",
        label_hp: "生命值：",
        label_atk: "攻击消耗：",
        label_spe: "特殊攻击消耗：",
        btn_host_start: "生成对战房间号",
        btn_back: "返回",
        code_display: "房间号：",

        // Ecran de combat
        energy: "能量：",
        action_move: "移动",
        action_charge: "充能",
        action_attack: "攻击",
        action_special: "特殊攻击",

        // Ecran de fin
        waiting_rematch: "等待对手...",
        btn_rematch: "再来一局",
        btn_main_menu: "主菜单",
        win: "胜利！",
        lose: "失败...",
        draw: "平局！",

        // Ecran de tutoriel
        btn_tutorial: "教程",
        tut_step1: "欢迎！你代表蓝色圆球。点击移动按钮，然后在绿色网格上选择一个格子进行移动。",
        tut_step2: "完美！现在点击充能按钮，然后点击绿色网格以获取能量。",
        tut_step3: "太棒了！消耗1点能量，点击攻击按钮，然后点击敌人（橙色圆球）。",
        tut_step4: "命中了！充能直到3点能量，然后发动特殊攻击，进行强力一击！",
        tut_step5: "恭喜！你已准备好战斗了。返回主菜单..."
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