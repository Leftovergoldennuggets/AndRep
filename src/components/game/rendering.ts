import { Player, Enemy, Bullet, Obstacle, Particle, GameState } from './types';
import { COLORS } from './constants';

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  theme: string,
  cameraX: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  // Simple background color based on theme
  const bgColor = COLORS.BACKGROUND[theme.toUpperCase() as keyof typeof COLORS.BACKGROUND] || COLORS.BACKGROUND.YARD;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Add simple ground
  ctx.fillStyle = '#4A5D23';
  ctx.fillRect(0, canvasHeight - 100, canvasWidth, 100);
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  cameraX: number
): void {
  const screenX = player.x - cameraX;
  
  // Player body (rooster)
  ctx.fillStyle = player.spawnImmunity > 0 ? 'rgba(255, 100, 100, 0.7)' : COLORS.PLAYER;
  ctx.fillRect(screenX, player.y, 48, 48);
  
  // Simple weapon indicator
  ctx.fillStyle = '#8B4513';
  const weaponX = player.direction === 'left' ? screenX - 10 : screenX + 48;
  ctx.fillRect(weaponX, player.y + 20, 15, 5);
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  cameraX: number
): void {
  const screenX = enemy.x - cameraX;
  
  // Enemy body
  ctx.fillStyle = enemy.hitFlash ? '#FF0000' : COLORS.ENEMY;
  const size = enemy.type === 'boss' ? 90 : (enemy.type === 'dog' ? 38 : 42);
  ctx.fillRect(screenX, enemy.y, size, size);
  
  // Health bar for boss
  if (enemy.type === 'boss') {
    drawHealthBar(ctx, screenX, enemy.y - 20, size, enemy.health, enemy.maxHealth);
  }
}

export function drawBullet(
  ctx: CanvasRenderingContext2D,
  bullet: Bullet,
  cameraX: number
): void {
  const screenX = bullet.x - cameraX;
  
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(screenX, bullet.y, 12, 4);
}

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obstacle: Obstacle,
  cameraX: number
): void {
  const screenX = obstacle.x - cameraX;
  
  ctx.fillStyle = obstacle.type === 'crate' ? '#8B4513' : '#696969';
  ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
  
  // Damage indicator
  if (obstacle.health && obstacle.maxHealth && obstacle.health < obstacle.maxHealth) {
    const damageRatio = 1 - (obstacle.health / obstacle.maxHealth);
    ctx.fillStyle = `rgba(255, 0, 0, ${damageRatio * 0.5})`;
    ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
  }
}

export function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  cameraX: number
): void {
  const screenX = particle.x - cameraX;
  const alpha = particle.life / particle.maxLife;
  
  ctx.fillStyle = particle.color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(screenX, particle.y, particle.size, particle.size);
  ctx.globalAlpha = 1;
}

export function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  health: number,
  maxHealth: number
): void {
  const barHeight = 6;
  const healthRatio = health / maxHealth;
  
  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(x, y, width, barHeight);
  
  // Health
  ctx.fillStyle = healthRatio > 0.5 ? COLORS.HEALTH : healthRatio > 0.25 ? '#F39C12' : COLORS.DAMAGE;
  ctx.fillRect(x, y, width * healthRatio, barHeight);
  
  // Border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, barHeight);
}

export function drawUI(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  canvasWidth: number,
  canvasHeight: number
): void {
  const { player, level, score } = gameState;
  
  // Player health bar
  drawHealthBar(ctx, 20, 20, 200, player.health, 150); // Using easier difficulty max health
  
  // Ammo counter
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px monospace';
  ctx.fillText(`Ammo: ${player.ammo}`, 20, 60);
  ctx.fillText(`Weapon: ${player.weapon}`, 20, 80);
  
  // Score
  ctx.fillText(`Score: ${score}`, canvasWidth - 150, 30);
  
  // Level progress
  const progressRatio = Math.min(player.x / level.endX, 1);
  ctx.fillStyle = '#000000';
  ctx.fillRect(20, 100, 300, 10);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(20, 100, 300 * progressRatio, 10);
}