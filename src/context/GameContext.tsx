import React, { createContext, useContext, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { Position } from '../game/GameEngine';

export interface GameContextType {
  peer: SimplePeer.Instance | null;
  localId: string | null;
  players: Map<string, string>;
  playerName: string;
  gameStarted: boolean;
  connectionData: string;
  setPlayerName: (name: string) => void;
  createGame: () => void;
  joinGame: (connectionData: string) => void;
  updatePosition: (position: Position) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface SignalData {
  type: 'offer' | 'answer';
  sdp: string;
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [localId, setLocalId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Map<string, string>>(new Map());
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [connectionData, setConnectionData] = useState('');

  const handlePeerError = useCallback((err: Error) => {
    console.error('Peer connection error:', err);
    // Clean up on error
    setGameStarted(false);
    setPeer(null);
    setPlayers(new Map());
  }, []);

  const createGame = useCallback(() => {
    try {
      const newPeer = new SimplePeer({
        initiator: true,
        trickle: false
      });

      const newLocalId = Math.random().toString(36).substring(7);
      setLocalId(newLocalId);

      newPeer.on('error', handlePeerError);

      newPeer.on('signal', data => {
        const signalData: SignalData = {
          type: 'offer',
          sdp: JSON.stringify(data)
        };
        setConnectionData(JSON.stringify(signalData));
      });

      newPeer.on('connect', () => {
        console.log('Peer connection established (host)');
        setPlayers(new Map([[newLocalId, playerName]]));
        setGameStarted(true);
      });

      newPeer.on('data', data => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'join') {
            setPlayers(prevPlayers => {
              const newPlayers = new Map(prevPlayers);
              newPlayers.set(message.playerId, message.playerName);
              return newPlayers;
            });
            // Send current players list to new player
            newPeer.send(JSON.stringify({
              type: 'players',
              players: Array.from(players.entries())
            }));
          }
        } catch (error) {
          console.error('Error handling peer data:', error);
        }
      });

      setPeer(newPeer);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  }, [playerName, players, handlePeerError]);

  const joinGame = useCallback((connectionDataString: string) => {
    try {
      const { type, sdp } = JSON.parse(connectionDataString) as SignalData;
      if (type !== 'offer') {
        throw new Error('Invalid connection data');
      }

      const newPeer = new SimplePeer({
        initiator: false,
        trickle: false
      });

      const newLocalId = Math.random().toString(36).substring(7);
      setLocalId(newLocalId);

      newPeer.on('error', handlePeerError);

      newPeer.on('signal', data => {
        const signalData: SignalData = {
          type: 'answer',
          sdp: JSON.stringify(data)
        };
        setConnectionData(JSON.stringify(signalData));
      });

      newPeer.on('connect', () => {
        console.log('Peer connection established (client)');
        setGameStarted(true);
        // Send join message with player info
        newPeer.send(JSON.stringify({
          type: 'join',
          playerId: newLocalId,
          playerName
        }));
      });

      newPeer.on('data', data => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'players') {
            const playerEntries = message.players as [string, string][];
            setPlayers(new Map(playerEntries));
          }
        } catch (error) {
          console.error('Error handling peer data:', error);
        }
      });

      // Signal the peer with the offer data
      newPeer.signal(JSON.parse(sdp));
      setPeer(newPeer);
    } catch (error) {
      console.error('Error joining game:', error);
    }
  }, [playerName, handlePeerError]);

  const updatePosition = useCallback((position: Position) => {
    if (peer && localId) {
      peer.send(JSON.stringify({
        type: 'position',
        playerId: localId,
        position
      }));
    }
  }, [peer, localId]);

  return (
    <GameContext.Provider value={{
      peer,
      localId,
      players,
      playerName,
      gameStarted,
      connectionData,
      setPlayerName,
      createGame,
      joinGame,
      updatePosition
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
