import React, { createContext, useContext, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { Position } from '../game/GameEngine';

export interface GameContextType {
  peer: SimplePeer.Instance | null;
  localId: string | null;
  players: Map<string, string>; // Map of playerId to playerName
  playerName: string;
  gameStarted: boolean;
  connectionData: string;
  setPlayerName: (name: string) => void;
  createGame: () => void;
  joinGame: (connectionData: string) => void;
  updatePosition: (position: Position) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [localId, setLocalId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Map<string, string>>(new Map());
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [connectionData, setConnectionData] = useState('');

  const createGame = useCallback(() => {
    const newPeer = new SimplePeer({
      initiator: true,
      trickle: false
    });

    newPeer.on('signal', data => {
      setConnectionData(JSON.stringify(data));
    });

    newPeer.on('connect', () => {
      const newLocalId = Math.random().toString(36).substring(7);
      setLocalId(newLocalId);
      setPlayers(new Map([[newLocalId, playerName]]));
      setGameStarted(true);
    });

    newPeer.on('data', data => {
      const message = JSON.parse(data.toString());
      if (message.type === 'join') {
        setPlayers(prevPlayers => {
          const newPlayers = new Map(prevPlayers);
          newPlayers.set(message.playerId, message.playerName);
          return newPlayers;
        });
        newPeer.send(JSON.stringify({
          type: 'players',
          players: Array.from(players.entries())
        }));
      }
    });

    setPeer(newPeer);
  }, [playerName, players]);

  const joinGame = useCallback((connectionData: string) => {
    const newPeer = new SimplePeer({
      initiator: false,
      trickle: false
    });

    newPeer.on('signal', data => {
      setConnectionData(JSON.stringify(data));
    });

    newPeer.on('connect', () => {
      const newLocalId = Math.random().toString(36).substring(7);
      setLocalId(newLocalId);
      newPeer.send(JSON.stringify({
        type: 'join',
        playerId: newLocalId,
        playerName
      }));
    });

    newPeer.on('data', data => {
      const message = JSON.parse(data.toString());
      if (message.type === 'players') {
        const playerEntries = message.players as [string, string][];
        setPlayers(new Map(playerEntries));
        setGameStarted(true);
      }
    });

    try {
      newPeer.signal(JSON.parse(connectionData));
    } catch (error) {
      console.error('Invalid connection data:', error);
    }

    setPeer(newPeer);
  }, [playerName]);

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
