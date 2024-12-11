import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io'
});

const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors({
  origin: "*",
  credentials: true
}));

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, '../build')));

// Handle any requests that don't match the above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

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
    console.log(`Creating lobby for player ${playerName} (${socket.id})`);
    const lobbyId = Math.random().toString(36).substring(2, 8);
    lobbies.set(lobbyId, {
      id: lobbyId,
      host: socket.id,
      players: new Map([[socket.id, { id: socket.id, name: playerName, position: { x: 100, y: 100 } }]]),
      isGameStarted: false
    });
    socket.join(lobbyId);
    socket.emit('lobby-created', lobbyId);
    console.log(`Lobby ${lobbyId} created by ${playerName}`);
  });

  // Join lobby
  socket.on('join-lobby', ({ lobbyId, playerName }: { lobbyId: string, playerName: string }) => {
    console.log(`Player ${playerName} (${socket.id}) attempting to join lobby ${lobbyId}`);
    const lobby = lobbies.get(lobbyId);
    if (lobby && !lobby.isGameStarted && lobby.players.size < 5) {
      lobby.players.set(socket.id, { id: socket.id, name: playerName, position: { x: 100, y: 100 } });
      socket.join(lobbyId);
      socket.emit('joined-lobby', lobbyId);
      io.to(lobbyId).emit('players-update', Array.from(lobby.players.values()));
      console.log(`Player ${playerName} joined lobby ${lobbyId}`);
    } else {
      console.log(`Player ${playerName} failed to join lobby ${lobbyId}`);
      socket.emit('join-error', 'Unable to join lobby');
    }
  });

  // Start game
  socket.on('start-game', (lobbyId: string) => {
    console.log(`Attempting to start game in lobby ${lobbyId}`);
    const lobby = lobbies.get(lobbyId);
    if (lobby && lobby.host === socket.id) {
      lobby.isGameStarted = true;
      io.to(lobbyId).emit('game-started');
      console.log(`Game started in lobby ${lobbyId}`);
    } else {
      console.log(`Failed to start game in lobby ${lobbyId}`);
    }
  });

  // Update player position
  socket.on('move', ({ lobbyId, position }: { lobbyId: string, position: { x: number; y: number } }) => {
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
    console.log('User disconnected:', socket.id);
    lobbies.forEach((lobby, lobbyId) => {
      if (lobby.players.has(socket.id)) {
        const player = lobby.players.get(socket.id);
        lobby.players.delete(socket.id);
        if (lobby.players.size === 0) {
          console.log(`Lobby ${lobbyId} deleted - no players remaining`);
          lobbies.delete(lobbyId);
        } else if (lobby.host === socket.id) {
          // Assign new host
          const newHost = Array.from(lobby.players.keys())[0];
          lobby.host = newHost;
          console.log(`New host assigned in lobby ${lobbyId}: ${newHost}`);
        }
        io.to(lobbyId).emit('players-update', Array.from(lobby.players.values()));
        console.log(`Player ${player?.name} left lobby ${lobbyId}`);
      }
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
