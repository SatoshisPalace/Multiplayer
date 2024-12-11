export interface GameState {
  players: Map<string, Player>;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
}

export interface Position {
  x: number;
  y: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private localPlayerId: string;

  constructor(canvas: HTMLCanvasElement, localPlayerId: string) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;
    this.localPlayerId = localPlayerId;
    this.gameState = {
      players: new Map()
    };
  }

  public addPlayer(player: Player): void {
    this.gameState.players.set(player.id, player);
  }

  public removePlayer(playerId: string): void {
    this.gameState.players.delete(playerId);
  }

  public updatePlayerPosition(playerId: string, position: Position): void {
    const player = this.gameState.players.get(playerId);
    if (player) {
      player.position = position;
    }
  }

  public render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw each player
    this.gameState.players.forEach((player) => {
      // Draw player circle
      this.ctx.fillStyle = player.id === this.localPlayerId ? '#00ff00' : '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(player.position.x, player.position.y, 20, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw player name
      this.ctx.fillStyle = '#000';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(player.name, player.position.x, player.position.y + 35);
    });
  }

  public handleInput(keys: Set<string>): Position | null {
    const player = this.gameState.players.get(this.localPlayerId);
    if (!player) return null;

    const speed = 5;
    const newPosition = { ...player.position };
    let moved = false;

    if (keys.has('ArrowUp')) {
      newPosition.y -= speed;
      moved = true;
    }
    if (keys.has('ArrowDown')) {
      newPosition.y += speed;
      moved = true;
    }
    if (keys.has('ArrowLeft')) {
      newPosition.x -= speed;
      moved = true;
    }
    if (keys.has('ArrowRight')) {
      newPosition.x += speed;
      moved = true;
    }

    // Keep player within canvas bounds
    newPosition.x = Math.max(20, Math.min(this.canvas.width - 20, newPosition.x));
    newPosition.y = Math.max(20, Math.min(this.canvas.height - 20, newPosition.y));

    return moved ? newPosition : null;
  }
}
