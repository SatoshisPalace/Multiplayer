import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  position: { x: number; y: number };
}

interface GameContextType {
  socket: Socket | null;
  players: Player[];
  lobbyId: string | null;
  isHost: boolean;
  isGameStarted: boolean;
  playerName: string;
  setPlayerName: (name: string) => void;
  createLobby: () => void;
  joinLobby: (id: string) => void;
  startGame: () => void;
  updatePosition: (position: { x: number; y: number }) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket'],
      upgrade: false
    });
    
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('lobby-created', (id: string) => {
      console.log('Lobby created:', id);
      setLobbyId(id);
      setIsHost(true);
    });

    socket.on('joined-lobby', (id: string) => {
      console.log('Joined lobby:', id);
      setLobbyId(id);
    });

    socket.on('players-update', (updatedPlayers: Player[]) => {
      console.log('Players updated:', updatedPlayers);
      setPlayers(updatedPlayers);
    });

    socket.on('game-started', () => {
      console.log('Game started');
      setIsGameStarted(true);
    });

    socket.on('join-error', (message: string) => {
      console.error('Join error:', message);
      alert(message);
    });

    return () => {
      socket.off('lobby-created');
      socket.off('joined-lobby');
      socket.off('players-update');
      socket.off('game-started');
      socket.off('join-error');
    };
  }, [socket]);

  const createLobby = () => {
    if (socket && playerName) {
      console.log('Creating lobby with name:', playerName);
      socket.emit('create-lobby', playerName);
    } else {
      console.error('Cannot create lobby: socket or player name missing');
    }
  };

  const joinLobby = (id: string) => {
    if (socket && playerName) {
      console.log('Joining lobby:', id, 'with name:', playerName);
      socket.emit('join-lobby', { lobbyId: id, playerName });
    } else {
      console.error('Cannot join lobby: socket or player name missing');
    }
  };

  const startGame = () => {
    if (socket && lobbyId && isHost) {
      console.log('Starting game in lobby:', lobbyId);
      socket.emit('start-game', lobbyId);
    } else {
      console.error('Cannot start game: missing socket, lobbyId, or not host');
    }
  };

  const updatePosition = (position: { x: number; y: number }) => {
    if (socket && lobbyId) {
      socket.emit('move', { lobbyId, position });
    } else {
      console.error('Cannot update position: socket or lobbyId missing');
    }
  };

  return (
    <GameContext.Provider
      value={{
        socket,
        players,
        lobbyId,
        isHost,
        isGameStarted,
        playerName,
        setPlayerName,
        createLobby,
        joinLobby,
        startGame,
        updatePosition,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
