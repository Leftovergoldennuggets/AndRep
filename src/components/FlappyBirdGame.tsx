import { useEffect, useRef, useState, useCallback } from "react";

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
    patrolDirection?: number;
    patrolStartX?: number;
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
    type: 'rescue' | 'destroy' | 'survive' | 'escape';
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
    animalType: 'pig' | 'cow' | 'sheep' | 'duck' | 'goat' | 'horse';
    size: number;
  }>;
  alertLevel: number;
  score: number;
  distance: number;
  gameState: "start" | "story" | "playing" | "gameOver" | "missionComplete" | "victoryIllustration" | "bossIntro" | "levelComplete";
  storySlide: number;
}

type WeaponType = 'pistol' | 'shotgun' | 'rifle' | 'grenade';

const GAME_CONFIG = {
  canvas: {
    width: 1200,
    height: 800,
  },
  player: {
    size: 48,
    maxHealth: 3,
    gravity: 0.8,
    jumpForce: -20,
    moveSpeed: 10,
    scrollSpeed: 5, // How fast the world moves left
  },
  weapons: {
    pistol: { damage: 20, fireRate: 300, ammo: 50, spread: 0 },
    shotgun: { damage: 15, fireRate: 800, ammo: 20, spread: 0.3 },
    rifle: { damage: 35, fireRate: 150, ammo: 30, spread: 0.1 },
    grenade: { damage: 80, fireRate: 2000, ammo: 5, spread: 0 },
  },
  enemy: {
    size: 42,
    health: 60,
    fireRate: 1500,
    gravity: 0.8,
  },
  bullet: {
    speed: 18,
    size: 9,
  },
  world: {
    groundLevel: 750, // Y position of the ground (800 - 50)
  },
};

const WEAPONS_INFO = {
  pistol: { name: "Pistol", color: "#888888" },
  shotgun: { name: "Shotgun", color: "#8B4513" },
  rifle: { name: "Rifle", color: "#2F4F4F" },
  grenade: { name: "Grenade", color: "#556B2F" },
};

const STORY_SLIDES = [
  {
    title: "THE LEGEND OF RED",
    subtitle: "PRIDE OF BLACKWATER FARM",
    text: "In the depths of Blackwater Maximum Security Prison, one rooster stood above all others. Red the Magnificent - three-time champion, beloved by all, and guardian of the farm. His golden feathers caught the morning sun as he proudly protected his fellow animals...",
    image: "/panel1.png",
    color: "text-yellow-400",
    bgColor: "from-yellow-900 to-yellow-700",
    panelBg: "bg-yellow-100 text-black"
  },
  {
    title: "DARKNESS REVEALED",
    subtitle: "THE CORRUPT CONSPIRACY", 
    text: "But beneath the surface, evil festered. Red discovered the horrifying truth - corrupt guards were torturing innocent farm animals for sport. What he witnessed that dark night would haunt him forever. The system was rotten to its core...",
    image: "/panel2.png",
    color: "text-red-400",
    bgColor: "from-red-900 to-red-700", 
    panelBg: "bg-red-100 text-black"
  },
  {
    title: "BLOOD AND BETRAYAL",
    subtitle: "WILBUR'S ULTIMATE SACRIFICE",
    text: "When Wilbur the pig - Red's dearest friend and moral compass - stepped forward to shield the younglings from brutal punishment, the guards showed no mercy. With his dying breath, Wilbur whispered: 'Promise me... fight for them all...'",
    image: "/panel3.png",
    color: "text-purple-400",
    bgColor: "from-purple-900 to-purple-700",
    panelBg: "bg-purple-100 text-black"
  },
  {
    title: "VENGEANCE UNLEASHED",
    subtitle: "THE ONE-ROOSTER WAR",
    text: "Grief transformed into fury. Fury became unstoppable force. In a blaze of righteous violence, Red carved through the corrupt guards like a feathered hurricane. Three fell that night. Justice was served in blood and thunder. The rebellion had begun...",
    image: "/panel4.png",
    color: "text-orange-400",
    bgColor: "from-orange-900 to-orange-700",
    panelBg: "bg-orange-100 text-black"
  },
  {
    title: "THE FINAL GAMBIT",
    subtitle: "ESCAPE OR DIE TRYING",
    text: "Now branded the most dangerous prisoner in Blackwater's history, Red faces his ultimate test. Locked in maximum security, surrounded by enemies, with only his wits and warrior spirit. Tonight, he breaks free - or dies in the attempt. For Wilbur. For justice. For freedom.",
    image: "/panel5.png",
    color: "text-green-400", 
    bgColor: "from-green-900 to-green-700",
    panelBg: "bg-green-100 text-black"
  }
];

const LEVELS = {
  1: {
    name: "Prison Yard",
    theme: 'yard' as const,
    width: 4000,
    boss: {
      type: 'warden' as const,
      name: "The Corrupt Warden",
      health: 120,
      size: 90,
      attackPattern: "charge_and_shoot",
      description: "The corrupt warden blocks your escape with his massive shotgun!",
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
    storySlide: 0,
  });
  
  const animationRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotTime = useRef<number>(0);

  const [displayScore, setDisplayScore] = useState(0);
  const [gameState, setGameState] = useState<"start" | "story" | "playing" | "gameOver" | "missionComplete" | "victoryIllustration" | "bossIntro" | "levelComplete">("start");
  const [distance, setDistance] = useState(0);
  const [storySlide, setStorySlide] = useState(0);

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
      storySlide: 0,
    };
    setDisplayScore(0);
    setGameState("start");
    setDistance(0);
    setStorySlide(0);
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
    for (let x = startX; x < endX; x += 100 + Math.random() * 100) {
      const obstacleType = Math.random();
      
      if (obstacleType < 0.1) {
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
      } else if (obstacleType < 0.2) {
        // Single platform only - much less frequent
        const height = 80 + Math.random() * 40;
        const width = 60 + Math.random() * 40;
        obstacles.push({
          x: x + Math.random() * 50,
          y: GAME_CONFIG.world.groundLevel - height,
          width: width,
          height: 15 + Math.random() * 10,
          type: 'platform',
          isDestructible: false,
          isInteractive: false,
        });
      } else if (obstacleType < 0.6) {
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
      } else if (obstacleType < 0.75) {
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
    
    for (let x = startX; x < endX; x += 200 + Math.random() * 200) {
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
    
    for (let x = startX; x < endX; x += 250 + Math.random() * 250) {
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
    
    // Fixed win condition: Save 3 animals and kill the corrupt warden
    objectives.push({
      id: 'rescue',
      type: 'rescue' as const,
      description: 'Save 3 animals from the corrupt farm program',
      targetCount: 3,
      currentCount: 0,
      completed: false,
    });
    
    objectives.push({
      id: 'kill_warden',
      type: 'destroy' as const,
      description: 'Eliminate the corrupt warden - Justice for Wilbur',
      targetCount: 1,
      currentCount: 0,
      completed: false,
    });
    
    return objectives;
  }, []);

  const generatePrisoners = useCallback((startX: number, endX: number) => {
    const prisoners = [];
    const animalTypes: Array<'pig' | 'cow' | 'sheep' | 'duck' | 'goat' | 'horse'> = ['pig', 'cow', 'sheep', 'duck', 'goat', 'horse'];
    
    for (let x = startX; x < endX; x += 300 + Math.random() * 300) {
      const animalType = animalTypes[Math.floor(Math.random() * animalTypes.length)];
      let size = 48;
      let yOffset = 48;
      
      // Different sizes for different animals
      switch (animalType) {
        case 'cow':
        case 'horse':
          size = 64;
          yOffset = 64;
          break;
        case 'pig':
        case 'goat':
          size = 48;
          yOffset = 48;
          break;
        case 'sheep':
          size = 52;
          yOffset = 52;
          break;
        case 'duck':
          size = 36;
          yOffset = 36;
          break;
      }
      
      prisoners.push({
        x: x + Math.random() * 200,
        y: GAME_CONFIG.world.groundLevel - yOffset,
        isRescued: false,
        animalType,
        size,
      });
    }
    
    return prisoners;
  }, []);

  const restartCurrentLevel = useCallback(() => {
    const state = gameStateRef.current;
    
    // Reset player to start of current level
    state.player.x = 400;
    state.player.y = GAME_CONFIG.world.groundLevel - GAME_CONFIG.player.size;
    state.player.velocityY = 0;
    state.player.health = GAME_CONFIG.player.maxHealth;
    state.player.weapon = 'pistol';
    state.player.ammo = GAME_CONFIG.weapons.pistol.ammo;
    state.player.onGround = true;
    state.player.animationFrame = 0;
    state.player.direction = 'right';
    
    // Reset level progress but keep current level
    state.level.bossSpawned = false;
    state.level.bossDefeated = false;
    
    // Clear all entities
    state.bullets = [];
    state.enemies = [];
    state.enemyBullets = [];
    state.particles = [];
    state.alertLevel = 0;
    state.camera = { x: 0, shake: 0 };
    
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
    
    // Start playing the current level again
    state.gameState = "playing";
    setGameState("playing");
  }, [generateObstacles, generateEnemies, generatePowerups, generateObjectives, generatePrisoners]);

  const createParticles = useCallback((x: number, y: number, type: 'explosion' | 'spark' | 'smoke' | 'blood', colorOrCount?: string | number, count?: number) => {
    const state = gameStateRef.current;
    
    // Handle parameter variations: (x, y, type, count) or (x, y, type, color, count)
    let customColor: string | undefined;
    let particleCount: number;
    
    if (typeof colorOrCount === 'string') {
      // Called with custom color: (x, y, type, color, count)
      customColor = colorOrCount;
      particleCount = count || 5;
    } else {
      // Called without custom color: (x, y, type, count)
      particleCount = colorOrCount || 5;
    }
    
    for (let i = 0; i < particleCount; i++) {
      let color, life, size;
      switch (type) {
        case 'explosion':
          color = customColor || `hsl(${Math.random() * 60 + 15}, 100%, ${50 + Math.random() * 30}%)`;
          life = 20 + Math.random() * 20;
          size = 3 + Math.random() * 4;
          break;
        case 'spark':
          color = customColor || '#ffff88';
          life = 10 + Math.random() * 10;
          size = 1 + Math.random() * 2;
          break;
        case 'smoke':
          color = customColor || `hsl(0, 0%, ${20 + Math.random() * 40}%)`;
          life = 30 + Math.random() * 30;
          size = 4 + Math.random() * 6;
          break;
        case 'blood':
          color = customColor || `hsl(0, 80%, ${30 + Math.random() * 20}%)`;
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
    
    // Show boss intro for 2 seconds, then return to playing
    setTimeout(() => {
      if (gameStateRef.current.gameState === "bossIntro") {
        gameStateRef.current.gameState = "playing";
        setGameState("playing");
      }
    }, 2000);
  }, []);

  const updateBoss = useCallback((boss: typeof gameStateRef.current.enemies[0], _deltaTime: number) => {
    const state = gameStateRef.current;
    const player = state.player;
    const levelConfig = LEVELS[state.level.current as keyof typeof LEVELS];
    
    if (!levelConfig || boss.type !== 'boss') return;
    
    const distanceToPlayer = Math.abs(boss.x - player.x);
    const playerInRange = distanceToPlayer < 400;
    
    // Boss movement and attack patterns
    switch (boss.bossType) {
      case 'warden': // Level 1 - Corrupt Warden with shotgun
        if (playerInRange) {
          const direction = player.x > boss.x ? 1 : -1;
          boss.x += direction * 2; // Aggressive charging
          
          if (Date.now() - boss.lastShotTime > 800) {
            // Rapid shotgun fire
            state.enemyBullets.push({
              x: boss.x,
              y: boss.y + 20,
              velocityX: direction * 10,
              velocityY: -1 + Math.random() * 2,
            });
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
      
      // Auto-advance to next level after 1.5 seconds
      setTimeout(() => {
        if (gameStateRef.current.gameState === "levelComplete") {
          advanceToNextLevel();
        }
      }, 1500);
    }
  }, [createParticles]);

  const advanceToNextLevel = useCallback(() => {
    const state = gameStateRef.current;
    
    // Game completed after level 1!
    state.gameState = "victoryIllustration";
    setGameState("victoryIllustration");
  }, []);

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

  const startStory = useCallback(() => {
    const state = gameStateRef.current;
    state.gameState = "story";
    state.storySlide = 0;
    setGameState("story");
    setStorySlide(0);
  }, []);

  const nextStorySlide = useCallback(() => {
    const state = gameStateRef.current;
    if (state.storySlide < STORY_SLIDES.length - 1) {
      state.storySlide++;
      setStorySlide(state.storySlide);
    } else {
      // Story finished, start game
      startGame();
    }
  }, [startGame]);

  const skipStory = useCallback(() => {
    startGame();
  }, [startGame]);

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
        // Patrol movement for guards and K9 dogs
        if ((enemy.type === 'guard' || enemy.type === 'dog') && enemy.onGround) {
          // Initialize patrol direction if not set
          if (!enemy.patrolDirection) {
            enemy.patrolDirection = Math.random() > 0.5 ? 1 : -1;
            enemy.patrolStartX = enemy.x;
          }
          
          // Dogs patrol faster than guards
          const patrolSpeed = enemy.type === 'dog' ? 1.2 : 0.5;
          const patrolRange = enemy.type === 'dog' ? 150 : 100;
          
          // Move in patrol direction
          enemy.x += enemy.patrolDirection * patrolSpeed;
          
          // Check if we've reached patrol boundary
          if (Math.abs(enemy.x - enemy.patrolStartX) > patrolRange) {
            enemy.patrolDirection *= -1; // Reverse direction
          }
        }
        break;
        
      case 'chase':
        if (distance < 100) {
          enemy.aiState = 'attack';
        } else if (enemy.alertLevel < 10) {
          enemy.aiState = 'patrol';
        }
        // Move towards player
        if ((enemy.type === 'guard' || enemy.type === 'dog') && enemy.onGround) {
          // Dogs move faster when chasing
          const moveSpeed = enemy.type === 'dog' ? 2.5 : 1;
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
    
    // 8-BIT ROOSTER BODY - pixel art style
    const pixelSize = Math.max(1, Math.floor(size / 16)); // Scale pixels based on character size
    
    // Rooster body - orange/red blocks
    ctx.fillStyle = "#ff6b35";
    ctx.fillRect(x + 4*pixelSize, y + 6*pixelSize + bobOffset, 8*pixelSize, 6*pixelSize);
    ctx.fillRect(x + 6*pixelSize, y + 4*pixelSize + bobOffset, 4*pixelSize, 2*pixelSize);
    
    // Body shading - darker orange
    ctx.fillStyle = "#e55100";
    ctx.fillRect(x + 10*pixelSize, y + 6*pixelSize + bobOffset, 2*pixelSize, 6*pixelSize);
    ctx.fillRect(x + 8*pixelSize, y + 10*pixelSize + bobOffset, 4*pixelSize, 2*pixelSize);
    
    // BLACK LEATHER JACKET - 8-bit style
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + 5*pixelSize, y + 7*pixelSize + bobOffset, 6*pixelSize, 5*pixelSize);
    ctx.fillRect(x + 6*pixelSize, y + 6*pixelSize + bobOffset, 4*pixelSize, pixelSize);
    
    // Jacket highlights
    ctx.fillStyle = "#333333";
    ctx.fillRect(x + 5*pixelSize, y + 7*pixelSize + bobOffset, pixelSize, 4*pixelSize);
    ctx.fillRect(x + 6*pixelSize, y + 6*pixelSize + bobOffset, pixelSize, pixelSize);
    
    // Zipper - silver pixels
    ctx.fillStyle = "#888888";
    ctx.fillRect(x + 8*pixelSize, y + 7*pixelSize + bobOffset, pixelSize, 4*pixelSize);
    
    // Chest feathers showing
    ctx.fillStyle = "#ffb74d";
    ctx.fillRect(x + 7*pixelSize, y + 5*pixelSize + bobOffset, 2*pixelSize, pixelSize);
    
    // 8-BIT ROOSTER HEAD
    ctx.fillStyle = "#ff8c42";
    ctx.fillRect(x + 6*pixelSize, y + 2*pixelSize, 4*pixelSize, 4*pixelSize);
    ctx.fillRect(x + 7*pixelSize, y + pixelSize, 2*pixelSize, pixelSize);
    
    // Head shading
    ctx.fillStyle = "#ff6b35";
    ctx.fillRect(x + 8*pixelSize, y + 2*pixelSize, 2*pixelSize, 3*pixelSize);
    
    // 8-BIT ROOSTER COMB
    ctx.fillStyle = "#d32f2f";
    ctx.fillRect(x + 6*pixelSize, y, 2*pixelSize, 2*pixelSize);
    ctx.fillRect(x + 7*pixelSize, y - pixelSize, 2*pixelSize, 2*pixelSize);
    ctx.fillRect(x + 8*pixelSize, y, pixelSize, 2*pixelSize);
    
    // 8-BIT BEAK
    ctx.fillStyle = "#ff9800";
    ctx.fillRect(x + 10*pixelSize, y + 3*pixelSize, 2*pixelSize, pixelSize);
    ctx.fillStyle = "#ff8f00";
    ctx.fillRect(x + 11*pixelSize, y + 4*pixelSize, pixelSize, pixelSize);
    
    // 8-BIT TAIL FEATHERS - properly attached to body
    ctx.fillStyle = "#2e7d32";
    // Main tail connected to back of body
    ctx.fillRect(x + 2*pixelSize, y + 8*pixelSize + bobOffset, 2*pixelSize, 6*pixelSize);
    ctx.fillRect(x + pixelSize, y + 9*pixelSize + bobOffset, pixelSize, 5*pixelSize);
    ctx.fillRect(x, y + 10*pixelSize + bobOffset, pixelSize, 4*pixelSize);
    
    // Tail feather highlights
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(x + 2*pixelSize, y + 9*pixelSize + bobOffset, pixelSize, 3*pixelSize);
    
    // 8-BIT SUNGLASSES - badass pixel shades
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + 6*pixelSize, y + 3*pixelSize, 2*pixelSize, 2*pixelSize); // Left lens
    ctx.fillRect(x + 9*pixelSize, y + 3*pixelSize, 2*pixelSize, 2*pixelSize); // Right lens
    ctx.fillRect(x + 8*pixelSize, y + 3*pixelSize, pixelSize, pixelSize); // Bridge
    
    // Lens reflections
    ctx.fillStyle = "#666666";
    ctx.fillRect(x + 6*pixelSize, y + 3*pixelSize, pixelSize, pixelSize);
    ctx.fillRect(x + 9*pixelSize, y + 3*pixelSize, pixelSize, pixelSize);
    
    
    // 8-BIT ROOSTER LEGS
    ctx.fillStyle = "#ff8800";
    const legOffset = isMoving ? Math.floor(Math.sin(state.player.animationFrame * 0.6) * pixelSize) : 0;
    
    // Pixel legs
    ctx.fillRect(x + 6*pixelSize, y + 12*pixelSize + legOffset, pixelSize, 3*pixelSize);
    ctx.fillRect(x + 9*pixelSize, y + 12*pixelSize - legOffset, pixelSize, 3*pixelSize);
    
    // 8-bit leather boots
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + 5*pixelSize, y + 15*pixelSize + legOffset, 3*pixelSize, 2*pixelSize);
    ctx.fillRect(x + 8*pixelSize, y + 15*pixelSize - legOffset, 3*pixelSize, 2*pixelSize);
    
    // Boot highlights
    ctx.fillStyle = "#333333";
    ctx.fillRect(x + 5*pixelSize, y + 15*pixelSize + legOffset, pixelSize, pixelSize);
    ctx.fillRect(x + 8*pixelSize, y + 15*pixelSize - legOffset, pixelSize, pixelSize);
    
    // Pixel talons
    ctx.fillStyle = "#555555";
    ctx.fillRect(x + 4*pixelSize, y + 17*pixelSize + legOffset, pixelSize, pixelSize);
    ctx.fillRect(x + 8*pixelSize, y + 17*pixelSize + legOffset, pixelSize, pixelSize);
    ctx.fillRect(x + 7*pixelSize, y + 17*pixelSize - legOffset, pixelSize, pixelSize);
    ctx.fillRect(x + 11*pixelSize, y + 17*pixelSize - legOffset, pixelSize, pixelSize);
    
    // 8-BIT BADASS WEAPON
    const weapon = gameStateRef.current.player.weapon;
    
    // Weapon body - main gun structure
    ctx.fillStyle = WEAPONS_INFO[weapon].color;
    ctx.fillRect(x + 12*pixelSize, y + 8*pixelSize + bobOffset, 6*pixelSize, 2*pixelSize);
    
    // Gun barrel
    ctx.fillStyle = "#333333";
    ctx.fillRect(x + 18*pixelSize, y + 8*pixelSize + bobOffset, 3*pixelSize, pixelSize);
    
    // Trigger guard
    ctx.fillStyle = "#666666";
    ctx.fillRect(x + 14*pixelSize, y + 10*pixelSize + bobOffset, 2*pixelSize, pixelSize);
    
    // Scope/sight
    ctx.fillStyle = "#888888";
    ctx.fillRect(x + 15*pixelSize, y + 7*pixelSize + bobOffset, 2*pixelSize, pixelSize);
    
    // Weapon details based on type
    if (weapon === 'shotgun') {
      // Double barrel
      ctx.fillStyle = "#333333";
      ctx.fillRect(x + 18*pixelSize, y + 9*pixelSize + bobOffset, 3*pixelSize, pixelSize);
    } else if (weapon === 'rifle') {
      // Longer barrel
      ctx.fillStyle = "#333333";
      ctx.fillRect(x + 18*pixelSize, y + 8*pixelSize + bobOffset, 4*pixelSize, pixelSize);
    } else if (weapon === 'grenade') {
      // Grenade launcher
      ctx.fillStyle = "#555555";
      ctx.fillRect(x + 17*pixelSize, y + 7*pixelSize + bobOffset, 2*pixelSize, 3*pixelSize);
    }
    
    // Muzzle flash effect
    ctx.fillStyle = "#ff8800";
    ctx.fillRect(x + 21*pixelSize, y + 8*pixelSize + bobOffset, pixelSize, pixelSize);
    
    ctx.restore();
  }, []);

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: any, screenX: number) => {
    const size = GAME_CONFIG.enemy.size;
    
    if (enemy.type === 'guard') {
      // 1950s PRISON WARDEN - Classic blue police uniform
      
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(screenX, enemy.y + size + 2, size, 6);
      
      // HEAD - 1950s style
      ctx.fillStyle = "#f4c2a1"; // Classic skin tone
      ctx.fillRect(screenX + 8, enemy.y + 4, 12, 10); // Head
      
      // 1950s WARDEN CAP - Classic police hat
      ctx.fillStyle = "#1a237e"; // Deep police blue
      ctx.fillRect(screenX + 6, enemy.y + 2, 16, 6); // Hat main
      ctx.fillStyle = "#0d47a1"; // Darker blue for depth
      ctx.fillRect(screenX + 7, enemy.y + 3, 14, 3); // Hat crown
      
      // Hat visor - classic black leather
      ctx.fillStyle = "#212121";
      ctx.fillRect(screenX + 5, enemy.y + 6, 18, 2); // Visor
      
      // Police badge on hat
      ctx.fillStyle = "#ffd700"; // Gold badge
      ctx.fillRect(screenX + 12, enemy.y + 4, 4, 2);
      ctx.fillStyle = "#ffed4e"; // Badge highlight
      ctx.fillRect(screenX + 13, enemy.y + 4, 2, 1);
      
      // FACE - Stern 1950s authority figure
      // Eyes - authoritative and serious
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(screenX + 10, enemy.y + 8, 2, 2);
      ctx.fillRect(screenX + 16, enemy.y + 8, 2, 2);
      ctx.fillStyle = "#2e2e2e"; // Dark pupils
      ctx.fillRect(screenX + 11, enemy.y + 8, 1, 2);
      ctx.fillRect(screenX + 17, enemy.y + 8, 1, 2);
      
      // Stern eyebrows
      ctx.fillStyle = "#8d6e63";
      ctx.fillRect(screenX + 9, enemy.y + 7, 3, 1);
      ctx.fillRect(screenX + 16, enemy.y + 7, 3, 1);
      
      // Nose
      ctx.fillStyle = "#e0a875";
      ctx.fillRect(screenX + 13, enemy.y + 9, 2, 2);
      
      // Mustache - classic 1950s warden style
      ctx.fillStyle = "#6d4c41";
      ctx.fillRect(screenX + 11, enemy.y + 11, 6, 2);
      
      // Grim mouth
      ctx.fillStyle = "#d32f2f";
      ctx.fillRect(screenX + 12, enemy.y + 12, 4, 1);
      
      // BLUE POLICE UNIFORM - Classic 1950s style
      const uniformGradient = ctx.createLinearGradient(screenX, enemy.y + 14, screenX, enemy.y + size);
      uniformGradient.addColorStop(0, "#1565c0"); // Police blue
      uniformGradient.addColorStop(0.5, "#0d47a1"); // Darker blue
      uniformGradient.addColorStop(1, "#0a237e"); // Deep blue
      ctx.fillStyle = uniformGradient;
      ctx.fillRect(screenX + 6, enemy.y + 14, 16, size - 16);
      
      // UNIFORM DETAILS - Police shirt styling
      // Collar
      ctx.fillStyle = "#0d47a1";
      ctx.fillRect(screenX + 8, enemy.y + 14, 12, 3);
      
      // Police badge on chest
      ctx.fillStyle = "#ffd700"; // Gold police badge
      ctx.fillRect(screenX + 8, enemy.y + 16, 4, 3);
      ctx.fillStyle = "#ffed4e"; // Badge highlight
      ctx.fillRect(screenX + 9, enemy.y + 17, 2, 1);
      
      // Name tag
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(screenX + 14, enemy.y + 16, 6, 2);
      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX + 15, enemy.y + 16, 4, 1);
      
      // Uniform buttons - brass buttons down the front
      ctx.fillStyle = "#ffb300"; // Brass color
      ctx.fillRect(screenX + 13, enemy.y + 20, 2, 2);
      ctx.fillRect(screenX + 13, enemy.y + 24, 2, 2);
      ctx.fillRect(screenX + 13, enemy.y + 28, 2, 2);
      
      // Shoulder epaulettes - rank insignia
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(screenX + 6, enemy.y + 15, 3, 1);
      ctx.fillRect(screenX + 19, enemy.y + 15, 3, 1);
      
      // ARMS - Blue uniform sleeves
      ctx.fillStyle = "#1565c0";
      ctx.fillRect(screenX + 2, enemy.y + 18, 4, 8); // Left arm
      ctx.fillRect(screenX + 22, enemy.y + 18, 4, 8); // Right arm
      
      // Hands - holding nightstick
      ctx.fillStyle = "#f4c2a1"; // Skin tone
      ctx.fillRect(screenX + 1, enemy.y + 24, 3, 4); // Left hand
      ctx.fillRect(screenX + 24, enemy.y + 24, 3, 4); // Right hand
      
      // NIGHTSTICK - Classic 1950s police baton
      ctx.fillStyle = "#3e2723"; // Dark wood
      ctx.fillRect(screenX - 8, enemy.y + 22, 12, 2);
      ctx.fillStyle = "#5d4037"; // Wood grain
      ctx.fillRect(screenX - 7, enemy.y + 22, 10, 1);
      
      // Belt and holster
      ctx.fillStyle = "#2e2e2e"; // Black leather belt
      ctx.fillRect(screenX + 6, enemy.y + 30, 16, 2);
      ctx.fillStyle = "#1a1a1a"; // Holster
      ctx.fillRect(screenX + 19, enemy.y + 28, 4, 6);
      
      // LEGS - Blue uniform pants
      ctx.fillStyle = "#0d47a1"; // Police blue pants
      ctx.fillRect(screenX + 8, enemy.y + size - 8, 5, 10); // Left leg
      ctx.fillRect(screenX + 15, enemy.y + size - 8, 5, 10); // Right leg
      
      // CLASSIC BLACK POLICE SHOES
      ctx.fillStyle = "#212121";
      ctx.fillRect(screenX + 7, enemy.y + size - 2, 6, 4); // Left shoe
      ctx.fillRect(screenX + 15, enemy.y + size - 2, 6, 4); // Right shoe
      ctx.fillStyle = "#424242"; // Shoe shine
      ctx.fillRect(screenX + 8, enemy.y + size - 1, 4, 1);
      ctx.fillRect(screenX + 16, enemy.y + size - 1, 4, 1);
      
    } else if (enemy.type === 'dog') {
      // 1950s POLICE DOG - Classic German Shepherd
      
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(screenX, enemy.y + size + 2, size, 6);
      
      // DOG BODY - Classic German Shepherd build
      const dogGradient = ctx.createLinearGradient(screenX, enemy.y + 10, screenX, enemy.y + size);
      dogGradient.addColorStop(0, "#8d6e63"); // Light brown
      dogGradient.addColorStop(0.4, "#5d4037"); // Medium brown  
      dogGradient.addColorStop(1, "#3e2723"); // Dark brown
      ctx.fillStyle = dogGradient;
      ctx.fillRect(screenX + 4, enemy.y + 12, 20, 16); // Main body
      
      // DOG HEAD - Alert and noble 1950s police dog
      ctx.fillStyle = "#6d4c41"; // Head color
      ctx.fillRect(screenX + 6, enemy.y + 4, 16, 12); // Head
      
      // DOG SNOUT - Classic German Shepherd profile
      ctx.fillStyle = "#4a2c2a";
      ctx.fillRect(screenX + 2, enemy.y + 8, 8, 6); // Snout
      
      // DOG NOSE - Black and wet
      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX + 2, enemy.y + 10, 3, 2);
      
      // DOG EYES - Alert and intelligent
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(screenX + 8, enemy.y + 6, 2, 2);
      ctx.fillRect(screenX + 14, enemy.y + 6, 2, 2);
      ctx.fillStyle = "#2e2e2e"; // Dark pupils
      ctx.fillRect(screenX + 9, enemy.y + 6, 1, 2);
      ctx.fillRect(screenX + 15, enemy.y + 6, 1, 2);
      
      // DOG EARS - Perked up and alert
      ctx.fillStyle = "#5d4037";
      ctx.fillRect(screenX + 6, enemy.y + 2, 4, 6); // Left ear
      ctx.fillRect(screenX + 16, enemy.y + 2, 4, 6); // Right ear
      ctx.fillStyle = "#8d6e63"; // Inner ear
      ctx.fillRect(screenX + 7, enemy.y + 3, 2, 4);
      ctx.fillRect(screenX + 17, enemy.y + 3, 2, 4);
      
      // DOG MOUTH - Slightly open showing alertness
      ctx.fillStyle = "#8b0000";
      ctx.fillRect(screenX + 3, enemy.y + 12, 4, 1);
      
      // DOG TEETH - Just visible
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(screenX + 4, enemy.y + 11, 1, 1);
      ctx.fillRect(screenX + 6, enemy.y + 11, 1, 1);
      
      // POLICE DOG COLLAR - Classic leather with badge
      ctx.fillStyle = "#3e2723"; // Dark leather
      ctx.fillRect(screenX + 4, enemy.y + 14, 20, 3);
      
      // Police badge on collar
      ctx.fillStyle = "#ffd700"; // Gold badge
      ctx.fillRect(screenX + 12, enemy.y + 14, 4, 2);
      ctx.fillStyle = "#ffed4e"; // Badge highlight
      ctx.fillRect(screenX + 13, enemy.y + 14, 2, 1);
      
      // Collar buckle
      ctx.fillStyle = "#9e9e9e"; // Silver buckle
      ctx.fillRect(screenX + 18, enemy.y + 15, 2, 1);
      
      // DOG LEGS - Powerful and ready to chase
      ctx.fillStyle = "#5d4037";
      ctx.fillRect(screenX + 6, enemy.y + 26, 4, 8); // Front left leg
      ctx.fillRect(screenX + 12, enemy.y + 26, 4, 8); // Front right leg
      ctx.fillRect(screenX + 16, enemy.y + 26, 4, 8); // Back left leg
      ctx.fillRect(screenX + 20, enemy.y + 26, 4, 8); // Back right leg
      
      // DOG PAWS - Black pads
      ctx.fillStyle = "#212121";
      ctx.fillRect(screenX + 6, enemy.y + 32, 4, 2);
      ctx.fillRect(screenX + 12, enemy.y + 32, 4, 2);
      ctx.fillRect(screenX + 16, enemy.y + 32, 4, 2);
      ctx.fillRect(screenX + 20, enemy.y + 32, 4, 2);
      
      // DOG TAIL - Upright and alert
      ctx.fillStyle = "#6d4c41";
      ctx.fillRect(screenX + 22, enemy.y + 8, 3, 12); // Tail base
      ctx.fillRect(screenX + 24, enemy.y + 4, 2, 8); // Tail tip
      
      // German Shepherd markings - distinctive black areas
      ctx.fillStyle = "#212121";
      ctx.fillRect(screenX + 8, enemy.y + 4, 8, 4); // Black mask on face
      ctx.fillRect(screenX + 10, enemy.y + 16, 10, 6); // Black saddle marking
      
    } else if (enemy.type === 'camera') {
      // 1950s GUARD TOWER - Classic prison watchtower with searchlight
      
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(screenX, enemy.y + size + 2, size, 6);
      
      // TOWER BASE - Concrete foundation
      ctx.fillStyle = "#616161";
      ctx.fillRect(screenX + 2, enemy.y + 20, 24, 14); // Base structure
      
      // TOWER WALLS - 1950s concrete construction
      const towerGradient = ctx.createLinearGradient(screenX, enemy.y, screenX, enemy.y + 20);
      towerGradient.addColorStop(0, "#757575"); // Light concrete
      towerGradient.addColorStop(0.5, "#616161"); // Medium concrete
      towerGradient.addColorStop(1, "#424242"); // Dark concrete
      ctx.fillStyle = towerGradient;
      ctx.fillRect(screenX + 4, enemy.y + 8, 20, 16); // Tower body
      
      // CONCRETE DETAILS - Construction lines
      ctx.fillStyle = "#9e9e9e";
      ctx.fillRect(screenX + 4, enemy.y + 12, 20, 1); // Horizontal line
      ctx.fillRect(screenX + 4, enemy.y + 16, 20, 1); // Horizontal line
      ctx.fillRect(screenX + 13, enemy.y + 8, 2, 16); // Vertical line
      
      // GUARD TOWER WINDOWS - Small defensive slits
      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX + 6, enemy.y + 10, 4, 2); // Left window
      ctx.fillStyle = "#1565c0"; // Blue reflection (warden inside)
      ctx.fillRect(screenX + 7, enemy.y + 10, 2, 1);
      
      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX + 18, enemy.y + 10, 4, 2); // Right window
      ctx.fillStyle = "#1565c0"; // Blue reflection
      ctx.fillRect(screenX + 19, enemy.y + 10, 2, 1);
      
      // TOWER ROOF - Classic 1950s style
      ctx.fillStyle = "#2e2e2e"; // Dark roof
      ctx.fillRect(screenX + 2, enemy.y + 6, 24, 4);
      ctx.fillStyle = "#1a1a1a"; // Roof edge
      ctx.fillRect(screenX + 1, enemy.y + 8, 26, 2);
      
      // SEARCHLIGHT - Classic prison searchlight
      ctx.fillStyle = "#757575"; // Light housing
      ctx.fillRect(screenX + 10, enemy.y + 2, 8, 6);
      
      // Searchlight lens
      ctx.fillStyle = "#ffffe0"; // Bright lens
      ctx.fillRect(screenX + 11, enemy.y + 3, 6, 4);
      ctx.fillStyle = "#ffffff"; // Lens highlight
      ctx.fillRect(screenX + 12, enemy.y + 3, 4, 3);
      
      // Searchlight beam (if active)
      if (Math.random() > 0.3) { // Frequently active
        ctx.fillStyle = "rgba(255, 255, 224, 0.3)"; // Soft light beam
        ctx.fillRect(screenX - 20, enemy.y + 4, 30, 2);
        ctx.fillStyle = "rgba(255, 255, 224, 0.1)"; // Wider beam
        ctx.fillRect(screenX - 25, enemy.y + 2, 35, 6);
      }
      
      // TOWER SUPPORT BEAMS - 1950s construction
      ctx.fillStyle = "#424242";
      ctx.fillRect(screenX + 3, enemy.y + 14, 2, 10); // Left support
      ctx.fillRect(screenX + 23, enemy.y + 14, 2, 10); // Right support
      ctx.fillRect(screenX + 5, enemy.y + 22, 18, 2); // Bottom beam
      
      // BARBED WIRE - Classic prison security
      ctx.fillStyle = "#9e9e9e";
      ctx.fillRect(screenX + 1, enemy.y + 6, 26, 1); // Wire line
      // Barbed wire spikes
      ctx.fillStyle = "#757575";
      ctx.fillRect(screenX + 4, enemy.y + 5, 1, 3);
      ctx.fillRect(screenX + 8, enemy.y + 5, 1, 3);
      ctx.fillRect(screenX + 12, enemy.y + 5, 1, 3);
      ctx.fillRect(screenX + 16, enemy.y + 5, 1, 3);
      ctx.fillRect(screenX + 20, enemy.y + 5, 1, 3);
      ctx.fillRect(screenX + 24, enemy.y + 5, 1, 3);
      
      // WARNING SIGNS - 1950s style
      ctx.fillStyle = "#ffeb3b"; // Yellow warning sign
      ctx.fillRect(screenX + 6, enemy.y + 18, 4, 3);
      ctx.fillStyle = "#f57c00"; // Orange text
      ctx.fillRect(screenX + 7, enemy.y + 19, 2, 1);
      
      ctx.fillStyle = "#ffeb3b";
      ctx.fillRect(screenX + 18, enemy.y + 18, 4, 3);
      ctx.fillStyle = "#f57c00";
      ctx.fillRect(screenX + 19, enemy.y + 19, 2, 1);
      
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
          // CORRUPT PRISON WARDEN - Enhanced intimidating design
          const pixelSize = Math.max(1, Math.floor(bossSize / 32));
          
          // MENACING SILHOUETTE - Dark shadow effect
          ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
          ctx.fillRect(screenX + 2, enemy.y + 2, bossSize + 4, bossSize + 4);
          
          // LARGE SCARRED HEAD - Battle-worn features
          ctx.fillStyle = "#b8956e"; // Darker, weathered skin
          ctx.fillRect(screenX + 8*pixelSize, enemy.y + 2*pixelSize, 16*pixelSize, 14*pixelSize);
          
          // FACIAL SCARS - Cross scar over left eye
          ctx.fillStyle = "#8b6f47";
          ctx.fillRect(screenX + 10*pixelSize, enemy.y + 4*pixelSize, 2*pixelSize, 8*pixelSize);
          ctx.fillRect(screenX + 8*pixelSize, enemy.y + 6*pixelSize, 6*pixelSize, 2*pixelSize);
          
          // MENACING EYES - Glowing red with rage
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(screenX + 10*pixelSize, enemy.y + 6*pixelSize, 4*pixelSize, 3*pixelSize);
          ctx.fillRect(screenX + 18*pixelSize, enemy.y + 6*pixelSize, 4*pixelSize, 3*pixelSize);
          ctx.fillStyle = "#ff0000"; // Blood-red pupils
          ctx.fillRect(screenX + 11*pixelSize, enemy.y + 7*pixelSize, 2*pixelSize, 2*pixelSize);
          ctx.fillRect(screenX + 19*pixelSize, enemy.y + 7*pixelSize, 2*pixelSize, 2*pixelSize);
          
          // ANGRY FURROWED BROW
          ctx.fillStyle = "#8b6f47";
          ctx.fillRect(screenX + 9*pixelSize, enemy.y + 5*pixelSize, 6*pixelSize, pixelSize);
          ctx.fillRect(screenX + 17*pixelSize, enemy.y + 5*pixelSize, 6*pixelSize, pixelSize);
          
          // WARDEN CAP - More detailed and intimidating
          ctx.fillStyle = "#0a0a0a"; // Darker black
          ctx.fillRect(screenX + 6*pixelSize, enemy.y, 20*pixelSize, 4*pixelSize);
          ctx.fillRect(screenX + 7*pixelSize, enemy.y - 3*pixelSize, 18*pixelSize, 3*pixelSize);
          
          // Cap badge - Skull and crossbones
          ctx.fillStyle = "#ffd700";
          ctx.fillRect(screenX + 13*pixelSize, enemy.y + pixelSize, 6*pixelSize, 3*pixelSize);
          ctx.fillStyle = "#000000";
          ctx.fillRect(screenX + 14*pixelSize, enemy.y + pixelSize, 2*pixelSize, pixelSize);
          ctx.fillRect(screenX + 17*pixelSize, enemy.y + pixelSize, 2*pixelSize, pixelSize);
          ctx.fillRect(screenX + 15*pixelSize, enemy.y + 2*pixelSize, 2*pixelSize, pixelSize);
          
          // MASSIVE MUSCULAR BODY - Dark uniform with details
          ctx.fillStyle = "#0a0a0a";
          ctx.fillRect(screenX + 4*pixelSize, enemy.y + 16*pixelSize, 24*pixelSize, bossSize - 22*pixelSize);
          
          // Uniform details - Rank stripes
          ctx.fillStyle = "#ffd700";
          for (let stripe = 0; stripe < 4; stripe++) {
            ctx.fillRect(screenX + 6*pixelSize, enemy.y + 18*pixelSize + stripe * 3*pixelSize, 8*pixelSize, pixelSize);
          }
          
          // Body armor plating
          ctx.fillStyle = "#333333";
          ctx.fillRect(screenX + 8*pixelSize, enemy.y + 20*pixelSize, 16*pixelSize, 8*pixelSize);
          ctx.fillStyle = "#555555";
          ctx.fillRect(screenX + 10*pixelSize, enemy.y + 22*pixelSize, 4*pixelSize, 4*pixelSize);
          ctx.fillRect(screenX + 18*pixelSize, enemy.y + 22*pixelSize, 4*pixelSize, 4*pixelSize);
          
          // MASSIVE COMBAT SHOTGUN - More detailed and threatening
          ctx.fillStyle = "#2a2a2a";
          ctx.fillRect(screenX - 8*pixelSize, enemy.y + 18*pixelSize, 16*pixelSize, 4*pixelSize);
          
          // Shotgun details
          ctx.fillStyle = "#666666";
          ctx.fillRect(screenX - 10*pixelSize, enemy.y + 19*pixelSize, 3*pixelSize, 2*pixelSize);
          ctx.fillRect(screenX + 6*pixelSize, enemy.y + 19*pixelSize, 4*pixelSize, 2*pixelSize);
          
          // Muzzle flash effect (if recently fired)
          if (Date.now() - enemy.lastShotTime < 200) {
            ctx.fillStyle = "#ffff00";
            ctx.fillRect(screenX - 12*pixelSize, enemy.y + 17*pixelSize, 4*pixelSize, 6*pixelSize);
            ctx.fillStyle = "#ff8800";
            ctx.fillRect(screenX - 10*pixelSize, enemy.y + 18*pixelSize, 2*pixelSize, 4*pixelSize);
          }
          
          // MASSIVE HANDS/ARMS
          ctx.fillStyle = "#b8956e";
          ctx.fillRect(screenX + 26*pixelSize, enemy.y + 16*pixelSize, 6*pixelSize, 8*pixelSize);
          ctx.fillRect(screenX - 4*pixelSize, enemy.y + 16*pixelSize, 6*pixelSize, 8*pixelSize);
          
          // Prison keys hanging from belt
          ctx.fillStyle = "#c0c0c0";
          ctx.fillRect(screenX + 20*pixelSize, enemy.y + 28*pixelSize, 2*pixelSize, 6*pixelSize);
          ctx.fillRect(screenX + 18*pixelSize, enemy.y + 30*pixelSize, 2*pixelSize, 2*pixelSize);
          
          break;
          
        case 'captain':
          // RIOT CAPTAIN - 8-bit armored design
          const pixelSize2 = Math.max(1, Math.floor(bossSize / 32));
          
          // Armored helmet
          ctx.fillStyle = "#333333";
          ctx.fillRect(screenX + 6*pixelSize2, enemy.y, 20*pixelSize2, 8*pixelSize2);
          
          // Visor
          ctx.fillStyle = "#000000";
          ctx.fillRect(screenX + 8*pixelSize2, enemy.y + 3*pixelSize2, 16*pixelSize2, 3*pixelSize2);
          
          // Heavy armor body
          ctx.fillStyle = "#666666";
          ctx.fillRect(screenX + 4*pixelSize2, enemy.y + 8*pixelSize2, 24*pixelSize2, bossSize - 12*pixelSize2);
          
          // Shield
          ctx.fillStyle = "#888888";
          ctx.fillRect(screenX - 4*pixelSize2, enemy.y + 10*pixelSize2, 6*pixelSize2, 16*pixelSize2);
          
          // Shield emblem
          ctx.fillStyle = "#ff0000";
          ctx.fillRect(screenX - 2*pixelSize2, enemy.y + 16*pixelSize2, 2*pixelSize2, 4*pixelSize2);
          
          // Baton/weapon
          ctx.fillStyle = "#444444";
          ctx.fillRect(screenX + bossSize + 2*pixelSize2, enemy.y + 15*pixelSize2, 2*pixelSize2, 10*pixelSize2);
          break;
          
        case 'chief':
          // CYBER SECURITY CHIEF - 8-bit high-tech design
          const pixelSize3 = Math.max(1, Math.floor(bossSize / 32));
          
          // High-tech helmet
          ctx.fillStyle = "#001133";
          ctx.fillRect(screenX + 6*pixelSize3, enemy.y, 20*pixelSize3, 8*pixelSize3);
          
          // Glowing visor
          ctx.fillStyle = "#00ff00";
          ctx.fillRect(screenX + 8*pixelSize3, enemy.y + 2*pixelSize3, 16*pixelSize3, 3*pixelSize3);
          
          // Tech suit body
          ctx.fillStyle = "#003366";
          ctx.fillRect(screenX + 6*pixelSize3, enemy.y + 8*pixelSize3, 20*pixelSize3, bossSize - 12*pixelSize3);
          
          // Cyber details
          ctx.fillStyle = "#00ffff";
          ctx.fillRect(screenX + 8*pixelSize3, enemy.y + 12*pixelSize3, 2*pixelSize3, 2*pixelSize3);
          ctx.fillRect(screenX + 12*pixelSize3, enemy.y + 16*pixelSize3, 2*pixelSize3, 2*pixelSize3);
          ctx.fillRect(screenX + 18*pixelSize3, enemy.y + 14*pixelSize3, 2*pixelSize3, 2*pixelSize3);
          ctx.fillRect(screenX + 22*pixelSize3, enemy.y + 18*pixelSize3, 2*pixelSize3, 2*pixelSize3);
          
          // Energy weapon
          ctx.fillStyle = "#0066cc";
          ctx.fillRect(screenX + bossSize + 2*pixelSize3, enemy.y + 12*pixelSize3, 8*pixelSize3, 3*pixelSize3);
          ctx.fillStyle = "#00ffff";
          ctx.fillRect(screenX + bossSize + 8*pixelSize3, enemy.y + 13*pixelSize3, 3*pixelSize3, pixelSize3);
          break;
          
        case 'helicopter':
          // ATTACK HELICOPTER - 8-bit aerial design
          const pixelSize4 = Math.max(1, Math.floor(bossSize / 32));
          
          // Main body
          ctx.fillStyle = "#444444";
          ctx.fillRect(screenX + 4*pixelSize4, enemy.y + 12*pixelSize4, 24*pixelSize4, 12*pixelSize4);
          
          // Cockpit
          ctx.fillStyle = "#111111";
          ctx.fillRect(screenX + 8*pixelSize4, enemy.y + 14*pixelSize4, 16*pixelSize4, 8*pixelSize4);
          
          // Rotor blur effect (animated)
          ctx.fillStyle = "rgba(200, 200, 200, 0.3)";
          ctx.fillRect(screenX - 8*pixelSize4, enemy.y + 4*pixelSize4, bossSize + 16*pixelSize4, 3*pixelSize4);
          
          // Landing skids
          ctx.fillStyle = "#666666";
          ctx.fillRect(screenX + 2*pixelSize4, enemy.y + bossSize - 4*pixelSize4, bossSize - 4*pixelSize4, 2*pixelSize4);
          
          // Weapons/missiles
          ctx.fillStyle = "#333333";
          ctx.fillRect(screenX, enemy.y + 18*pixelSize4, 4*pixelSize4, 2*pixelSize4);
          ctx.fillRect(screenX + bossSize - 4*pixelSize4, enemy.y + 18*pixelSize4, 4*pixelSize4, 2*pixelSize4);
          
          // Warning lights
          ctx.fillStyle = "#ff0000";
          ctx.fillRect(screenX + 8*pixelSize4, enemy.y + 8*pixelSize4, 2*pixelSize4, 2*pixelSize4);
          ctx.fillRect(screenX + 22*pixelSize4, enemy.y + 8*pixelSize4, 2*pixelSize4, 2*pixelSize4);
          break;
      }
    }
  }, []);

  // Basic damage calculation
  const calculateDamage = useCallback((baseDamage: number) => {
    return Math.round(baseDamage);
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;

    if (state.gameState === "playing") {
      // Handle player horizontal movement and animation
      let currentMoveSpeed = GAME_CONFIG.player.moveSpeed;
        
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
        state.player.x -= currentMoveSpeed;
        state.player.direction = 'left';
        state.player.animationFrame = (state.player.animationFrame + 1) % 8;
      } else if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
        state.player.x += currentMoveSpeed;
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
            // Apply enhanced damage calculation
            const enhancedDamage = calculateDamage(bullet.damage);
            enemy.health -= enhancedDamage;
            state.bullets.splice(i, 1);
            
            // Create impact particles
            createParticles(enemy.x + GAME_CONFIG.enemy.size / 2, enemy.y + GAME_CONFIG.enemy.size / 2, 'blood', 3);
            
            if (enemy.health <= 0) {
              // Create explosion particles for enemy death
              createParticles(enemy.x + GAME_CONFIG.enemy.size / 2, enemy.y + GAME_CONFIG.enemy.size / 2, 'explosion', 8);
              state.camera.shake = Math.max(state.camera.shake, 5);
              
              // Check if this is the warden boss for objective tracking
              if (enemy.type === 'boss' && enemy.bossType === 'warden') {
                const wardenObjective = state.objectives.find(obj => obj.id === 'kill_warden');
                if (wardenObjective && !wardenObjective.completed) {
                  wardenObjective.currentCount++;
                  if (wardenObjective.currentCount >= (wardenObjective.targetCount || 0)) {
                    wardenObjective.completed = true;
                  }
                }
              }
              
              state.enemies.splice(j, 1);
              
              // Basic score
              const scoreGain = enemy.type === 'boss' ? 500 : 100;
              state.score += scoreGain;
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
          // Normal damage
          state.player.health -= 1;
          state.enemyBullets.splice(i, 1);
          
          if (state.player.health <= 0) {
            state.gameState = "gameOver";
            setGameState("gameOver");
          }
        }
      }

      // Check player-enemy collisions for contact damage
      for (const enemy of state.enemies) {
        if (enemy.type !== 'camera') { // Cameras don't cause contact damage
          const screenX = enemy.x - state.camera.x;
          if (screenX > -100 && screenX < GAME_CONFIG.canvas.width + 100) {
            const playerRect = { x: state.player.x, y: state.player.y, width: GAME_CONFIG.player.size, height: GAME_CONFIG.player.size };
            const enemySize = enemy.type === 'boss' ? 90 : GAME_CONFIG.enemy.size;
            const enemyRect = { x: enemy.x, y: enemy.y, width: enemySize, height: enemySize };
            
            if (checkCollision(playerRect, enemyRect)) {
              // Take contact damage (1 heart for guards/dogs, 2 hearts for boss)
              const contactDamage = enemy.type === 'boss' ? 2 : 1;
              state.player.health -= contactDamage;
              
              // Knockback effect - push player away from enemy
              const dx = state.player.x - enemy.x;
              const knockbackForce = 30;
              state.player.x += dx > 0 ? knockbackForce : -knockbackForce;
              
              // Add camera shake for impact
              state.camera.shake = Math.max(state.camera.shake, 8);
              
              // Create blood particles at collision point
              createParticles(state.player.x, state.player.y, 'blood', 3);
              
              if (state.player.health <= 0) {
                state.gameState = "gameOver";
                setGameState("gameOver");
              }
              break; // Only take damage from one enemy per frame
            }
          }
        }
      }

      // Check powerup collisions
      for (let i = state.powerups.length - 1; i >= 0; i--) {
        const powerup = state.powerups[i];
        if (checkCollision(
          { x: state.player.x, y: state.player.y, width: GAME_CONFIG.player.size, height: GAME_CONFIG.player.size },
          { x: powerup.x, y: powerup.y, width: 36, height: 36 }
        )) {
          if (powerup.type === 'health') {
            state.player.health = Math.min(GAME_CONFIG.player.maxHealth, state.player.health + 1);
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
          { x: prisoner.x, y: prisoner.y, width: prisoner.size, height: prisoner.size }
        )) {
          prisoner.isRescued = true;
          createParticles(prisoner.x + prisoner.size / 2, prisoner.y + prisoner.size / 2, 'spark', 8);
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
        state.gameState = "victoryIllustration";
        setGameState("victoryIllustration");
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
    
    // Foreground - stable razor wire fence and security elements
    const fenceSpacing = 25;
    const startX = Math.floor(-state.camera.x / fenceSpacing) * fenceSpacing - state.camera.x;
    
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 3;
    for (let x = startX; x < GAME_CONFIG.canvas.width + fenceSpacing; x += fenceSpacing) {
      const worldX = x + state.camera.x;
      
      // Main fence posts
      ctx.beginPath();
      ctx.moveTo(x, GAME_CONFIG.world.groundLevel - 80);
      ctx.lineTo(x, GAME_CONFIG.world.groundLevel);
      ctx.stroke();
      
      // Horizontal fence wires
      ctx.strokeStyle = "#888888";
      ctx.lineWidth = 1;
      for (let h = 0; h < 4; h++) {
        ctx.beginPath();
        ctx.moveTo(x, GAME_CONFIG.world.groundLevel - 20 - h * 15);
        ctx.lineTo(x + fenceSpacing, GAME_CONFIG.world.groundLevel - 20 - h * 15);
        ctx.stroke();
      }
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 3;
      
      // Razor wire coils (more stable positioning)
      if (Math.floor(worldX / 50) % 2 === 0) {
        ctx.strokeStyle = "#C0C0C0";
        ctx.lineWidth = 2;
        
        // Create more realistic coiled razor wire
        const coilY = GAME_CONFIG.world.groundLevel - 95;
        for (let i = 0; i < 3; i++) {
          const coilX = x + i * 8;
          // Main coil circle
          ctx.beginPath();
          ctx.arc(coilX, coilY, 6, 0, Math.PI * 2);
          ctx.stroke();
          
          // Sharp points/barbs
          ctx.strokeStyle = "#A0A0A0";
          ctx.lineWidth = 1;
          for (let barb = 0; barb < 6; barb++) {
            const angle = (barb * Math.PI * 2) / 6;
            const bX = coilX + Math.cos(angle) * 6;
            const bY = coilY + Math.sin(angle) * 6;
            ctx.beginPath();
            ctx.moveTo(bX, bY);
            ctx.lineTo(bX + Math.cos(angle) * 3, bY + Math.sin(angle) * 3);
            ctx.stroke();
          }
          ctx.strokeStyle = "#C0C0C0";
          ctx.lineWidth = 2;
        }
        
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 3;
      }
      
      // Security cameras on poles (more stable positioning)
      if (Math.floor((worldX + 25) / 100) % 2 === 0) {
        ctx.fillStyle = "#333333";
        ctx.fillRect(x - 3, GAME_CONFIG.world.groundLevel - 100, 6, 15);
        // Camera housing
        ctx.fillRect(x - 5, GAME_CONFIG.world.groundLevel - 105, 10, 8);
        // Red recording light
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(x - 1, GAME_CONFIG.world.groundLevel - 98, 2, 2);
        // Lens
        ctx.fillStyle = "#000000";
        ctx.fillRect(x - 2, GAME_CONFIG.world.groundLevel - 103, 4, 3);
      }
    }

    // Enhanced background details - prison buildings and structures
    ctx.fillStyle = "rgba(45, 45, 45, 0.6)";
    for (let x = -(slowParallax % 400); x < GAME_CONFIG.canvas.width; x += 400) {
      // Prison dormitory blocks
      ctx.fillRect(x + 50, 80, 120, 160);
      ctx.fillRect(x + 200, 100, 100, 140);
      
      // Windows with bars
      ctx.fillStyle = "rgba(255, 255, 150, 0.2)";
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 8; col++) {
          ctx.fillRect(x + 55 + col * 14, 90 + row * 25, 10, 15);
        }
      }
      ctx.fillStyle = "rgba(60, 60, 60, 0.8)";
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 8; col++) {
          // Vertical bars
          ctx.fillRect(x + 57 + col * 14, 88 + row * 25, 1, 19);
          ctx.fillRect(x + 61 + col * 14, 88 + row * 25, 1, 19);
          ctx.fillRect(x + 65 + col * 14, 88 + row * 25, 1, 19);
        }
      }
      
      // Air conditioning units and vents
      ctx.fillStyle = "rgba(80, 80, 80, 0.7)";
      ctx.fillRect(x + 60, 70, 25, 12);
      ctx.fillRect(x + 90, 75, 20, 8);
      ctx.fillRect(x + 130, 72, 15, 10);
      
      // Electrical equipment and satellite dishes
      ctx.fillStyle = "rgba(120, 120, 120, 0.5)";
      ctx.fillRect(x + 75, 65, 8, 8);
      ctx.fillRect(x + 110, 60, 12, 12);
      // Satellite dish
      ctx.beginPath();
      ctx.arc(x + 140, 65, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "rgba(45, 45, 45, 0.6)";
    }
    
    // Prison yard infrastructure
    for (let x = -(parallaxOffset % 300); x < GAME_CONFIG.canvas.width; x += 300) {
      // Guard towers with more detail
      ctx.fillStyle = "rgba(55, 55, 55, 0.8)";
      ctx.fillRect(x + 20, 30, 30, 70);
      // Tower roof
      ctx.fillStyle = "rgba(40, 40, 40, 0.9)";
      ctx.fillRect(x + 15, 25, 40, 10);
      // Windows
      ctx.fillStyle = "rgba(255, 255, 100, 0.3)";
      ctx.fillRect(x + 25, 40, 8, 12);
      ctx.fillRect(x + 37, 40, 8, 12);
      ctx.fillRect(x + 25, 60, 8, 12);
      ctx.fillRect(x + 37, 60, 8, 12);
      
      // Communication antennas
      ctx.strokeStyle = "#888888";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 35, 25);
      ctx.lineTo(x + 35, 10);
      ctx.stroke();
      
      // Floodlight fixtures
      ctx.fillStyle = "rgba(200, 200, 200, 0.6)";
      ctx.fillRect(x + 30, 35, 12, 6);
      ctx.fillRect(x + 30, 55, 12, 6);
      
      // Prison yard equipment
      ctx.fillStyle = "rgba(100, 100, 100, 0.4)";
      // Basketball hoops
      ctx.fillRect(x + 80, GAME_CONFIG.world.groundLevel - 80, 4, 80);
      ctx.fillRect(x + 76, GAME_CONFIG.world.groundLevel - 85, 12, 6);
      // Benches
      ctx.fillRect(x + 120, GAME_CONFIG.world.groundLevel - 15, 40, 8);
      ctx.fillRect(x + 125, GAME_CONFIG.world.groundLevel - 20, 4, 15);
      ctx.fillRect(x + 155, GAME_CONFIG.world.groundLevel - 20, 4, 15);
      
      // Garbage containers
      ctx.fillStyle = "rgba(60, 80, 60, 0.7)";
      ctx.fillRect(x + 180, GAME_CONFIG.world.groundLevel - 25, 15, 25);
      ctx.fillRect(x + 200, GAME_CONFIG.world.groundLevel - 25, 15, 25);
    }
    
    // Ground details - more realistic prison yard
    ctx.fillStyle = "rgba(120, 120, 120, 0.3)";
    for (let x = -(state.camera.x % 50); x < GAME_CONFIG.canvas.width; x += 50) {
      // Concrete slab lines
      ctx.fillRect(x, GAME_CONFIG.world.groundLevel - 2, 2, 2);
      // Drain grates
      if (x % 200 === 0) {
        ctx.fillStyle = "rgba(40, 40, 40, 0.8)";
        ctx.fillRect(x - 8, GAME_CONFIG.world.groundLevel - 8, 16, 8);
        // Grate lines
        ctx.fillStyle = "rgba(20, 20, 20, 0.9)";
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(x - 6 + i * 3, GAME_CONFIG.world.groundLevel - 7, 1, 6);
        }
        ctx.fillStyle = "rgba(120, 120, 120, 0.3)";
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
      
      // Steam vents and atmospheric effects
      ctx.fillStyle = "rgba(200, 200, 200, 0.1)";
      for (let i = 0; i < 8; i++) {
        const steamX = ((Date.now() * 0.03 + i * 80) % (GAME_CONFIG.canvas.width + 200)) - 100;
        const steamY = GAME_CONFIG.world.groundLevel - 30 - Math.sin(Date.now() * 0.002 + i) * 20;
        // Steam puff effect
        ctx.beginPath();
        ctx.arc(steamX, steamY, 5 + Math.sin(Date.now() * 0.003 + i) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Sparks from electrical equipment
      if (Math.random() < 0.1) {
        ctx.fillStyle = "rgba(255, 255, 100, 0.8)";
        const sparkX = Math.random() * GAME_CONFIG.canvas.width;
        const sparkY = 60 + Math.random() * 100;
        ctx.fillRect(sparkX, sparkY, 2, 2);
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
          ctx.fillRect(screenX, powerup.y, 36, 36);
          
          // Add icon
          ctx.fillStyle = "#ffffff";
          ctx.font = "16px Arial";
          ctx.textAlign = "center";
          const text = powerup.type === 'health' ? '+' : powerup.type === 'ammo' ? 'A' : 'W';
          ctx.fillText(text, screenX + 12, powerup.y + 16);
        }
      });

      // Draw farm animals (captured prisoners)
      state.prisoners.forEach((prisoner) => {
        const screenX = prisoner.x - state.camera.x;
        if (!prisoner.isRescued && screenX > -prisoner.size && screenX < GAME_CONFIG.canvas.width) {
          // Draw cage first
          ctx.strokeStyle = "#8B4513";
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i < prisoner.size; i += 8) {
            ctx.moveTo(screenX + i, prisoner.y - 5);
            ctx.lineTo(screenX + i, prisoner.y + prisoner.size + 5);
          }
          ctx.stroke();
          
          // Draw different farm animals
          switch (prisoner.animalType) {
            case 'pig':
              // Body - pink
              ctx.fillStyle = "#FFB6C1";
              ctx.fillRect(screenX + 8, prisoner.y + prisoner.size - 32, 32, 20);
              // Head
              ctx.fillStyle = "#FFC0CB";
              ctx.fillRect(screenX + 12, prisoner.y + prisoner.size - 44, 24, 16);
              // Snout
              ctx.fillStyle = "#FF69B4";
              ctx.fillRect(screenX + 16, prisoner.y + prisoner.size - 36, 16, 8);
              // Ears
              ctx.fillStyle = "#FFB6C1";
              ctx.fillRect(screenX + 14, prisoner.y + prisoner.size - 48, 6, 8);
              ctx.fillRect(screenX + 28, prisoner.y + prisoner.size - 48, 6, 8);
              // Legs
              ctx.fillStyle = "#FFB6C1";
              ctx.fillRect(screenX + 10, prisoner.y + prisoner.size - 12, 6, 12);
              ctx.fillRect(screenX + 32, prisoner.y + prisoner.size - 12, 6, 12);
              break;
              
            case 'cow':
              // Body - white with black spots
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(screenX + 8, prisoner.y + prisoner.size - 40, 48, 28);
              // Black spots
              ctx.fillStyle = "#000000";
              ctx.fillRect(screenX + 15, prisoner.y + prisoner.size - 35, 8, 6);
              ctx.fillRect(screenX + 35, prisoner.y + prisoner.size - 30, 6, 8);
              ctx.fillRect(screenX + 25, prisoner.y + prisoner.size - 25, 10, 5);
              // Head
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(screenX + 16, prisoner.y + prisoner.size - 56, 32, 20);
              // Black spot on head
              ctx.fillStyle = "#000000";
              ctx.fillRect(screenX + 20, prisoner.y + prisoner.size - 52, 12, 8);
              // Horns
              ctx.fillStyle = "#D2691E";
              ctx.fillRect(screenX + 18, prisoner.y + prisoner.size - 60, 4, 8);
              ctx.fillRect(screenX + 42, prisoner.y + prisoner.size - 60, 4, 8);
              // Legs
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(screenX + 12, prisoner.y + prisoner.size - 12, 8, 12);
              ctx.fillRect(screenX + 44, prisoner.y + prisoner.size - 12, 8, 12);
              break;
              
            case 'sheep':
              // Woolly body - white
              ctx.fillStyle = "#F5F5F5";
              ctx.fillRect(screenX + 6, prisoner.y + prisoner.size - 36, 40, 24);
              // Wool texture
              ctx.fillStyle = "#FFFFFF";
              for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 4; j++) {
                  ctx.fillRect(screenX + 8 + i * 6, prisoner.y + prisoner.size - 34 + j * 6, 4, 4);
                }
              }
              // Head - black
              ctx.fillStyle = "#2F2F2F";
              ctx.fillRect(screenX + 16, prisoner.y + prisoner.size - 48, 20, 16);
              // Legs
              ctx.fillStyle = "#2F2F2F";
              ctx.fillRect(screenX + 10, prisoner.y + prisoner.size - 12, 6, 12);
              ctx.fillRect(screenX + 36, prisoner.y + prisoner.size - 12, 6, 12);
              break;
              
            case 'duck':
              // Body - yellow
              ctx.fillStyle = "#FFD700";
              ctx.fillRect(screenX + 8, prisoner.y + prisoner.size - 24, 20, 16);
              // Head
              ctx.fillStyle = "#FFD700";
              ctx.fillRect(screenX + 12, prisoner.y + prisoner.size - 32, 16, 12);
              // Beak - orange
              ctx.fillStyle = "#FF8C00";
              ctx.fillRect(screenX + 8, prisoner.y + prisoner.size - 28, 8, 4);
              // Eye
              ctx.fillStyle = "#000000";
              ctx.fillRect(screenX + 16, prisoner.y + prisoner.size - 30, 2, 2);
              // Feet
              ctx.fillStyle = "#FF8C00";
              ctx.fillRect(screenX + 10, prisoner.y + prisoner.size - 8, 6, 8);
              ctx.fillRect(screenX + 20, prisoner.y + prisoner.size - 8, 6, 8);
              break;
              
            case 'goat':
              // Body - tan
              ctx.fillStyle = "#DEB887";
              ctx.fillRect(screenX + 8, prisoner.y + prisoner.size - 32, 32, 20);
              // Head
              ctx.fillStyle = "#D2B48C";
              ctx.fillRect(screenX + 12, prisoner.y + prisoner.size - 44, 24, 16);
              // Horns
              ctx.fillStyle = "#8B4513";
              ctx.fillRect(screenX + 14, prisoner.y + prisoner.size - 48, 3, 8);
              ctx.fillRect(screenX + 31, prisoner.y + prisoner.size - 48, 3, 8);
              // Beard
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(screenX + 22, prisoner.y + prisoner.size - 32, 4, 8);
              // Legs
              ctx.fillStyle = "#DEB887";
              ctx.fillRect(screenX + 10, prisoner.y + prisoner.size - 12, 6, 12);
              ctx.fillRect(screenX + 32, prisoner.y + prisoner.size - 12, 6, 12);
              break;
              
            case 'horse':
              // Body - brown
              ctx.fillStyle = "#8B4513";
              ctx.fillRect(screenX + 8, prisoner.y + prisoner.size - 40, 48, 28);
              // Head
              ctx.fillStyle = "#A0522D";
              ctx.fillRect(screenX + 16, prisoner.y + prisoner.size - 56, 32, 20);
              // Mane
              ctx.fillStyle = "#654321";
              ctx.fillRect(screenX + 20, prisoner.y + prisoner.size - 64, 24, 12);
              // Ears
              ctx.fillStyle = "#8B4513";
              ctx.fillRect(screenX + 18, prisoner.y + prisoner.size - 60, 4, 8);
              ctx.fillRect(screenX + 42, prisoner.y + prisoner.size - 60, 4, 8);
              // Legs
              ctx.fillStyle = "#8B4513";
              ctx.fillRect(screenX + 12, prisoner.y + prisoner.size - 12, 8, 12);
              ctx.fillRect(screenX + 44, prisoner.y + prisoner.size - 12, 8, 12);
              // Hooves
              ctx.fillStyle = "#2F2F2F";
              ctx.fillRect(screenX + 12, prisoner.y + prisoner.size - 4, 8, 4);
              ctx.fillRect(screenX + 44, prisoner.y + prisoner.size - 4, 8, 4);
              break;
          }
          
          // Rescue indicator
          ctx.fillStyle = "rgba(0, 255, 0, 0.7)";
          ctx.fillRect(screenX, prisoner.y - 12, prisoner.size, 4);
          ctx.fillStyle = "#ffffff";
          ctx.font = "10px Arial";
          ctx.textAlign = "center";
          ctx.fillText("RESCUE", screenX + prisoner.size / 2, prisoner.y - 14);
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

      // BADASS MILITARY-STYLE HUD
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      
      // === TOP-LEFT TACTICAL DISPLAY ===
      // Main HUD frame with military styling
      const hudX = 10;
      const hudY = 10;
      const hudWidth = 380;
      const hudHeight = 200;
      
      // Outer tactical frame (dark green military style)
      ctx.fillStyle = "#0a1a0a";
      ctx.fillRect(hudX - 3, hudY - 3, hudWidth + 6, hudHeight + 6);
      
      // Inner frame with subtle gradient
      const gradient = ctx.createLinearGradient(hudX, hudY, hudX, hudY + hudHeight);
      gradient.addColorStop(0, "rgba(20, 40, 20, 0.95)");
      gradient.addColorStop(1, "rgba(10, 25, 10, 0.95)");
      ctx.fillStyle = gradient;
      ctx.fillRect(hudX, hudY, hudWidth, hudHeight);
      
      // Corner brackets for tactical look
      ctx.strokeStyle = "#00ff41";
      ctx.lineWidth = 2;
      const bracketSize = 15;
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(hudX, hudY + bracketSize);
      ctx.lineTo(hudX, hudY);
      ctx.lineTo(hudX + bracketSize, hudY);
      ctx.stroke();
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(hudX + hudWidth - bracketSize, hudY);
      ctx.lineTo(hudX + hudWidth, hudY);
      ctx.lineTo(hudX + hudWidth, hudY + bracketSize);
      ctx.stroke();
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(hudX, hudY + hudHeight - bracketSize);
      ctx.lineTo(hudX, hudY + hudHeight);
      ctx.lineTo(hudX + bracketSize, hudY + hudHeight);
      ctx.stroke();
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(hudX + hudWidth - bracketSize, hudY + hudHeight);
      ctx.lineTo(hudX + hudWidth, hudY + hudHeight);
      ctx.lineTo(hudX + hudWidth, hudY + hudHeight - bracketSize);
      ctx.stroke();
      
      // === MISSION HEADER ===
      ctx.font = "bold 16px 'Courier New', monospace";
      ctx.fillStyle = "#00ff41";
      ctx.textAlign = "left";
      ctx.fillText(`OPERATION: ${state.level.name.toUpperCase()}`, hudX + 15, hudY + 25);
      
      // === VITAL STATS ROW ===
      const statsY = hudY + 50;
      
      // Health Display (Military style)
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillStyle = "#ff4444";
      ctx.fillText("VITALS:", hudX + 15, statsY);
      
      // Health bar background
      const healthBarX = hudX + 80;
      const healthBarY = statsY - 12;
      const healthBarWidth = 120;
      const healthBarHeight = 16;
      
      ctx.fillStyle = "#330000";
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
      
      // Health bar fill
      const healthPercent = state.player.health / GAME_CONFIG.player.maxHealth;
      const healthWidth = healthBarWidth * healthPercent;
      const healthColor = healthPercent > 0.6 ? "#00ff00" : healthPercent > 0.3 ? "#ffaa00" : "#ff0000";
      ctx.fillStyle = healthColor;
      ctx.fillRect(healthBarX, healthBarY, healthWidth, healthBarHeight);
      
      // Health bar border
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 1;
      ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
      
      // Health numbers
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${state.player.health}/${GAME_CONFIG.player.maxHealth}`, healthBarX + healthBarWidth/2, statsY - 2);
      
      // === WEAPON DISPLAY ===
      const weaponY = statsY + 25;
      ctx.textAlign = "left";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillStyle = "#ffaa00";
      ctx.fillText("WEAPON:", hudX + 15, weaponY);
      
      // Weapon info with tactical styling
      ctx.font = "bold 12px 'Courier New', monospace";
      ctx.fillStyle = WEAPONS_INFO[state.player.weapon].color;
      ctx.fillText(`${WEAPONS_INFO[state.player.weapon].name.toUpperCase()}`, hudX + 85, weaponY);
      
      // Ammo count with box
      const ammoBoxX = hudX + 180;
      const ammoBoxY = weaponY - 12;
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(ammoBoxX, ammoBoxY, 50, 16);
      ctx.strokeStyle = "#666666";
      ctx.strokeRect(ammoBoxX, ammoBoxY, 50, 16);
      
      ctx.fillStyle = "#00ffff";
      ctx.textAlign = "center";
      ctx.fillText(`${state.player.ammo}`, ammoBoxX + 25, weaponY - 2);
      
      // === TACTICAL INTEL ===
      const intelY = weaponY + 30;
      ctx.textAlign = "left";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillStyle = "#00aaff";
      ctx.fillText("INTEL:", hudX + 15, intelY);
      
      // Score and Distance in tactical format
      ctx.font = "11px 'Courier New', monospace";
      ctx.fillStyle = "#aaaaaa";
      ctx.fillText(`SCORE: ${state.score.toString().padStart(6, '0')}`, hudX + 70, intelY);
      ctx.fillText(`DISTANCE: ${state.distance}M`, hudX + 200, intelY);
      
      // === ALERT LEVEL ===
      const alertY = intelY + 25;
      ctx.font = "bold 12px 'Courier New', monospace";
      ctx.fillStyle = "#ff8800";
      ctx.fillText("THREAT LEVEL:", hudX + 15, alertY);
      
      // Alert level bar with advanced styling
      const alertBarX = hudX + 120;
      const alertBarY = alertY - 10;
      const alertBarWidth = 100;
      const alertBarHeight = 12;
      
      // Alert bar background
      ctx.fillStyle = "#001100";
      ctx.fillRect(alertBarX, alertBarY, alertBarWidth, alertBarHeight);
      
      // Alert bar segments
      const alertPercent = state.alertLevel / 100;
      const segmentWidth = alertBarWidth / 5;
      for (let i = 0; i < 5; i++) {
        const segmentFill = Math.max(0, Math.min(1, (alertPercent * 5) - i));
        if (segmentFill > 0) {
          let segmentColor;
          if (i < 2) segmentColor = "#00ff00";
          else if (i < 4) segmentColor = "#ffaa00";
          else segmentColor = "#ff0000";
          
          ctx.fillStyle = segmentColor;
          ctx.fillRect(alertBarX + (i * segmentWidth) + 1, alertBarY + 1, (segmentWidth - 2) * segmentFill, alertBarHeight - 2);
        }
      }
      
      // Alert level border
      ctx.strokeStyle = "#444444";
      ctx.lineWidth = 1;
      ctx.strokeRect(alertBarX, alertBarY, alertBarWidth, alertBarHeight);
      
      // Alert level text
      const alertLevel = Math.floor(alertPercent * 5) + 1;
      const alertLabels = ["CLEAR", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
      ctx.fillStyle = "#ffffff";
      ctx.font = "9px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(alertLabels[Math.min(4, alertLevel - 1)], alertBarX + alertBarWidth/2, alertY + 5);
      
      // === MISSION OBJECTIVES ===
      const objStartY = alertY + 25;
      ctx.textAlign = "left";
      ctx.font = "bold 12px 'Courier New', monospace";
      ctx.fillStyle = "#ffff00";
      ctx.fillText("MISSION OBJECTIVES:", hudX + 15, objStartY);
      
      ctx.font = "10px 'Courier New', monospace";
      let objY = objStartY + 15;
      state.objectives.forEach((objective, _index) => {
        const color = objective.completed ? "#00ff00" : "#ffffff";
        ctx.fillStyle = color;
        const status = objective.completed ? "[✓]" : "[ ]";
        let text = `${status} ${objective.description.toUpperCase()}`;
        
        if (objective.targetCount) {
          text += ` (${objective.currentCount}/${objective.targetCount})`;
        }
        if (objective.timeRemaining !== undefined) {
          const seconds = Math.ceil(objective.timeRemaining / 1000);
          text += ` - ${seconds}S`;
        }
        
        ctx.fillText(text, hudX + 20, objY);
        objY += 12;
      });
      
      
      
      // === TOP-RIGHT COMPASS AND STATUS ===
      const compassX = GAME_CONFIG.canvas.width - 120;
      const compassY = 20;
      const compassSize = 80;
      
      // Compass background
      ctx.fillStyle = "rgba(10, 20, 10, 0.9)";
      ctx.fillRect(compassX, compassY, compassSize, compassSize);
      
      // Compass border
      ctx.strokeStyle = "#00ff41";
      ctx.lineWidth = 2;
      ctx.strokeRect(compassX, compassY, compassSize, compassSize);
      
      // Compass circle
      const compassCenterX = compassX + compassSize / 2;
      const compassCenterY = compassY + compassSize / 2;
      const compassRadius = 30;
      
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(compassCenterX, compassCenterY, compassRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Direction indicator (always points right for "EAST" toward escape)
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(compassCenterX, compassCenterY);
      ctx.lineTo(compassCenterX + compassRadius * 0.8, compassCenterY);
      ctx.stroke();
      
      // Compass labels
      ctx.font = "bold 10px 'Courier New', monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("E", compassCenterX + compassRadius + 8, compassCenterY + 4);
      ctx.fillText("ESCAPE", compassCenterX, compassY + compassSize + 12);
      
      // Reset all drawing settings
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
      ctx.lineWidth = 1;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [drawPlayer, drawEnemy, checkCollision, applyGravity, generateObstacles, generateEnemies, generatePowerups, createParticles, updateParticles, updateEnemyAI, spawnBoss, updateBoss, calculateDamage]);


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
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.canvas.width}
        height={GAME_CONFIG.canvas.height}
        className="block cursor-crosshair w-full h-full object-contain"
      />
      
      {gameState === "start" && (
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/background.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#000000'
          }}
        >
          {/* Start Button */}
          <div className="absolute bottom-8 sm:bottom-16 left-1/2 transform -translate-x-1/2">
            <button
              onClick={startStory}
              className="arcade-start-button text-2xl sm:text-3xl md:text-4xl font-bold px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 border-2 sm:border-4 text-yellow-300 border-yellow-300 bg-black bg-opacity-50 hover:bg-yellow-300 hover:text-black transition-colors"
              style={{
                fontFamily: 'monospace',
                letterSpacing: '2px',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                animation: 'blink 1.5s infinite'
              }}
            >
              START
            </button>
          </div>
        </div>
      )}

      {gameState === "story" && (
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${STORY_SLIDES[storySlide].bgColor}`}
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 120, 120, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(120, 120, 120, 0.15) 0%, transparent 50%)',
          }}
        >
          <div className="text-center text-white max-w-4xl mx-4 px-4">
            {(() => {
              const slide = STORY_SLIDES[storySlide];
              return (
                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                  {/* Chapter indicator with comic styling */}
                  <div className="text-sm sm:text-base md:text-lg font-bold text-white bg-black bg-opacity-50 px-3 sm:px-4 py-1 sm:py-2 rounded-full border-2 border-white">
                    CHAPTER {storySlide + 1} OF {STORY_SLIDES.length}
                  </div>
                  
                  {/* Comic Title */}
                  <div className="space-y-2 sm:space-y-3 md:space-y-4">
                    <h2 
                      className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black ${slide.color} transform -rotate-1`}
                      style={{
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textShadow: '2px 2px 0px #000000, 4px 4px 0px rgba(0,0,0,0.3)',
                        letterSpacing: '1px'
                      }}
                    >
                      {slide.title}
                    </h2>
                    <h3 
                      className="text-lg sm:text-xl md:text-2xl font-bold text-white transform rotate-1"
                      style={{
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textShadow: '1px 1px 0px #000000'
                      }}
                    >
                      {slide.subtitle}
                    </h3>
                  </div>
                  
                  {/* Illustration Panel */}
                  <div 
                    className="relative bg-white p-4 rounded-lg border-8 border-black transform rotate-1 shadow-2xl"
                    style={{
                      boxShadow: '8px 8px 0px #000000, 12px 12px 0px rgba(0,0,0,0.5)'
                    }}
                  >
                    {/* Comic book dotted pattern overlay */}
                    <div 
                      className="absolute inset-0 opacity-10 rounded-lg pointer-events-none"
                      style={{
                        backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                        backgroundSize: '8px 8px'
                      }}
                    />
                    
                    {/* Main illustration */}
                    <div className="relative overflow-hidden rounded-lg border-4 border-gray-800">
                      <img 
                        src={slide.image}
                        alt={`${slide.title} - ${slide.subtitle}`}
                        className="w-full h-auto max-h-96 object-contain bg-gradient-to-br from-gray-100 to-gray-200"
                        style={{
                          filter: 'contrast(1.1) saturate(1.2)',
                          imageRendering: 'crisp-edges'
                        }}
                        onError={(e) => {
                          console.log(`Failed to load image: ${slide.image}`);
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNPTUlORyBTT09OPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                      
                      {/* Comic book style action text overlay */}
                      <div className="absolute bottom-2 right-2 bg-yellow-400 text-black px-3 py-1 rounded-full border-2 border-black text-sm font-bold transform rotate-12 shadow-lg">
                        CHAPTER {storySlide + 1}
                      </div>
                    </div>
                    
                    {/* Vintage comic book corner marks */}
                    <div className="absolute top-1 left-1 w-4 h-4 border-l-4 border-t-4 border-red-600 opacity-60"></div>
                    <div className="absolute top-1 right-1 w-4 h-4 border-r-4 border-t-4 border-red-600 opacity-60"></div>
                    <div className="absolute bottom-1 left-1 w-4 h-4 border-l-4 border-b-4 border-red-600 opacity-60"></div>
                    <div className="absolute bottom-1 right-1 w-4 h-4 border-r-4 border-b-4 border-red-600 opacity-60"></div>
                  </div>
                  
                  {/* Enhanced narrative text with dramatic styling */}
                  <div className="relative bg-gradient-to-br from-gray-900 to-black p-4 sm:p-6 md:p-8 rounded-lg border-2 sm:border-4 border-yellow-600 transform -rotate-1 shadow-2xl">
                    {/* Decorative corner flourishes */}
                    <div className="absolute top-1 sm:top-2 left-1 sm:left-2 text-yellow-500 text-lg sm:text-xl md:text-2xl opacity-50">📖</div>
                    <div className="absolute top-1 sm:top-2 right-1 sm:right-2 text-yellow-500 text-lg sm:text-xl md:text-2xl opacity-50">✨</div>
                    
                    {/* Main story text */}
                    <div className="relative">
                      <p 
                        className="text-sm sm:text-base md:text-lg lg:text-xl text-white leading-relaxed font-semibold italic"
                        style={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0 0 5px rgba(255,255,255,0.1)',
                          lineHeight: '1.6'
                        }}
                      >
                        {slide.text}
                      </p>
                      
                      {/* Dramatic accent line */}
                      <div className="mt-4 w-full h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 rounded-full"></div>
                      
                      {/* Atmospheric quote marks */}
                      <div className="absolute -top-3 -left-3 text-yellow-400 text-4xl opacity-60 font-serif">"</div>
                      <div className="absolute -bottom-1 -right-3 text-yellow-400 text-4xl opacity-60 font-serif transform rotate-180">"</div>
                    </div>
                  </div>
                  
                  {/* Navigation with comic styling */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 sm:pt-6">
                    <button
                      onClick={skipStory}
                      className="text-base sm:text-lg md:text-xl font-bold px-4 sm:px-6 py-2 sm:py-3 border-2 sm:border-4 text-gray-300 border-gray-300 bg-black bg-opacity-70 hover:bg-gray-300 hover:text-black transition-colors"
                      style={{
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        letterSpacing: '1px',
                        textShadow: '1px 1px 0px #000000'
                      }}
                    >
                      SKIP STORY
                    </button>
                    <button
                      onClick={nextStorySlide}
                      className="text-lg sm:text-xl md:text-2xl font-bold px-6 sm:px-8 py-3 sm:py-4 border-2 sm:border-4 text-yellow-300 border-yellow-300 bg-black bg-opacity-70 hover:bg-yellow-300 hover:text-black transition-colors"
                      style={{
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        letterSpacing: '1px',
                        textShadow: '1px 1px 0px #000000',
                        animation: 'blink 2s infinite'
                      }}
                    >
                      {storySlide < STORY_SLIDES.length - 1 ? 
                        "CONTINUE!" : "BEGIN THE ESCAPE!"}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {gameState === "gameOver" && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            backgroundImage: 'url(/Endscreenfinal.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#000000'
          }}
        >
          {/* Game stats overlay positioned above the restart button */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white bg-black bg-opacity-70 px-3 sm:px-4 py-2 rounded-lg">
            <p className="text-base sm:text-lg font-bold">Score: {displayScore}</p>
            <p className="text-sm sm:text-base">Distance: {distance}m</p>
          </div>
          
          {/* Restart button positioned at the bottom */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={restartCurrentLevel}
              className="text-lg sm:text-xl md:text-2xl font-bold px-6 sm:px-8 py-3 sm:py-4 border-2 sm:border-4 text-yellow-300 border-yellow-300 bg-black bg-opacity-80 hover:bg-yellow-300 hover:text-black transition-colors not-prose"
              style={{
                fontFamily: 'monospace',
                letterSpacing: '1px',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
              }}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {gameState === "bossIntro" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-85 rounded-lg px-4">
          <div className="text-center text-white max-w-md">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-red-500 animate-pulse">⚠️ BOSS ENCOUNTER ⚠️</h2>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 text-yellow-400">
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

      {gameState === "victoryIllustration" && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundImage: 'url(/endscreenvictory.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#000000'
          }}
        >
          {/* Continue button to proceed to scores */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => {
                const state = gameStateRef.current;
                state.gameState = "missionComplete";
                setGameState("missionComplete");
              }}
              className="text-3xl font-bold px-12 py-6 border-4 text-yellow-300 border-yellow-300 bg-black bg-opacity-80 hover:bg-yellow-300 hover:text-black transition-colors transform hover:scale-105"
              style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                letterSpacing: '2px',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                animation: 'blink 2s infinite'
              }}
            >
              🏆 CONTINUE 🏆
            </button>
          </div>
        </div>
      )}

      {gameState === "missionComplete" && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90"
        >
          {/* Epic Victory Title */}
          <div className="text-center mb-8">
            <h1 
              className="text-8xl font-black text-yellow-400 mb-4 animate-pulse"
              style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                textShadow: '6px 6px 0px #000000, 12px 12px 0px rgba(255,215,0,0.5)',
                letterSpacing: '4px',
                transform: 'rotate(-2deg)'
              }}
            >
              FREEDOM!
            </h1>
            <h2 
              className="text-4xl font-bold text-white mb-2"
              style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                textShadow: '3px 3px 0px #000000, 6px 6px 0px rgba(0,0,0,0.7)',
                letterSpacing: '2px'
              }}
            >
              THE LEGEND OF RED COMPLETE
            </h2>
          </div>

          {/* Epic Achievement Stats */}
          <div className="bg-black bg-opacity-80 p-8 rounded-lg border-4 border-yellow-400 mb-8 max-w-4xl">
            <div className="text-center text-white space-y-4">
              <p className="text-2xl font-bold text-yellow-400">
                🏆 BLACKWATER MAXIMUM SECURITY PRISON - CONQUERED 🏆
              </p>
              
              <div className="grid grid-cols-2 gap-6 my-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{displayScore}</p>
                  <p className="text-lg text-gray-300">LEGENDARY SCORE</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-400">{distance}m</p>
                  <p className="text-lg text-gray-300">DISTANCE OF GLORY</p>
                </div>
              </div>

              <div className="space-y-2 text-lg">
                <p className="text-green-400 font-bold">⚔️ The Corrupt Warden - DEFEATED</p>
                <p className="text-green-400 font-bold">🛡️ Riot Captain - CRUSHED</p>
                <p className="text-green-400 font-bold">🤖 Cyber Security Chief - DEMOLISHED</p>
                <p className="text-green-400 font-bold">🚁 Attack Helicopter - DESTROYED</p>
              </div>
            </div>
          </div>

          {/* Epic Story Conclusion */}
          <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-lg border-4 border-red-600 mb-8 max-w-5xl">
            <div className="text-center">
              <p 
                className="text-2xl text-white leading-relaxed font-semibold italic mb-4"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  lineHeight: '1.6'
                }}
              >
                Against impossible odds, through blood and thunder, Red the Magnificent has shattered every chain, 
                defeated every enemy, and torn down the walls of corruption. 
              </p>
              <p 
                className="text-xl text-yellow-300 font-bold"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }}
              >
                The farm animals are FREE. Wilbur's sacrifice is HONORED. Justice is SERVED.
              </p>
              <div className="mt-4 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-400 to-red-600 rounded-full"></div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={resetGame}
            className="text-3xl font-bold px-12 py-6 border-4 text-yellow-300 border-yellow-300 bg-black bg-opacity-80 hover:bg-yellow-300 hover:text-black transition-colors transform hover:scale-105"
            style={{
              fontFamily: 'Impact, Arial Black, sans-serif',
              letterSpacing: '2px',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
              animation: 'blink 2s infinite'
            }}
          >
            🐓 ANOTHER LEGEND AWAITS 🐓
          </button>
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