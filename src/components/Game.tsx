import React, { useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import Lobby from './Lobby';

const Game: React.FC = () => {
  const {
    players,
    playerName,
    isGameStarted,
    updatePosition
  } = useGame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastRender = useRef(0);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const speed = 5;
      let newPosition = { x: 0, y: 0 };
      const currentPlayer = players.find(p => p.name === playerName);
      
      if (!currentPlayer) return;
      
      newPosition = { ...currentPlayer.position };

      switch (e.key) {
        case 'ArrowUp':
          newPosition.y -= speed;
          break;
        case 'ArrowDown':
          newPosition.y += speed;
          break;
        case 'ArrowLeft':
          newPosition.x -= speed;
          break;
        case 'ArrowRight':
          newPosition.x += speed;
          break;
      }

      updatePosition(newPosition);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [players, playerName, updatePosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      if (!isGameStarted) return;
      
      // Calculate delta time
      const delta = timestamp - lastRender.current;
      lastRender.current = timestamp;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all players
      players.forEach(player => {
        ctx.fillStyle = player.name === playerName ? '#00ff00' : '#ff0000';
        ctx.beginPath();
        ctx.arc(player.position.x, player.position.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Draw player name
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.position.x, player.position.y + 35);
      });

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }, [players, playerName, isGameStarted]);

  // Show lobby if game hasn't started
  if (!isGameStarted) {
    return <Lobby />;
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px' 
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>Game in Progress</h2>
        <div>Players Connected: {players.length}</div>
        <ul>
          {players.map(player => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ul>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ 
          border: '2px solid black',
          borderRadius: '4px',
          backgroundColor: '#f0f0f0'
        }}
      />
      <div style={{ marginTop: '20px' }}>
        <p>Use arrow keys to move your character (green)</p>
        <p>Other players will appear in red</p>
      </div>
    </div>
  );
};

export default Game;
