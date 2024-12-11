import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import Lobby from './Lobby';
import './Game.css';

const Game: React.FC = () => {
  const {
    players,
    isGameStarted,
    updatePosition,
    socket
  } = useGame();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isGameStarted) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (!socket) return;
      const player = players.find(p => p.id === socket.id);
      if (!player) return;

      const newPosition = { ...player.position };
      const MOVE_SPEED = 5;

      switch (e.key) {
        case 'ArrowUp':
          newPosition.y -= MOVE_SPEED;
          break;
        case 'ArrowDown':
          newPosition.y += MOVE_SPEED;
          break;
        case 'ArrowLeft':
          newPosition.x -= MOVE_SPEED;
          break;
        case 'ArrowRight':
          newPosition.x += MOVE_SPEED;
          break;
      }

      updatePosition(newPosition);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isGameStarted, players, updatePosition, socket]);

  useEffect(() => {
    if (!canvasRef.current || !isGameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PLAYER_SIZE = 30;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw players
    players.forEach(player => {
      ctx.fillStyle = socket && player.id === socket.id ? '#00ff00' : '#ff0000';
      ctx.fillRect(player.position.x, player.position.y, PLAYER_SIZE, PLAYER_SIZE);
      
      // Draw player name
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, player.position.x + PLAYER_SIZE/2, player.position.y + PLAYER_SIZE + 20);
    });
  }, [players, isGameStarted, socket]);

  if (!isGameStarted) {
    return <Lobby />;
  }

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="game-canvas"
      />
    </div>
  );
};

export default Game;
