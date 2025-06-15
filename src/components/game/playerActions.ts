import { GameState, Bullet, WeaponType } from './types';
import { WEAPONS } from './weapons';
import { PHYSICS, SPECIAL_ABILITIES } from './constants';
import { createParticles } from './particles';

export function jump(player: GameState['player']): void {
  if (player.onGround) {
    player.velocityY = PHYSICS.JUMP_FORCE;
    player.onGround = false;
  }
}

export function shoot(
  gameState: GameState,
  currentTime: number,
  lastShotTime: { current: number },
  playSound: (type: string) => void
): void {
  const { player } = gameState;
  const weapon = WEAPONS[player.weapon];
  
  if (player.ammo <= 0 || currentTime - lastShotTime.current < weapon.fireRate) {
    return;
  }
  
  lastShotTime.current = currentTime;
  player.ammo--;
  
  const bulletCount = weapon.bulletCount || 1;
  const spread = weapon.spread || 0;
  
  for (let i = 0; i < bulletCount; i++) {
    let angle = 0;
    
    if (bulletCount > 1) {
      angle = -spread/2 + (spread * i) / (bulletCount - 1);
    }
    
    const velocityX = Math.cos(angle) * weapon.bulletSpeed * (player.direction === 'left' ? -1 : 1);
    const velocityY = Math.sin(angle) * weapon.bulletSpeed;
    
    const bullet: Bullet = {
      x: player.x + (player.direction === 'left' ? 0 : 48),
      y: player.y + 24,
      velocityX,
      velocityY,
      damage: weapon.damage,
      trail: [],
    };
    
    gameState.bullets.push(bullet);
  }
  
  playSound('shoot');
}

export function switchWeapon(player: GameState['player'], direction: 'next' | 'prev'): void {
  const weapons: WeaponType[] = ['pistol', 'shotgun', 'rifle', 'sniper', 'machinegun'];
  const currentIndex = weapons.indexOf(player.weapon);
  
  let newIndex: number;
  if (direction === 'next') {
    newIndex = (currentIndex + 1) % weapons.length;
  } else {
    newIndex = (currentIndex - 1 + weapons.length) % weapons.length;
  }
  
  const newWeapon = weapons[newIndex];
  player.weapon = newWeapon;
  player.ammo = WEAPONS[newWeapon].ammo;
}

export function rebelDash(
  gameState: GameState,
  currentTime: number,
  lastDashTime: { current: number },
  playSound: (type: string) => void
): void {
  const { player } = gameState;
  
  if (currentTime - lastDashTime.current < SPECIAL_ABILITIES.EXECUTION_DASH.COOLDOWN) {
    return;
  }
  
  lastDashTime.current = currentTime;
  
  // Dash movement
  const dashDistance = SPECIAL_ABILITIES.EXECUTION_DASH.DISTANCE;
  const dashDirection = player.direction === 'left' ? -1 : 1;
  player.x += dashDistance * dashDirection;
  
  // Damage enemies in dash path
  const dashDamage = SPECIAL_ABILITIES.EXECUTION_DASH.DAMAGE;
  
  gameState.enemies.forEach(enemy => {
    const distanceToEnemy = Math.abs(enemy.x - player.x);
    if (distanceToEnemy < dashDistance) {
      enemy.health -= dashDamage;
      
      // Create blood particles
      gameState.particles.push(...createParticles({
        x: enemy.x,
        y: enemy.y,
        count: 8,
        type: 'blood',
        speed: { min: 2, max: 6 },
        lifetime: 800,
        colors: ['#DC143C', '#8B0000', '#B22222']
      }));
      
      if (enemy.health <= 0) {
        gameState.score += 50;
        gameState.comboCount++;
        gameState.lastKillTime = currentTime;
      }
    }
  });
  
  // Screen shake effect
  gameState.camera.shake = 15;
  
  playSound('explosion');
}

export function berserkerMode(
  gameState: GameState,
  currentTime: number,
  lastBerserkerTime: { current: number },
  berserkerEndTime: { current: number },
  playSound: (type: string) => void
): void {
  if (currentTime - lastBerserkerTime.current < SPECIAL_ABILITIES.BERSERKER_MODE.COOLDOWN) {
    return;
  }
  
  lastBerserkerTime.current = currentTime;
  berserkerEndTime.current = currentTime + SPECIAL_ABILITIES.BERSERKER_MODE.DURATION;
  
  // Visual effect - add red particles around player
  gameState.particles.push(...createParticles({
    x: gameState.player.x + 24,
    y: gameState.player.y + 24,
    count: 20,
    type: 'spark',
    speed: { min: 3, max: 8 },
    lifetime: 1000,
    colors: ['#FF0000', '#FF4500', '#DC143C']
  }));
  
  playSound('powerup');
}

export function isBerserkerActive(currentTime: number, berserkerEndTime: { current: number }): boolean {
  return currentTime < berserkerEndTime.current;
}

export function multiShot(
  gameState: GameState,
  currentTime: number,
  lastMultiShotTime: { current: number },
  playSound: (type: string) => void
): void {
  const { player } = gameState;
  
  if (currentTime - lastMultiShotTime.current < SPECIAL_ABILITIES.MULTI_SHOT.COOLDOWN) {
    return;
  }
  
  lastMultiShotTime.current = currentTime;
  
  const bulletCount = SPECIAL_ABILITIES.MULTI_SHOT.BULLET_COUNT;
  const spreadAngle = SPECIAL_ABILITIES.MULTI_SHOT.SPREAD_ANGLE;
  const weapon = WEAPONS[player.weapon];
  
  for (let i = 0; i < bulletCount; i++) {
    const angle = -spreadAngle/2 + (spreadAngle * i) / (bulletCount - 1);
    const velocityX = Math.cos(angle) * weapon.bulletSpeed * (player.direction === 'left' ? -1 : 1);
    const velocityY = Math.sin(angle) * weapon.bulletSpeed;
    
    const bullet: Bullet = {
      x: player.x + (player.direction === 'left' ? 0 : 48),
      y: player.y + 24,
      velocityX,
      velocityY,
      damage: weapon.damage * 1.5, // Bonus damage for special ability
      trail: [],
    };
    
    gameState.bullets.push(bullet);
  }
  
  playSound('shoot');
}