// Game configuration constants
export const GAME_DIMENSIONS = {
  WIDTH: 1200,
  HEIGHT: 600,
  GROUND_HEIGHT: 500,
} as const;

export const PHYSICS = {
  GRAVITY: 0.4,  // Reduced from 0.6 - slower falling, easier to control
  JUMP_FORCE: -14,  // Increased from -12 - higher jumps
  PLAYER_SPEED: 7,  // Increased from 5 - faster movement
  BULLET_SPEED: 20,  // Increased from 15 - easier to hit enemies
  ENEMY_BULLET_SPEED: 5,  // Reduced from 8 - easier to dodge
} as const;

export const PLAYER = {
  WIDTH: 42,
  HEIGHT: 48,
  MAX_HEALTH: 150,  // Increased from 100 - more health
  SPAWN_IMMUNITY_DURATION: 3000,  // Increased from 2000 - longer immunity after respawn
  ANIMATION_SPEED: 5,
} as const;

export const ENEMY_SIZES = {
  GUARD: { WIDTH: 36, HEIGHT: 42 },
  DOG: { WIDTH: 48, HEIGHT: 32 },
  BOSS: { WIDTH: 60, HEIGHT: 70 },
} as const;

export const UI = {
  HEALTH_BAR: {
    WIDTH: 200,
    HEIGHT: 20,
    X: 20,
    Y: 20,
  },
  PROGRESS_BAR: {
    WIDTH: 300,
    HEIGHT: 10,
    Y: 50,
  },
  FONT: {
    SMALL: "16px 'Courier New', monospace",
    MEDIUM: "20px 'Courier New', monospace",
    LARGE: "24px 'Courier New', monospace",
    TITLE: "48px 'Courier New', monospace",
  },
} as const;

export const COMBAT = {
  KNOCKBACK_FORCE: 8,
  INVULNERABILITY_TIME: 1000,
  CRITICAL_HIT_CHANCE: 0.1,
  HEADSHOT_MULTIPLIER: 2,
} as const;

export const AI = {
  PATROL_SPEED: 0.5,  // Reduced from 1 - slower patrolling enemies
  CHASE_SPEED: 1.5,  // Reduced from 2 - slower chasing
  DETECTION_RANGE: 200,  // Reduced from 300 - enemies detect from shorter distance
  ATTACK_RANGE: 300,  // Reduced from 400 - enemies attack from closer range
  COVER_SEARCH_RANGE: 200,
  ALERT_DECAY_RATE: 2,  // Increased from 1 - enemies lose alert faster
} as const;

export const SPECIAL_ABILITIES = {
  MULTI_SHOT: {
    COOLDOWN: 2000,  // Reduced from 4000 - more frequent special attacks
    BULLET_COUNT: 5,  // Increased from 3 - more bullets
    SPREAD_ANGLE: Math.PI / 6,  // Wider spread for better coverage
  },
  EXECUTION_DASH: {
    COOLDOWN: 3000,  // Reduced from 6000 - more frequent dashes
    DISTANCE: 400,  // Increased from 300 - longer dash
    DAMAGE: 100,  // Increased from 50 - more damage
  },
  BERSERKER_MODE: {
    COOLDOWN: 5000,  // Reduced from 8000 - more frequent berserker mode
    DURATION: 7000,  // Increased from 5000 - longer duration
    DAMAGE_MULTIPLIER: 3,  // Increased from 2 - more damage
  },
} as const;

export const PARTICLES = {
  EXPLOSION: {
    COUNT: 30,
    MIN_SPEED: 2,
    MAX_SPEED: 10,
    LIFETIME: 1000,
  },
  BLOOD: {
    COUNT: 15,
    MIN_SPEED: 1,
    MAX_SPEED: 5,
    LIFETIME: 800,
  },
  SPARK: {
    COUNT: 10,
    MIN_SPEED: 3,
    MAX_SPEED: 8,
    LIFETIME: 500,
  },
} as const;

export const COLORS = {
  PLAYER: '#4A90E2',
  ENEMY: '#E25449',
  BOSS: '#9B59B6',
  HEALTH: '#2ECC71',
  DAMAGE: '#E74C3C',
  AMMO: '#F39C12',
  BACKGROUND: {
    YARD: '#87CEEB',
    CELLBLOCK: '#4A5568',
    SECURITY: '#2D3748',
    ESCAPE: '#1A202C',
  },
  PARTICLES: {
    EXPLOSION: ['#FFA500', '#FF6347', '#FFD700', '#FF4500'],
    BLOOD: ['#DC143C', '#8B0000', '#B22222'],
    SMOKE: ['#696969', '#808080', '#A9A9A9'],
    SPARK: ['#FFFF00', '#FFD700', '#FFA500'],
  },
} as const;