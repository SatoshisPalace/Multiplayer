import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    netplayjs: any;
  }
}

class SimpleGame extends (window.netplayjs?.Game || class {}) {
  aPos: { x: number; y: number };
  bPos: { x: number; y: number };

  constructor() {
    super();
    this.aPos = { x: 100, y: 150 };
    this.bPos = { x: 500, y: 150 };
  }

  tick(playerInputs: Map<any, any>) {
    for (const [player, input] of playerInputs.entries()) {
      const vel = input.arrowKeys();

      if (player.getID() === 0) {
        this.aPos.x += vel.x * 5;
        this.aPos.y -= vel.y * 5;
      } else if (player.getID() === 1) {
        this.bPos.x += vel.x * 5;
        this.bPos.y -= vel.y * 5;
      }
    }
  }

  draw(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'red';
    ctx.fillRect(this.aPos.x - 5, this.aPos.y - 5, 10, 10);
    ctx.fillStyle = 'blue';
    ctx.fillRect(this.bPos.x - 5, this.bPos.y - 5, 10, 10);
  }

  static timestep = 1000 / 60;
  static canvasSize = { width: 600, height: 300 };
}

const Game: React.FC = () => {
  const gameInitialized = useRef(false);

  useEffect(() => {
    if (!gameInitialized.current && window.netplayjs) {
      new window.netplayjs.RollbackWrapper(SimpleGame).start();
      gameInitialized.current = true;
    }
  }, []);

  return (
    <div className="game-container">
      <h2>Netplayjs Game</h2>
      <div id="game-canvas"></div>
    </div>
  );
};

export default Game;
