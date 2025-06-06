// Game configuration constants
export const GAME_DIMENSIONS = {
  WIDTH: 1200,
  HEIGHT: 600,
  GROUND_HEIGHT: 500,
} as const;

export const PHYSICS = {
  GRAVITY: 0.6,
  JUMP_FORCE: -12,
  PLAYER_SPEED: 5,
  BULLET_SPEED: 15,
  ENEMY_BULLET_SPEED: 8,
} as const;

export const PLAYER = {
  WIDTH: 42,
  HEIGHT: 48,
  MAX_HEALTH: 100,
  SPAWN_IMMUNITY_DURATION: 2000,
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
  PATROL_SPEED: 1,
  CHASE_SPEED: 2,
  DETECTION_RANGE: 300,
  ATTACK_RANGE: 400,
  COVER_SEARCH_RANGE: 200,
  ALERT_DECAY_RATE: 1,
} as const;

export const SPECIAL_ABILITIES = {
  MULTI_SHOT: {
    COOLDOWN: 4000,
    BULLET_COUNT: 3,
    SPREAD_ANGLE: Math.PI / 8,
  },
  EXECUTION_DASH: {
    COOLDOWN: 6000,
    DISTANCE: 300,
    DAMAGE: 50,
  },
  BERSERKER_MODE: {
    COOLDOWN: 8000,
    DURATION: 5000,
    DAMAGE_MULTIPLIER: 2,
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