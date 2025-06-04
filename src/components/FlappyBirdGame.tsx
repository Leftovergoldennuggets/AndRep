import { useEffect, useRef, useState, useCallback } from "react";
import { Play, RotateCcw } from "lucide-react";

interface GameState {
  player: {
    x: number;
    y: number;
    velocityY: number;
    health: number;
    weapon: WeaponType;
    ammo: number;
    onGround: boolean;
    animationFrame: number;
    direction: 'left' | 'right';
  };
  level: {
    current: number;
    name: string;
    theme: 'yard' | 'cellblock' | 'security' | 'escape';
    startX: number;
    endX: number;
    bossSpawned: boolean;
    bossDefeated: boolean;
  };
  bullets: Array<{
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    damage: number;
    trail: Array<{x: number, y: number}>;
  }>;
  enemies: Array<{
    x: number;
    y: number;
    velocityY: number;
    health: number;
    maxHealth: number;
    type: 'guard' | 'dog' | 'camera' | 'boss';
    bossType?: 'warden' | 'captain' | 'chief' | 'helicopter';
    attackPattern?: string;
    phase?: number;
    lastShotTime: number;
    onGround: boolean;
    aiState: 'patrol' | 'chase' | 'cover' | 'attack' | 'retreat';
    alertLevel: number;
    lastPlayerSeen: number;
    coverPosition?: { x: number; y: number };
  }>;
  enemyBullets: Array<{
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
  }>;
  obstacles: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'wall' | 'fence' | 'crate' | 'platform' | 'ground' | 'barrel' | 'door' | 'switch';
    health?: number;
    maxHealth?: number;
    isDestructible: boolean;
    isInteractive: boolean;
    isActivated?: boolean;
    explosionRadius?: number;
  }>;
  powerups: Array<{
    x: number;
    y: number;
    type: 'health' | 'ammo' | 'weapon';
    weaponType?: WeaponType;
  }>;
  particles: Array<{
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
    type: 'explosion' | 'spark' | 'smoke' | 'blood';
  }>;
  camera: {
    x: number;
    shake: number;
  };
  objectives: Array<{
    id: string;
    type: 'rescue' | 'destroy' | 'survive' | 'escape' | 'stealth';
    description: string;
    target?: { x: number; y: number };
    targetCount?: number;
    currentCount: number;
    completed: boolean;
    timeLimit?: number;
    timeRemaining?: number;
  }>;
  prisoners: Array<{
    x: number;
    y: number;
    isRescued: boolean;
  }>;
  alertLevel: number;
  score: number;
  distance: number;
  gameState: "start" | "playing" | "gameOver" | "missionComplete" | "bossIntro" | "levelComplete";
}

type WeaponType = 'pistol' | 'shotgun' | 'rifle' | 'grenade';

const GAME_CONFIG = {
  canvas: {
    width: 800,
    height: 400,
  },
  player: {
    size: 32,
    maxHealth: 100,
    gravity: 0.6,
    jumpForce: -16,
    moveSpeed: 6,
    scrollSpeed: 3, // How fast the world moves left
  },
  weapons: {
    pistol: { damage: 20, fireRate: 300, ammo: 50, spread: 0 },
    shotgun: { damage: 15, fireRate: 800, ammo: 20, spread: 0.3 },
    rifle: { damage: 35, fireRate: 150, ammo: 30, spread: 0.1 },
    grenade: { damage: 80, fireRate: 2000, ammo: 5, spread: 0 },
  },
  enemy: {
    size: 28,
    health: 60,
    fireRate: 1500,
    gravity: 0.6,
  },
  bullet: {
    speed: 12,
    size: 6,
  },
  world: {
    groundLevel: 350, // Y position of the ground
  },
};

const WEAPONS_INFO = {
  pistol: { name: "Pistol", color: "#888888" },
  shotgun: { name: "Shotgun", color: "#8B4513" },
  rifle: { name: "Rifle", color: "#2F4F4F" },
  grenade: { name: "Grenade", color: "#556B2F" },
};

const LEVELS = {
  1: {
    name: "Prison Yard",
    theme: 'yard' as const,
    width: 2000,
    boss: {
      type: 'warden' as const,
      name: "Prison Warden",
      health: 120,
      size: 60,
      attackPattern: "charge_and_shoot",
      description: "The corrupt warden blocks your escape!",
    },
  },
  2: {
    name: "Cell Block Alpha",
    theme: 'cellblock' as const,
    width: 2500,
    boss: {
      type: 'captain' as const,
      name: "Riot Captain",
      health: 180,
      size: 55,
      attackPattern: "shield_slam",
      description: "The riot captain won't let you pass!",
    },
  },
  3: {
    name: "Security Center",
    theme: 'security' as const,
    width: 3000,
    boss: {
      type: 'chief' as const,
      name: "Security Chief",
      health: 240,
      size: 50,
      attackPattern: "tech_assault",
      description: "The security chief activates all defenses!",
    },
  },
  4: {
    name: "Escape Route",
    theme: 'escape' as const,
    width: 3500,
    boss: {
      type: 'helicopter' as const,
      name: "Pursuit Helicopter",
      health: 300,
      size: 80,
      attackPattern: "aerial_barrage",
      description: "A helicopter blocks your final escape!",
    },
  },
};

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    player: {
      x: 400, // World position (not relative to camera)
      y: GAME_CONFIG.world.groundLevel - GAME_CONFIG.player.size,
      velocityY: 0,
      health: GAME_CONFIG.player.maxHealth,
      weapon: 'pistol',
      ammo: GAME_CONFIG.weapons.pistol.ammo,
      onGround: true,
      animationFrame: 0,
      direction: 'right',
    },
    level: {
      current: 1,
      name: LEVELS[1].name,
      theme: LEVELS[1].theme,
      startX: 0,
      endX: LEVELS[1].width,
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
    prisoners: [],
    alertLevel: 0,
    score: 0,
    distance: 0,
    gameState: "start",
  });
  
  const animationRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotTime = useRef<number>(0);

  const [displayScore, setDisplayScore] = useState(0);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameOver" | "missionComplete" | "bossIntro" | "levelComplete">("start");
  const [distance, setDistance] = useState(0);

  const resetGame = useCallback(() => {
    gameStateRef.current = {
      player: {
        x: 400,
        y: GAME_CONFIG.world.groundLevel - GAME_CONFIG.player.size,
        velocityY: 0,
        health: GAME_CONFIG.player.maxHealth,
        weapon: 'pistol',
        ammo: GAME_CONFIG.weapons.pistol.ammo,
        onGround: true,
        animationFrame: 0,
        direction: 'right',
      },
      level: {
        current: 1,
        name: LEVELS[1].name,
        theme: LEVELS[1].theme,
        startX: 0,
        endX: LEVELS[1].width,
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
      prisoners: [],
      alertLevel: 0,
      score: 0,
      distance: 0,
      gameState: "start",
    };
    setDisplayScore(0);
    setGameState("start");
    setDistance(0);
    keysRef.current.clear();
  }, []);

  const generateObstacles = useCallback((startX: number, endX: number) => {
    const state = gameStateRef.current;
    const obstacles: typeof state.obstacles = [];
    
    // Generate ground segments
    for (let x = startX; x < endX; x += 40) {
      obstacles.push({
        x,
        y: GAME_CONFIG.world.groundLevel,
        width: 40,
        height: GAME_CONFIG.canvas.height - GAME_CONFIG.world.groundLevel,
        type: 'ground',
        isDestructible: false,
        isInteractive: false,
      });
    }
    
    // Generate prison walls and obstacles
    for (let x = startX; x < endX; x += 150 + Math.random() * 150) {
      const obstacleType = Math.random();
      
      if (obstacleType < 0.15) {
        // Wall obstacle
        const height = 80 + Math.random() * 120;
        obstacles.push({
          x: x + Math.random() * 100,
          y: GAME_CONFIG.world.groundLevel - height,
          width: 20 + Math.random() * 40,
          height: height,
          type: 'wall',
          isDestructible: false,
          isInteractive: false,
        });
      } else if (obstacleType < 0.55) {
        // Multiple platform levels for complex jumping
        const platformCount = 1 + Math.floor(Math.random() * 3);
        for (let level = 0; level < platformCount; level++) {
          const height = 80 + level * 60 + Math.random() * 40;
          const width = 60 + Math.random() * 60;
          obstacles.push({
            x: x + Math.random() * 50 + level * 20,
            y: GAME_CONFIG.world.groundLevel - height,
            width: width,
            height: 15 + Math.random() * 10,
            type: 'platform',
            isDestructible: false,
            isInteractive: false,
          });
        }
      } else if (obstacleType < 0.7) {
        // EXPLOSIVE BARREL - destructible!
        obstacles.push({
          x: x + Math.random() * 100,
          y: GAME_CONFIG.world.groundLevel - 40,
          width: 40,
          height: 40,
          type: 'barrel',
          health: 50,
          maxHealth: 50,
          isDestructible: true,
          isInteractive: false,
          explosionRadius: 80,
        });
      } else if (obstacleType < 0.8) {
        // SECURITY DOOR - interactive!
        obstacles.push({
          x: x + Math.random() * 100,
          y: GAME_CONFIG.world.groundLevel - 80,
          width: 15,
          height: 80,
          type: 'door',
          isDestructible: true,
          isInteractive: true,
          health: 100,
          maxHealth: 100,
          isActivated: false,
        });
      } else {
        // Fence obstacle
        obstacles.push({
          x: x + Math.random() * 100,
          y: GAME_CONFIG.world.groundLevel - 60,
          width: 10,
          height: 60,
          type: 'fence',
          isDestructible: false,
          isInteractive: false,
        });
      }
    }
    
    return obstacles;
  }, []);

  const generateEnemies = useCallback((startX: number, endX: number) => {
    const enemies: GameState['enemies'] = [];
    
    for (let x = startX; x < endX; x += 300 + Math.random() * 400) {
      const enemyType = Math.random() < 0.7 ? 'guard' : Math.random() < 0.9 ? 'dog' : 'camera';
      const enemyY = enemyType === 'camera' ? 
        GAME_CONFIG.world.groundLevel - 100 - Math.random() * 200 : 
        GAME_CONFIG.world.groundLevel - GAME_CONFIG.enemy.size;
      
      enemies.push({
        x: x + Math.random() * 200,
        y: enemyY,
        velocityY: 0,
        health: GAME_CONFIG.enemy.health,
        maxHealth: GAME_CONFIG.enemy.health,
        type: enemyType,
        lastShotTime: 0,
        onGround: enemyType !== 'camera',
        aiState: 'patrol',
        alertLevel: 0,
        lastPlayerSeen: 0,
      });
    }
    
    return enemies;
  }, []);

  const generatePowerups = useCallback((startX: number, endX: number) => {
    const powerups: GameState['powerups'] = [];
    
    for (let x = startX; x < endX; x += 400 + Math.random() * 600) {
      const powerupType = Math.random() < 0.4 ? 'health' : Math.random() < 0.7 ? 'ammo' : 'weapon';
      powerups.push({
        x: x + Math.random() * 200,
        y: GAME_CONFIG.world.groundLevel - 40 - Math.random() * 200,
        type: powerupType,
        weaponType: powerupType === 'weapon' ? 
          (['shotgun', 'rifle', 'grenade'] as WeaponType[])[Math.floor(Math.random() * 3)] : 
          undefined,
      });
    }
    
    return powerups;
  }, []);

  const generateObjectives = useCallback(() => {
    const objectives = [];
    
    // Random mission type
    const missionType = Math.random();
    
    if (missionType < 0.3) {
      // RESCUE MISSION
      objectives.push({
        id: 'rescue',
        type: 'rescue' as const,
        description: 'Rescue 3 prisoners - Honor Wilbur\'s memory',
        targetCount: 3,
        currentCount: 0,
        completed: false,
      });
    } else if (missionType < 0.6) {
      // DESTRUCTION MISSION
      objectives.push({
        id: 'destroy',
        type: 'destroy' as const,
        description: 'Destroy 5 explosive barrels - Sabotage the system',
        targetCount: 5,
        currentCount: 0,
        completed: false,
      });
    } else {
      // SURVIVAL MISSION
      objectives.push({
        id: 'survive',
        type: 'survive' as const,
        description: 'Survive for 60 seconds - Stay strong like Wilbur',
        timeLimit: 60000,
        timeRemaining: 60000,
        currentCount: 0,
        completed: false,
      });
    }
    
    // Always add escape objective
    objectives.push({
      id: 'escape',
      type: 'escape' as const,
      description: 'Reach the escape point - Expose the truth!',
      target: { x: 2000, y: GAME_CONFIG.world.groundLevel - 50 },
      currentCount: 0,
      completed: false,
    });
    
    return objectives;
  }, []);

  const generatePrisoners = useCallback((startX: number, endX: number) => {
    const prisoners = [];
    
    for (let x = startX; x < endX; x += 400 + Math.random() * 600) {
      prisoners.push({
        x: x + Math.random() * 200,
        y: GAME_CONFIG.world.groundLevel - 32,
        isRescued: false,
      });
    }
    
    return prisoners;
  }, []);

  const createParticles = useCallback((x: number, y: number, type: 'explosion' | 'spark' | 'smoke' | 'blood', count: number = 5) => {
    const state = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      let color, life, size;
      switch (type) {
        case 'explosion':
          color = `hsl(${Math.random() * 60 + 15}, 100%, ${50 + Math.random() * 30}%)`;
          life = 20 + Math.random() * 20;
          size = 3 + Math.random() * 4;
          break;
        case 'spark':
          color = '#ffff88';
          life = 10 + Math.random() * 10;
          size = 1 + Math.random() * 2;
          break;
        case 'smoke':
          color = `hsl(0, 0%, ${20 + Math.random() * 40}%)`;
          life = 30 + Math.random() * 30;
          size = 4 + Math.random() * 6;
          break;
        case 'blood':
          color = `hsl(0, 80%, ${30 + Math.random() * 20}%)`;
          life = 15 + Math.random() * 15;
          size = 2 + Math.random() * 3;
          break;
      }
      
      state.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        velocityX: (Math.random() - 0.5) * 8,
        velocityY: (Math.random() - 0.5) * 8 - 2,
        life,
        maxLife: life,
        color,
        size,
        type,
      });
    }
  }, []);

  const updateParticles = useCallback(() => {
    const state = gameStateRef.current;
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const particle = state.particles[i];
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += 0.2; // gravity
      particle.life--;
      
      if (particle.life <= 0) {
        state.particles.splice(i, 1);
      }
    }
  }, []);

  const spawnBoss = useCallback(() => {
    const state = gameStateRef.current;
    const currentLevel = state.level.current;
    const levelConfig = LEVELS[currentLevel as keyof typeof LEVELS];
    
    if (!levelConfig || state.level.bossSpawned) return;
    
    // Spawn boss at the end of the level
    const boss = {
      x: state.level.endX - 200,
      y: GAME_CONFIG.world.groundLevel - levelConfig.boss.size,
      velocityY: 0,
      health: levelConfig.boss.health,
      maxHealth: levelConfig.boss.health,
      type: 'boss' as const,
      bossType: levelConfig.boss.type,
      attackPattern: levelConfig.boss.attackPattern,
      phase: 1,
      lastShotTime: 0,
      onGround: true,
      aiState: 'patrol' as const,
      alertLevel: 100, // Bosses are always fully alert
      lastPlayerSeen: Date.now(),
      coverPosition: undefined,
    };
    
    state.enemies.push(boss);
    state.level.bossSpawned = true;
    
    // Trigger boss intro
    state.gameState = "bossIntro";
    setGameState("bossIntro");
    
    // Show boss intro for 3 seconds, then return to playing
    setTimeout(() => {
      if (gameStateRef.current.gameState === "bossIntro") {
        gameStateRef.current.gameState = "playing";
        setGameState("playing");
      }
    }, 3000);
  }, []);

  const updateBoss = useCallback((boss: typeof gameStateRef.current.enemies[0], deltaTime: number) => {
    const state = gameStateRef.current;
    const player = state.player;
    const levelConfig = LEVELS[state.level.current as keyof typeof LEVELS];
    
    if (!levelConfig || boss.type !== 'boss') return;
    
    const distanceToPlayer = Math.abs(boss.x - player.x);
    const playerInRange = distanceToPlayer < 400;
    
    // Boss movement and attack patterns
    switch (boss.bossType) {
      case 'warden': // Charge and shoot
        if (playerInRange) {
          // Charge towards player (slower)
          const direction = player.x > boss.x ? 1 : -1;
          boss.x += direction * 2;
          
          // Slower fire rate when close
          if (Date.now() - boss.lastShotTime > 800) {
            state.enemyBullets.push({
              x: boss.x,
              y: boss.y + 20,
              velocityX: direction * 8,
              velocityY: -2 + Math.random() * 4,
            });
            boss.lastShotTime = Date.now();
          }
        }
        break;
        
      case 'captain': // Shield slam with periodic vulnerability
        if (playerInRange) {
          // Move towards player but slower
          const direction = player.x > boss.x ? 1 : -1;
          boss.x += direction * 1.5;
          
          // Slam attack every 3 seconds (slower)
          if (Date.now() - boss.lastShotTime > 3000) {
            // Fewer shots in slam (3 instead of 5)
            for (let i = -1; i <= 1; i++) {
              state.enemyBullets.push({
                x: boss.x,
                y: boss.y + 20,
                velocityX: direction * 6 + i * 2,
                velocityY: -3 + Math.random() * 6,
              });
            }
            boss.lastShotTime = Date.now();
          }
        }
        break;
        
      case 'chief': // Tech assault with drones
        if (playerInRange) {
          // Stay at distance and coordinate attacks
          const direction = player.x > boss.x ? 1 : -1;
          if (distanceToPlayer < 250) {
            boss.x -= direction * 1.5; // Back away slower
          }
          
          // Tech barrage every 2.5 seconds (slower)
          if (Date.now() - boss.lastShotTime > 2500) {
            // Fewer bullets (3 instead of 5)
            for (let i = 0; i < 3; i++) {
              const angle = (Math.PI / 6) * (i - 1);
              state.enemyBullets.push({
                x: boss.x,
                y: boss.y + 20,
                velocityX: Math.cos(angle) * 6 * direction,
                velocityY: Math.sin(angle) * 6,
              });
            }
            boss.lastShotTime = Date.now();
          }
        }
        break;
        
      case 'helicopter': // Aerial barrage from above
        // Float above ground
        boss.y = GAME_CONFIG.world.groundLevel - 150;
        
        if (playerInRange) {
          // Follow player horizontally (slower)
          const direction = player.x > boss.x ? 1 : -1;
          boss.x += direction * 2;
          
          // Carpet bomb every 1.8 seconds (much slower)
          if (Date.now() - boss.lastShotTime > 1800) {
            // Drop fewer bombs (2 instead of 3)
            for (let i = 0; i < 2; i++) {
              state.enemyBullets.push({
                x: boss.x + (i - 0.5) * 40,
                y: boss.y + 30,
                velocityX: (i - 0.5) * 2,
                velocityY: 5, // Fall down slower
              });
            }
            boss.lastShotTime = Date.now();
          }
        }
        break;
    }
    
    // Check if boss is defeated
    if (boss.health <= 0 && !state.level.bossDefeated) {
      state.level.bossDefeated = true;
      
      // Remove boss from enemies
      const bossIndex = state.enemies.indexOf(boss);
      if (bossIndex !== -1) {
        state.enemies.splice(bossIndex, 1);
      }
      
      // Create epic death explosion
      createParticles(boss.x, boss.y, 'explosion', 20);
      
      // Award points for boss kill
      state.score += 1000;
      
      // Trigger level completion
      state.gameState = "levelComplete";
      setGameState("levelComplete");
      
      // Auto-advance to next level after 3 seconds
      setTimeout(() => {
        if (gameStateRef.current.gameState === "levelComplete") {
          advanceToNextLevel();
        }
      }, 3000);
    }
  }, [createParticles]);

  const advanceToNextLevel = useCallback(() => {
    const state = gameStateRef.current;
    const nextLevel = state.level.current + 1;
    
    if (nextLevel > 4) {
      // Game completed!
      state.gameState = "missionComplete";
      setGameState("missionComplete");
      return;
    }
    
    // Set up next level
    const levelConfig = LEVELS[nextLevel as keyof typeof LEVELS];
    state.level = {
      current: nextLevel,
      name: levelConfig.name,
      theme: levelConfig.theme,
      startX: 0,
      endX: levelConfig.width,
      bossSpawned: false,
      bossDefeated: false,
    };
    
    // Reset player position
    state.player.x = 400;
    state.player.y = GAME_CONFIG.world.groundLevel - GAME_CONFIG.player.size;
    state.player.health = GAME_CONFIG.player.maxHealth; // Full health for new level
    
    // Clear existing entities
    state.enemies = [];
    state.bullets = [];
    state.enemyBullets = [];
    state.particles = [];
    
    // Generate new level content
    const newObstacles = generateObstacles(state.level.startX, state.level.endX);
    const newEnemies = generateEnemies(state.level.startX + 400, state.level.endX - 400);
    const newPowerups = generatePowerups(state.level.startX + 200, state.level.endX - 200);
    const newObjectives = generateObjectives();
    const newPrisoners = generatePrisoners(state.level.startX + 300, state.level.endX - 300);
    
    state.obstacles = newObstacles;
    state.enemies = newEnemies;
    state.powerups = newPowerups;
    state.objectives = newObjectives;
    state.prisoners = newPrisoners;
    
    // Start playing the new level
    state.gameState = "playing";
    setGameState("playing");
  }, [generateObstacles, generateEnemies, generatePowerups, generateObjectives, generatePrisoners]);

  const startGame = useCallback(() => {
    const state = gameStateRef.current;
    state.gameState = "playing";
    setGameState("playing");
    
    // Generate level content based on current level
    const level = state.level;
    const newObstacles = generateObstacles(level.startX, level.endX);
    const newEnemies = generateEnemies(level.startX + 400, level.endX - 400);
    const newPowerups = generatePowerups(level.startX + 200, level.endX - 200);
    const newObjectives = generateObjectives();
    const newPrisoners = generatePrisoners(level.startX + 300, level.endX - 300);
    
    state.obstacles = newObstacles;
    state.enemies = newEnemies;
    state.powerups = newPowerups;
    state.objectives = newObjectives;
    state.prisoners = newPrisoners;
    state.alertLevel = 0;
    
    // Reset level-specific flags
    state.level.bossSpawned = false;
    state.level.bossDefeated = false;
  }, [generateObstacles, generateEnemies, generatePowerups, generateObjectives, generatePrisoners]);

  const jump = useCallback(() => {
    const state = gameStateRef.current;
    if (state.gameState === "start") {
      startGame();
      return;
    }
    if (state.gameState === "playing" && state.player.onGround) {
      state.player.velocityY = GAME_CONFIG.player.jumpForce;
      state.player.onGround = false;
    }
  }, [startGame]);

  const shoot = useCallback(() => {
    const state = gameStateRef.current;
    const currentTime = Date.now();
    const weapon = GAME_CONFIG.weapons[state.player.weapon];
    
    if (currentTime - lastShotTime.current < weapon.fireRate || state.player.ammo <= 0) {
      return;
    }
    
    lastShotTime.current = currentTime;
    state.player.ammo--;
    
    // Add camera shake
    state.camera.shake = 3;
    
    // Create muzzle flash particles based on direction
    const directionMultiplier = state.player.direction === 'right' ? 1 : -1;
    const muzzleX = state.player.direction === 'right' ? 
      state.player.x + GAME_CONFIG.player.size : 
      state.player.x;
    const muzzleY = state.player.y + GAME_CONFIG.player.size / 2;
    createParticles(muzzleX, muzzleY, 'spark', 3);
    
    const bulletSpeed = GAME_CONFIG.bullet.speed * directionMultiplier;
    
    if (state.player.weapon === 'shotgun') {
      // Shotgun fires multiple pellets in the facing direction
      for (let i = 0; i < 5; i++) {
        const spread = (Math.random() - 0.5) * weapon.spread;
        state.bullets.push({
          x: muzzleX,
          y: muzzleY,
          velocityX: bulletSpeed + spread * 2 * directionMultiplier,
          velocityY: spread,
          damage: weapon.damage,
          trail: [],
        });
      }
    } else {
      const spread = (Math.random() - 0.5) * weapon.spread;
      state.bullets.push({
        x: muzzleX,
        y: muzzleY,
        velocityX: bulletSpeed,
        velocityY: spread,
        damage: weapon.damage,
        trail: [],
      });
    }
  }, [createParticles]);

  const updateEnemyAI = useCallback((enemy: any, playerX: number, playerY: number, currentTime: number) => {
    const dx = playerX - enemy.x;
    const dy = playerY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Update alert level based on distance and line of sight
    if (distance < 200) {
      enemy.alertLevel = Math.min(100, enemy.alertLevel + 2);
      enemy.lastPlayerSeen = currentTime;
    } else if (currentTime - enemy.lastPlayerSeen > 3000) {
      enemy.alertLevel = Math.max(0, enemy.alertLevel - 1);
    }
    
    // AI State machine
    switch (enemy.aiState) {
      case 'patrol':
        if (enemy.alertLevel > 30) {
          enemy.aiState = 'chase';
        }
        break;
        
      case 'chase':
        if (distance < 100) {
          enemy.aiState = 'attack';
        } else if (enemy.alertLevel < 10) {
          enemy.aiState = 'patrol';
        }
        // Move towards player
        if (enemy.type === 'guard' && enemy.onGround) {
          const moveSpeed = 1;
          enemy.x += dx > 0 ? moveSpeed : -moveSpeed;
        }
        break;
        
      case 'attack':
        if (distance > 150) {
          enemy.aiState = 'chase';
        } else if (enemy.health < enemy.maxHealth * 0.3) {
          enemy.aiState = 'retreat';
        }
        break;
        
      case 'retreat':
        // Move away from player
        if (enemy.type === 'guard' && enemy.onGround) {
          const moveSpeed = 1.5;
          enemy.x += dx > 0 ? -moveSpeed : moveSpeed;
        }
        if (distance > 200) {
          enemy.aiState = 'cover';
        }
        break;
        
      case 'cover':
        // Try to find cover (simple implementation)
        if (enemy.alertLevel < 20) {
          enemy.aiState = 'patrol';
        }
        break;
    }
    
    return distance;
  }, []);

  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  const applyGravity = useCallback((entity: any) => {
    entity.velocityY += GAME_CONFIG.player.gravity;
    entity.y += entity.velocityY;
    
    // Ground collision
    if (entity.y + (entity.size || GAME_CONFIG.player.size) >= GAME_CONFIG.world.groundLevel) {
      entity.y = GAME_CONFIG.world.groundLevel - (entity.size || GAME_CONFIG.player.size);
      entity.velocityY = 0;
      entity.onGround = true;
    } else {
      entity.onGround = false;
    }
  }, []);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const size = GAME_CONFIG.player.size;
    const state = gameStateRef.current;
    const isMoving = state.player.animationFrame > 0;
    const bobOffset = isMoving ? Math.sin(state.player.animationFrame * 0.5) * 2 : 0;
    const direction = state.player.direction;
    
    ctx.save();
    
    // Flip horizontally if moving left
    if (direction === 'left') {
      ctx.scale(-1, 1);
      x = -x - size;
    }
    
    // Draw shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(x, y + size + 2, size + 4, 6);
    
    // Draw BLACK LEATHER JACKET - main body
    const jacketGradient = ctx.createLinearGradient(x, y, x, y + size);
    jacketGradient.addColorStop(0, "#1a1a1a");
    jacketGradient.addColorStop(0.3, "#000000");
    jacketGradient.addColorStop(1, "#333333");
    ctx.fillStyle = jacketGradient;
    ctx.fillRect(x + 2, y + 8 + bobOffset, size - 4, size - 10);
    
    // Jacket details - zipper and seams
    ctx.fillStyle = "#555555";
    ctx.fillRect(x + size/2, y + 10 + bobOffset, 2, size - 12);
    ctx.fillStyle = "#666666";
    ctx.fillRect(x + 4, y + 12 + bobOffset, size - 8, 1);
    ctx.fillRect(x + 4, y + 20 + bobOffset, size - 8, 1);
    
    // Jacket collar
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + 6, y + 6 + bobOffset, size - 12, 4);
    
    // Draw rooster head/neck above jacket
    const headGradient = ctx.createLinearGradient(x, y, x, y + 12);
    headGradient.addColorStop(0, "#ff8c42");
    headGradient.addColorStop(1, "#ff6b35");
    ctx.fillStyle = headGradient;
    ctx.fillRect(x + 6, y + 2, size - 12, 8);
    
    // Draw comb (rebel rooster style)
    ctx.fillStyle = "#d32f2f";
    ctx.fillRect(x + 8, y - 2, 3, 6);
    ctx.fillRect(x + 11, y - 4, 3, 8);
    ctx.fillRect(x + 14, y - 2, 3, 6);
    
    // Draw beak
    ctx.fillStyle = "#ff9800";
    ctx.fillRect(x + size - 2, y + 6, 6, 3);
    ctx.fillStyle = "#ff8f00";
    ctx.fillRect(x + size - 2, y + 7, 4, 1);
    
    // Draw SUNGLASSES - total badass
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + 8, y + 4, 12, 6);
    // Lens reflections
    ctx.fillStyle = "#333333";
    ctx.fillRect(x + 9, y + 5, 4, 2);
    ctx.fillRect(x + 15, y + 5, 4, 2);
    // Bridge
    ctx.fillRect(x + 13, y + 6, 2, 1);
    
    // Draw CIGARETTE - smoking badass
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + size + 2, y + 8, 8, 2);
    ctx.fillStyle = "#ff6b35";
    ctx.fillRect(x + size + 8, y + 8, 2, 2);
    // Smoke particles
    ctx.fillStyle = "rgba(200, 200, 200, 0.7)";
    for (let i = 0; i < 3; i++) {
      const smokeX = x + size + 10 + i * 3 + Math.sin((state.player.animationFrame + i) * 0.3) * 2;
      const smokeY = y + 6 - i * 2;
      ctx.fillRect(smokeX, smokeY, 1, 1);
    }
    
    // Draw legs in LEATHER BOOTS
    ctx.fillStyle = "#1a1a1a";
    const legOffset = isMoving ? Math.sin(state.player.animationFrame * 0.6) * 1 : 0;
    ctx.fillRect(x + 8, y + size - 4, 3, 8 + legOffset);
    ctx.fillRect(x + 16, y + size - 4, 3, 8 - legOffset);
    
    // Boot details
    ctx.fillStyle = "#333333";
    ctx.fillRect(x + 6, y + size + 2, 8, 3);
    ctx.fillRect(x + 14, y + size + 2, 8, 3);
    
    // Draw BADASS WEAPON
    const weapon = gameStateRef.current.player.weapon;
    const weaponGradient = ctx.createLinearGradient(x + size, y + 14, x + size + 20, y + 20);
    weaponGradient.addColorStop(0, WEAPONS_INFO[weapon].color);
    weaponGradient.addColorStop(1, "#000000");
    ctx.fillStyle = weaponGradient;
    ctx.fillRect(x + size - 2, y + 14, 22, 8);
    
    // Weapon details - scope, barrel, etc.
    ctx.fillStyle = "#666666";
    ctx.fillRect(x + size + 2, y + 16, 2, 2);
    ctx.fillRect(x + size + 8, y + 15, 8, 1);
    ctx.fillRect(x + size + 8, y + 21, 8, 1);
    ctx.fillStyle = "#ff8800";
    ctx.fillRect(x + size + 16, y + 17, 2, 2);
    
    ctx.restore();
  }, []);

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: any, screenX: number) => {
    const size = GAME_CONFIG.enemy.size;
    
    if (enemy.type === 'guard') {
      // DANGEROUS HUMAN GUARD - Realistic and intimidating
      
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(screenX, enemy.y + size + 2, size, 6);
      
      // HUMAN HEAD - Realistic proportions
      ctx.fillStyle = "#d4a574"; // Skin tone
      ctx.fillRect(screenX + 6, enemy.y + 2, 16, 12); // Head
      
      // MENACING FACE FEATURES
      // Eyes - cold and calculating
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(screenX + 8, enemy.y + 5, 3, 2);
      ctx.fillRect(screenX + 13, enemy.y + 5, 3, 2);
      ctx.fillStyle = "#000000"; // Dark pupils
      ctx.fillRect(screenX + 9, enemy.y + 5, 1, 2);
      ctx.fillRect(screenX + 14, enemy.y + 5, 1, 2);
      
      // Angry eyebrows
      ctx.fillStyle = "#8b4513";
      ctx.fillRect(screenX + 7, enemy.y + 4, 4, 1);
      ctx.fillRect(screenX + 13, enemy.y + 4, 4, 1);
      
      // Nose
      ctx.fillStyle = "#c19660";
      ctx.fillRect(screenX + 11, enemy.y + 7, 2, 3);
      
      // Grim mouth
      ctx.fillStyle = "#8b0000";
      ctx.fillRect(screenX + 10, enemy.y + 10, 4, 1);
      
      // Facial hair/stubble for menacing look
      ctx.fillStyle = "#2f1b14";
      ctx.fillRect(screenX + 8, enemy.y + 11, 8, 2);
      
      // TACTICAL HELMET - Military style
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(screenX + 5, enemy.y + 1, 18, 4); // Helmet rim
      ctx.fillRect(screenX + 4, enemy.y, 20, 3); // Helmet top
      
      // Night vision goggles - HIGH-TECH THREAT
      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX + 7, enemy.y + 3, 5, 3);
      ctx.fillRect(screenX + 14, enemy.y + 3, 5, 3);
      ctx.fillStyle = "#00ff00"; // Green glow
      ctx.fillRect(screenX + 8, enemy.y + 4, 3, 1);
      ctx.fillRect(screenX + 15, enemy.y + 4, 3, 1);
      
      // HUMAN BODY - Muscular and armored
      const bodyGradient = ctx.createLinearGradient(screenX, enemy.y + 14, screenX, enemy.y + size);
      bodyGradient.addColorStop(0, "#2a3a2a"); // Dark tactical gear
      bodyGradient.addColorStop(0.5, "#1a2a1a");
      bodyGradient.addColorStop(1, "#0a1a0a");
      ctx.fillStyle = bodyGradient;
      ctx.fillRect(screenX + 4, enemy.y + 14, 20, size - 16);
      
      // BODY ARMOR DETAILS
      ctx.fillStyle = "#4a4a4a"; // Armor plates
      ctx.fillRect(screenX + 6, enemy.y + 16, 16, 3); // Chest plate
      ctx.fillRect(screenX + 6, enemy.y + 21, 16, 2); // Armor segments
      ctx.fillRect(screenX + 6, enemy.y + 25, 16, 2);
      
      // Tactical vest details
      ctx.fillStyle = "#666666";
      ctx.fillRect(screenX + 5, enemy.y + 17, 2, 8); // Side straps
      ctx.fillRect(screenX + 21, enemy.y + 17, 2, 8);
      
      // Equipment pouches
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(screenX + 3, enemy.y + 19, 3, 4);
      ctx.fillRect(screenX + 22, enemy.y + 19, 3, 4);
      
      // HUMAN ARMS - Realistic positioning
      ctx.fillStyle = "#d4a574"; // Skin for hands
      ctx.fillRect(screenX + 1, enemy.y + 18, 3, 6); // Left arm
      ctx.fillRect(screenX + 24, enemy.y + 18, 3, 6); // Right arm
      
      // ASSAULT RIFLE - More detailed and threatening
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(screenX - 10, enemy.y + 16, 16, 3); // Main barrel
      ctx.fillRect(screenX - 8, enemy.y + 19, 12, 2); // Stock
      ctx.fillStyle = "#666666";
      ctx.fillRect(screenX - 12, enemy.y + 17, 3, 1); // Muzzle
      ctx.fillRect(screenX - 5, enemy.y + 15, 2, 2); // Scope
      ctx.fillStyle = "#ff0000"; // Laser sight
      ctx.fillRect(screenX - 4, enemy.y + 16, 1, 1);
      
      // HUMAN LEGS - Realistic proportions
      ctx.fillStyle = "#2a3a2a"; // Tactical pants
      ctx.fillRect(screenX + 6, enemy.y + size - 6, 6, 8); // Left leg
      ctx.fillRect(screenX + 16, enemy.y + size - 6, 6, 8); // Right leg
      
      // COMBAT BOOTS - Military grade
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(screenX + 5, enemy.y + size - 2, 8, 4); // Left boot
      ctx.fillRect(screenX + 15, enemy.y + size - 2, 8, 4); // Right boot
      ctx.fillStyle = "#333333"; // Boot details
      ctx.fillRect(screenX + 6, enemy.y + size - 1, 6, 1);
      ctx.fillRect(screenX + 16, enemy.y + size - 1, 6, 1);
      
    } else if (enemy.type === 'dog') {
      // DANGEROUS K9 HANDLER - Human with attack dog
      
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(screenX, enemy.y + size + 2, size + 8, 6);
      
      // K9 HANDLER HEAD - Specialized unit
      ctx.fillStyle = "#d4a574"; // Skin tone
      ctx.fillRect(screenX + 8, enemy.y + 2, 12, 10);
      
      // INTIMIDATING FACE
      // Cold eyes
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(screenX + 10, enemy.y + 4, 2, 2);
      ctx.fillRect(screenX + 14, enemy.y + 4, 2, 2);
      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX + 10, enemy.y + 4, 1, 2);
      ctx.fillRect(screenX + 14, enemy.y + 4, 1, 2);
      
      // Scar across face - battle-hardened
      ctx.fillStyle = "#8b0000";
      ctx.fillRect(screenX + 9, enemy.y + 3, 1, 6);
      
      // Grim expression
      ctx.fillStyle = "#8b0000";
      ctx.fillRect(screenX + 11, enemy.y + 8, 3, 1);
      
      // K9 HANDLER HELMET - Different from regular guards
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(screenX + 7, enemy.y + 1, 14, 3);
      ctx.fillRect(screenX + 6, enemy.y, 16, 2);
      
      // Radio headset
      ctx.fillStyle = "#666666";
      ctx.fillRect(screenX + 20, enemy.y + 3, 2, 4);
      ctx.fillStyle = "#ff0000"; // Active radio
      ctx.fillRect(screenX + 21, enemy.y + 4, 1, 1);
      
      // BODY - K9 handler uniform
      const handlerGradient = ctx.createLinearGradient(screenX, enemy.y + 12, screenX, enemy.y + size);
      handlerGradient.addColorStop(0, "#1a3a1a"); // Darker green uniform
      handlerGradient.addColorStop(0.5, "#0a2a0a");
      handlerGradient.addColorStop(1, "#051a05");
      ctx.fillStyle = handlerGradient;
      ctx.fillRect(screenX + 6, enemy.y + 12, 16, size - 14);
      
      // K9 UNIT PATCHES
      ctx.fillStyle = "#ffff00";
      ctx.fillRect(screenX + 8, enemy.y + 14, 4, 3); // Left shoulder patch
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(screenX + 16, enemy.y + 14, 4, 3); // Right shoulder patch
      
      // Equipment belt
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(screenX + 7, enemy.y + 20, 14, 3);
      
      // Dog leash and control equipment
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(screenX + 4, enemy.y + 18, 2, 6);
      
      // ATTACK DOG - Aggressive German Shepherd
      // Dog body - positioned next to handler
      ctx.fillStyle = "#8b4513"; // Brown dog fur
      ctx.fillRect(screenX - 6, enemy.y + 15, 12, 8);
      
      // Dog head - snarling
      ctx.fillStyle = "#654321";
      ctx.fillRect(screenX - 8, enemy.y + 12, 8, 6);
      
      // Menacing dog eyes
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(screenX - 7, enemy.y + 13, 1, 1);
      ctx.fillRect(screenX - 4, enemy.y + 13, 1, 1);
      
      // Dog teeth showing - aggressive
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(screenX - 6, enemy.y + 16, 1, 2);
      ctx.fillRect(screenX - 4, enemy.y + 16, 1, 2);
      
      // Dog ears - alert
      ctx.fillStyle = "#654321";
      ctx.fillRect(screenX - 9, enemy.y + 11, 2, 3);
      ctx.fillRect(screenX - 2, enemy.y + 11, 2, 3);
      
      // HANDLER ARMS - controlling the dog
      ctx.fillStyle = "#d4a574";
      ctx.fillRect(screenX + 2, enemy.y + 16, 4, 6); // Left arm holding leash
      ctx.fillRect(screenX + 22, enemy.y + 16, 4, 6); // Right arm
      
      // Taser/control weapon
      ctx.fillStyle = "#ffff00";
      ctx.fillRect(screenX + 23, enemy.y + 17, 3, 2);
      ctx.fillStyle = "#0000ff"; // Electric sparks
      ctx.fillRect(screenX + 24, enemy.y + 16, 1, 1);
      
      // LEGS
      ctx.fillStyle = "#1a3a1a";
      ctx.fillRect(screenX + 8, enemy.y + size - 6, 5, 8);
      ctx.fillRect(screenX + 15, enemy.y + size - 6, 5, 8);
      
      // BOOTS
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(screenX + 7, enemy.y + size - 2, 6, 4);
      ctx.fillRect(screenX + 15, enemy.y + size - 2, 6, 4);
      
    } else if (enemy.type === 'camera') {
      // DEADLY SNIPER - Human marksman in ghillie suit
      
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(screenX, enemy.y + size + 2, size, 6);
      
      // SNIPER HEAD - Partially concealed
      ctx.fillStyle = "#d4a574"; // Skin tone
      ctx.fillRect(screenX + 8, enemy.y + 3, 12, 9);
      
      // COLD SNIPER EYES - One visible through scope
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(screenX + 9, enemy.y + 5, 2, 2);
      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX + 9, enemy.y + 5, 1, 2);
      
      // Other eye hidden behind scope
      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX + 13, enemy.y + 4, 4, 4); // Scope
      ctx.fillStyle = "#ff0000"; // Scope glint - deadly aim
      ctx.fillRect(screenX + 14, enemy.y + 5, 2, 2);
      
      // Camouflage face paint
      ctx.fillStyle = "#2d5a2d";
      ctx.fillRect(screenX + 10, enemy.y + 7, 2, 1);
      ctx.fillRect(screenX + 14, enemy.y + 9, 3, 1);
      
      // GHILLIE SUIT - Camouflaged sniper
      const ghillieGradient = ctx.createLinearGradient(screenX, enemy.y + 12, screenX, enemy.y + size);
      ghillieGradient.addColorStop(0, "#3d5a3d"); // Forest colors
      ghillieGradient.addColorStop(0.5, "#2d4a2d");
      ghillieGradient.addColorStop(1, "#1d3a1d");
      ctx.fillStyle = ghillieGradient;
      ctx.fillRect(screenX + 4, enemy.y + 12, 20, size - 14);
      
      // Ghillie suit vegetation details
      ctx.fillStyle = "#4d6a4d";
      ctx.fillRect(screenX + 3, enemy.y + 14, 2, 3);
      ctx.fillRect(screenX + 7, enemy.y + 16, 2, 2);
      ctx.fillRect(screenX + 12, enemy.y + 15, 2, 3);
      ctx.fillRect(screenX + 17, enemy.y + 17, 2, 2);
      ctx.fillRect(screenX + 21, enemy.y + 14, 2, 4);
      
      // SNIPER HELMET - Specialized gear
      ctx.fillStyle = "#2a3a2a";
      ctx.fillRect(screenX + 6, enemy.y + 1, 16, 4);
      ctx.fillRect(screenX + 5, enemy.y, 18, 2);
      
      // Communication equipment
      ctx.fillStyle = "#666666";
      ctx.fillRect(screenX + 22, enemy.y + 2, 2, 5);
      ctx.fillStyle = "#ffff00"; // Active comms
      ctx.fillRect(screenX + 23, enemy.y + 3, 1, 1);
      
      // PRONE POSITION ARMS - Realistic sniper pose
      ctx.fillStyle = "#d4a574";
      ctx.fillRect(screenX + 1, enemy.y + 14, 4, 3); // Left arm supporting
      ctx.fillRect(screenX + 23, enemy.y + 16, 4, 3); // Right arm on trigger
      
      // SNIPER RIFLE - High-powered precision weapon
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(screenX - 12, enemy.y + 12, 20, 2); // Main barrel
      ctx.fillRect(screenX - 8, enemy.y + 15, 14, 2); // Stock
      
      // Rifle details - scope and bipod
      ctx.fillStyle = "#666666";
      ctx.fillRect(screenX - 14, enemy.y + 13, 2, 1); // Muzzle brake
      ctx.fillRect(screenX - 6, enemy.y + 10, 3, 3); // Scope mount
      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX - 5, enemy.y + 11, 2, 1); // Scope lens
      
      // Bipod legs
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(screenX - 4, enemy.y + 17, 1, 4);
      ctx.fillRect(screenX - 1, enemy.y + 17, 1, 4);
      
      // LEGS - Prone sniper position
      ctx.fillStyle = "#3d5a3d";
      ctx.fillRect(screenX + 8, enemy.y + size - 4, 6, 6);
      ctx.fillRect(screenX + 16, enemy.y + size - 4, 6, 6);
      
      // Combat boots
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(screenX + 7, enemy.y + size - 1, 7, 3);
      ctx.fillRect(screenX + 16, enemy.y + size - 1, 7, 3);
      
      // Laser sight dot - indicating active targeting
      if (Math.random() > 0.7) { // Intermittent laser
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(screenX - 15, enemy.y + 13, 1, 1);
      }
      
    } else if (enemy.type === 'boss') {
      // EPIC BOSS RENDERING - Different for each boss type
      const currentLevel = gameStateRef.current.level.current;
      const levelConfig = LEVELS[currentLevel as keyof typeof LEVELS];
      const bossSize = levelConfig?.boss.size || 60;
      
      // Draw boss shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(screenX - 5, enemy.y + bossSize + 2, bossSize + 10, 8);
      
      // Boss health bar above boss
      const healthBarWidth = bossSize + 20;
      const healthPercent = enemy.health / enemy.maxHealth;
      
      // Health bar background
      ctx.fillStyle = "#333333";
      ctx.fillRect(screenX - 10, enemy.y - 20, healthBarWidth, 6);
      
      // Health bar fill
      const healthColor = healthPercent > 0.6 ? "#00ff00" : healthPercent > 0.3 ? "#ffff00" : "#ff0000";
      ctx.fillStyle = healthColor;
      ctx.fillRect(screenX - 10, enemy.y - 20, healthBarWidth * healthPercent, 6);
      
      // Boss name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(levelConfig?.boss.name || "BOSS", screenX + bossSize / 2, enemy.y - 25);
      
      switch (enemy.bossType) {
        case 'warden':
          // CORRUPT PRISON WARDEN - Massive, intimidating human authority
          
          // LARGE HUMAN HEAD - Menacing features
          ctx.fillStyle = "#d4a574"; // Skin tone
          ctx.fillRect(screenX + 8, enemy.y + 2, 24, 18);
          
          // COLD, CRUEL EYES
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(screenX + 12, enemy.y + 7, 4, 3);
          ctx.fillRect(screenX + 20, enemy.y + 7, 4, 3);
          ctx.fillStyle = "#000000"; // Dark pupils
          ctx.fillRect(screenX + 13, enemy.y + 8, 2, 2);
          ctx.fillRect(screenX + 21, enemy.y + 8, 2, 2);
          
          // Angry, threatening eyebrows
          ctx.fillStyle = "#8b4513";
          ctx.fillRect(screenX + 11, enemy.y + 6, 5, 1);
          ctx.fillRect(screenX + 20, enemy.y + 6, 5, 1);
          
          // Large, cruel nose
          ctx.fillStyle = "#c19660";
          ctx.fillRect(screenX + 16, enemy.y + 10, 4, 5);
          
          // Sinister grin showing teeth
          ctx.fillStyle = "#8b0000";
          ctx.fillRect(screenX + 14, enemy.y + 15, 8, 2);
          ctx.fillStyle = "#ffffff"; // Menacing teeth
          ctx.fillRect(screenX + 15, enemy.y + 16, 1, 1);
          ctx.fillRect(screenX + 17, enemy.y + 16, 1, 1);
          ctx.fillRect(screenX + 19, enemy.y + 16, 1, 1);
          ctx.fillRect(screenX + 21, enemy.y + 16, 1, 1);
          
          // Scars and battle damage
          ctx.fillStyle = "#8b0000";
          ctx.fillRect(screenX + 10, enemy.y + 5, 1, 8); // Face scar
          ctx.fillRect(screenX + 25, enemy.y + 12, 1, 6); // Another scar
          
          // WARDEN CAP - Authority symbol
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(screenX + 6, enemy.y, 28, 5);
          ctx.fillRect(screenX + 8, enemy.y - 2, 24, 3);
          
          // Cap badge - authority symbol
          ctx.fillStyle = "#ffd700";
          ctx.fillRect(screenX + 18, enemy.y + 1, 4, 3);
          
          // MASSIVE BODY - Imposing uniform
          const wardenGradient = ctx.createLinearGradient(screenX, enemy.y + 20, screenX, enemy.y + bossSize);
          wardenGradient.addColorStop(0, "#1a1a1a"); // Dark uniform
          wardenGradient.addColorStop(0.5, "#333333");
          wardenGradient.addColorStop(1, "#1a1a1a");
          ctx.fillStyle = wardenGradient;
          ctx.fillRect(screenX + 5, enemy.y + 20, bossSize - 10, bossSize - 25);
          
          // AUTHORITY INSIGNIA and badges
          ctx.fillStyle = "#ffd700";
          ctx.fillRect(screenX + 8, enemy.y + 25, 6, 6); // Left badge
          ctx.fillRect(screenX + 8, enemy.y + 35, 6, 6); // Left medal
          ctx.fillRect(screenX + bossSize - 14, enemy.y + 25, 6, 6); // Right badge
          
          // Name tag and rank insignia
          ctx.fillStyle = "#888888";
          ctx.fillRect(screenX + 16, enemy.y + 22, 8, 3);
          ctx.fillStyle = "#ff0000";
          ctx.fillRect(screenX + 17, enemy.y + 23, 6, 1); // WARDEN text
          
          // MUSCULAR ARMS - Intimidating physique
          ctx.fillStyle = "#d4a574";
          ctx.fillRect(screenX + 1, enemy.y + 26, 6, 12); // Left arm
          ctx.fillRect(screenX + bossSize - 7, enemy.y + 26, 6, 12); // Right arm
          
          // MASSIVE SHOTGUN - Warden's weapon of choice
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(screenX - 15, enemy.y + 28, 20, 4); // Main barrel
          ctx.fillRect(screenX - 12, enemy.y + 33, 16, 3); // Stock
          ctx.fillStyle = "#666666";
          ctx.fillRect(screenX - 17, enemy.y + 29, 3, 2); // Muzzle
          ctx.fillRect(screenX - 8, enemy.y + 26, 3, 3); // Sight
          
          // MASSIVE LEGS - Imposing stance
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(screenX + 8, enemy.y + bossSize - 12, 10, 14);
          ctx.fillRect(screenX + 22, enemy.y + bossSize - 12, 10, 14);
          
          // Heavy boots
          ctx.fillStyle = "#0a0a0a";
          ctx.fillRect(screenX + 6, enemy.y + bossSize - 4, 14, 6);
          ctx.fillRect(screenX + 20, enemy.y + bossSize - 4, 14, 6);
          break;
          
        case 'captain':
          // RIOT CAPTAIN - Armored with shield
          // Heavy armor body
          const captainGradient = ctx.createLinearGradient(screenX, enemy.y, screenX, enemy.y + bossSize);
          captainGradient.addColorStop(0, "#4a4a4a");
          captainGradient.addColorStop(0.5, "#666666");
          captainGradient.addColorStop(1, "#4a4a4a");
          ctx.fillStyle = captainGradient;
          ctx.fillRect(screenX + 3, enemy.y + 8, bossSize - 6, bossSize - 12);
          
          // Shield
          ctx.fillStyle = "#888888";
          ctx.fillRect(screenX - 5, enemy.y + 10, 8, bossSize - 20);
          
          // Shield emblem
          ctx.fillStyle = "#ff0000";
          ctx.fillRect(screenX - 3, enemy.y + 20, 4, 8);
          
          // Riot helmet
          ctx.fillStyle = "#222222";
          ctx.fillRect(screenX + 5, enemy.y + 2, bossSize - 10, 10);
          
          // Visor
          ctx.fillStyle = "#000000";
          ctx.fillRect(screenX + 7, enemy.y + 4, bossSize - 14, 4);
          break;
          
        case 'chief':
          // SECURITY CHIEF - High-tech cyber appearance
          // Tech suit body
          const chiefGradient = ctx.createLinearGradient(screenX, enemy.y, screenX, enemy.y + bossSize);
          chiefGradient.addColorStop(0, "#003366");
          chiefGradient.addColorStop(0.5, "#006699");
          chiefGradient.addColorStop(1, "#003366");
          ctx.fillStyle = chiefGradient;
          ctx.fillRect(screenX + 4, enemy.y + 6, bossSize - 8, bossSize - 10);
          
          // Tech details and circuitry
          ctx.fillStyle = "#00ffff";
          ctx.fillRect(screenX + 6, enemy.y + 10, 2, 2);
          ctx.fillRect(screenX + 10, enemy.y + 15, 2, 2);
          ctx.fillRect(screenX + 14, enemy.y + 12, 2, 2);
          ctx.fillRect(screenX + bossSize - 8, enemy.y + 18, 2, 2);
          
          // High-tech helmet
          ctx.fillStyle = "#001122";
          ctx.fillRect(screenX + 6, enemy.y + 1, bossSize - 12, 8);
          
          // Glowing visor
          ctx.fillStyle = "#00ff00";
          ctx.fillRect(screenX + 8, enemy.y + 3, bossSize - 16, 3);
          break;
          
        case 'helicopter':
          // PURSUIT HELICOPTER - Flying menace
          // Main body
          const heliGradient = ctx.createLinearGradient(screenX, enemy.y, screenX, enemy.y + bossSize);
          heliGradient.addColorStop(0, "#333333");
          heliGradient.addColorStop(0.5, "#555555");
          heliGradient.addColorStop(1, "#333333");
          ctx.fillStyle = heliGradient;
          ctx.fillRect(screenX + 5, enemy.y + 15, bossSize - 10, bossSize - 25);
          
          // Cockpit
          ctx.fillStyle = "#111111";
          ctx.fillRect(screenX + 8, enemy.y + 18, bossSize - 16, 15);
          
          // Rotor blur effect (spinning)
          ctx.fillStyle = "rgba(200, 200, 200, 0.3)";
          ctx.fillRect(screenX - 10, enemy.y + 5, bossSize + 20, 4);
          
          // Landing skids
          ctx.fillStyle = "#666666";
          ctx.fillRect(screenX + 2, enemy.y + bossSize - 8, bossSize - 4, 3);
          
          // Warning lights
          ctx.fillStyle = "#ff0000";
          ctx.fillRect(screenX + 10, enemy.y + 10, 3, 3);
          ctx.fillRect(screenX + bossSize - 13, enemy.y + 10, 3, 3);
          break;
      }
    }
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;

    if (state.gameState === "playing") {
      // Handle player horizontal movement and animation
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
        state.player.x -= GAME_CONFIG.player.moveSpeed;
        state.player.direction = 'left';
        state.player.animationFrame = (state.player.animationFrame + 1) % 8;
      } else if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
        state.player.x += GAME_CONFIG.player.moveSpeed;
        state.player.direction = 'right';
        state.player.animationFrame = (state.player.animationFrame + 1) % 8;
      } else {
        state.player.animationFrame = 0;
      }

      // Camera follows player with shake effect
      const shakeX = state.camera.shake > 0 ? (Math.random() - 0.5) * state.camera.shake : 0;
      state.camera.x = state.player.x - GAME_CONFIG.canvas.width / 2 + shakeX;
      state.camera.shake = Math.max(0, state.camera.shake - 0.5);
      
      state.distance = Math.floor(Math.abs(state.player.x - 400) / 10);
      setDistance(state.distance);

      // Apply gravity to player
      applyGravity(state.player);

      // Platform collision for player
      for (const obstacle of state.obstacles) {
        if (obstacle.type === 'platform') {
          const screenX = obstacle.x - state.camera.x;
          if (screenX > -obstacle.width && screenX < GAME_CONFIG.canvas.width) {
            if (checkCollision(
              { x: state.player.x, y: state.player.y, width: GAME_CONFIG.player.size, height: GAME_CONFIG.player.size },
              { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height }
            )) {
              if (state.player.velocityY > 0) { // Falling down
                state.player.y = obstacle.y - GAME_CONFIG.player.size;
                state.player.velocityY = 0;
                state.player.onGround = true;
              }
            }
          }
        }
      }

      // Update bullets and trails
      state.bullets.forEach((bullet) => {
        // Add current position to trail
        bullet.trail.push({ x: bullet.x, y: bullet.y });
        if (bullet.trail.length > 5) {
          bullet.trail.shift();
        }
        
        bullet.x += bullet.velocityX;
        bullet.y += bullet.velocityY;
      });

      // Update particles
      updateParticles();

      // Remove bullets that are off screen or hit obstacles
      state.bullets = state.bullets.filter(bullet => {
        const screenX = bullet.x - state.camera.x;
        if (screenX < -50 || screenX > GAME_CONFIG.canvas.width + 50 ||
            bullet.y < -10 || bullet.y > GAME_CONFIG.canvas.height + 10) {
          return false;
        }
        
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obstacle = state.obstacles[i];
          if (checkCollision(
            { x: bullet.x, y: bullet.y, width: GAME_CONFIG.bullet.size, height: GAME_CONFIG.bullet.size },
            { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height }
          )) {
            // Handle destructible objects
            if (obstacle.isDestructible && obstacle.health !== undefined) {
              obstacle.health -= 25;
              createParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 'spark', 3);
              
              if (obstacle.health <= 0) {
                // EXPLOSIVE BARREL EXPLOSION!
                if (obstacle.type === 'barrel') {
                  createParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 'explosion', 15);
                  state.camera.shake = Math.max(state.camera.shake, 8);
                  
                  // Damage nearby enemies and player
                  const explosionRadius = obstacle.explosionRadius || 80;
                  state.enemies.forEach(enemy => {
                    const dx = enemy.x - (obstacle.x + obstacle.width/2);
                    const dy = enemy.y - (obstacle.y + obstacle.height/2);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < explosionRadius) {
                      enemy.health -= 80;
                      createParticles(enemy.x, enemy.y, 'blood', 5);
                    }
                  });
                  
                  // Check objective progress
                  const destroyObjective = state.objectives.find(obj => obj.type === 'destroy');
                  if (destroyObjective && !destroyObjective.completed) {
                    destroyObjective.currentCount++;
                    if (destroyObjective.currentCount >= (destroyObjective.targetCount || 0)) {
                      destroyObjective.completed = true;
                    }
                  }
                }
                
                state.obstacles.splice(i, 1);
              }
            }
            return false;
          }
        }
        
        return true;
      });

      // Check for boss spawning when player reaches near end of level
      if (!state.level.bossSpawned && state.player.x > state.level.endX - 500) {
        spawnBoss();
      }

      // Update enemies with enhanced AI
      const currentTime = Date.now();
      state.enemies.forEach((enemy) => {
        // Apply gravity to enemies
        if (enemy.type !== 'camera') {
          applyGravity(enemy);
        }
        
        // Handle boss-specific updates
        if (enemy.type === 'boss') {
          updateBoss(enemy, 1/60); // Assume 60fps
        }
        
        const screenX = enemy.x - state.camera.x;
        
        // Enhanced AI behavior (skip for bosses as they have their own logic)
        let distance = 0;
        if (enemy.type !== 'boss') {
          distance = updateEnemyAI(enemy, state.player.x, state.player.y, currentTime);
        } else {
          distance = Math.sqrt((enemy.x - state.player.x) ** 2 + (enemy.y - state.player.y) ** 2);
        }
        
        // Enhanced enemy shooting based on AI state
        const canShoot = enemy.aiState === 'attack' || enemy.aiState === 'chase';
        if (enemy.type === 'guard' && canShoot && distance < 250 && screenX > -100 && screenX < GAME_CONFIG.canvas.width + 100) {
          const fireRate = enemy.aiState === 'attack' ? GAME_CONFIG.enemy.fireRate * 0.7 : GAME_CONFIG.enemy.fireRate;
          if (currentTime - enemy.lastShotTime > fireRate) {
            enemy.lastShotTime = currentTime;
            const bulletSpeed = GAME_CONFIG.bullet.speed * 0.7;
            const dx = state.player.x - enemy.x;
            const dy = state.player.y - enemy.y;
            
            // Add some inaccuracy based on distance and AI state
            const accuracy = enemy.aiState === 'attack' ? 0.95 : 0.8;
            const spread = (1 - accuracy) * (Math.random() - 0.5) * 0.5;
            
            state.enemyBullets.push({
              x: enemy.x,
              y: enemy.y + GAME_CONFIG.enemy.size / 2,
              velocityX: (dx / distance) * bulletSpeed + spread,
              velocityY: (dy / distance) * bulletSpeed + spread,
            });
          }
        }
        
        // Increase global alert level when enemies are alert
        if (enemy.alertLevel > 50) {
          state.alertLevel = Math.min(100, state.alertLevel + 0.5);
        }
      });

      // Update enemy bullets
      state.enemyBullets.forEach((bullet) => {
        bullet.x += bullet.velocityX;
        bullet.y += bullet.velocityY;
      });

      // Remove enemy bullets that are off screen
      state.enemyBullets = state.enemyBullets.filter(bullet => {
        const screenX = bullet.x - state.camera.x;
        return screenX > -50 && screenX < GAME_CONFIG.canvas.width + 50 &&
               bullet.y > -10 && bullet.y < GAME_CONFIG.canvas.height + 10;
      });

      // Check bullet-enemy collisions
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const bullet = state.bullets[i];
        for (let j = state.enemies.length - 1; j >= 0; j--) {
          const enemy = state.enemies[j];
          if (checkCollision(
            { x: bullet.x, y: bullet.y, width: GAME_CONFIG.bullet.size, height: GAME_CONFIG.bullet.size },
            { x: enemy.x, y: enemy.y, width: GAME_CONFIG.enemy.size, height: GAME_CONFIG.enemy.size }
          )) {
            enemy.health -= bullet.damage;
            state.bullets.splice(i, 1);
            
            // Create impact particles
            createParticles(enemy.x + GAME_CONFIG.enemy.size / 2, enemy.y + GAME_CONFIG.enemy.size / 2, 'blood', 3);
            
            if (enemy.health <= 0) {
              // Create explosion particles for enemy death
              createParticles(enemy.x + GAME_CONFIG.enemy.size / 2, enemy.y + GAME_CONFIG.enemy.size / 2, 'explosion', 8);
              state.camera.shake = Math.max(state.camera.shake, 5);
              state.enemies.splice(j, 1);
              state.score += 100;
              setDisplayScore(state.score);
            }
            break;
          }
        }
      }

      // Check enemy bullet-player collisions
      for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = state.enemyBullets[i];
        
        const playerRect = { x: state.player.x, y: state.player.y, width: GAME_CONFIG.player.size, height: GAME_CONFIG.player.size };
        const bulletRect = { x: bullet.x, y: bullet.y, width: GAME_CONFIG.bullet.size, height: GAME_CONFIG.bullet.size };
        
        if (checkCollision(playerRect, bulletRect)) {
          state.player.health -= 10;
          state.enemyBullets.splice(i, 1);
          
          if (state.player.health <= 0) {
            state.gameState = "gameOver";
            setGameState("gameOver");
          }
        }
      }

      // Check powerup collisions
      for (let i = state.powerups.length - 1; i >= 0; i--) {
        const powerup = state.powerups[i];
        if (checkCollision(
          { x: state.player.x, y: state.player.y, width: GAME_CONFIG.player.size, height: GAME_CONFIG.player.size },
          { x: powerup.x, y: powerup.y, width: 24, height: 24 }
        )) {
          if (powerup.type === 'health') {
            state.player.health = Math.min(GAME_CONFIG.player.maxHealth, state.player.health + 30);
          } else if (powerup.type === 'ammo') {
            state.player.ammo += 20;
          } else if (powerup.type === 'weapon' && powerup.weaponType) {
            state.player.weapon = powerup.weaponType;
            state.player.ammo = GAME_CONFIG.weapons[powerup.weaponType].ammo;
          }
          state.powerups.splice(i, 1);
        }
      }

      // Check prisoner rescue
      for (let i = state.prisoners.length - 1; i >= 0; i--) {
        const prisoner = state.prisoners[i];
        if (!prisoner.isRescued && checkCollision(
          { x: state.player.x, y: state.player.y, width: GAME_CONFIG.player.size, height: GAME_CONFIG.player.size },
          { x: prisoner.x, y: prisoner.y, width: 32, height: 32 }
        )) {
          prisoner.isRescued = true;
          createParticles(prisoner.x + 16, prisoner.y + 16, 'spark', 8);
          state.score += 500;
          setDisplayScore(state.score);
          
          // Check rescue objective
          const rescueObjective = state.objectives.find(obj => obj.type === 'rescue');
          if (rescueObjective && !rescueObjective.completed) {
            rescueObjective.currentCount++;
            if (rescueObjective.currentCount >= (rescueObjective.targetCount || 0)) {
              rescueObjective.completed = true;
            }
          }
        }
      }

      // Update objectives
      state.objectives.forEach(objective => {
        if (objective.type === 'survive' && objective.timeRemaining !== undefined) {
          objective.timeRemaining -= 16; // Assuming 60fps
          if (objective.timeRemaining <= 0) {
            objective.completed = true;
          }
        }
        
        if (objective.type === 'escape' && objective.target) {
          const dx = state.player.x - objective.target.x;
          const dy = state.player.y - objective.target.y;
          if (Math.sqrt(dx * dx + dy * dy) < 50) {
            objective.completed = true;
          }
        }
      });
      
      // Check if mission is complete
      const allCompleted = state.objectives.every(obj => obj.completed);
      if (allCompleted && state.gameState === "playing") {
        state.gameState = "missionComplete";
        setGameState("missionComplete");
      }

      // No need to generate or remove content - static world
    }

    // Clear canvas
    ctx.clearRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);

    // Draw dark, gritty prison sky background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.world.groundLevel);
    gradient.addColorStop(0, "#2C1810"); // Dark brown-red
    gradient.addColorStop(0.3, "#1A1A1A"); // Very dark gray
    gradient.addColorStop(0.7, "#333333"); // Dark gray
    gradient.addColorStop(1, "#4A4A4A"); // Medium gray
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.world.groundLevel);

    // Draw high-security prison background elements with depth
    const parallaxOffset = state.camera.x * 0.2;
    const slowParallax = state.camera.x * 0.1;
    
    // Far background - concrete prison walls with watchtowers
    ctx.fillStyle = "rgba(60, 60, 60, 0.4)";
    for (let x = -(slowParallax % 200); x < GAME_CONFIG.canvas.width; x += 200) {
      // Main wall
      ctx.fillRect(x, 60, 15, GAME_CONFIG.world.groundLevel - 60);
      
      // Watchtower every few walls
      if ((x + slowParallax) % 600 < 200) {
        ctx.fillStyle = "rgba(40, 40, 40, 0.6)";
        ctx.fillRect(x + 5, 20, 25, 80);
        ctx.fillRect(x + 10, 10, 15, 20);
        ctx.fillStyle = "rgba(60, 60, 60, 0.4)";
      }
    }
    
    // Mid background - concrete wall panels with industrial details
    ctx.fillStyle = "rgba(80, 80, 80, 0.5)";
    for (let x = -(parallaxOffset % 150); x < GAME_CONFIG.canvas.width; x += 150) {
      ctx.fillRect(x, 0, 12, GAME_CONFIG.world.groundLevel);
      
      // Add concrete panel lines
      ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
      ctx.fillRect(x + 2, 40, 8, 2);
      ctx.fillRect(x + 2, 120, 8, 2);
      ctx.fillRect(x + 2, 200, 8, 2);
      ctx.fillStyle = "rgba(80, 80, 80, 0.5)";
    }
    
    // Foreground - razor wire fence and security elements
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 3;
    for (let x = -(state.camera.x % 25); x < GAME_CONFIG.canvas.width; x += 25) {
      // Main fence posts
      ctx.beginPath();
      ctx.moveTo(x, GAME_CONFIG.world.groundLevel - 80);
      ctx.lineTo(x, GAME_CONFIG.world.groundLevel);
      ctx.stroke();
      
      // Razor wire coils
      if (x % 50 === 0) {
        ctx.strokeStyle = "#C0C0C0";
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(x, GAME_CONFIG.world.groundLevel - 90 + i * 5, 8, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 3;
      }
      
      // Security cameras on poles
      if (x % 100 === 50) {
        ctx.fillStyle = "#333333";
        ctx.fillRect(x - 3, GAME_CONFIG.world.groundLevel - 100, 6, 15);
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(x - 1, GAME_CONFIG.world.groundLevel - 98, 2, 2);
      }
    }

    // Add dramatic lighting effects for badass atmosphere
    if (state.gameState !== "start") {
      // Searchlight sweeps across the prison yard
      const searchlightTime = Date.now() * 0.001;
      const searchlightX = Math.sin(searchlightTime * 0.3) * 300 + 400;
      const searchlightScreenX = searchlightX - state.camera.x;
      
      if (searchlightScreenX > -200 && searchlightScreenX < GAME_CONFIG.canvas.width + 200) {
        // Create spotlight effect
        const spotlightGradient = ctx.createRadialGradient(
          searchlightScreenX, 50, 0,
          searchlightScreenX, 50, 150
        );
        spotlightGradient.addColorStop(0, "rgba(255, 255, 200, 0.3)");
        spotlightGradient.addColorStop(0.5, "rgba(255, 255, 200, 0.1)");
        spotlightGradient.addColorStop(1, "rgba(255, 255, 200, 0)");
        
        ctx.fillStyle = spotlightGradient;
        ctx.fillRect(searchlightScreenX - 150, 50, 300, GAME_CONFIG.world.groundLevel - 50);
      }
      
      // Emergency strobe lights from alarms
      if (state.alertLevel > 50) {
        const strobeTime = Math.floor(Date.now() / 200) % 2;
        if (strobeTime === 0) {
          ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
          ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);
        }
      }
      
      // Atmospheric dust particles in the air
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      for (let i = 0; i < 30; i++) {
        const dustX = ((Date.now() * 0.02 + i * 50) % (GAME_CONFIG.canvas.width + 100)) - 50;
        const dustY = ((Date.now() * 0.015 + i * 30) % GAME_CONFIG.world.groundLevel);
        ctx.fillRect(dustX, dustY, 1, 1);
      }
    }

    if (state.gameState !== "start") {
      // Draw obstacles
      state.obstacles.forEach((obstacle) => {
        const screenX = obstacle.x - state.camera.x;
        if (screenX > -obstacle.width && screenX < GAME_CONFIG.canvas.width) {
          if (obstacle.type === 'barrel') {
            // EXPLOSIVE BARREL - orange with warning stripes
            const barrelGradient = ctx.createLinearGradient(screenX, obstacle.y, screenX + obstacle.width, obstacle.y + obstacle.height);
            barrelGradient.addColorStop(0, "#ff8800");
            barrelGradient.addColorStop(1, "#cc4400");
            ctx.fillStyle = barrelGradient;
            ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
            
            // Warning stripes
            ctx.fillStyle = "#ffff00";
            for (let i = 0; i < 3; i++) {
              ctx.fillRect(screenX + 5, obstacle.y + 5 + i * 12, obstacle.width - 10, 3);
            }
            
            // Hazard symbol
            ctx.fillStyle = "#000000";
            ctx.fillRect(screenX + obstacle.width/2 - 4, obstacle.y + obstacle.height/2 - 4, 8, 8);
          } else if (obstacle.type === 'door') {
            // SECURITY DOOR - metallic with health bar
            const doorGradient = ctx.createLinearGradient(screenX, obstacle.y, screenX + obstacle.width, obstacle.y);
            doorGradient.addColorStop(0, "#555555");
            doorGradient.addColorStop(0.5, "#333333");
            doorGradient.addColorStop(1, "#555555");
            ctx.fillStyle = doorGradient;
            ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
            
            // Door details
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(screenX + 2, obstacle.y + 10, obstacle.width - 4, 3);
            ctx.fillRect(screenX + 2, obstacle.y + obstacle.height - 13, obstacle.width - 4, 3);
            
            // Health bar
            if (obstacle.health !== undefined && obstacle.maxHealth !== undefined) {
              const healthPercent = obstacle.health / obstacle.maxHealth;
              ctx.fillStyle = "#ff4444";
              ctx.fillRect(screenX, obstacle.y - 8, obstacle.width, 4);
              ctx.fillStyle = "#44ff44";
              ctx.fillRect(screenX, obstacle.y - 8, obstacle.width * healthPercent, 4);
            }
          } else {
            // Standard obstacles
            if (obstacle.type === 'ground') {
              // Industrial concrete ground with grime
              const groundGradient = ctx.createLinearGradient(screenX, obstacle.y, screenX, obstacle.y + obstacle.height);
              groundGradient.addColorStop(0, "#4A4A4A");
              groundGradient.addColorStop(0.2, "#666666");
              groundGradient.addColorStop(1, "#2A2A2A");
              ctx.fillStyle = groundGradient;
            } else if (obstacle.type === 'wall') {
              // Prison concrete walls with weathering
              const wallGradient = ctx.createLinearGradient(screenX, obstacle.y, screenX + obstacle.width, obstacle.y);
              wallGradient.addColorStop(0, "#555555");
              wallGradient.addColorStop(0.5, "#404040");
              wallGradient.addColorStop(1, "#505050");
              ctx.fillStyle = wallGradient;
            } else if (obstacle.type === 'platform') {
              // Industrial metal grating platforms
              const platformGradient = ctx.createLinearGradient(screenX, obstacle.y, screenX, obstacle.y + obstacle.height);
              platformGradient.addColorStop(0, "#888888");
              platformGradient.addColorStop(0.3, "#666666");
              platformGradient.addColorStop(1, "#555555");
              ctx.fillStyle = platformGradient;
            } else if (obstacle.type === 'crate') {
              ctx.fillStyle = "#D2691E";
            } else {
              ctx.fillStyle = "#708090";
            }
            ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
            
            // Add enhanced details based on obstacle type
            if (obstacle.type === 'platform') {
              // Metal grating lines for industrial look
              ctx.strokeStyle = "#999999";
              ctx.lineWidth = 1;
              for (let i = 1; i < obstacle.width / 8; i++) {
                ctx.beginPath();
                ctx.moveTo(screenX + i * 8, obstacle.y);
                ctx.lineTo(screenX + i * 8, obstacle.y + obstacle.height);
                ctx.stroke();
              }
              // Support rivets
              ctx.fillStyle = "#AAAAAA";
              for (let i = 0; i < obstacle.width / 20; i++) {
                ctx.fillRect(screenX + 5 + i * 20, obstacle.y + 2, 3, 3);
                ctx.fillRect(screenX + 5 + i * 20, obstacle.y + obstacle.height - 5, 3, 3);
              }
            } else if (obstacle.type === 'wall') {
              // Concrete panel lines
              ctx.strokeStyle = "#333333";
              ctx.lineWidth = 2;
              for (let i = 1; i < obstacle.height / 30; i++) {
                ctx.beginPath();
                ctx.moveTo(screenX, obstacle.y + i * 30);
                ctx.lineTo(screenX + obstacle.width, obstacle.y + i * 30);
                ctx.stroke();
              }
            } else if (obstacle.type === 'ground') {
              // Concrete texture with cracks
              ctx.strokeStyle = "#333333";
              ctx.lineWidth = 1;
              for (let i = 0; i < obstacle.width / 25; i++) {
                const crackX = screenX + i * 25 + Math.random() * 10;
                ctx.beginPath();
                ctx.moveTo(crackX, obstacle.y);
                ctx.lineTo(crackX + Math.random() * 8 - 4, obstacle.y + 8);
                ctx.stroke();
              }
            }
            
            // Add border
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX, obstacle.y, obstacle.width, obstacle.height);
          }
        }
      });

      // Draw powerups
      state.powerups.forEach((powerup) => {
        const screenX = powerup.x - state.camera.x;
        if (screenX > -24 && screenX < GAME_CONFIG.canvas.width) {
          if (powerup.type === 'health') {
            ctx.fillStyle = "#ff0000";
          } else if (powerup.type === 'ammo') {
            ctx.fillStyle = "#ffff00";
          } else {
            ctx.fillStyle = "#00ff00";
          }
          ctx.fillRect(screenX, powerup.y, 24, 24);
          
          // Add icon
          ctx.fillStyle = "#ffffff";
          ctx.font = "16px Arial";
          ctx.textAlign = "center";
          const text = powerup.type === 'health' ? '+' : powerup.type === 'ammo' ? 'A' : 'W';
          ctx.fillText(text, screenX + 12, powerup.y + 16);
        }
      });

      // Draw prisoners
      state.prisoners.forEach((prisoner) => {
        const screenX = prisoner.x - state.camera.x;
        if (!prisoner.isRescued && screenX > -32 && screenX < GAME_CONFIG.canvas.width) {
          // Draw prisoner - orange jumpsuit
          const prisonerGradient = ctx.createLinearGradient(screenX, prisoner.y, screenX, prisoner.y + 32);
          prisonerGradient.addColorStop(0, "#ff8800");
          prisonerGradient.addColorStop(1, "#cc6600");
          ctx.fillStyle = prisonerGradient;
          ctx.fillRect(screenX + 4, prisoner.y + 8, 24, 20);
          
          // Head
          ctx.fillStyle = "#ffdbac";
          ctx.fillRect(screenX + 8, prisoner.y + 2, 16, 12);
          
          // Shackles
          ctx.fillStyle = "#666666";
          ctx.fillRect(screenX + 6, prisoner.y + 24, 4, 4);
          ctx.fillRect(screenX + 22, prisoner.y + 24, 4, 4);
          
          // Rescue indicator
          ctx.fillStyle = "rgba(0, 255, 0, 0.7)";
          ctx.fillRect(screenX, prisoner.y - 8, 32, 4);
          ctx.fillStyle = "#ffffff";
          ctx.font = "10px Arial";
          ctx.textAlign = "center";
          ctx.fillText("RESCUE", screenX + 16, prisoner.y - 10);
        }
      });

      // Draw player
      const playerScreenX = state.player.x - state.camera.x;
      drawPlayer(ctx, playerScreenX, state.player.y);

      // Draw enemies
      state.enemies.forEach((enemy) => {
        const screenX = enemy.x - state.camera.x;
        if (screenX > -GAME_CONFIG.enemy.size && screenX < GAME_CONFIG.canvas.width) {
          drawEnemy(ctx, enemy, screenX);
        }
      });

      // Draw bullets with dramatic trails and effects
      state.bullets.forEach((bullet) => {
        const screenX = bullet.x - state.camera.x;
        if (screenX > -GAME_CONFIG.bullet.size && screenX < GAME_CONFIG.canvas.width) {
          // Draw enhanced trail with gradient
          if (bullet.trail.length > 0) {
            for (let i = 0; i < bullet.trail.length - 1; i++) {
              const alpha = (i / bullet.trail.length) * 0.8;
              const trailScreenX1 = bullet.trail[i].x - state.camera.x;
              const trailScreenX2 = bullet.trail[i + 1].x - state.camera.x;
              
              ctx.strokeStyle = `rgba(255, 255, 200, ${alpha})`;
              ctx.lineWidth = 3 - (i / bullet.trail.length) * 2;
              ctx.beginPath();
              ctx.moveTo(trailScreenX1, bullet.trail[i].y);
              ctx.lineTo(trailScreenX2, bullet.trail[i + 1].y);
              ctx.stroke();
            }
          }
          
          // Draw bullet with intense glow and spark effect
          const bulletGradient = ctx.createRadialGradient(
            screenX + GAME_CONFIG.bullet.size/2, bullet.y + GAME_CONFIG.bullet.size/2, 0,
            screenX + GAME_CONFIG.bullet.size/2, bullet.y + GAME_CONFIG.bullet.size/2, GAME_CONFIG.bullet.size * 2
          );
          bulletGradient.addColorStop(0, "#FFFFFF");
          bulletGradient.addColorStop(0.3, "#FFFF88");
          bulletGradient.addColorStop(0.7, "#FF8800");
          bulletGradient.addColorStop(1, "rgba(255, 136, 0, 0)");
          ctx.fillStyle = bulletGradient;
          ctx.fillRect(screenX - GAME_CONFIG.bullet.size, bullet.y - GAME_CONFIG.bullet.size, 
                      GAME_CONFIG.bullet.size * 3, GAME_CONFIG.bullet.size * 3);
          
          // Bright bullet core
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(screenX, bullet.y, GAME_CONFIG.bullet.size, GAME_CONFIG.bullet.size);
        }
      });

      // Draw enemy bullets with menacing red glow
      state.enemyBullets.forEach((bullet) => {
        const screenX = bullet.x - state.camera.x;
        if (screenX > -GAME_CONFIG.bullet.size && screenX < GAME_CONFIG.canvas.width) {
          // Enemy bullet glow
          const enemyBulletGradient = ctx.createRadialGradient(
            screenX + GAME_CONFIG.bullet.size/2, bullet.y + GAME_CONFIG.bullet.size/2, 0,
            screenX + GAME_CONFIG.bullet.size/2, bullet.y + GAME_CONFIG.bullet.size/2, GAME_CONFIG.bullet.size * 1.5
          );
          enemyBulletGradient.addColorStop(0, "#FF0000");
          enemyBulletGradient.addColorStop(0.5, "#FF4444");
          enemyBulletGradient.addColorStop(1, "rgba(255, 68, 68, 0)");
          ctx.fillStyle = enemyBulletGradient;
          ctx.fillRect(screenX - GAME_CONFIG.bullet.size/2, bullet.y - GAME_CONFIG.bullet.size/2, 
                      GAME_CONFIG.bullet.size * 2, GAME_CONFIG.bullet.size * 2);
          
          // Bright enemy bullet core
          ctx.fillStyle = "#FF6666";
          ctx.fillRect(screenX, bullet.y, GAME_CONFIG.bullet.size, GAME_CONFIG.bullet.size);
        }
      });

      // Draw particles
      state.particles.forEach((particle) => {
        const screenX = particle.x - state.camera.x;
        if (screenX > -10 && screenX < GAME_CONFIG.canvas.width + 10) {
          const alpha = particle.life / particle.maxLife;
          ctx.globalAlpha = alpha;
          
          if (particle.type === 'explosion') {
            const radius = particle.size * (1 - alpha * 0.5);
            const gradient = ctx.createRadialGradient(screenX, particle.y, 0, screenX, particle.y, radius);
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(screenX, particle.y, radius, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = particle.color;
            ctx.fillRect(screenX - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
          }
          
          ctx.globalAlpha = 1;
        }
      });

      // Draw HUD with improved styling
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "left";
      
      // Draw HUD background (bigger for objectives and level info)
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(5, 5, 350, 180);
      
      // Level Information with glow effect
      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 2;
      ctx.fillStyle = "#00ffff";
      ctx.fillText(`Level ${state.level.current}: ${state.level.name}`, 15, 30);
      
      // Score with glow effect
      ctx.shadowColor = "#ffff88";
      ctx.shadowBlur = 2;
      ctx.fillStyle = "#ffff88";
      ctx.fillText(`Score: ${state.score}`, 15, 55);
      
      // Distance
      ctx.shadowColor = "#88ff88";
      ctx.fillStyle = "#88ff88";
      ctx.fillText(`Distance: ${state.distance}m`, 15, 80);
      
      // Health bar
      ctx.shadowColor = "none";
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(15, 90, 100, 10);
      ctx.fillStyle = "#44ff44";
      const healthPercent = state.player.health / GAME_CONFIG.player.maxHealth;
      ctx.fillRect(15, 90, 100 * healthPercent, 10);
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.fillText(`Health: ${state.player.health}`, 15, 110);
      
      // Weapon info with color coding
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = WEAPONS_INFO[state.player.weapon].color;
      ctx.shadowColor = WEAPONS_INFO[state.player.weapon].color;
      ctx.shadowBlur = 1;
      ctx.fillText(`${WEAPONS_INFO[state.player.weapon].name}: ${state.player.ammo}`, 15, 130);
      
      // Alert Level
      ctx.font = "12px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`Alert Level:`, 15, 150);
      
      // Alert level bar
      ctx.fillStyle = "#333333";
      ctx.fillRect(100, 140, 100, 8);
      const alertPercent = state.alertLevel / 100;
      const alertColor = alertPercent > 0.7 ? "#ff4444" : alertPercent > 0.4 ? "#ffaa44" : "#44ff44";
      ctx.fillStyle = alertColor;
      ctx.fillRect(100, 140, 100 * alertPercent, 8);
      
      // Objectives
      ctx.font = "bold 14px Arial";
      ctx.fillStyle = "#ffff88";
      ctx.fillText("OBJECTIVES:", 15, 170);
      
      ctx.font = "11px Arial";
      let objY = 180;
      state.objectives.forEach((objective, index) => {
        const color = objective.completed ? "#44ff44" : "#ffffff";
        ctx.fillStyle = color;
        const status = objective.completed ? "✓" : "○";
        let text = `${status} ${objective.description}`;
        
        if (objective.targetCount) {
          text += ` (${objective.currentCount}/${objective.targetCount})`;
        }
        if (objective.timeRemaining !== undefined) {
          const seconds = Math.ceil(objective.timeRemaining / 1000);
          text += ` (${seconds}s)`;
        }
        
        ctx.fillText(text, 25, objY);
        objY += 12;
      });
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [drawPlayer, drawEnemy, checkCollision, applyGravity, generateObstacles, generateEnemies, generatePowerups, createParticles, updateParticles, updateEnemyAI, spawnBoss, updateBoss]);

  useEffect(() => {
    gameLoop();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        jump();
      }
      if (e.code === "KeyX" || e.code === "KeyZ") {
        e.preventDefault();
        shoot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const handleClick = () => {
      if (gameStateRef.current.gameState === "start") {
        startGame();
      } else {
        shoot();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    const canvas = canvasRef.current;
    canvas?.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      canvas?.removeEventListener("click", handleClick);
    };
  }, [jump, shoot, startGame]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.canvas.width}
        height={GAME_CONFIG.canvas.height}
        className="border-4 border-white rounded-lg shadow-2xl cursor-crosshair"
      />
      
      {gameState === "start" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 rounded-lg">
          <div className="text-center text-white max-w-2xl mx-4">
            <h1 className="text-4xl font-bold mb-6 text-red-500">Prison Break Rooster</h1>
            
            {/* Epic Backstory */}
            <div className="bg-gray-900 bg-opacity-80 p-6 rounded-lg mb-6 text-left border border-red-500">
              <h2 className="text-xl font-bold mb-3 text-yellow-400 text-center">🔥 THE REBELLION BEGINS 🔥</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <span className="text-red-400 font-bold">Meet "Red"</span> - once the prize rooster of Blackwater Maximum Security Prison's farm program. 
                  For years, he watched as his fellow animals were exploited, beaten, and worse by the corrupt guards.
                </p>
                <p>
                  <span className="text-yellow-400 font-bold">The breaking point:</span> When Warden Morrison ordered the execution of Red's best friend - 
                  an old pig named Wilbur who dared to protect the younger animals - something snapped inside the rooster's heart.
                </p>
                <p>
                  <span className="text-orange-400 font-bold">That night</span>, Red broke into the guard's armory, armed himself with weapons, 
                  and single-handedly took down three guards who were abusing animals in the barn. The leather jacket? 
                  Taken from a guard who won't be needing it anymore.
                </p>
                <p className="text-red-300 font-bold text-center">
                  Now they've locked him in maximum security. But Red has one goal: 
                  <span className="text-white"> ESCAPE AND EXPOSE THE TRUTH!</span>
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm text-gray-300">Space/W/↑: Jump</p>
              <p className="mb-2 text-sm text-gray-300">A/D/←/→: Move Left/Right</p>
              <p className="mb-2 text-sm text-gray-300">X/Z/Click: Shoot</p>
              <p className="mb-4 text-sm text-yellow-400">Fight for justice. Fight for freedom. Fight for Wilbur.</p>
            </div>
            
            <button
              onClick={startGame}
              className="btn btn-primary btn-lg not-prose"
            >
              <Play className="w-6 h-6 mr-2" />
              BEGIN THE ESCAPE
            </button>
          </div>
        </div>
      )}

      {gameState === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-85 rounded-lg">
          <div className="text-center text-white max-w-lg mx-4">
            <h2 className="text-3xl font-bold mb-4 text-red-500">🚨 CAPTURED! 🚨</h2>
            <div className="bg-gray-900 bg-opacity-80 p-4 rounded-lg mb-4 border border-red-500">
              <p className="text-yellow-400 mb-2 italic">"They got me this time, but Wilbur's spirit lives on..."</p>
              <p className="text-gray-300 text-sm">Red's escape attempt has been thwarted, but the rebellion continues.</p>
            </div>
            <p className="text-xl mb-2">Final Score: {displayScore}</p>
            <p className="text-lg mb-2">Distance Escaped: {distance}m</p>
            <p className="text-sm text-gray-400 mb-6">Every yard counts in the fight for justice!</p>
            <button
              onClick={resetGame}
              className="btn btn-secondary btn-lg not-prose"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Try Escape Again
            </button>
          </div>
        </div>
      )}

      {gameState === "bossIntro" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-85 rounded-lg">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4 text-red-500 animate-pulse">⚠️ BOSS ENCOUNTER ⚠️</h2>
            <h3 className="text-2xl font-bold mb-2 text-yellow-400">
              {gameStateRef.current.level && LEVELS[gameStateRef.current.level.current as keyof typeof LEVELS]?.boss.name}
            </h3>
            <p className="text-lg mb-6 text-gray-300">
              {gameStateRef.current.level && LEVELS[gameStateRef.current.level.current as keyof typeof LEVELS]?.boss.description}
            </p>
            <div className="text-6xl mb-4">💀</div>
            <p className="text-sm opacity-75">Prepare for battle...</p>
          </div>
        </div>
      )}

      {gameState === "levelComplete" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4 text-green-500">LEVEL COMPLETE!</h2>
            <h3 className="text-xl mb-2 text-yellow-400">
              {gameStateRef.current.level?.name} - Cleared!
            </h3>
            <p className="text-lg mb-2">Boss Defeated! +1000 Points</p>
            <p className="text-lg mb-6">Advancing to next level...</p>
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-sm opacity-75">Get ready for the next challenge!</p>
          </div>
        </div>
      )}

      {gameState === "missionComplete" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4 text-green-500">🎉 PRISON BREAK COMPLETE! 🎉</h2>
            <p className="text-2xl mb-4 text-yellow-400">⭐ ALL 4 LEVELS CLEARED ⭐</p>
            <p className="text-lg mb-2">Final Score: {displayScore}</p>
            <p className="text-lg mb-4">Distance Escaped: {distance}m</p>
            <div className="mb-6">
              <p className="text-green-400 mb-2">✓ Prison Yard - Warden Defeated</p>
              <p className="text-green-400 mb-2">✓ Cell Block Alpha - Riot Captain Defeated</p>
              <p className="text-green-400 mb-2">✓ Security Center - Security Chief Defeated</p>
              <p className="text-green-400 mb-2">✓ Escape Route - Helicopter Destroyed</p>
              <p className="text-xl text-yellow-400 mt-4">🐓 ULTIMATE FREEDOM ACHIEVED! 🐓</p>
              <p className="text-sm opacity-80 mt-2">The legendary badass rooster has escaped the maximum security prison!</p>
            </div>
            <button
              onClick={resetGame}
              className="btn btn-primary btn-lg not-prose"
            >
              <Play className="w-6 h-6 mr-2" />
              New Prison Break
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-center text-white">
        <p className="text-sm opacity-80">
          Keep running, rebel rooster! The prison never ends! 🐓🏃‍♂️
        </p>
      </div>
    </div>
  );
}