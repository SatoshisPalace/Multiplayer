import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Default to Heroku's free tier for WebSocket hosting
const DEFAULT_SOCKET_SERVER = 'https://simple-peer-game.herokuapp.com';

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
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const connectToServer = () => {
      try {
        const serverUrl = process.env.REACT_APP_SERVER_URL || DEFAULT_SOCKET_SERVER;
        console.log('Connecting to server:', serverUrl);

        const newSocket = io(serverUrl, {
          transports: ['websocket'],
          upgrade: false,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
          console.log('Connected to server successfully');
          setSocket(newSocket);
          setConnectionAttempts(0);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          if (connectionAttempts < maxRetries) {
            setConnectionAttempts(prev => prev + 1);
            setTimeout(connectToServer, 2000);
          }
        });

        return newSocket;
      } catch (error) {
        console.error('Failed to connect to server:', error);
        return null;
      }
    };

    const socket = connectToServer();

    return () => {
      if (socket) {
        console.log('Cleaning up socket connection');
        socket.close();
      }
    };
  }, [connectionAttempts]);

  useEffect(() => {
    if (!socket) return;

    const handlers = {
      'lobby-created': (id: string) => {
        console.log('Lobby created:', id);
        setLobbyId(id);
        setIsHost(true);
      },
      'joined-lobby': (id: string) => {
        console.log('Joined lobby:', id);
        setLobbyId(id);
      },
      'players-update': (updatedPlayers: Player[]) => {
        console.log('Players updated:', updatedPlayers);
        setPlayers(updatedPlayers);
      },
      'game-started': () => {
        console.log('Game started');
        setIsGameStarted(true);
      },
      'join-error': (message: string) => {
        console.error('Join error:', message);
        alert(message);
      },
      'disconnect': () => {
        console.log('Disconnected from server');
        setPlayers([]);
        setLobbyId(null);
        setIsHost(false);
        setIsGameStarted(false);
      }
    };

    // Register all event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup event handlers
    return () => {
      Object.keys(handlers).forEach(event => {
        socket.off(event);
      });
    };
  }, [socket]);

  const createLobby = () => {
    if (socket && playerName) {
      console.log('Creating lobby with name:', playerName);
      socket.emit('create-lobby', playerName);
    } else {
      console.error('Cannot create lobby: socket or player name missing');
      if (!socket) alert('Unable to connect to server. Please try again.');
      if (!playerName) alert('Please enter your name');
    }
  };

  const joinLobby = (id: string) => {
    if (socket && playerName) {
      console.log('Joining lobby:', id, 'with name:', playerName);
      socket.emit('join-lobby', { lobbyId: id, playerName });
    } else {
      console.error('Cannot join lobby: socket or player name missing');
      if (!socket) alert('Unable to connect to server. Please try again.');
      if (!playerName) alert('Please enter your name');
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
