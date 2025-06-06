// Game type definitions
export type WeaponType = 'pistol' | 'rifle' | 'shotgun' | 'sniper' | 'machinegun';

export type EnemyType = 'guard' | 'dog' | 'boss';

export type BossType = 'warden' | 'captain' | 'chief' | 'helicopter';

export type AIState = 'patrol' | 'chase' | 'cover' | 'attack' | 'retreat';

export type ParticleType = 'explosion' | 'spark' | 'smoke' | 'blood';

export type PowerupType = 'health' | 'ammo' | 'weapon';

export type ObstacleType = 'fence' | 'crate' | 'platform' | 'ground' | 'door' | 'switch';

export type LevelTheme = 'yard' | 'cellblock' | 'security' | 'escape';

export type ObjectiveType = 'rescue' | 'destroy' | 'survive' | 'escape';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Entity extends Vector2D {
  velocityX?: number;
  velocityY?: number;
  health?: number;
  maxHealth?: number;
}

export interface Player extends Entity {
  velocityY: number;
  health: number;
  weapon: WeaponType;
  ammo: number;
  onGround: boolean;
  animationFrame: number;
  direction: 'left' | 'right';
  spawnImmunity: number;
}

export interface Enemy extends Entity {
  velocityY: number;
  health: number;
  maxHealth: number;
  type: EnemyType;
  bossType?: BossType;
  attackPattern?: string;
  phase?: number;
  lastShotTime: number;
  onGround: boolean;
  aiState: AIState;
  alertLevel: number;
  lastPlayerSeen: number;
  coverPosition?: Vector2D;
  patrolDirection?: number;
  patrolStartX?: number;
  hitFlash?: number;
}

export interface Bullet extends Entity {
  velocityX: number;
  velocityY: number;
  damage: number;
  trail?: Vector2D[];
}

export interface Obstacle extends Vector2D, Dimensions {
  type: ObstacleType;
  health?: number;
  maxHealth?: number;
  isDestructible: boolean;
  isInteractive: boolean;
  isActivated?: boolean;
  explosionRadius?: number;
}

export interface Powerup extends Vector2D {
  type: PowerupType;
  weaponType?: WeaponType;
}

export interface Particle extends Entity {
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: ParticleType;
}

export interface Level {
  current: number;
  name: string;
  theme: LevelTheme;
  startX: number;
  endX: number;
  bossSpawned: boolean;
  bossDefeated: boolean;
}

export interface Objective {
  id: string;
  type: ObjectiveType;
  description: string;
  target?: Vector2D;
  targetCount?: number;
  currentCount: number;
  completed: boolean;
}

export interface Camera {
  x: number;
  shake: number;
}

export interface GameState {
  player: Player;
  level: Level;
  bullets: Bullet[];
  enemies: Enemy[];
  enemyBullets: Bullet[];
  obstacles: Obstacle[];
  powerups: Powerup[];
  particles: Particle[];
  camera: Camera;
  objectives: Objective[];
  score: number;
  gameOver: boolean;
  gameStarted: boolean;
  gamePaused: boolean;
  gameWon: boolean;
  currentObjective: number;
  comboCount: number;
  lastKillTime: number;
  dialogueText: string;
  dialogueTimer: number;
  currentSlide: number;
  slideTransition: boolean;
  specialAbilitiesUsed: Record<string, boolean>;
}

export interface WeaponInfo {
  damage: number;
  fireRate: number;
  ammo: number;
  spread: number;
  range: number;
  bulletSpeed: number;
  bulletCount?: number;
  specialEffect?: string;
}

export interface LevelConfig {
  name: string;
  theme: LevelTheme;
  length: number;
  enemyDensity: number;
  enemyTypes: { type: EnemyType; weight: number }[];
  boss?: BossType;
  objectives: Objective[];
  dialogue?: string;
  obstacleDensity: number;
  powerupDensity: number;
}