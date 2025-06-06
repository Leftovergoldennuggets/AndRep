import { Vector2D, Entity, Dimensions } from './types';
import { GAME_DIMENSIONS } from './constants';

// Math utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const distance = (a: Vector2D, b: Vector2D): number => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const angle = (from: Vector2D, to: Vector2D): number => {
  return Math.atan2(to.y - from.y, to.x - from.x);
};

export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(randomRange(min, max + 1));
};

// Collision detection
export const checkCollision = (
  a: Vector2D & Dimensions,
  b: Vector2D & Dimensions
): boolean => {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
};

export const isInViewport = (
  entity: Vector2D,
  cameraX: number,
  margin: number = 100
): boolean => {
  return (
    entity.x > cameraX - margin &&
    entity.x < cameraX + GAME_DIMENSIONS.WIDTH + margin
  );
};

// Physics utilities
export const applyGravity = (
  entity: Entity & { onGround: boolean },
  gravity: number
): void => {
  if (!entity.onGround && entity.velocityY !== undefined) {
    entity.velocityY += gravity;
  }
};

export const applyKnockback = (
  entity: Entity,
  force: number,
  angle: number
): void => {
  if (entity.velocityX !== undefined && entity.velocityY !== undefined) {
    entity.velocityX = Math.cos(angle) * force;
    entity.velocityY = Math.sin(angle) * force;
  }
};

// Drawing utilities
export const drawHealthBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  health: number,
  maxHealth: number,
  color: string = '#2ECC71'
): void => {
  const healthPercentage = health / maxHealth;
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x, y, width, height);
  
  // Health bar
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * healthPercentage, height);
  
  // Border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
};

export const drawProgressBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number,
  maxProgress: number,
  color: string,
  label?: string
): void => {
  const progressPercentage = progress / maxProgress;
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(x, y, width, height);
  
  // Progress bar
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * progressPercentage, height);
  
  // Border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  
  // Label
  if (label) {
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y - 5);
  }
};

// Screen shake effect
export const updateCameraShake = (
  camera: { shake: number },
  decayRate: number = 0.9
): void => {
  camera.shake *= decayRate;
  if (camera.shake < 0.1) {
    camera.shake = 0;
  }
};

export const applyCameraShake = (
  ctx: CanvasRenderingContext2D,
  camera: { x: number; shake: number }
): void => {
  if (camera.shake > 0) {
    const shakeX = (Math.random() - 0.5) * camera.shake;
    const shakeY = (Math.random() - 0.5) * camera.shake;
    ctx.translate(shakeX, shakeY);
  }
  ctx.translate(-camera.x, 0);
};

// Color utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Array utilities
export const removeDeadEntities = <T extends { health?: number; life?: number }>(
  entities: T[]
): T[] => {
  return entities.filter(entity => {
    if (entity.health !== undefined) return entity.health > 0;
    if (entity.life !== undefined) return entity.life > 0;
    return true;
  });
};

// Time utilities
export const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};