import { Player, Enemy, Bullet, Obstacle, Particle } from './types';
import { PHYSICS } from './constants';

export function checkCollision(
  obj1: { x: number; y: number; width?: number; height?: number; size?: number },
  obj2: { x: number; y: number; width?: number; height?: number; size?: number }
): boolean {
  const obj1Width = obj1.width || obj1.size || 48;
  const obj1Height = obj1.height || obj1.size || 48;
  const obj2Width = obj2.width || obj2.size || 48;
  const obj2Height = obj2.height || obj2.size || 48;

  return (
    obj1.x < obj2.x + obj2Width &&
    obj1.x + obj1Width > obj2.x &&
    obj1.y < obj2.y + obj2Height &&
    obj1.y + obj1Height > obj2.y
  );
}

export function applyGravity(entity: Player | Enemy | Particle, groundLevel: number): void {
  if (!entity.onGround || entity.y < groundLevel - (entity.size || 48)) {
    entity.velocityY += PHYSICS.GRAVITY;
    entity.y += entity.velocityY;
    
    if (entity.y >= groundLevel - (entity.size || 48)) {
      entity.y = groundLevel - (entity.size || 48);
      entity.velocityY = 0;
      if ('onGround' in entity) {
        entity.onGround = true;
      }
    } else {
      if ('onGround' in entity) {
        entity.onGround = false;
      }
    }
  }
}

export function updateBulletPhysics(bullet: Bullet): void {
  bullet.x += bullet.velocityX;
  bullet.y += bullet.velocityY;
  
  // Update trail for visual effects
  if (bullet.trail) {
    bullet.trail.push({ x: bullet.x, y: bullet.y });
    if (bullet.trail.length > 5) {
      bullet.trail.shift();
    }
  }
}

export function isOnGround(entity: { y: number; size?: number }, groundLevel: number): boolean {
  const entitySize = entity.size || 48;
  return entity.y >= groundLevel - entitySize;
}

export function clampToScreen(
  entity: { x: number; y: number; size?: number },
  screenWidth: number,
  screenHeight: number
): void {
  const size = entity.size || 48;
  entity.x = Math.max(0, Math.min(screenWidth - size, entity.x));
  entity.y = Math.max(0, Math.min(screenHeight - size, entity.y));
}