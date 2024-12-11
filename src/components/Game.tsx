import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    netplayjs: any;
  }
}

class SimpleGame extends (window.netplayjs?.Game || class {}) {
  aPos: { x: number; y: number };
  bPos: { x: number; y: number };
  aVel: { x: number; y: number };
  bVel: { x: number; y: number };
  worldSize: { width: number; height: number };
  playerRadius: number;
  localPlayerID: number;

  constructor() {
    super();
    this.aPos = { x: 100, y: 150 };
    this.bPos = { x: 500, y: 150 };
    this.aVel = { x: 0, y: 0 };
    this.bVel = { x: 0, y: 0 };
    this.worldSize = { width: 4000, height: 4000 };
    this.playerRadius = 20;
    this.localPlayerID = 0;
  }

  onStart(localPlayer: any) {
    this.localPlayerID = localPlayer?.getID() ?? 0;
  }

  tick(playerInputs: Map<any, any>) {
    const friction = 0.95;
    const acceleration = 0.5;
    const maxSpeed = 8;

    for (const [player, input] of playerInputs.entries()) {
      const vel = input.arrowKeys();
      
      if (player.getID() === 0) {
        this.aVel.x += vel.x * acceleration;
        this.aVel.y -= vel.y * acceleration;

        this.aVel.x *= friction;
        this.aVel.y *= friction;

        const speed = Math.sqrt(this.aVel.x * this.aVel.x + this.aVel.y * this.aVel.y);
        if (speed > maxSpeed) {
          const scale = maxSpeed / speed;
          this.aVel.x *= scale;
          this.aVel.y *= scale;
        }

        this.aPos.x += this.aVel.x;
        this.aPos.y += this.aVel.y;
      } else if (player.getID() === 1) {
        this.bVel.x += vel.x * acceleration;
        this.bVel.y -= vel.y * acceleration;
        
        this.bVel.x *= friction;
        this.bVel.y *= friction;

        const speed = Math.sqrt(this.bVel.x * this.bVel.x + this.bVel.y * this.bVel.y);
        if (speed > maxSpeed) {
          const scale = maxSpeed / speed;
          this.bVel.x *= scale;
          this.bVel.y *= scale;
        }

        this.bPos.x += this.bVel.x;
        this.bPos.y += this.bVel.y;
      }

      if (player.getID() === 0) {
        if (this.aPos.x - this.playerRadius < 0) {
          this.aPos.x = this.playerRadius;
          this.aVel.x *= -0.5;
        }
        if (this.aPos.x + this.playerRadius > this.worldSize.width) {
          this.aPos.x = this.worldSize.width - this.playerRadius;
          this.aVel.x *= -0.5;
        }
        if (this.aPos.y - this.playerRadius < 0) {
          this.aPos.y = this.playerRadius;
          this.aVel.y *= -0.5;
        }
        if (this.aPos.y + this.playerRadius > this.worldSize.height) {
          this.aPos.y = this.worldSize.height - this.playerRadius;
          this.aVel.y *= -0.5;
        }
      } else if (player.getID() === 1) {
        if (this.bPos.x - this.playerRadius < 0) {
          this.bPos.x = this.playerRadius;
          this.bVel.x *= -0.5;
        }
        if (this.bPos.x + this.playerRadius > this.worldSize.width) {
          this.bPos.x = this.worldSize.width - this.playerRadius;
          this.bVel.x *= -0.5;
        }
        if (this.bPos.y - this.playerRadius < 0) {
          this.bPos.y = this.playerRadius;
          this.bVel.y *= -0.5;
        }
        if (this.bPos.y + this.playerRadius > this.worldSize.height) {
          this.bPos.y = this.worldSize.height - this.playerRadius;
          this.bVel.y *= -0.5;
        }
      }
    }
  }

  draw(canvas: HTMLCanvasElement) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    SimpleGame.canvasSize = { width: window.innerWidth, height: window.innerHeight };

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const currentPos = this.localPlayerID === 1 ? this.bPos : this.aPos;
    const cameraX = currentPos.x - canvas.width / 2;
    const cameraY = currentPos.y - canvas.height / 2;

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    const gridSize = 50;
    
    const startX = Math.floor(cameraX / gridSize) * gridSize;
    const startY = Math.floor(cameraY / gridSize) * gridSize;
    const endX = startX + canvas.width + gridSize;
    const endY = startY + canvas.height + gridSize;

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.worldSize.width, this.worldSize.height);

    if (this.localPlayerID === 1) {
      this.drawPlayer(ctx, this.aPos, '#ff6b6b', '#ff4757');
      this.drawPlayer(ctx, this.bPos, '#70a1ff', '#1e90ff');
    } else {
      this.drawPlayer(ctx, this.bPos, '#70a1ff', '#1e90ff');
      this.drawPlayer(ctx, this.aPos, '#ff6b6b', '#ff4757');
    }

    ctx.restore();
  }

  drawPlayer(ctx: CanvasRenderingContext2D, pos: { x: number; y: number }, colorInner: string, colorOuter: string) {
    const gradient = ctx.createRadialGradient(
      pos.x, pos.y, 0,
      pos.x, pos.y, this.playerRadius
    );
    gradient.addColorStop(0, colorInner);
    gradient.addColorStop(1, colorOuter);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.playerRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  static timestep = 1000 / 60;
  static canvasSize = { width: window.innerWidth, height: window.innerHeight };
  static background = '#F0F0F0';
  static hideLobbyElements = true;
}

const Game: React.FC = () => {
  const gameInitialized = useRef(false);

  useEffect(() => {
    if (!gameInitialized.current && window.netplayjs) {
      gameInitialized.current = true;
      
      const style = document.createElement('style');
      style.textContent = `
        .netplayjs-lobby {
          display: none !important;
        }
        #game-container {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        canvas {
          width: 100% !important;
          height: 100% !important;
        }
      `;
      document.head.appendChild(style);

      const game = new window.netplayjs.RollbackWrapper(SimpleGame);
      game.start();
    }
  }, []);

  return <div id="game-container"></div>;
};

export default Game;
