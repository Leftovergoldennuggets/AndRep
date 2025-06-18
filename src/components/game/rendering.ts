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
  const time = Date.now();
  const isRageMode = boss.phase && boss.phase > 1;
  
  // Animation timing with enhanced movement-based effects
  const isMoving = Math.abs(boss.velocityX || 0) > 0;
  const moveIntensity = Math.min(Math.abs(boss.velocityX || 0) / 8, 1); // Normalize movement speed
  
  // Enhanced animation cycles
  const walkCycle = isMoving ? Math.sin(time * 0.015 * (1 + moveIntensity)) * (2 + moveIntensity) : 0;
  const breathCycle = Math.sin(time * 0.005) * (0.5 + moveIntensity * 0.5);
  const ragePulse = isRageMode ? Math.sin(time * 0.02) * 0.5 + 0.5 : 0;
  
  // Stomping effect based on behavior state
  const stompEffect = boss.behaviorState?.stompPhase ? Math.sin(boss.behaviorState.stompPhase) * 3 : 0;
  
  // Save context state
  ctx.save();
  
  // Shadow under boss
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(screenX + 5, boss.y + bossHeight + 2, bossWidth - 10, 8);
  
  // Rage mode ground crack effect
  if (isRageMode) {
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(screenX - 20 + i * 30, boss.y + bossHeight + 5);
      ctx.lineTo(screenX + 20 + i * 30, boss.y + bossHeight + 15);
      ctx.stroke();
    }
  }
  
  // Boss body with breathing animation - more detailed uniform
  const bodyY = boss.y + breathCycle;
  
  // Uniform base
  ctx.fillStyle = boss.hitFlash ? '#FF0000' : '#1a237e';
  ctx.fillRect(screenX, bodyY, bossWidth, bossHeight);
  
  // Uniform details - collar
  ctx.fillStyle = '#0d47a1';
  ctx.fillRect(screenX + 15, bodyY + 5, bossWidth - 30, 8);
  
  // Uniform buttons
  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(screenX + bossWidth/2 - 2, bodyY + 15 + i * 12, 4, 4);
  }
  
  // Shoulder pads/epaulettes
  ctx.fillStyle = '#0d47a1';
  ctx.fillRect(screenX - 3, bodyY + 8, 15, 20);
  ctx.fillRect(screenX + bossWidth - 12, bodyY + 8, 15, 20);
  
  // Rank stripes on sleeves
  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(screenX + 5, bodyY + 20 + i * 4, 8, 2);
    ctx.fillRect(screenX + bossWidth - 13, bodyY + 20 + i * 4, 8, 2);
  }
  
  // Enhanced warden's badge/star on chest with glow
  if (isRageMode) {
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10 + ragePulse * 5;
  }
  ctx.fillStyle = '#FFD700';
  const badgeX = screenX + bossWidth / 2;
  const badgeY = bodyY + 30;
  drawStar(ctx, badgeX, badgeY, 15 + ragePulse * 2, 5, 0.4);
  ctx.shadowBlur = 0;
  
  // Warden's hat/cap with more detail
  ctx.fillStyle = '#0d47a1';
  ctx.fillRect(screenX + 8, bodyY - 12, bossWidth - 16, 18);
  ctx.fillRect(screenX + 3, bodyY - 7, bossWidth - 6, 12);
  
  // Hat brim detail
  ctx.fillStyle = '#1a237e';
  ctx.fillRect(screenX + 3, bodyY - 2, bossWidth - 6, 3);
  
  // Hat badge with animation
  ctx.fillStyle = '#FFD700';
  const hatBadgeSize = 12 + ragePulse;
  ctx.fillRect(screenX + bossWidth/2 - hatBadgeSize/2, bodyY - 10, hatBadgeSize, 10);
  
  // Eyes - animated and more expressive
  const eyeGlow = isRageMode ? ragePulse * 100 : 0;
  ctx.fillStyle = isRageMode ? `rgb(255, ${50 + eyeGlow}, ${50 + eyeGlow})` : '#FFFFFF';
  
  // Blinking animation
  const blinkCycle = Math.sin(time * 0.003);
  const eyeHeight = blinkCycle > 0.95 ? 2 : 8;
  
  ctx.fillRect(screenX + 18, bodyY + 18, 12, eyeHeight);
  ctx.fillRect(screenX + 60, bodyY + 18, 12, eyeHeight);
  
  // Pupils that track movement direction
  ctx.fillStyle = '#000000';
  if (eyeHeight > 2) {
    const pupilOffset = boss.velocityX ? Math.sign(boss.velocityX) * 2 : 0;
    ctx.fillRect(screenX + 22 + pupilOffset, bodyY + 20, 4, 4);
    ctx.fillRect(screenX + 64 + pupilOffset, bodyY + 20, 4, 4);
  }
  
  // Enhanced angry eyebrows with animation
  ctx.strokeStyle = isRageMode ? '#FF0000' : '#000000';
  ctx.lineWidth = 4;
  const browFurrow = isRageMode ? 3 : 0;
  
  ctx.beginPath();
  ctx.moveTo(screenX + 12, bodyY + 12 + browFurrow);
  ctx.lineTo(screenX + 32, bodyY + 16 + browFurrow);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(screenX + 78, bodyY + 12 + browFurrow);
  ctx.lineTo(screenX + 58, bodyY + 16 + browFurrow);
  ctx.stroke();
  
  // Enhanced mustache with detail
  ctx.fillStyle = '#2C3E50';
  ctx.fillRect(screenX + 22, bodyY + 32, 46, 10);
  ctx.fillRect(screenX + 18, bodyY + 35, 10, 6);
  ctx.fillRect(screenX + 62, bodyY + 35, 10, 6);
  
  // Mustache highlights
  ctx.fillStyle = '#4A5568';
  ctx.fillRect(screenX + 24, bodyY + 33, 42, 3);
  
  // Menacing grin/snarl
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(screenX + 30, bodyY + 45);
  ctx.quadraticCurveTo(screenX + 45, bodyY + 50, screenX + 60, bodyY + 45);
  ctx.stroke();
  
  // Enhanced shotgun with more detail and animation
  ctx.fillStyle = '#2C3E50';
  const direction = boss.x < 600 ? 1 : -1; // Face player
  const gunX = direction > 0 ? screenX + bossWidth - 8 : screenX - 22;
  const gunSwing = Math.sin(time * 0.01) * 3; // Gun swaying
  
  // Gun barrel
  ctx.fillRect(gunX, bodyY + 35 + gunSwing, 35, 10);
  // Gun stock
  ctx.fillRect(gunX + 28, bodyY + 32 + gunSwing, 8, 16);
  // Gun details
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(gunX + 2, bodyY + 37 + gunSwing, 25, 6);
  
  // Muzzle flash effect when attacking
  if (boss.lastShotTime && time - boss.lastShotTime < 100) {
    ctx.fillStyle = '#FFFF00';
    const flashX = direction > 0 ? gunX - 8 : gunX + 35;
    ctx.fillRect(flashX, bodyY + 32 + gunSwing, 8, 14);
    ctx.fillStyle = '#FF6600';
    ctx.fillRect(flashX + 2, bodyY + 34 + gunSwing, 4, 10);
  }
  
  // Enhanced belt and gear
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(screenX + 3, bodyY + 68, bossWidth - 6, 12);
  
  // Belt buckle
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(screenX + bossWidth/2 - 8, bodyY + 70, 16, 8);
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(screenX + bossWidth/2 - 6, bodyY + 72, 12, 4);
  
  // Enhanced ammo shells with better detail
  ctx.fillStyle = '#DAA520';
  for (let i = 0; i < 6; i++) {
    const shellX = screenX + 8 + i * 12;
    ctx.fillRect(shellX, bodyY + 69, 5, 10);
    // Shell caps
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(shellX + 1, bodyY + 69, 3, 3);
    ctx.fillStyle = '#DAA520';
  }
  
  // Combat boots with dynamic stomping animation
  ctx.fillStyle = '#1A1A1A';
  const leftBootY = boss.y + 78 + Math.abs(stompEffect) * 0.5;
  const rightBootY = boss.y + 78 + Math.abs(stompEffect * -1) * 0.5;
  
  ctx.fillRect(screenX + 15 + walkCycle, leftBootY, 25, 12 + Math.abs(stompEffect) * 0.3);
  ctx.fillRect(screenX + 50 - walkCycle, rightBootY, 25, 12 + Math.abs(stompEffect) * 0.3);
  
  // Dust clouds when stomping hard
  if (Math.abs(stompEffect) > 2 && isMoving) {
    ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
    ctx.fillRect(screenX + 10, boss.y + 88, 35, 4);
    ctx.fillRect(screenX + 45, boss.y + 88, 35, 4);
  }
  
  // Boot laces
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(screenX + 20 + walkCycle, boss.y + 80 + i * 3);
    ctx.lineTo(screenX + 35 + walkCycle, boss.y + 80 + i * 3);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(screenX + 55 - walkCycle, boss.y + 80 + i * 3);
    ctx.lineTo(screenX + 70 - walkCycle, boss.y + 80 + i * 3);
    ctx.stroke();
  }
  
  // Enhanced rage mode effects
  if (isRageMode) {
    // Electrical aura
    ctx.strokeStyle = `rgba(255, 255, 0, ${0.3 + ragePulse * 0.4})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const angle = (time * 0.01 + i * Math.PI * 0.4) % (Math.PI * 2);
      const x1 = screenX + bossWidth/2 + Math.cos(angle) * (bossWidth/2 + 10);
      const y1 = bodyY + bossHeight/2 + Math.sin(angle) * (bossHeight/2 + 10);
      const x2 = screenX + bossWidth/2 + Math.cos(angle + 0.1) * (bossWidth/2 + 20);
      const y2 = bodyY + bossHeight/2 + Math.sin(angle + 0.1) * (bossHeight/2 + 20);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // Smoke/steam effects
    ctx.fillStyle = `rgba(100, 100, 100, ${0.2 + ragePulse * 0.2})`;
    for (let i = 0; i < 3; i++) {
      const smokeX = screenX + 20 + i * 25 + Math.sin(time * 0.01 + i) * 5;
      const smokeY = bodyY - 5 - Math.sin(time * 0.008 + i) * 10;
      ctx.fillRect(smokeX, smokeY, 6, 8);
    }
    
    // Charging effects
    if (boss.behaviorState?.currentPattern === 'charge' && moveIntensity > 0.5) {
      // Speed lines behind charging boss
      ctx.strokeStyle = `rgba(255, 200, 0, ${moveIntensity * 0.6})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const lineX = screenX - (i + 1) * 15 * Math.sign(boss.velocityX || 1);
        ctx.beginPath();
        ctx.moveTo(lineX, bodyY + 20 + i * 15);
        ctx.lineTo(lineX - 20 * Math.sign(boss.velocityX || 1), bodyY + 25 + i * 15);
        ctx.stroke();
      }
    }
  }
  
  // General movement effects
  if (isMoving && moveIntensity > 0.3) {
    // Motion blur effect
    ctx.fillStyle = `rgba(26, 35, 126, ${moveIntensity * 0.2})`;
    const blurOffset = moveIntensity * 5 * Math.sign(boss.velocityX || 1);
    ctx.fillRect(screenX - blurOffset, bodyY, bossWidth, bossHeight);
  }
  
  // Screen shake effect when boss moves
  if (Math.abs(boss.velocityX || 0) > 0) {
    const shake = Math.sin(time * 0.05) * 2;
    ctx.translate(shake, shake * 0.5);
  }
  
  // Restore context
  ctx.restore();
  
  // Enhanced health bar with boss nameplate
  const healthBarY = boss.y - 40;
  
  // Boss name background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(screenX - 20, healthBarY - 20, bossWidth + 40, 15);
  
  // Boss name
  ctx.fillStyle = isRageMode ? '#FF4444' : '#FFFFFF';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CORRUPT WARDEN JOHNSON', screenX + bossWidth/2, healthBarY - 8);
  
  // Enhanced health bar
  drawHealthBar(ctx, screenX, healthBarY, bossWidth, boss.health, boss.maxHealth);
  
  // Phase indicator
  if (isRageMode) {
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ ENRAGED ⚡', screenX + bossWidth/2, healthBarY + 20);
  }
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