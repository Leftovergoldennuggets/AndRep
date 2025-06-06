import { Particle, ParticleType, Vector2D } from './types';
import { PARTICLES, COLORS } from './constants';
import { randomRange, randomInt } from './utils';

export const createParticles = (
  position: Vector2D,
  type: ParticleType,
  count?: number
): Particle[] => {
  const particles: Particle[] = [];
  const config = PARTICLES[type.toUpperCase() as keyof typeof PARTICLES];
  const particleCount = count || config.COUNT;
  const colors = COLORS.PARTICLES[type.toUpperCase() as keyof typeof COLORS.PARTICLES];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(config.MIN_SPEED, config.MAX_SPEED);
    
    particles.push({
      x: position.x,
      y: position.y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      life: config.LIFETIME,
      maxLife: config.LIFETIME,
      color: colors[randomInt(0, colors.length - 1)],
      size: randomRange(2, 6),
      type,
    });
  }
  
  return particles;
};

export const updateParticles = (particles: Particle[], deltaTime: number): Particle[] => {
  return particles
    .map(particle => {
      // Update position
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      
      // Apply gravity for certain types
      if (particle.type === 'blood' || particle.type === 'explosion') {
        particle.velocityY += 0.3;
      }
      
      // Fade out smoke
      if (particle.type === 'smoke') {
        particle.velocityY -= 0.1;
        particle.velocityX *= 0.98;
      }
      
      // Update life
      particle.life -= deltaTime;
      
      return particle;
    })
    .filter(particle => particle.life > 0);
};

export const drawParticles = (
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void => {
  particles.forEach(particle => {
    const alpha = particle.life / particle.maxLife;
    
    if (particle.type === 'spark') {
      // Draw sparks as lines
      ctx.strokeStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = particle.size * alpha;
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(
        particle.x - particle.velocityX * 2,
        particle.y - particle.velocityY * 2
      );
      ctx.stroke();
    } else {
      // Draw other particles as circles
      ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};

export const createExplosion = (
  position: Vector2D,
  intensity: number = 1
): Particle[] => {
  const particles: Particle[] = [];
  
  // Create multiple particle types for a better explosion
  particles.push(...createParticles(position, 'explosion', Math.floor(30 * intensity)));
  particles.push(...createParticles(position, 'spark', Math.floor(15 * intensity)));
  particles.push(...createParticles(position, 'smoke', Math.floor(10 * intensity)));
  
  return particles;
};

export const createBloodSplatter = (
  position: Vector2D,
  direction: number,
  intensity: number = 1
): Particle[] => {
  const particles: Particle[] = [];
  const count = Math.floor(15 * intensity);
  
  for (let i = 0; i < count; i++) {
    const angleVariation = randomRange(-Math.PI / 4, Math.PI / 4);
    const angle = direction + angleVariation;
    const speed = randomRange(2, 8) * intensity;
    
    particles.push({
      x: position.x,
      y: position.y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed - 2, // Initial upward velocity
      life: 800,
      maxLife: 800,
      color: COLORS.PARTICLES.BLOOD[randomInt(0, COLORS.PARTICLES.BLOOD.length - 1)],
      size: randomRange(2, 4),
      type: 'blood',
    });
  }
  
  return particles;
};