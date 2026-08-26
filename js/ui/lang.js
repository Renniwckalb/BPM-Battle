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
        btn_preset_1: "Classique",
        btn_preset_2: "BPM Rapide",
        btn_custom_rules: "Règles Personnalisées",
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
        tutorial_title: "Choix du Tutoriel",
        btn_tut_base: "Les bases du jeu",
        btn_tut_bpm: "Mode BPM",

        // Tutoriel sur les bases
        tut_1: "Bienvenue dans le tutoriel ! Découvrons ensemble les bases du jeu. (Clique pour continuer)",
        tut_2: "Voici ton avatar (la boule bleue). Tu le contrôles ! (Clique pour continuer)",
        tut_3: "Voici ta grille de jeu. C'est la zone où tu peux te déplacer.",
        tut_4: "Voici ton adversaire (en orange). Ton but est de le vaincre.",
        tut_5: "À droite des grilles se trouvent les points de vie (les cœurs).",
        tut_6: "Ici se trouve ton énergie. Tu en as besoin pour attaquer.",
        tut_7: "Enfin, voici tes actions. Tu en choisiras une à chaque tour.",
        tut_8: "Un tour se joue ainsi : choisis une action, puis clique sur la grille.",
        tut_9: "Essayons ! Clique sur DÉPLACEMENT puis sur une case verte.",
        tut_fail_9: "Ce n'est pas ça. Sélectionne DÉPLACEMENT puis clique sur ta grille.",
        tut_10: "Parfait ! Maintenant, clique sur RECHARGE puis n'importe où sur l'écran.",
        tut_fail_10: "Raté. Sélectionne RECHARGE et clique n'importe où sur l'écran.",
        tut_11: "Super ! Tu as de l'énergie. Clique sur ATTAQUE puis sur l'adversaire !",
        tut_fail_11: "Cible manquée ! Sélectionne ATTAQUE et clique sur la case de l'adversaire.",
        tut_12: "Oh non ! Il a esquivé ! Ton attaque a consommé ton énergie. Fais une RECHARGE (clique n'importe où).",
        tut_fail_12: "Il te faut de l'énergie ! Sélectionne RECHARGE et clique n'importe où sur l'écran.",
        tut_13: "Parfait. Maintenant que tu as récupéré de l'énergie, retente une ATTAQUE !",
        tut_fail_13: "Raté ! Il faut l'attaquer de nouveau en utilisant ATTAQUE.",
        tut_14: "Touché ! Maintenant, RECHARGE jusqu'à 3 d'énergie et lance une attaque SPÉCIALE.",
        tut_fail_14: "Concentre-toi ! Il faut l'attaquer de nouveau en utilisant une attaque SPÉCIAL !",
        tut_15: "Félicitations, tu maîtrises les bases ! Retour au menu...",

        // Tutoriel Mode BPM
        tut_20: "Bienvenue dans le mode Rythme (BPM) ! (Clique)",
        tut_21: "Écoute le son : Tic, Tic, BOOM (Vert). Le temps entre chaque BOOM est le temps que tu as pour choisir ton action. Tes actions se valident uniquement au BOOM ! (Clique)", 
        tut_22: "Essaie de te DÉPLACER. L'action s'exécutera au prochain BOOM.",
        tut_fail_22: "Sélectionne DÉPLACEMENT et clique sur la grille.",
        tut_23: "Parfait ! Maintenant, fais une RECHARGE.",
        tut_fail_23: "Sélectionne RECHARGE et clique sur la grille.",
        tut_24: "En mode BPM, tes attaques sont retardées. Lance une ATTAQUE et observe la file d'attente !",
        tut_fail_24: "Sélectionne ATTAQUE et clique sur l'adversaire.",
        tut_25: "Génial ! L'attaque va glisser jusqu'à frapper. Tu maîtrises le mode BPM ! Retour au menu...",

        // Mode BPM
        label_bpm_mode: "Mode Rythme (BPM) :",
        label_bpm_tempo: "Vitesse (ms) :",
        label_bpm_queue: "Taille de la pile :"
    },
    en: {
        // Ecran Titre
        btn_ai: "Play vs AI",
        btn_host: "Create Game",
        divider: "--- OR ---",
        placeholder_join: "Code (e.g: 1234)",
        btn_join: "Join",

        // Menu de création de partie
        btn_preset_1: "Classic",
        btn_preset_2: "Fast BPM",
        btn_custom_rules: "Custom Rules",
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

        // Ecran Tutoriel
        btn_tutorial: "Tutorial",
        tutorial_title: "Select Tutorial",
        btn_tut_base: "Game Basics",
        btn_tut_bpm: "BPM Mode",

        // Tutoriel sur les bases
        tut_1: "Welcome to the tutorial! Let's learn the basics together. (Click to continue)",
        tut_2: "This is your avatar (the blue ball). You control it! (Click to continue)",
        tut_3: "This is your grid. This is where you can move.",
        tut_4: "This is your opponent (orange). Your goal is to defeat them.",
        tut_5: "To the right of the grids are health points (hearts).",
        tut_6: "Here is your energy. You need it to attack.",
        tut_7: "Finally, these are your actions. You will choose one each turn.",
        tut_8: "A turn goes like this: choose an action, then click on the grid.",
        tut_9: "Let's try! Click on MOVE then on a green cell.",
        tut_fail_9: "Not quite. Select MOVE then click on your grid.",
        tut_10: "Perfect! Now, click on RECHARGE then anywhere on the screen.",
        tut_fail_10: "Missed. Select RECHARGE and click anywhere on the screen.",
        tut_11: "Great! You have energy. Click on ATTACK then on the opponent!",
        tut_fail_11: "Target missed! Select ATTACK and click on the opponent's cell.",
        tut_12: "Oh no! They dodged! Your attack consumed your energy. You need to RECHARGE again (click anywhere).",
        tut_fail_12: "You need energy! Select RECHARGE and click anywhere on the screen.",
        tut_13: "Perfect. Now that you have your energy back, try to ATTACK again!",
        tut_fail_13: "Missed! You need to attack them again using ATTACK.",
        tut_14: "Hit! Now, RECHARGE up to 3 energy and launch a SPECIAL attack.",
        tut_fail_14: "Focus! You need to attack them again using a SPECIAL attack!",
        tut_15: "Congratulations, you've mastered the basics! Returning to menu...",

        // Tutoriel Mode BPM
        tut_20: "Welcome to Rhythm Mode (BPM)! (Click to continue)",
        tut_21: "Listen to the sound: Tick, Tick, BOOM (Green). The time between each BOOM is the time you have to choose your action. Your actions execute only on the BOOM! (Click to continue)",
        tut_22: "Try to MOVE. The action will execute on the next BOOM.",
        tut_fail_22: "Select MOVE and click on your grid.",
        tut_23: "Perfect! Now, RECHARGE your energy.",
        tut_fail_23: "Select RECHARGE and click anywhere on your grid.",
        tut_24: "In BPM mode, attacks are delayed. Launch an ATTACK and watch the queue!",
        tut_fail_24: "Select ATTACK and click on the opponent's cell.",
        tut_25: "Awesome! The attack will slide down until it hits. You mastered BPM Mode! Returning to menu...",
        
        // Mode BPM
        label_bpm_mode: "Rhythm Mode (BPM):",
        label_bpm_tempo: "Speed (ms):",
        label_bpm_queue: "Queue Size:"
    },
    zh: {
        // Ecran Titre
        btn_ai: "与AI对战",
        btn_host: "创建游戏",
        divider: "--- 或 ---",
        placeholder_join: "房间号 (例: 1234)",
        btn_join: "加入",

        // Menu de création de partie
        btn_preset_1: "经典",
        btn_preset_2: "快速 BPM",
        btn_custom_rules: "自定义规则",
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
        tutorial_title: "选择教程",
        btn_tut_base: "游戏基础",
        btn_tut_bpm: "BPM 模式",

        // Tutoriel sur les bases
        tut_1: "欢迎来到教程！让我们一起学习基础知识。（点击继续）",
        tut_2: "这是你的化身（蓝色圆球）。由你控制！(点击继续)",
        tut_3: "这是你的网格。这是你可以移动的区域。",
        tut_4: "这是你的对手（橙色）。你的目标是击败他。",
        tut_5: "网格的右侧是你们的生命值（心形图标）。",
        tut_6: "这里是你的能量。你需要能量来发动攻击。",
        tut_7: "最后，这是你的操作按钮。你每回合需要选择一个。",
        tut_8: "回合流程如下：选择一个操作，然后点击网格。",
        tut_9: "让我们试试吧！点击移动，然后点击一个绿色格子。",
        tut_fail_9: "不对。选择移动，然后点击你的网格。",
        tut_10: "完美！现在，点击充能，然后点击屏幕上的任何位置。",
        tut_fail_10: "没点中。选择充能并点击屏幕上的任何位置。",
        tut_11: "太棒了！你有能量了。点击攻击，然后点击对手！",
        tut_fail_11: "目标丢失！选择攻击并点击对手所在的网格。",
        tut_12: "哦，不！他们躲开了！你的攻击消耗了能量。你需要再次充能（点击任何位置）。",
        tut_fail_12: "你需要能量！选择充能并点击屏幕上的任何位置。",
        tut_13: "完美。既然能量恢复了，再次尝试攻击！",
        tut_fail_13: "未命中！你需要再次使用攻击来打击他。",
        tut_14: "命中了！现在充能到3点能量，然后发动特殊攻击。",
        tut_fail_14: "集中注意力！你需要再次使用特殊攻击来打击他！",
        tut_15: "恭喜，你已经掌握了基础操作！返回菜单...",

        // Tutoriel Mode BPM
        tut_20: "欢迎来到节奏模式 (BPM)！（点击继续）",
        tut_21: "听声音：滴，滴，嘭（绿灯）。每次“嘭”之间的时间是你选择操作的时间。你的操作只会在“嘭”时执行！（点击继续）",
        tut_22: "尝试移动。操作将在下一个“嘭”时执行。",
        tut_fail_22: "选择移动并点击你的网格。",
        tut_23: "完美！现在，进行充能。",
        tut_fail_23: "选择充能并点击你网格上的任何位置。",
        tut_24: "在BPM模式下，攻击会延迟。发动攻击并观察队列！",
        tut_fail_24: "选择攻击并点击对手所在的网格。",
        tut_25: "太棒了！攻击会向下滑动直到命中。你已掌握BPM模式！返回菜单...",
        
        // Mode BPM
        label_bpm_mode: "节奏模式 (BPM)：",
        label_bpm_tempo: "速度 (毫秒)：",
        label_bpm_queue: "队列大小："
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