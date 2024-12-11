import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';

interface Player {
  id: string;
  name: string;
  position: { x: number; y: number };
}

interface PeerConnection {
  peer: SimplePeer.Instance;
  playerId: string;
}

interface GameContextType {
  players: Player[];
  isHost: boolean;
  isGameStarted: boolean;
  playerName: string;
  connectionData: string;
  setPlayerName: (name: string) => void;
  createGame: () => void;
  joinGame: (connectionData: string) => void;
  updatePosition: (position: { x: number; y: number }) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [connectionData, setConnectionData] = useState('');
  const peerConnection = useRef<PeerConnection | null>(null);
  const localPlayer = useRef<Player>({ 
    id: crypto.randomUUID(),
    name: '',
    position: { x: 100, y: 100 }
  });

  const initializePeer = (initiator: boolean) => {
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('signal', data => {
      // Convert the signal data to a shareable string
      const signalString = JSON.stringify(data);
      setConnectionData(signalString);
    });

    peer.on('connect', () => {
      console.log('Peer connection established!');
      setIsGameStarted(true);

      // Send local player info
      peer.send(JSON.stringify({
        type: 'player-info',
        player: localPlayer.current
      }));
    });

    peer.on('data', data => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'position') {
          setPlayers(prev => 
            prev.map(p => 
              p.id !== localPlayer.current.id 
                ? { ...p, position: message.position }
                : p
            )
          );
        } else if (message.type === 'player-info') {
          const remotePlayer: Player = message.player;
          setPlayers(prev => [...prev.filter(p => p.id !== remotePlayer.id), remotePlayer]);
        }
      } catch (err) {
        console.error('Error parsing peer data:', err);
      }
    });

    peer.on('error', err => {
      console.error('Peer error:', err);
    });

    return peer;
  };

  const createGame = () => {
    setIsHost(true);
    localPlayer.current.name = playerName;
    setPlayers([localPlayer.current]);
    
    const peer = initializePeer(true);
    peerConnection.current = { 
      peer, 
      playerId: crypto.randomUUID() 
    };
  };

  const joinGame = (connectionData: string) => {
    try {
      localPlayer.current.name = playerName;
      setPlayers([localPlayer.current]);

      const peer = initializePeer(false);
      peerConnection.current = { 
        peer, 
        playerId: crypto.randomUUID() 
      };

      // Connect using the provided connection data
      const signal = JSON.parse(connectionData);
      peer.signal(signal);
    } catch (err) {
      console.error('Error joining game:', err);
    }
  };

  const updatePosition = (position: { x: number; y: number }) => {
    // Update local player position
    localPlayer.current.position = position;
    setPlayers(prev => 
      prev.map(p => 
        p.id === localPlayer.current.id 
          ? { ...p, position }
          : p
      )
    );

    // Send position to peer
    if (peerConnection.current?.peer && peerConnection.current.peer.connected) {
      const positionUpdate = JSON.stringify({
        type: 'position',
        position
      });
      peerConnection.current.peer.send(positionUpdate);
    }
  };

  return (
    <GameContext.Provider
      value={{
        players,
        isHost,
        isGameStarted,
        playerName,
        connectionData,
        setPlayerName,
        createGame,
        joinGame,
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
