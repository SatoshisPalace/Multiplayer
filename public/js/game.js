const socket = io();

// Game state
let myPlayerId = null;
let players = new Map();
let isHost = false;
let currentLobbyId = null;
let gameStarted = false;

// DOM Elements
const createLobbyBtn = document.getElementById('createLobby');
const joinLobbyBtn = document.getElementById('joinLobby');
const lobbyIdInput = document.getElementById('lobbyId');
const playerNameInput = document.getElementById('playerName');
const lobbyInfo = document.getElementById('lobbyInfo');
const startGameBtn = document.getElementById('startGame');
const lobbyDiv = document.getElementById('lobby');
const gameDiv = document.getElementById('game');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const PLAYER_SIZE = 30;
const MOVE_SPEED = 5;

// Event Listeners
createLobbyBtn.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    socket.emit('create-lobby', playerName);
});

joinLobbyBtn.addEventListener('click', () => {
    const lobbyId = lobbyIdInput.value.trim();
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    if (lobbyId) {
        socket.emit('join-lobby', { lobbyId, playerName });
    }
});

startGameBtn.addEventListener('click', () => {
    if (currentLobbyId) {
        socket.emit('start-game', currentLobbyId);
    }
});

// Movement controls
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// Socket events
socket.on('connect', () => {
    myPlayerId = socket.id;
});

socket.on('lobby-created', (lobbyId) => {
    currentLobbyId = lobbyId;
    isHost = true;
    lobbyInfo.textContent = `Lobby created! ID: ${lobbyId}`;
    startGameBtn.style.display = 'block';
});

socket.on('joined-lobby', (lobbyId) => {
    currentLobbyId = lobbyId;
    lobbyInfo.textContent = `Joined lobby: ${lobbyId}`;
});

socket.on('players-update', (playersList) => {
    players.clear();
    playersList.forEach(player => {
        players.set(player.id, player);
    });
});

socket.on('game-started', () => {
    gameStarted = true;
    lobbyDiv.style.display = 'none';
    gameDiv.style.display = 'block';
    gameLoop();
});

socket.on('join-error', (message) => {
    alert(message);
});

// Game functions
function updatePosition() {
    if (!gameStarted || !players.has(myPlayerId)) return;

    const player = players.get(myPlayerId);
    let moved = false;

    if (keys.ArrowUp && player.position.y > 0) {
        player.position.y -= MOVE_SPEED;
        moved = true;
    }
    if (keys.ArrowDown && player.position.y < canvas.height - PLAYER_SIZE) {
        player.position.y += MOVE_SPEED;
        moved = true;
    }
    if (keys.ArrowLeft && player.position.x > 0) {
        player.position.x -= MOVE_SPEED;
        moved = true;
    }
    if (keys.ArrowRight && player.position.x < canvas.width - PLAYER_SIZE) {
        player.position.x += MOVE_SPEED;
        moved = true;
    }

    if (moved) {
        socket.emit('move', currentLobbyId, player.position);
    }
}

function drawPlayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    players.forEach((player, id) => {
        // Draw player square
        ctx.fillStyle = id === myPlayerId ? '#00ff00' : '#ff0000';
        ctx.fillRect(player.position.x, player.position.y, PLAYER_SIZE, PLAYER_SIZE);
        
        // Draw player name
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.position.x + PLAYER_SIZE/2, player.position.y + PLAYER_SIZE + 20);
    });
}

function gameLoop() {
    if (!gameStarted) return;

    updatePosition();
    drawPlayers();
    requestAnimationFrame(gameLoop);
}
