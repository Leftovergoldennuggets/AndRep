import { Player, Enemy, Bullet, Obstacle, Particle, GameState } from './types';
import { COLORS } from './constants';

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  theme: string,
  _cameraX: number,
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
  
  if (enemy.type === 'boss') {
    // Draw the Corrupt Warden boss with more detail
    drawBoss(ctx, enemy, screenX);
  } else {
    // Enemy body
    ctx.fillStyle = enemy.hitFlash ? '#FF0000' : COLORS.ENEMY;
    const size = enemy.type === 'dog' ? 38 : 42;
    ctx.fillRect(screenX, enemy.y, size, size);
  }
}

function drawBoss(
  ctx: CanvasRenderingContext2D,
  boss: Enemy,
  screenX: number
): void {
  const bossWidth = 90;
  const bossHeight = 90;
  
  // Save context state
  ctx.save();
  
  // Boss body - dark blue prison warden uniform
  ctx.fillStyle = boss.hitFlash ? '#FF0000' : '#1a237e';
  ctx.fillRect(screenX, boss.y, bossWidth, bossHeight);
  
  // Warden's badge/star on chest
  ctx.fillStyle = '#FFD700';
  const badgeX = screenX + bossWidth / 2;
  const badgeY = boss.y + 30;
  drawStar(ctx, badgeX, badgeY, 12, 5, 0.5);
  
  // Warden's hat/cap
  ctx.fillStyle = '#0d47a1';
  ctx.fillRect(screenX + 10, boss.y - 10, bossWidth - 20, 15);
  ctx.fillRect(screenX + 5, boss.y - 5, bossWidth - 10, 10);
  
  // Hat badge
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(screenX + bossWidth/2 - 5, boss.y - 8, 10, 8);
  
  // Eyes - menacing red when in rage mode
  ctx.fillStyle = boss.phase && boss.phase > 1 ? '#FF0000' : '#FFFFFF';
  ctx.fillRect(screenX + 20, boss.y + 20, 10, 5);
  ctx.fillRect(screenX + 60, boss.y + 20, 10, 5);
  
  // Angry eyebrows
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(screenX + 15, boss.y + 15);
  ctx.lineTo(screenX + 30, boss.y + 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(screenX + 75, boss.y + 15);
  ctx.lineTo(screenX + 60, boss.y + 18);
  ctx.stroke();
  
  // Mustache
  ctx.fillStyle = '#4A5568';
  ctx.fillRect(screenX + 25, boss.y + 35, 40, 8);
  ctx.fillRect(screenX + 20, boss.y + 38, 10, 5);
  ctx.fillRect(screenX + 60, boss.y + 38, 10, 5);
  
  // Shotgun - held at side
  ctx.fillStyle = '#2C3E50';
  const gunX = boss.x < 600 ? screenX + bossWidth - 5 : screenX - 25; // Direction based
  ctx.fillRect(gunX, boss.y + 40, 30, 8);
  ctx.fillRect(gunX + 25, boss.y + 40, 5, 20);
  
  // Belt with ammo
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(screenX + 5, boss.y + 65, bossWidth - 10, 8);
  
  // Ammo shells on belt
  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(screenX + 15 + i * 15, boss.y + 66, 4, 6);
  }
  
  // Rage mode aura effect
  if (boss.phase && boss.phase > 1) {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(screenX - 5, boss.y - 15, bossWidth + 10, bossHeight + 15);
  }
  
  // Restore context
  ctx.restore();
  
  // Health bar above boss
  drawHealthBar(ctx, screenX, boss.y - 30, bossWidth, boss.health, boss.maxHealth);
}

// Helper function to draw a star
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  points: number,
  innerRadiusRatio: number
): void {
  const innerRadius = outerRadius * innerRadiusRatio;
  const angle = Math.PI / points;
  
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + Math.cos(i * angle - Math.PI / 2) * radius;
    const y = cy + Math.sin(i * angle - Math.PI / 2) * radius;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();
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
  _canvasHeight: number
): void {
  const { player, level, score } = gameState;
  
  // Player health bar
  drawHealthBar(ctx, 20, 20, 200, player.health, 10); // Updated to match reduced max health
  
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