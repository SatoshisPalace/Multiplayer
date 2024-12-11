import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Store active lobbies
interface Lobby {
  id: string;
  host: string;
  players: Map<string, Player>;
  isGameStarted: boolean;
}

interface Player {
  id: string;
  name: string;
  position: { x: number; y: number };
}

const lobbies = new Map<string, Lobby>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create lobby
  socket.on('create-lobby', (playerName: string) => {
    const lobbyId = Math.random().toString(36).substring(2, 8);
    lobbies.set(lobbyId, {
      id: lobbyId,
      host: socket.id,
      players: new Map([[socket.id, { id: socket.id, name: playerName, position: { x: 100, y: 100 } }]]),
      isGameStarted: false
    });
    socket.join(lobbyId);
    socket.emit('lobby-created', lobbyId);
  });

  // Join lobby
  socket.on('join-lobby', ({ lobbyId, playerName }: { lobbyId: string, playerName: string }) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby && !lobby.isGameStarted && lobby.players.size < 5) {
      lobby.players.set(socket.id, { id: socket.id, name: playerName, position: { x: 100, y: 100 } });
      socket.join(lobbyId);
      socket.emit('joined-lobby', lobbyId);
      io.to(lobbyId).emit('players-update', Array.from(lobby.players.values()));
    } else {
      socket.emit('join-error', 'Unable to join lobby');
    }
  });

  // Start game
  socket.on('start-game', (lobbyId: string) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby && lobby.host === socket.id) {
      lobby.isGameStarted = true;
      io.to(lobbyId).emit('game-started');
    }
  });

  // Update player position
  socket.on('move', (lobbyId: string, position: { x: number; y: number }) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby && lobby.isGameStarted) {
      const player = lobby.players.get(socket.id);
      if (player) {
        player.position = position;
        io.to(lobbyId).emit('players-update', Array.from(lobby.players.values()));
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    lobbies.forEach((lobby, lobbyId) => {
      if (lobby.players.has(socket.id)) {
        lobby.players.delete(socket.id);
        if (lobby.players.size === 0) {
          lobbies.delete(lobbyId);
        } else if (lobby.host === socket.id) {
          // Assign new host
          lobby.host = Array.from(lobby.players.keys())[0];
        }
        io.to(lobbyId).emit('players-update', Array.from(lobby.players.values()));
      }
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
