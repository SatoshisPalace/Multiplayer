import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { GameEngine, Player } from '../game/GameEngine';
import Lobby from './Lobby';

const Game: React.FC = () => {
  const { peer, localId, players, gameStarted } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!gameStarted || !canvasRef.current || !localId) return;

    // Initialize game engine
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 600;
    
    const gameEngine = new GameEngine(canvas, localId);
    gameEngineRef.current = gameEngine;

    // Add all current players to the game
    players.forEach((name, id) => {
      const player: Player = {
        id,
        name,
        position: { x: Math.random() * (canvas.width - 40) + 20, y: Math.random() * (canvas.height - 40) + 20 }
      };
      gameEngine.addPlayer(player);
    });

    // Set up keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game loop
    const gameLoop = () => {
      if (!gameEngine || !peer) return;

      // Handle input and update position
      const newPosition = gameEngine.handleInput(keysPressed.current);
      if (newPosition) {
        // Send position update to peers
        players.forEach((_, peerId) => {
          if (peerId !== localId) {
            peer.send(JSON.stringify({
              type: 'position',
              playerId: localId,
              position: newPosition
            }));
          }
        });
        gameEngine.updatePlayerPosition(localId, newPosition);
      }

      // Render game
      gameEngine.render();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    // Start game loop
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStarted, localId, peer, players]);

  useEffect(() => {
    if (!peer) return;

    const handleData = (data: string) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'position' && gameEngineRef.current) {
          gameEngineRef.current.updatePlayerPosition(message.playerId, message.position);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    peer.on('data', handleData);

    return () => {
      peer.off('data', handleData);
    };
  }, [peer]);

  if (!gameStarted) {
    return <Lobby />;
  }

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid black' }}
      />
      <div style={{ marginTop: '20px' }}>
        <h3>Connected Players:</h3>
        <ul>
          {Array.from(players.entries()).map(([id, name]) => (
            <li key={id}>{name} {id === localId ? '(You)' : ''}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Game;
