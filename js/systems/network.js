// --- GESTION DU RÉSEAU (PeerJS) ---
let peer = null;
let conn = null;

// Fonction pour héberger une partie
export function hostGame(onRoomCreated, onPlayerJoined, onDataReceived) {
    let code = Math.floor(1000 + Math.random() * 9000).toString();
    peer = new Peer('bpm-' + code);
    
    // Quand la salle est prête
    peer.on('open', () => {
        onRoomCreated(code);
    });

    // Quand un joueur se connecte
    peer.on('connection', (connection) => {
        conn = connection;
        
        conn.on('open', () => {
            conn.on('data', onDataReceived);
            onPlayerJoined();
        });
    });
}

// Fonction pour rejoindre une partie
export function joinGame(code, onConnected, onDataReceived) {
    peer = new Peer();
    
    peer.on('open', () => {
        conn = peer.connect('bpm-' + code);
        
        conn.on('open', () => {
            conn.on('data', onDataReceived);
            onConnected();
        });
    });
}

// Fonction pour envoyer des données à l'adversaire
export function sendData(data) {
    if (conn) {
        conn.send(data);
    }
}

// Fonction pour fermer proprement la connexion
export function closeNetwork() {
    if (conn) conn.close();
    if (peer) peer.destroy();
    peer = null;
    conn = null;
}

// Permet de vérifier si on est actuellement connecté
export function isConnected() {
    return conn !== null;
}