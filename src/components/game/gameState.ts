import { GameState, Obstacle, Enemy, Powerup, Objective } from './types';
import { LEVELS, ANIMAL_TYPES, ANIMAL_SIZES } from './config';
import { GAME_DIMENSIONS, PLAYER } from './constants';

export function createInitialGameState(): Partial<GameState> {
  return {
    player: {
      x: 400,
      y: GAME_DIMENSIONS.GROUND_HEIGHT - PLAYER.HEIGHT,
      velocityY: 0,
      health: PLAYER.MAX_HEALTH,
      weapon: 'shotgun',
      ammo: 40, // Using shotgun ammo from weapons config
      onGround: true,
      animationFrame: 0,
      direction: 'right',
      spawnImmunity: PLAYER.SPAWN_IMMUNITY_DURATION,
      spawnState: 'in_cell',
      cellBreakTimer: 0,
    },
    level: {
      current: 1,
      name: LEVELS[1].name,
      theme: LEVELS[1].theme,
      startX: 0,
      endX: LEVELS[1].length,
      bossSpawned: false,
      bossDefeated: false,
    },
    bullets: [],
    enemies: [],
    enemyBullets: [],
    obstacles: [],
    powerups: [],
    particles: [],
    camera: {
      x: 0,
      shake: 0,
    },
    objectives: [],
    score: 0,
    gameOver: false,
    gameStarted: false,
    gamePaused: false,
    gameWon: false,
    currentObjective: 0,
    comboCount: 0,
    lastKillTime: 0,
    dialogueText: '',
    dialogueTimer: 0,
    currentSlide: 0,
    slideTransition: false,
    specialAbilitiesUsed: {},
  };
}

export function generateObstacles(levelWidth: number, _obstacleDensity: number): Obstacle[] {
  const obstacles: Obstacle[] = [];
  const groundLevel = GAME_DIMENSIONS.GROUND_HEIGHT;
  
  // Add ground obstacles
  for (let x = 0; x < levelWidth; x += 200 + Math.random() * 300) {
    const obstacleType = Math.random() < 0.6 ? 'crate' : 'fence';
    const width = obstacleType === 'crate' ? 60 : 100;
    const height = obstacleType === 'crate' ? 60 : 80;
    
    obstacles.push({
      x: x + Math.random() * 100,
      y: groundLevel - height,
      width,
      height,
      type: obstacleType,
      health: obstacleType === 'crate' ? 50 : 80,
      maxHealth: obstacleType === 'crate' ? 50 : 80,
      isDestructible: true,
      isInteractive: false,
    });
  }
  
  // Add platform obstacles
  for (let x = 100; x < levelWidth; x += 400 + Math.random() * 200) {
    obstacles.push({
      x: x + Math.random() * 50,
      y: groundLevel - 150 - Math.random() * 100,
      width: 120,
      height: 20,
      type: 'platform',
      isDestructible: false,
      isInteractive: false,
    });
  }
  
  return obstacles;
}

export function generateEnemies(levelWidth: number, enemyDensity: number, levelConfig: any): Enemy[] {
  const enemies: Enemy[] = [];
  const groundLevel = GAME_DIMENSIONS.GROUND_HEIGHT;
  const safeZone = 500; // Safe zone around player spawn
  
  for (let x = safeZone; x < levelWidth - 300; x += 200 + Math.random() * 200) {
    if (Math.random() < enemyDensity) {
      const enemyTypeRoll = Math.random();
      let enemyType: 'guard' | 'dog' = 'guard';
      
      // Determine enemy type based on level configuration
      let cumulativeWeight = 0;
      for (const typeConfig of levelConfig.enemyTypes) {
        cumulativeWeight += typeConfig.weight;
        if (enemyTypeRoll <= cumulativeWeight) {
          enemyType = typeConfig.type as 'guard' | 'dog';
          break;
        }
      }
      
      const enemySize = enemyType === 'guard' ? 42 : 38;
      
      enemies.push({
        x: x + Math.random() * 100,
        y: groundLevel - enemySize,
        velocityY: 0,
        health: enemyType === 'guard' ? 30 : 20, // Using easier difficulty values
        maxHealth: enemyType === 'guard' ? 30 : 20,
        type: enemyType,
        lastShotTime: 0,
        onGround: true,
        aiState: 'patrol',
        alertLevel: 0,
        lastPlayerSeen: 0,
        patrolDirection: Math.random() < 0.5 ? -1 : 1,
        patrolStartX: x,
      });
    }
  }
  
  return enemies;
}

export function generatePowerups(levelWidth: number, powerupDensity: number): Powerup[] {
  const powerups: Powerup[] = [];
  const groundLevel = GAME_DIMENSIONS.GROUND_HEIGHT;
  
  for (let x = 300; x < levelWidth; x += 300 + Math.random() * 400) {
    if (Math.random() < powerupDensity) {
      const powerupType = Math.random() < 0.5 ? 'health' : 'ammo';
      
      powerups.push({
        x: x + Math.random() * 50,
        y: groundLevel - 80 - Math.random() * 50,
        type: powerupType,
      });
    }
  }
  
  return powerups;
}

export function generateObjectives(levelNumber: number): Objective[] {
  const levelConfig = LEVELS[levelNumber];
  if (!levelConfig) return [];
  
  return levelConfig.objectives.map(obj => ({ ...obj }));
}

export function generatePrisoners(levelWidth: number, targetCount: number): Array<{
  x: number;
  y: number;
  type: string;
  rescued: boolean;
  size: number;
}> {
  const prisoners: Array<{
    x: number;
    y: number;
    type: string;
    rescued: boolean;
    size: number;
  }> = [];
  const groundLevel = GAME_DIMENSIONS.GROUND_HEIGHT;
  
  for (let i = 0; i < targetCount; i++) {
    const animalType = ANIMAL_TYPES[Math.floor(Math.random() * ANIMAL_TYPES.length)];
    const size = ANIMAL_SIZES[animalType];
    
    prisoners.push({
      x: 600 + (i * (levelWidth - 900) / targetCount) + Math.random() * 200,
      y: groundLevel - size,
      type: animalType,
      rescued: false,
      size,
    });
  }
  
  return prisoners;
}

export function resetLevel(gameState: GameState, levelNumber: number): void {
  const levelConfig = LEVELS[levelNumber];
  if (!levelConfig) return;
  
  // Reset level properties
  gameState.level.current = levelNumber;
  gameState.level.name = levelConfig.name;
  gameState.level.theme = levelConfig.theme;
  gameState.level.startX = 0;
  gameState.level.endX = levelConfig.length;
  gameState.level.bossSpawned = false;
  gameState.level.bossDefeated = false;
  
  // Reset player position
  gameState.player.x = 400;
  gameState.player.y = GAME_DIMENSIONS.GROUND_HEIGHT - PLAYER.HEIGHT;
  gameState.player.velocityY = 0;
  gameState.player.onGround = true;
  gameState.player.spawnImmunity = PLAYER.SPAWN_IMMUNITY_DURATION;
  gameState.player.spawnState = 'in_cell';
  gameState.player.cellBreakTimer = 0;
  
  // Reset camera
  gameState.camera.x = 0;
  gameState.camera.shake = 0;
  
  // Clear arrays
  gameState.bullets = [];
  gameState.enemyBullets = [];
  gameState.particles = [];
  
  // Generate level content
  gameState.obstacles = generateObstacles(levelConfig.length, levelConfig.obstacleDensity);
  gameState.enemies = generateEnemies(levelConfig.length, levelConfig.enemyDensity, levelConfig);
  gameState.powerups = generatePowerups(levelConfig.length, levelConfig.powerupDensity);
  gameState.objectives = generateObjectives(levelNumber);
}