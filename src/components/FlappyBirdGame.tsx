/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback } from "react";
import { Enemy } from "./game/types";

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
    spawnImmunity: number;
    spawnState: 'in_cell' | 'breaking_out' | 'free';
    cellBreakTimer: number;
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
    type: 'guard' | 'dog' | 'boss';
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
    hitFlash?: number;
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
    type: 'fence' | 'crate' | 'platform' | 'ground' | 'door' | 'switch';
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
  combo: number;
  comboMultiplier: number;
  lastKillTime: number;
  gameState: "start" | "story" | "playing" | "paused" | "gameOver" | "missionComplete" | "victoryIllustration" | "levelComplete";
  storySlide: number;
}

type WeaponType = 'pistol' | 'shotgun' | 'rifle' | 'grenade';

// Utility Functions (removed unused functions)

// Game Configuration Constants
const GAME_CONFIG = {
  canvas: {
    width: 1200,
    height: 800,
  },
  player: {
    size: 48,
    maxHealth: 10,  // Reduced for more challenging gameplay
    gravity: 0.6,  // Slightly easier than original 0.8
    jumpForce: -17,  // Slightly easier than original -20
    moveSpeed: 11,  // Slightly faster than original 10
    scrollSpeed: 5,
  },
  weapons: {
    pistol: { damage: 25, fireRate: 250, ammo: 75, spread: 0 },  // Balanced improvements
    shotgun: { damage: 20, fireRate: 700, ammo: 30, spread: 0.28, bulletCount: 6 },  // Moderate improvements
    rifle: { damage: 45, fireRate: 125, ammo: 45, spread: 0.08 },  // Balanced improvements
    grenade: { damage: 80, fireRate: 1800, ammo: 8, spread: 0 },  // Strong but not one-shot
  },
  enemy: {
    size: 42,
    health: 45,  // Balanced - not too weak, not too strong
    fireRate: 2000,  // Moderate - not too fast, not too slow
    gravity: 0.8,
  },
  bullet: {
    speed: 25,  // Increased from 18 - faster bullets
    size: 12,  // Increased from 9 - bigger bullets, easier to hit
  },
  world: {
    groundLevel: 750,
  },
  // Extracted magic numbers
  distances: {
    SAFE_SPAWN_ZONE: 600,
    BOSS_SPAWN_DISTANCE: 300,
    CAMERA_FOLLOW_OFFSET: 600,
  },
  cooldowns: {
    MULTI_SHOT: 2000,  // Reduced from 4000 - more frequent
    EXECUTION_DASH: 3000,  // Reduced from 6000 - more frequent
    BERSERKER_MODE: 5000,  // Reduced from 8000 - more frequent
    SPAWN_IMMUNITY: 3000,  // Increased from 2000 - longer immunity
  },
  particles: {
    EXPLOSION_COUNT: 30,
    BLOOD_COUNT: 8,
    SPARK_COUNT: 10,
    LIFETIME: 1000,
  },
  ui: {
    HEALTH_BAR_WIDTH: 200,
    HEALTH_BAR_HEIGHT: 20,
    PROGRESS_BAR_WIDTH: 300,
    PROGRESS_BAR_HEIGHT: 10,
  }
};

const WEAPONS_INFO = {
  pistol: { name: "Pistol", color: "#888888" },
  shotgun: { name: "Shotgun", color: "#8B4513" },
  rifle: { name: "Rifle", color: "#2F4F4F" },
  grenade: { name: "Grenade", color: "#556B2F" },
};

const STORY_SLIDES = [
  {
    text: "Red the Magnificent - three-time champion and beloved guardian of Blackwater Farm. His morning crow meant safety, his watch meant peace.",
    image: "/panel1.png",
    color: "text-yellow-400",
    bgColor: "from-yellow-900 to-yellow-700",
    panelBg: "bg-yellow-100 text-black"
  },
  {
    text: "Screams pierced the night. Cruel laughter echoed behind the barn. Red discovered the horrifying truth - guards tortured innocent animals for sport.",
    image: "/panel2.png",
    color: "text-red-400",
    bgColor: "from-red-900 to-red-700", 
    panelBg: "bg-red-100 text-black"
  },
  {
    text: "Wilbur threw himself between the guards and the piglets. \"Take me instead!\" The baton fell. \"Promise me,\" he whispered, \"save them all.\"",
    image: "/panel3.png",
    color: "text-purple-400",
    bgColor: "from-purple-900 to-purple-700",
    panelBg: "bg-purple-100 text-black"
  },
  {
    text: "Now branded the most dangerous prisoner in Blackwater, Red faces maximum security. Tonight, he breaks free or dies trying. The great escape begins!",
    image: "/panel4.png",
    color: "text-orange-400",
    bgColor: "from-orange-900 to-orange-700",
    panelBg: "bg-orange-100 text-black"
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
      health: 400, // Increased for longer, more strategic fight with less frequent shooting
      size: 90,
      attackPattern: "charge_and_shoot",
      description: "The corrupt warden blocks your escape with his massive shotgun!",
    },
  },
};

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const gameStateRef = useRef<GameState>({
    player: {
      x: 400, // World position (not relative to camera)
      y: GAME_CONFIG.world.groundLevel - GAME_CONFIG.player.size,
      velocityY: 0,
      health: GAME_CONFIG.player.maxHealth,
      weapon: 'shotgun',
      ammo: GAME_CONFIG.weapons.shotgun.ammo,
      onGround: true,
      animationFrame: 0,
      direction: 'right',
      spawnImmunity: 2000, // 2 seconds of spawn immunity
      spawnState: 'in_cell',
      cellBreakTimer: 0,
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
    combo: 0,
    comboMultiplier: 1.0,
    lastKillTime: 0,
    gameState: "start",
    storySlide: 0,
  });
  
  const animationRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotTime = useRef<number>(0);
  
  // Special ability cooldowns
  const lastDashTime = useRef<number>(0);
  const lastBerserkerTime = useRef<number>(0);
  const berserkerEndTime = useRef<number>(0);

  const [displayScore, setDisplayScore] = useState(0);
  const [gameState, setGameState] = useState<"start" | "story" | "playing" | "paused" | "gameOver" | "missionComplete" | "victoryIllustration" | "levelComplete">("start");
  const [distance, setDistance] = useState(0);
  const [storySlide, setStorySlide] = useState(0);
  const [showControls, setShowControls] = useState(false);
  
  // Sound system using Web Audio API
  const audioContext = useRef<AudioContext | null>(null);
  const soundEnabled = useRef(true);
  
  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);
  
  const playSound = useCallback((type: 'shoot' | 'hit' | 'damage' | 'jump' | 'powerup' | 'explosion') => {
    if (!soundEnabled.current || !audioContext.current) return;
    
    const ctx = audioContext.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const currentTime = ctx.currentTime;
    
    switch(type) {
      case 'shoot':
        oscillator.frequency.setValueAtTime(300, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.1);
        break;
        
      case 'hit':
        oscillator.frequency.setValueAtTime(150, currentTime);
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.2, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.05);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.05);
        break;
        
      case 'damage':
        oscillator.frequency.setValueAtTime(80, currentTime);
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.4, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.2);
        break;
        
      case 'jump':
        oscillator.frequency.setValueAtTime(400, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.2, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.1);
        break;
        
      case 'powerup':
        oscillator.frequency.setValueAtTime(800, currentTime);
        oscillator.frequency.linearRampToValueAtTime(1200, currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.2);
        break;
        
      case 'explosion': {
        // White noise for explosion
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, currentTime + 0.3);
        
        whiteNoise.connect(filter);
        filter.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0.5, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        
        whiteNoise.start(currentTime);
        whiteNoise.stop(currentTime + 0.3);
        break;
      }
    }
  }, []);

  const resetGame = useCallback(() => {
    gameStateRef.current = {
      player: {
        x: 400,
        y: GAME_CONFIG.world.groundLevel - GAME_CONFIG.player.size,
        velocityY: 0,
        health: GAME_CONFIG.player.maxHealth,
        weapon: 'shotgun',
        ammo: GAME_CONFIG.weapons.shotgun.ammo,
        onGround: true,
        animationFrame: 0,
        direction: 'right',
        spawnImmunity: 2000, // 2 seconds of spawn immunity
        spawnState: 'in_cell',
        cellBreakTimer: 0,
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
      combo: 0,
      comboMultiplier: 1,
      lastKillTime: 0,
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
    const _state = gameStateRef.current;
    const obstacles: typeof _state.obstacles = [];
    
    // Generate ground segments
    for (let x = startX; x < endX; x += 40) {
      obstacles.push({
        x,
        y: GAME_CONFIG.world.groundLevel,
        width: 40,
        height: GAME_CONFIG.canvas.height - GAME_CONFIG.world.groundLevel,
        type: 'ground',
        isDestructible: true,
        isInteractive: false,
        health: 50,
        maxHealth: 50,
      });
    }
    
    // Generate prison walls and obstacles
    for (let x = startX; x < endX; x += 100 + Math.random() * 100) {
      const obstacleType = Math.random();
      
      if (obstacleType < 0.5) {
        // More platforms for jumping gameplay
        const baseHeight = 80 + Math.random() * 40;
        const width = 60 + Math.random() * 40;
        const platformThickness = 15 + Math.random() * 10;
        
        // Create main platform
        obstacles.push({
          x: x + Math.random() * 50,
          y: GAME_CONFIG.world.groundLevel - baseHeight,
          width: width,
          height: platformThickness,
          type: 'platform',
          isDestructible: true,
          isInteractive: false,
          health: 30,
          maxHealth: 30,
        });
        
        // 30% chance for a second level platform above
        if (Math.random() < 0.3) {
          const upperHeight = baseHeight + 60 + Math.random() * 30;
          obstacles.push({
            x: x + Math.random() * 30,
            y: GAME_CONFIG.world.groundLevel - upperHeight,
            width: width * 0.7,
            height: platformThickness,
            type: 'platform',
            isDestructible: true,
            isInteractive: false,
            health: 30,
            maxHealth: 30,
          });
        }
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
          isDestructible: true,
          isInteractive: false,
          health: 20,
          maxHealth: 20,
        });
      }
    }
    
    return obstacles;
  }, []);

  const generateEnemies = useCallback((startX: number, endX: number) => {
    const enemies: GameState['enemies'] = [];
    
    // Create safe spawn zone around player (400 +/- 500 = -100 to 900)
    const playerSpawnX = 400;
    const safeZoneRadius = 500;
    const safeZoneStart = playerSpawnX - safeZoneRadius;
    const safeZoneEnd = playerSpawnX + safeZoneRadius;
    
    for (let x = startX; x < endX; x += 200 + Math.random() * 200) {
      const enemyType = Math.random() < 0.7 ? 'guard' : 'dog'; // Removed camera/tower enemies
      const enemyY = GAME_CONFIG.world.groundLevel - GAME_CONFIG.enemy.size;
      
      const enemyX = x + Math.random() * 200;
      
      // Skip enemies that would spawn in the safe zone around player
      if (enemyX >= safeZoneStart && enemyX <= safeZoneEnd) {
        continue;
      }
      
      enemies.push({
        x: enemyX,
        y: enemyY,
        velocityY: 0,
        health: GAME_CONFIG.enemy.health,
        maxHealth: GAME_CONFIG.enemy.health,
        type: enemyType,
        lastShotTime: 0,
        onGround: enemyType !== 'dog',
        aiState: 'patrol',
        alertLevel: 0,
        lastPlayerSeen: 0,
      });
    }
    
    return enemies;
  }, []);

  const generatePowerups = useCallback(() => {
    // Powerups removed for simplified gameplay
    return [];
  }, []);

  const generateObjectives = useCallback(() => {
    const objectives = [];
    
    // Primary objectives - simple and clear
    objectives.push({
      id: 'reach_boss',
      type: 'escape' as const,
      description: 'Reach 300m to face the Warden',
      targetCount: 300,
      currentCount: 0,
      completed: false,
    });
    
    objectives.push({
      id: 'kill_warden',
      type: 'destroy' as const,
      description: 'Defeat the Corrupt Warden',
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
    state.player.weapon = 'shotgun';
    state.player.ammo = GAME_CONFIG.weapons.shotgun.ammo;
    state.player.onGround = true;
    state.player.animationFrame = 0;
    state.player.direction = 'right';
    state.player.spawnImmunity = 2000; // 2 seconds of spawn immunity
    
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
    const newPowerups = generatePowerups();
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
    
    // Spawn boss at player position + 300 (visible on screen)
    const boss = {
      x: state.player.x + 300,
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
    
    // Boss spawns directly without intro screen
  }, []);

  const updateBoss = useCallback((boss: Enemy, _deltaTime: number) => {
    const state = gameStateRef.current;
    const player = state.player;
    const levelConfig = LEVELS[state.level.current as keyof typeof LEVELS];
    
    if (!levelConfig || boss.type !== 'boss') return;
    
    const distanceToPlayer = Math.abs(boss.x - player.x);
    const playerInRange = distanceToPlayer < 600; // Increased from 400 - larger aggro range
    
    // Enhanced boss movement and attack patterns with creative behaviors
    switch (boss.bossType) {
      case 'warden': // Level 1 - Corrupt Warden with advanced tactical movement
        if (playerInRange) {
          const direction = player.x > boss.x ? 1 : -1;
          const isRageMode = boss.health < boss.maxHealth * 0.4;
          const currentTime = Date.now();
          
          // Initialize boss behavior state if not exists
          if (!boss.behaviorState) {
            boss.behaviorState = {
              currentPattern: 'advance',
              patternTimer: currentTime,
              chargeStartTime: 0,
              retreatTimer: 0,
              lastDirection: direction,
              stompPhase: 0
            };
          }
          
          const behavior = boss.behaviorState;
          const timeSincePatternStart = currentTime - behavior.patternTimer;
          
          // Dynamic movement patterns based on health and situation
          if (!isRageMode) {
            // NORMAL PHASE: Tactical advance with cover and retreat
            switch (behavior.currentPattern) {
              case 'advance':
                // Slow, menacing advance with stomping
                const stompSpeed = 2 + Math.sin(currentTime * 0.01) * 0.5;
                boss.x += direction * stompSpeed;
                boss.velocityX = direction * stompSpeed;
                
                // Add stomping animation phase
                behavior.stompPhase = (behavior.stompPhase + 0.2) % (Math.PI * 2);
                
                // Switch to retreat if too close or after 3 seconds
                if (distanceToPlayer < 120 || timeSincePatternStart > 3000) {
                  behavior.currentPattern = 'retreat';
                  behavior.patternTimer = currentTime;
                }
                break;
                
              case 'retreat':
                // Tactical retreat while maintaining aim
                boss.x += -direction * 3;
                boss.velocityX = -direction * 3;
                
                // Return to advance after 2 seconds or if far enough
                if (distanceToPlayer > 300 || timeSincePatternStart > 2000) {
                  behavior.currentPattern = 'advance';
                  behavior.patternTimer = currentTime;
                }
                break;
            }
            
            // Normal phase shooting - measured and threatening
            const fireRate = 800;  // Increased from 400 - shoots less frequently
            if (currentTime - boss.lastShotTime > fireRate) {
              const pelletCount = 3;
              for (let i = 0; i < pelletCount; i++) {
                state.enemyBullets.push({
                  x: boss.x + (i - pelletCount/2) * 12,
                  y: boss.y + 25,
                  velocityX: direction * (5 + Math.random() * 1.5),
                  velocityY: -0.5 + Math.random() * 1,
                });
              }
              boss.lastShotTime = currentTime;
              state.camera.shake = Math.max(state.camera.shake, 5);
            }
            
          } else {
            // RAGE PHASE: Aggressive charging and area denial
            switch (behavior.currentPattern) {
              case 'advance':
              case 'retreat':
                // Switch to charging behavior in rage mode
                behavior.currentPattern = 'charge';
                behavior.chargeStartTime = currentTime;
                behavior.patternTimer = currentTime;
                break;
                
              case 'charge':
                // Powerful charging attack
                const chargeDirection = behavior.lastDirection;
                const chargeSpeed = 8;
                boss.x += chargeDirection * chargeSpeed;
                boss.velocityX = chargeDirection * chargeSpeed;
                
                // Create dramatic charge effects
                if (currentTime - behavior.chargeStartTime < 1500) {
                  // Charge forward aggressively
                  state.camera.shake = Math.max(state.camera.shake, 8);
                  
                  // Leave dust trail particles during charge
                  if (Math.random() < 0.3) {
                    state.particles.push({
                      x: boss.x + Math.random() * 90,
                      y: boss.y + 70 + Math.random() * 20,
                      velocityX: -chargeDirection * (2 + Math.random() * 3),
                      velocityY: -Math.random() * 2,
                      life: 30 + Math.random() * 20,
                      maxLife: 50,
                      size: 6 + Math.random() * 4,
                      color: '#8B4513',
                      type: 'smoke' as const
                    });
                  }
                } else {
                  // End charge, switch to area denial
                  behavior.currentPattern = 'area_denial';
                  behavior.patternTimer = currentTime;
                  behavior.lastDirection = direction; // Update direction for next charge
                }
                break;
                
              case 'area_denial':
                // Stop and create bullet hell pattern
                boss.velocityX = 0;
                
                // Rapid fire spread pattern
                const rapidFireRate = 400;  // Increased from 200 - less frequent in rage mode
                if (currentTime - boss.lastShotTime > rapidFireRate) {
                  const spreadPattern = Math.sin(currentTime * 0.01) * 0.5;
                  const pelletCount = 5;
                  
                  for (let i = 0; i < pelletCount; i++) {
                    const spread = (i - pelletCount/2) * 0.3 + spreadPattern;
                    state.enemyBullets.push({
                      x: boss.x + 45,
                      y: boss.y + 25,
                      velocityX: direction * (4 + Math.abs(spread)) + spread,
                      velocityY: -1 + spread * 0.5,
                    });
                  }
                  boss.lastShotTime = currentTime;
                  state.camera.shake = Math.max(state.camera.shake, 12);
                }
                
                // Return to charging after 2 seconds
                if (timeSincePatternStart > 2000) {
                  behavior.currentPattern = 'charge';
                  behavior.chargeStartTime = currentTime;
                  behavior.patternTimer = currentTime;
                }
                break;
            }
          }
          
          // Store phase for visual effects
          boss.phase = isRageMode ? 2 : 1;
          
        } else {
          // Reset behavior when player is out of range
          boss.behaviorState = undefined;
          boss.velocityX = 0;
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
    
    // Initialize audio on first user interaction
    initAudio();
    
    // Generate level content based on current level
    const level = state.level;
    const newObstacles = generateObstacles(level.startX, level.endX);
    const newEnemies = generateEnemies(level.startX + 400, level.endX - 400);
    const newPowerups = generatePowerups();
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
    console.log('startStory called');
    const state = gameStateRef.current;
    state.gameState = "story";
    state.storySlide = 0;
    setGameState("story");
    setStorySlide(0);
  }, []);

  const nextStorySlide = useCallback(() => {
    console.log('nextStorySlide called, current slide:', storySlide);
    const state = gameStateRef.current;
    if (state.storySlide < STORY_SLIDES.length - 1) {
      state.storySlide++;
      setStorySlide(state.storySlide);
    } else {
      // Story finished, start game
      startGame();
    }
  }, [startGame, storySlide]);

  const skipStory = useCallback(() => {
    console.log('skipStory called');
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
      playSound('jump');
    }
  }, [startGame]);

  const shoot = useCallback(() => {
    const state = gameStateRef.current;
    const currentTime = Date.now();
    const weapon = GAME_CONFIG.weapons[state.player.weapon];
    
    // BERSERKER MODE - much faster fire rate!
    const berserkerActive = Date.now() < berserkerEndTime.current;
    const fireRate = berserkerActive ? weapon.fireRate * 0.3 : weapon.fireRate; // 3x faster in berserker mode
    
    if (currentTime - lastShotTime.current < fireRate || state.player.ammo <= 0) {
      return;
    }
    
    lastShotTime.current = currentTime;
    state.player.ammo--;
    
    // Play shoot sound
    playSound('shoot');
    
    // Enhanced camera shake in berserker mode
    state.camera.shake = berserkerActive ? 8 : 3;
    
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
      const bulletCount = (weapon as any).bulletCount || 5;
      for (let i = 0; i < bulletCount; i++) {
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

  // WEAPON SWITCHING - TOGGLE BETWEEN PISTOL AND SHOTGUN
  const switchWeapon = useCallback(() => {
    const state = gameStateRef.current;
    
    if (state.gameState !== "playing") {
      return;
    }
    
    // Toggle between pistol and shotgun
    if (state.player.weapon === 'pistol') {
      state.player.weapon = 'shotgun';
      state.player.ammo = GAME_CONFIG.weapons.shotgun.ammo;
    } else {
      state.player.weapon = 'pistol';
      state.player.ammo = GAME_CONFIG.weapons.pistol.ammo;
    }
    
    // Play a sound effect (reuse pickup sound)
    playSound('powerup');
    
    // Visual feedback - create some particles
    createParticles(
      state.player.x + GAME_CONFIG.canvas.width / 2 - state.camera.x,
      state.player.y + 15,
      'spark',
      WEAPONS_INFO[state.player.weapon].color,
      5
    );
  }, [createParticles]);

  // SPECIAL ABILITY Q - REBEL DASH
  const rebelDash = useCallback(() => {
    const state = gameStateRef.current;
    const currentTime = Date.now();
    
    // Cooldown check (3 seconds)
    if (currentTime - lastDashTime.current < 3000) {
      return; // Still on cooldown
    }
    
    if (state.gameState !== "playing") {
      return;
    }
    
    lastDashTime.current = currentTime;
    
    // Powerful dash movement
    const dashDistance = 200;
    const dashDirection = state.player.direction === 'right' ? 1 : -1;
    state.player.x += dashDistance * dashDirection;
    
    // Temporary invulnerability (1.5 seconds)
    state.player.spawnImmunity = Math.max(state.player.spawnImmunity, 1500);
    
    // Epic visual effects
    state.camera.shake = Math.max(state.camera.shake, 15);
    
    // Create massive particle trail
    for (let i = 0; i < 8; i++) {
      const trailX = state.player.x - (i * 25 * dashDirection);
      createParticles(trailX, state.player.y + GAME_CONFIG.player.size/2, 'spark', 4);
    }
    
    // Create explosion effect at start and end
    createParticles(state.player.x - dashDistance * dashDirection, state.player.y + GAME_CONFIG.player.size/2, 'explosion', 6);
    createParticles(state.player.x, state.player.y + GAME_CONFIG.player.size/2, 'explosion', 6);
    
  }, [createParticles]);

  // SPECIAL ABILITY E - BERSERKER MODE  
  const berserkerMode = useCallback(() => {
    const state = gameStateRef.current;
    const currentTime = Date.now();
    
    // Cooldown check (8 seconds)
    if (currentTime - lastBerserkerTime.current < 8000) {
      return; // Still on cooldown
    }
    
    if (state.gameState !== "playing") {
      return;
    }
    
    lastBerserkerTime.current = currentTime;
    berserkerEndTime.current = currentTime + 4000; // 4 second duration
    
    // Visual effect for activation
    state.camera.shake = Math.max(state.camera.shake, 12);
    createParticles(state.player.x + GAME_CONFIG.player.size/2, state.player.y + GAME_CONFIG.player.size/2, 'explosion', 8);
    
  }, [createParticles]);

  // Helper function to check if berserker mode is active
  const isBerserkerActive = useCallback(() => {
    return Date.now() < berserkerEndTime.current;
  }, []);
  void isBerserkerActive; // Suppress unused variable warning

  const updateEnemyAI = useCallback((enemy: any, playerX: number, playerY: number, currentTime: number) => {
    const dx = playerX - enemy.x;
    const dy = playerY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // MUCH MORE AGGRESSIVE DETECTION - enemies spot you from further away
    if (distance < 400) { // Increased from 200
      enemy.alertLevel = Math.min(100, enemy.alertLevel + 5); // Increased from 2
      enemy.lastPlayerSeen = currentTime;
    } else if (currentTime - enemy.lastPlayerSeen > 2000) { // Reduced from 3000
      enemy.alertLevel = Math.max(0, enemy.alertLevel - 2); // Increased decay rate
    }
    
    // AI State machine - MUCH MORE AGGRESSIVE
    switch (enemy.aiState) {
      case 'patrol':
        if (enemy.alertLevel > 15) { // Reduced from 30 - they get suspicious faster
          enemy.aiState = 'chase';
        }
        // FASTER patrol movement
        if ((enemy.type === 'guard' || enemy.type === 'dog') && enemy.onGround) {
          if (!enemy.patrolDirection) {
            enemy.patrolDirection = Math.random() > 0.5 ? 1 : -1;
            enemy.patrolStartX = enemy.x;
          }
          
          // MUCH FASTER patrol speeds
          const patrolSpeed = enemy.type === 'dog' ? 2.5 : 1.2; // Increased from 1.2/0.5
          const patrolRange = enemy.type === 'dog' ? 200 : 150; // Increased ranges
          
          enemy.x += enemy.patrolDirection * patrolSpeed;
          
          if (Math.abs(enemy.x - enemy.patrolStartX) > patrolRange) {
            enemy.patrolDirection *= -1;
          }
        }
        break;
        
      case 'chase':
        if (distance < 150) { // Increased from 100
          enemy.aiState = 'attack';
        } else if (enemy.alertLevel < 5) { // Reduced from 10 - stay alert longer
          enemy.aiState = 'patrol';
        }
        // MUCH FASTER chase movement
        if ((enemy.type === 'guard' || enemy.type === 'dog') && enemy.onGround) {
          const moveSpeed = enemy.type === 'dog' ? 4.0 : 2.5; // Increased from 2.5/1
          enemy.x += dx > 0 ? moveSpeed : -moveSpeed;
        }
        break;
        
      case 'attack':
        // Stay in attack mode much longer and closer
        if (distance > 200) { // Increased from 150
          enemy.aiState = 'chase';
        } else if (enemy.health < enemy.maxHealth * 0.2) { // Reduced from 0.3 - fight harder
          enemy.aiState = 'retreat';
        }
        // Move to optimal attack distance
        if ((enemy.type === 'guard' || enemy.type === 'dog') && enemy.onGround) {
          const optimalDistance = 120;
          if (distance > optimalDistance + 20) {
            // Move closer
            const moveSpeed = enemy.type === 'dog' ? 3.0 : 2.0;
            enemy.x += dx > 0 ? moveSpeed : -moveSpeed;
          } else if (distance < optimalDistance - 20) {
            // Move back slightly
            const moveSpeed = enemy.type === 'dog' ? 1.5 : 1.0;
            enemy.x += dx > 0 ? -moveSpeed : moveSpeed;
          }
        }
        break;
        
      case 'retreat':
        // FASTER retreat movement
        if (enemy.type === 'guard' && enemy.onGround) {
          const moveSpeed = 2.5; // Increased from 1.5
          enemy.x += dx > 0 ? -moveSpeed : moveSpeed;
        }
        if (distance > 300) { // Increased from 200
          enemy.aiState = 'cover';
        }
        break;
        
      case 'cover':
        // Shorter cover time - get back to fighting faster
        if (enemy.alertLevel < 30) { // Increased from 20
          enemy.aiState = 'patrol';
        }
        // Even in cover, try to move to better position
        if (enemy.onGround && Math.random() < 0.02) { // 2% chance per frame
          enemy.patrolDirection = Math.random() > 0.5 ? 1 : -1;
          enemy.x += enemy.patrolDirection * 0.8;
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

  const drawSpawnCell = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const state = gameStateRef.current;
    const cellWidth = 80;
    const cellHeight = 90;
    const cellX = x - 16; // Center cell around player
    const cellY = y - 20;
    
    // Cell walls
    ctx.fillStyle = '#444444';
    ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
    
    // Cell interior
    ctx.fillStyle = '#666666';
    ctx.fillRect(cellX + 4, cellY + 4, cellWidth - 8, cellHeight - 8);
    
    if (state.player.spawnState === 'breaking_out') {
      // Add breaking effect
      const breakProgress = state.player.cellBreakTimer / 800; // 800ms duration
      const shakeAmount = Math.sin(Date.now() * 0.02) * breakProgress * 3;
      
      // Draw cracks
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Vertical cracks
      for (let i = 0; i < 3; i++) {
        const crackX = cellX + 20 + i * 20 + shakeAmount;
        ctx.moveTo(crackX, cellY);
        ctx.lineTo(crackX, cellY + cellHeight * breakProgress);
      }
      
      // Horizontal cracks
      for (let i = 0; i < 2; i++) {
        const crackY = cellY + 30 + i * 30;
        ctx.moveTo(cellX, crackY);
        ctx.lineTo(cellX + cellWidth * breakProgress, crackY + shakeAmount);
      }
      
      ctx.stroke();
      
      // Add sparks/particles effect
      if (breakProgress > 0.5) {
        for (let i = 0; i < 5; i++) {
          const sparkX = cellX + Math.random() * cellWidth;
          const sparkY = cellY + Math.random() * cellHeight;
          ctx.fillStyle = '#FFFF00';
          ctx.fillRect(sparkX, sparkY, 2, 2);
        }
      }
    } else {
      // Draw bars for intact cell
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const barX = cellX + 10 + i * 10;
        ctx.beginPath();
        ctx.moveTo(barX, cellY);
        ctx.lineTo(barX, cellY + cellHeight);
        ctx.stroke();
      }
    }
  }, []);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const size = GAME_CONFIG.player.size;
    const state = gameStateRef.current;
    const isMoving = state.player.animationFrame > 0;
    const bobOffset = isMoving ? Math.sin(state.player.animationFrame * 0.5) * 2 : 0;
    const direction = state.player.direction;
    
    ctx.save();

    // Draw cell if player is spawning
    if (state.player.spawnState !== 'free') {
      drawSpawnCell(ctx, x, y);
    }

    // Only draw player if breaking out or free
    if (state.player.spawnState === 'in_cell') {
      ctx.restore();
      return;
    }
    
    // Add invincibility visual effect (flashing)
    if (state.player.spawnImmunity > 0) {
      const flashRate = 200; // Flash every 200ms
      const isVisible = Math.floor(Date.now() / flashRate) % 2 === 0;
      if (!isVisible) {
        ctx.globalAlpha = 0.3; // Semi-transparent when flashing
      } else {
        ctx.globalAlpha = 1.0;
      }
      // Add blue tint to indicate invincibility
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
    }
    
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

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: any, screenX: number, playerX: number) => {
    const size = GAME_CONFIG.enemy.size;
    
    // Apply red tint if enemy was recently hit
    if (enemy.hitFlash && enemy.hitFlash > 0) {
      ctx.save();
      // Create a subtle red overlay effect
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(0.6, enemy.hitFlash / 200)})`;
      // We'll fill this after drawing the enemy
    }
    
    if (enemy.type === 'guard') {
      // DYNAMIC PRISON GUARD - More detailed and animated
      
      // Draw dynamic shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(screenX + 14, enemy.y + size + 4, 12, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Walking animation frame
      const walkFrame = Math.floor(Date.now() / 150) % 4;
      const bobOffset = Math.sin(walkFrame * Math.PI / 2) * 2;
      
      // HEAD - More rounded and detailed
      ctx.save();
      
      // Head shape (rounded)
      ctx.fillStyle = "#f4c2a1";
      ctx.beginPath();
      ctx.arc(screenX + 14, enemy.y + 9 + bobOffset, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Neck
      ctx.fillRect(screenX + 12, enemy.y + 13 + bobOffset, 4, 3);
      
      // POLICE CAP - More dynamic shape
      ctx.fillStyle = "#1a237e";
      ctx.beginPath();
      ctx.moveTo(screenX + 8, enemy.y + 7 + bobOffset);
      ctx.lineTo(screenX + 20, enemy.y + 7 + bobOffset);
      ctx.lineTo(screenX + 22, enemy.y + 9 + bobOffset);
      ctx.lineTo(screenX + 6, enemy.y + 9 + bobOffset);
      ctx.closePath();
      ctx.fill();
      
      // Cap top
      ctx.fillStyle = "#0d47a1";
      ctx.beginPath();
      ctx.arc(screenX + 14, enemy.y + 5 + bobOffset, 7, Math.PI, 0);
      ctx.fill();
      
      // Visor
      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX + 7, enemy.y + 8 + bobOffset, 14, 2);
      
      // Badge on cap (star shape)
      ctx.fillStyle = "#ffd700";
      ctx.save();
      ctx.translate(screenX + 14, enemy.y + 5 + bobOffset);
      ctx.scale(0.3, 0.3);
      for (let i = 0; i < 5; i++) {
        ctx.rotate(Math.PI * 2 / 5);
        ctx.fillRect(-1, -6, 2, 6);
      }
      ctx.restore();
      
      // FACE - More expressive
      // Eyes with animation
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(screenX + 10, enemy.y + 9 + bobOffset, 3, 2);
      ctx.fillRect(screenX + 15, enemy.y + 9 + bobOffset, 3, 2);
      
      // Pupils (looking at player)
      const playerDir = playerX < enemy.x ? 0 : 1;
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(screenX + 10 + playerDir, enemy.y + 9 + bobOffset, 2, 2);
      ctx.fillRect(screenX + 15 + playerDir, enemy.y + 9 + bobOffset, 2, 2);
      
      // Angry eyebrows
      ctx.strokeStyle = "#4a4a4a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX + 9, enemy.y + 8 + bobOffset);
      ctx.lineTo(screenX + 12, enemy.y + 9 + bobOffset);
      ctx.moveTo(screenX + 16, enemy.y + 9 + bobOffset);
      ctx.lineTo(screenX + 19, enemy.y + 8 + bobOffset);
      ctx.stroke();
      
      // Nose (triangular)
      ctx.fillStyle = "#e0a875";
      ctx.beginPath();
      ctx.moveTo(screenX + 14, enemy.y + 10 + bobOffset);
      ctx.lineTo(screenX + 13, enemy.y + 12 + bobOffset);
      ctx.lineTo(screenX + 15, enemy.y + 12 + bobOffset);
      ctx.fill();
      
      // Mustache (curved)
      ctx.fillStyle = "#6d4c41";
      ctx.beginPath();
      ctx.arc(screenX + 12, enemy.y + 12 + bobOffset, 2, 0, Math.PI);
      ctx.arc(screenX + 16, enemy.y + 12 + bobOffset, 2, 0, Math.PI);
      ctx.fill();
      
      // BODY - More dynamic pose
      
      // Torso (tapered)
      ctx.fillStyle = "#1565c0";
      ctx.beginPath();
      ctx.moveTo(screenX + 10, enemy.y + 16 + bobOffset);
      ctx.lineTo(screenX + 18, enemy.y + 16 + bobOffset);
      ctx.lineTo(screenX + 17, enemy.y + 32);
      ctx.lineTo(screenX + 11, enemy.y + 32);
      ctx.closePath();
      ctx.fill();
      
      // Collar detail
      ctx.fillStyle = "#0d47a1";
      ctx.beginPath();
      ctx.moveTo(screenX + 10, enemy.y + 16 + bobOffset);
      ctx.lineTo(screenX + 18, enemy.y + 16 + bobOffset);
      ctx.lineTo(screenX + 16, enemy.y + 18 + bobOffset);
      ctx.lineTo(screenX + 12, enemy.y + 18 + bobOffset);
      ctx.fill();
      
      // Badge (shield shape)
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.moveTo(screenX + 10, enemy.y + 19 + bobOffset);
      ctx.lineTo(screenX + 12, enemy.y + 19 + bobOffset);
      ctx.lineTo(screenX + 12, enemy.y + 21 + bobOffset);
      ctx.lineTo(screenX + 11, enemy.y + 22 + bobOffset);
      ctx.lineTo(screenX + 10, enemy.y + 21 + bobOffset);
      ctx.fill();
      
      // ARMS - Animated
      const armSwing = Math.sin(walkFrame * Math.PI / 2) * 15;
      
      // Left arm
      ctx.fillStyle = "#1565c0";
      ctx.save();
      ctx.translate(screenX + 10, enemy.y + 18 + bobOffset);
      ctx.rotate(armSwing * Math.PI / 180);
      ctx.fillRect(-2, 0, 4, 10);
      // Hand
      ctx.fillStyle = "#f4c2a1";
      ctx.beginPath();
      ctx.arc(0, 10, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Right arm with nightstick
      ctx.save();
      ctx.translate(screenX + 18, enemy.y + 18 + bobOffset);
      ctx.rotate(-armSwing * Math.PI / 180);
      ctx.fillStyle = "#1565c0";
      ctx.fillRect(-2, 0, 4, 10);
      
      // Hand holding nightstick
      ctx.fillStyle = "#f4c2a1";
      ctx.beginPath();
      ctx.arc(0, 10, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Nightstick (at angle)
      ctx.rotate(-30 * Math.PI / 180);
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(-1, 8, 2, 12);
      // Handle
      ctx.fillStyle = "#2e2e2e";
      ctx.fillRect(-2, 18, 4, 3);
      ctx.restore();
      
      // Belt
      ctx.fillStyle = "#2e2e2e";
      ctx.fillRect(screenX + 9, enemy.y + 30, 10, 3);
      // Belt buckle
      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(screenX + 13, enemy.y + 30, 2, 3);
      
      // LEGS - Walking animation
      const legFrame = walkFrame % 2;
      
      // Left leg
      ctx.fillStyle = "#0d47a1";
      if (legFrame === 0) {
        // Forward
        ctx.beginPath();
        ctx.moveTo(screenX + 11, enemy.y + 32);
        ctx.lineTo(screenX + 13, enemy.y + 32);
        ctx.lineTo(screenX + 12, enemy.y + 38);
        ctx.lineTo(screenX + 10, enemy.y + 38);
        ctx.fill();
      } else {
        // Back
        ctx.beginPath();
        ctx.moveTo(screenX + 11, enemy.y + 32);
        ctx.lineTo(screenX + 13, enemy.y + 32);
        ctx.lineTo(screenX + 14, enemy.y + 38);
        ctx.lineTo(screenX + 12, enemy.y + 38);
        ctx.fill();
      }
      
      // Right leg
      if (legFrame === 1) {
        // Forward
        ctx.beginPath();
        ctx.moveTo(screenX + 15, enemy.y + 32);
        ctx.lineTo(screenX + 17, enemy.y + 32);
        ctx.lineTo(screenX + 16, enemy.y + 38);
        ctx.lineTo(screenX + 14, enemy.y + 38);
        ctx.fill();
      } else {
        // Back
        ctx.beginPath();
        ctx.moveTo(screenX + 15, enemy.y + 32);
        ctx.lineTo(screenX + 17, enemy.y + 32);
        ctx.lineTo(screenX + 18, enemy.y + 38);
        ctx.lineTo(screenX + 16, enemy.y + 38);
        ctx.fill();
      }
      
      // SHOES - More detailed
      ctx.fillStyle = "#1a1a1a";
      // Left shoe
      const leftShoeX = legFrame === 0 ? screenX + 9 : screenX + 11;
      ctx.beginPath();
      ctx.moveTo(leftShoeX, enemy.y + 38);
      ctx.lineTo(leftShoeX + 5, enemy.y + 38);
      ctx.lineTo(leftShoeX + 6, enemy.y + 40);
      ctx.lineTo(leftShoeX - 1, enemy.y + 40);
      ctx.fill();
      
      // Right shoe  
      const rightShoeX = legFrame === 1 ? screenX + 13 : screenX + 15;
      ctx.beginPath();
      ctx.moveTo(rightShoeX, enemy.y + 38);
      ctx.lineTo(rightShoeX + 5, enemy.y + 38);
      ctx.lineTo(rightShoeX + 6, enemy.y + 40);
      ctx.lineTo(rightShoeX - 1, enemy.y + 40);
      ctx.fill();
      
      ctx.restore();
      
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
        case 'warden': {
          // CORRUPT PRISON WARDEN - Pixel Art Boss Design
          const time = Date.now() * 0.001;
          const breathingOffset = Math.sin(time * 2) * 0.5; // Subtle pixel breathing
          
          // Enhanced movement-based animations
          const isMoving = Math.abs(enemy.velocityX || 0) > 0;
          const moveIntensity = Math.min(Math.abs(enemy.velocityX || 0) / 8, 1);
          const walkCycle = isMoving ? Math.sin(time * 15 * (1 + moveIntensity)) * (1 + moveIntensity) : 0;
          const isRageMode = enemy.phase && enemy.phase > 1;
          const ragePulse = isRageMode ? Math.sin(time * 20) * 0.5 + 0.5 : 0;
          
          // Pixel-perfect animations
          const blinkCycle = Math.sin(time * 3);
          const eyeHeight = blinkCycle > 0.95 ? 1 : 2;
          const pixelSize = Math.max(1, Math.floor(bossSize / 45)); // Dynamic pixel scaling
          
          // PIXEL ART SHADOW
          ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
          ctx.fillRect(screenX + 3*pixelSize, enemy.y + bossSize + 2, 39*pixelSize, 4*pixelSize);
          
          // PIXEL ART HEAD - Large intimidating head with walking bob
          const headY = enemy.y + Math.floor(breathingOffset) + Math.floor(walkCycle * 0.3);
          
          // Head base (skin tone)
          ctx.fillStyle = "#d4a574";
          ctx.fillRect(screenX + 12*pixelSize, headY + 2*pixelSize, 21*pixelSize, 16*pixelSize);
          
          // Head shading (right side)
          ctx.fillStyle = "#b8935f";
          ctx.fillRect(screenX + 28*pixelSize, headY + 4*pixelSize, 5*pixelSize, 14*pixelSize);
          ctx.fillRect(screenX + 24*pixelSize, headY + 16*pixelSize, 9*pixelSize, 2*pixelSize);
          
          // Forehead highlight
          ctx.fillStyle = "#e8c18a";
          ctx.fillRect(screenX + 14*pixelSize, headY + 3*pixelSize, 12*pixelSize, 3*pixelSize);
          
          // PIXEL ART FACIAL SCARS
          ctx.fillStyle = "#8b6b47";
          // Diagonal scar across left eye
          ctx.fillRect(screenX + 16*pixelSize, headY + 8*pixelSize, pixelSize, 2*pixelSize);
          ctx.fillRect(screenX + 17*pixelSize, headY + 10*pixelSize, pixelSize, 2*pixelSize);
          ctx.fillRect(screenX + 18*pixelSize, headY + 12*pixelSize, pixelSize, 2*pixelSize);
          // Vertical scar on forehead
          ctx.fillRect(screenX + 26*pixelSize, headY + 4*pixelSize, pixelSize, 4*pixelSize);
          
          // PIXEL ART EYES - Evil and animated
          const eyeGlow = isRageMode ? Math.floor(ragePulse * 2) : 0;
          const pupilOffset = enemy.velocityX ? Math.sign(enemy.velocityX) * pixelSize : 0;
          
          // Eye whites
          ctx.fillStyle = isRageMode ? "#ffcccc" : "#ffffff";
          if (eyeHeight > 1) {
            ctx.fillRect(screenX + 16*pixelSize, headY + 8*pixelSize, 4*pixelSize, 2*pixelSize);
            ctx.fillRect(screenX + 26*pixelSize, headY + 8*pixelSize, 4*pixelSize, 2*pixelSize);
          }
          
          // Evil red pupils with tracking
          if (eyeHeight > 1) {
            ctx.fillStyle = isRageMode ? "#ff0000" : "#cc0000";
            ctx.fillRect(screenX + 17*pixelSize + pupilOffset, headY + 8*pixelSize, 2*pixelSize, 2*pixelSize);
            ctx.fillRect(screenX + 27*pixelSize + pupilOffset, headY + 8*pixelSize, 2*pixelSize, 2*pixelSize);
            
            // Rage mode eye glow effect
            if (isRageMode && eyeGlow > 0) {
              ctx.fillStyle = "#ff4444";
              ctx.fillRect(screenX + 16*pixelSize, headY + 7*pixelSize, 4*pixelSize, 4*pixelSize);
              ctx.fillRect(screenX + 26*pixelSize, headY + 7*pixelSize, 4*pixelSize, 4*pixelSize);
            }
          }
          
          // PIXEL ART ANGRY EYEBROWS
          ctx.fillStyle = "#8b6b47";
          ctx.fillRect(screenX + 15*pixelSize, headY + 6*pixelSize, 3*pixelSize, pixelSize);
          ctx.fillRect(screenX + 14*pixelSize, headY + 7*pixelSize, 2*pixelSize, pixelSize);
          ctx.fillRect(screenX + 28*pixelSize, headY + 6*pixelSize, 3*pixelSize, pixelSize);
          ctx.fillRect(screenX + 30*pixelSize, headY + 7*pixelSize, 2*pixelSize, pixelSize);
          
          // PIXEL ART WARDEN CAP
          ctx.fillStyle = "#1a1a1a";
          // Cap main body
          ctx.fillRect(screenX + 10*pixelSize, headY - 2*pixelSize, 25*pixelSize, 8*pixelSize);
          // Cap top
          ctx.fillRect(screenX + 8*pixelSize, headY - 4*pixelSize, 29*pixelSize, 4*pixelSize);
          
          // Cap visor
          ctx.fillStyle = "#0d0d0d";
          ctx.fillRect(screenX + 8*pixelSize, headY + 4*pixelSize, 29*pixelSize, 3*pixelSize);
          
          // Cap badge - Prison warden star
          ctx.fillStyle = "#ffd700";
          ctx.fillRect(screenX + 21*pixelSize, headY - 2*pixelSize, 3*pixelSize, 6*pixelSize);
          ctx.fillRect(screenX + 19*pixelSize, headY, 7*pixelSize, 2*pixelSize);
          
          // Badge details (skull symbol)
          ctx.fillStyle = "#000000";
          ctx.fillRect(screenX + 21*pixelSize, headY - 1*pixelSize, pixelSize, pixelSize);
          ctx.fillRect(screenX + 23*pixelSize, headY - 1*pixelSize, pixelSize, pixelSize);
          ctx.fillRect(screenX + 22*pixelSize, headY + pixelSize, pixelSize, pixelSize);
          
          // PIXEL ART MUSTACHE - Intimidating warden mustache
          ctx.fillStyle = "#2c3e50";
          ctx.fillRect(screenX + 18*pixelSize, headY + 12*pixelSize, 9*pixelSize, 2*pixelSize);
          ctx.fillRect(screenX + 16*pixelSize, headY + 13*pixelSize, 3*pixelSize, pixelSize);
          ctx.fillRect(screenX + 26*pixelSize, headY + 13*pixelSize, 3*pixelSize, pixelSize);
          
          // Mustache highlights
          ctx.fillStyle = "#4a5568";
          ctx.fillRect(screenX + 19*pixelSize, headY + 12*pixelSize, 7*pixelSize, pixelSize);
          
          // PIXEL ART WARDEN UNIFORM - Dark blue with details
          const bodyY = enemy.y + 18*pixelSize + Math.floor(breathingOffset);
          
          // Main uniform body
          ctx.fillStyle = "#1a237e";
          ctx.fillRect(screenX + 8*pixelSize, bodyY, 29*pixelSize, 28*pixelSize);
          
          // Uniform shading/highlights
          ctx.fillStyle = "#0d47a1";
          ctx.fillRect(screenX + 10*pixelSize, bodyY + 2*pixelSize, 25*pixelSize, 2*pixelSize); // Collar
          ctx.fillRect(screenX + 32*pixelSize, bodyY + 4*pixelSize, 5*pixelSize, 24*pixelSize); // Right side shadow
          
          // Uniform buttons
          ctx.fillStyle = "#ffd700";
          for (let i = 0; i < 5; i++) {
            ctx.fillRect(screenX + 21*pixelSize, bodyY + 6*pixelSize + i * 4*pixelSize, 2*pixelSize, 2*pixelSize);
          }
          
          // Shoulder pads/epaulettes
          ctx.fillStyle = "#0d47a1";
          ctx.fillRect(screenX + 6*pixelSize, bodyY + 2*pixelSize, 4*pixelSize, 8*pixelSize);
          ctx.fillRect(screenX + 35*pixelSize, bodyY + 2*pixelSize, 4*pixelSize, 8*pixelSize);
          
          // Rank stripes on sleeves
          ctx.fillStyle = "#ffd700";
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(screenX + 6*pixelSize, bodyY + 4*pixelSize + i * 2*pixelSize, 3*pixelSize, pixelSize);
            ctx.fillRect(screenX + 36*pixelSize, bodyY + 4*pixelSize + i * 2*pixelSize, 3*pixelSize, pixelSize);
          }
          
          // Chest badge/star
          ctx.fillStyle = "#ffd700";
          ctx.fillRect(screenX + 14*pixelSize, bodyY + 8*pixelSize, 3*pixelSize, 5*pixelSize);
          ctx.fillRect(screenX + 12*pixelSize, bodyY + 10*pixelSize, 7*pixelSize, pixelSize);
          
          // Belt
          ctx.fillStyle = "#4a4a4a";
          ctx.fillRect(screenX + 8*pixelSize, bodyY + 24*pixelSize, 29*pixelSize, 4*pixelSize);
          
          // Belt buckle
          ctx.fillStyle = "#ffd700";
          ctx.fillRect(screenX + 20*pixelSize, bodyY + 25*pixelSize, 5*pixelSize, 2*pixelSize);
          
          // PIXEL ART SHOTGUN - Detailed weapon
          const weaponY = bodyY + 12*pixelSize + Math.floor(breathingOffset * 0.3);
          const direction = enemy.x < 600 ? 1 : -1;
          const gunX = direction > 0 ? screenX + 37*pixelSize : screenX - 15*pixelSize;
          
          // Shotgun main body
          ctx.fillStyle = "#2c3e50";
          ctx.fillRect(gunX, weaponY, 12*pixelSize, 3*pixelSize);
          
          // Shotgun barrel
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(gunX - 4*pixelSize, weaponY + pixelSize, 6*pixelSize, pixelSize);
          
          // Shotgun stock
          ctx.fillStyle = "#8b4513";
          ctx.fillRect(gunX + 10*pixelSize, weaponY - pixelSize, 3*pixelSize, 5*pixelSize);
          
          // Shotgun details
          ctx.fillStyle = "#4a4a4a";
          ctx.fillRect(gunX + 2*pixelSize, weaponY + pixelSize, 6*pixelSize, pixelSize);
          
          // Pixel art muzzle flash effect
          if (Date.now() - enemy.lastShotTime < 150) {
            const flashIntensity = Math.max(0, 1 - (Date.now() - enemy.lastShotTime) / 150);
            if (flashIntensity > 0.5) {
              ctx.fillStyle = "#ffff00";
              const flashX = direction > 0 ? gunX - 6*pixelSize : gunX + 15*pixelSize;
              ctx.fillRect(flashX, weaponY, 4*pixelSize, 3*pixelSize);
              ctx.fillStyle = "#ff6600";
              ctx.fillRect(flashX + pixelSize, weaponY + pixelSize, 2*pixelSize, pixelSize);
            }
          }
          
          // PIXEL ART ARMS - Muscular warden arms
          ctx.fillStyle = "#d4a574";
          // Left arm
          ctx.fillRect(screenX + 2*pixelSize, bodyY + 6*pixelSize, 6*pixelSize, 16*pixelSize);
          // Right arm  
          ctx.fillRect(screenX + 37*pixelSize, bodyY + 6*pixelSize, 6*pixelSize, 16*pixelSize);
          
          // Arm shading
          ctx.fillStyle = "#b8935f";
          ctx.fillRect(screenX + 6*pixelSize, bodyY + 8*pixelSize, 2*pixelSize, 14*pixelSize);
          ctx.fillRect(screenX + 41*pixelSize, bodyY + 8*pixelSize, 2*pixelSize, 14*pixelSize);
          
          // PIXEL ART HANDS - Clenched fists
          ctx.fillStyle = "#d4a574";
          ctx.fillRect(screenX + pixelSize, bodyY + 20*pixelSize, 4*pixelSize, 6*pixelSize);
          ctx.fillRect(screenX + 40*pixelSize, bodyY + 20*pixelSize, 4*pixelSize, 6*pixelSize);
          
          // Hand details
          ctx.fillStyle = "#b8935f";
          ctx.fillRect(screenX + 2*pixelSize, bodyY + 22*pixelSize, 2*pixelSize, 3*pixelSize);
          ctx.fillRect(screenX + 41*pixelSize, bodyY + 22*pixelSize, 2*pixelSize, 3*pixelSize);
          
          // PIXEL ART PRISON KEYS - Jangling with movement
          const keySwing = Math.floor(Math.sin(time * 8) * 2);
          ctx.fillStyle = "#c0c0c0";
          ctx.fillRect(screenX + 28*pixelSize + keySwing, bodyY + 20*pixelSize, pixelSize, 6*pixelSize);
          ctx.fillRect(screenX + 27*pixelSize + keySwing, bodyY + 22*pixelSize, pixelSize, 2*pixelSize);
          
          // Key ring
          ctx.fillStyle = "#999999";
          ctx.fillRect(screenX + 27*pixelSize, bodyY + 18*pixelSize, 3*pixelSize, pixelSize);
          ctx.fillRect(screenX + 27*pixelSize, bodyY + 18*pixelSize, pixelSize, 3*pixelSize);
          ctx.fillRect(screenX + 29*pixelSize, bodyY + 18*pixelSize, pixelSize, 3*pixelSize);
          
          // PIXEL ART LEGS - Powerful warden legs with walking animation
          const legY = bodyY + 28*pixelSize;
          const legWalk = isMoving ? Math.floor(walkCycle) : 0;
          
          // Left leg
          ctx.fillStyle = "#1a237e";
          ctx.fillRect(screenX + 12*pixelSize, legY + legWalk, 8*pixelSize, 12*pixelSize);
          // Right leg
          ctx.fillRect(screenX + 25*pixelSize, legY - legWalk, 8*pixelSize, 12*pixelSize);
          
          // Leg shading
          ctx.fillStyle = "#0d47a1";
          ctx.fillRect(screenX + 18*pixelSize, legY + legWalk + 2*pixelSize, 2*pixelSize, 10*pixelSize);
          ctx.fillRect(screenX + 31*pixelSize, legY - legWalk + 2*pixelSize, 2*pixelSize, 10*pixelSize);
          
          // PIXEL ART COMBAT BOOTS - Heavy duty with stomping animation
          const bootY = legY + 12*pixelSize;
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(screenX + 10*pixelSize, bootY + legWalk, 12*pixelSize, 6*pixelSize);
          ctx.fillRect(screenX + 23*pixelSize, bootY - legWalk, 12*pixelSize, 6*pixelSize);
          
          // Boot details
          ctx.fillStyle = "#333333";
          ctx.fillRect(screenX + 11*pixelSize, bootY + legWalk + pixelSize, 10*pixelSize, 2*pixelSize);
          ctx.fillRect(screenX + 24*pixelSize, bootY - legWalk + pixelSize, 10*pixelSize, 2*pixelSize);
          
          // Boot laces
          ctx.fillStyle = "#8b4513";
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(screenX + 13*pixelSize + i * 2*pixelSize, bootY + legWalk + 2*pixelSize, pixelSize, pixelSize);
            ctx.fillRect(screenX + 26*pixelSize + i * 2*pixelSize, bootY - legWalk + 2*pixelSize, pixelSize, pixelSize);
          }
          
          // ENHANCED RAGE MODE EFFECTS
          if (isRageMode) {
            // Electrical aura around boss
            ctx.strokeStyle = `rgba(255, 255, 0, ${0.3 + ragePulse * 0.4})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
              const angle = (time * 10 + i * Math.PI * 0.5) % (Math.PI * 2);
              const x1 = screenX + bossSize/2 + Math.cos(angle) * (bossSize/2 + 8);
              const y1 = enemy.y + bossSize/2 + Math.sin(angle) * (bossSize/2 + 8);
              const x2 = screenX + bossSize/2 + Math.cos(angle + 0.1) * (bossSize/2 + 15);
              const y2 = enemy.y + bossSize/2 + Math.sin(angle + 0.1) * (bossSize/2 + 15);
              
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
            
            // Enhanced aura glow
            ctx.fillStyle = `rgba(255, 0, 0, ${ragePulse * 0.2})`;
            ctx.fillRect(screenX - 5, enemy.y - 5, bossSize + 10, bossSize + 10);
          }
          
          // MOVEMENT EFFECTS
          if (isMoving && moveIntensity > 0.3) {
            // Motion blur effect
            ctx.fillStyle = `rgba(26, 26, 26, ${moveIntensity * 0.15})`;
            const blurOffset = moveIntensity * 3 * Math.sign(enemy.velocityX || 1);
            ctx.fillRect(screenX - blurOffset, enemy.y, bossSize, bossSize);
            
            // Dust clouds when moving fast
            if (moveIntensity > 0.5) {
              ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
              ctx.fillRect(screenX - 5, enemy.y + bossSize - 2, bossSize + 10, 3);
            }
          }
          
          // CHARGING EFFECTS (when in charge pattern)
          if (enemy.behaviorState?.currentPattern === 'charge' && moveIntensity > 0.5) {
            // Speed lines behind charging boss
            ctx.strokeStyle = `rgba(255, 200, 0, ${moveIntensity * 0.6})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
              const lineX = screenX - (i + 1) * 12 * Math.sign(enemy.velocityX || 1);
              ctx.beginPath();
              ctx.moveTo(lineX, enemy.y + 15 + i * 20);
              ctx.lineTo(lineX - 15 * Math.sign(enemy.velocityX || 1), enemy.y + 20 + i * 20);
              ctx.stroke();
            }
          }
          
          break;
        }
          
        case 'captain': {
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
        }
          
        case 'chief': {
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
        }
          
        case 'helicopter': {
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
    }
    
    // Apply the red flash overlay if enemy was hit
    if (enemy.hitFlash && enemy.hitFlash > 0) {
      // Fill the entire enemy area with red tint
      ctx.fillRect(screenX - 5, enemy.y - 5, GAME_CONFIG.enemy.size + 10, GAME_CONFIG.enemy.size + 10);
      ctx.restore();
    }
  }, []);

  // Basic damage calculation
  const calculateDamage = useCallback((baseDamage: number) => {
    // BERSERKER MODE - 2x damage bonus!
    const berserkerActive = Date.now() < berserkerEndTime.current;
    const damageMultiplier = berserkerActive ? 2.0 : 1.0;
    return Math.round(baseDamage * damageMultiplier);
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;

    if (state.gameState === "playing") {
      // Reduce spawn immunity over time
      if (state.player.spawnImmunity > 0) {
        state.player.spawnImmunity -= 16; // Reduce by ~16ms per frame
      }
      
      // Update spawn animation state
      if (state.player.spawnState === 'in_cell') {
        state.player.cellBreakTimer += 16; // ~16ms per frame
        if (state.player.cellBreakTimer >= 1000) { // 1 second delay before breaking out
          state.player.spawnState = 'breaking_out';
          state.player.cellBreakTimer = 0;
        }
      } else if (state.player.spawnState === 'breaking_out') {
        state.player.cellBreakTimer += 16;
        if (state.player.cellBreakTimer >= 800) { // 0.8 seconds of breaking animation
          state.player.spawnState = 'free';
          state.player.cellBreakTimer = 0;
        }
      }
      
      // COMBO DECAY SYSTEM - combos expire after 3 seconds
      const currentTime = Date.now();
      if (state.combo > 0 && currentTime - state.lastKillTime > 3000) {
        state.combo = 0;
        state.comboMultiplier = 1.0;
      }
      
      // Handle player horizontal movement and animation (only when free)
      if (state.player.spawnState === 'free') {
        const currentMoveSpeed = GAME_CONFIG.player.moveSpeed;
          
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
      }

      // Camera follows player with shake effect
      const shakeX = state.camera.shake > 0 ? (Math.random() - 0.5) * state.camera.shake : 0;
      state.camera.x = state.player.x - GAME_CONFIG.canvas.width / 2 + shakeX;
      state.camera.shake = Math.max(0, state.camera.shake - 0.5);
      
      state.distance = Math.floor(Math.abs(state.player.x - 400) / 10);
      setDistance(state.distance);
      
      // Update reach boss objective
      const reachObjective = state.objectives.find(obj => obj.id === 'reach_boss');
      if (reachObjective && !reachObjective.completed) {
        reachObjective.currentCount = state.distance;
        if (state.distance >= 300) {
          reachObjective.completed = true;
        }
      }

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
                // Remove destroyed obstacle (barrels removed)
                
                state.obstacles.splice(i, 1);
              }
            }
            return false;
          }
        }
        
        return true;
      });

      // Check for boss spawning at 300m
      if (!state.level.bossSpawned && state.distance >= 300) {
        spawnBoss();
      }

      // Update enemies with enhanced AI
      state.enemies.forEach((enemy) => {
        // Update hit flash timer
        if (enemy.hitFlash && enemy.hitFlash > 0) {
          enemy.hitFlash -= 16; // Decrement by ~16ms per frame
        }
        
        // Apply gravity to enemies
        applyGravity(enemy);
        
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
        
        // MUCH MORE AGGRESSIVE SHOOTING
        const canShoot = enemy.aiState === 'attack' || enemy.aiState === 'chase';
        if (enemy.type === 'guard' && canShoot && distance < 400 && screenX > -200 && screenX < GAME_CONFIG.canvas.width + 200) {
          // MUCH FASTER fire rate
          const baseFireRate = GAME_CONFIG.enemy.fireRate * 0.3; // 3x faster than before
          const fireRate = enemy.aiState === 'attack' ? baseFireRate * 0.5 : baseFireRate; // Even faster in attack mode
          
          if (currentTime - enemy.lastShotTime > fireRate) {
            enemy.lastShotTime = currentTime;
            const bulletSpeed = GAME_CONFIG.bullet.speed * 0.7; // Slower for better dodging
            const dx = state.player.x - enemy.x;
            const dy = state.player.y - enemy.y;
            
            // MUCH BETTER ACCURACY - they're trained guards!
            const accuracy = enemy.aiState === 'attack' ? 0.98 : 0.9; // Increased from 0.95/0.8
            const spread = (1 - accuracy) * (Math.random() - 0.5) * 0.3; // Reduced spread
            
            // Sometimes fire multiple shots in burst
            const burstSize = enemy.aiState === 'attack' && Math.random() < 0.3 ? 2 : 1;
            
            for (let i = 0; i < burstSize; i++) {
              const burstSpread = i * 0.1 * (Math.random() - 0.5);
              state.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + GAME_CONFIG.enemy.size / 2,
                velocityX: (dx / distance) * bulletSpeed + spread + burstSpread,
                velocityY: (dy / distance) * bulletSpeed + spread + burstSpread,
              });
            }
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
            
            // Set hit flash effect
            enemy.hitFlash = 200; // 200ms flash duration
            
            // Create bigger blood particles for better visual feedback
            createParticles(enemy.x + GAME_CONFIG.enemy.size / 2, enemy.y + GAME_CONFIG.enemy.size / 2, 'blood', 8);
            
            // Play hit sound
            playSound('hit');
            
            if (enemy.health <= 0) {
              // Create explosion particles for enemy death
              createParticles(enemy.x + GAME_CONFIG.enemy.size / 2, enemy.y + GAME_CONFIG.enemy.size / 2, 'explosion', 8);
              state.camera.shake = Math.max(state.camera.shake, 5);
              
              // Play explosion sound for death
              playSound('explosion');
              
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
              
              // EPIC COMBO SYSTEM!
              const currentTime = Date.now();
              const timeSinceLastKill = currentTime - state.lastKillTime;
              
              // Combo window: 3 seconds to chain kills
              if (timeSinceLastKill < 3000 && state.combo > 0) {
                // Continue combo!
                state.combo++;
                state.comboMultiplier = Math.min(5.0, 1.0 + (state.combo * 0.3)); // Max 5x multiplier
              } else {
                // Start new combo
                state.combo = 1;
                state.comboMultiplier = 1.0;
              }
              
              state.lastKillTime = currentTime;
              
              // Score with combo multiplier
              const baseScore = enemy.type === 'boss' ? 500 : 100;
              const comboScore = Math.round(baseScore * state.comboMultiplier);
              state.score += comboScore;
              setDisplayScore(state.score);
              
              // Epic visual feedback for high combos
              if (state.combo >= 5) {
                state.camera.shake = Math.max(state.camera.shake, 15);
                // Create extra particles for high combo
                createParticles(enemy.x + GAME_CONFIG.enemy.size / 2, enemy.y + GAME_CONFIG.enemy.size / 2, 'explosion', 15);
                createParticles(enemy.x + GAME_CONFIG.enemy.size / 2, enemy.y + GAME_CONFIG.enemy.size / 2, 'spark', 10);
              }
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
          // Only take bullet damage if not immune from spawn
          if (state.player.spawnImmunity <= 0) {
            state.player.health -= 1;
            state.enemyBullets.splice(i, 1);
            
            // Add brief invincibility after bullet hit (prevents instant death from multiple bullets)
            state.player.spawnImmunity = 800; // 0.8 seconds
            
            // Add visual feedback
            state.camera.shake = Math.max(state.camera.shake, 8);
            createParticles(state.player.x + GAME_CONFIG.player.size/2, state.player.y + GAME_CONFIG.player.size/2, 'blood', 3);
            
            // Play damage sound
            playSound('damage');
            
            if (state.player.health <= 0) {
              state.gameState = "gameOver";
              setGameState("gameOver");
            }
          } else {
            // Remove bullet even if player is immune
            state.enemyBullets.splice(i, 1);
          }
        }
      }

      // Check player-enemy collisions for contact damage
      for (const enemy of state.enemies) {
        if (enemy.health > 0) { // All alive enemies cause contact damage
          const screenX = enemy.x - state.camera.x;
          if (screenX > -100 && screenX < GAME_CONFIG.canvas.width + 100) {
            const playerRect = { x: state.player.x, y: state.player.y, width: GAME_CONFIG.player.size, height: GAME_CONFIG.player.size };
            const enemySize = enemy.type === 'boss' ? 90 : GAME_CONFIG.enemy.size;
            const enemyRect = { x: enemy.x, y: enemy.y, width: enemySize, height: enemySize };
            
            if (checkCollision(playerRect, enemyRect)) {
              // Only take contact damage if not immune from spawn
              if (state.player.spawnImmunity <= 0) {
                // Take contact damage (0.5 heart for guards/dogs, 1 heart for boss)
                const contactDamage = enemy.type === 'boss' ? 1 : 0.5;
                state.player.health -= contactDamage;
                
                // Add invincibility frames after contact damage (1.5 seconds)
                state.player.spawnImmunity = 1500;
                
                // Knockback effect - push player away from enemy
                const dx = state.player.x - enemy.x;
                const knockbackForce = 30;
                state.player.x += dx > 0 ? knockbackForce : -knockbackForce;
                
                // Add camera shake for impact
                state.camera.shake = Math.max(state.camera.shake, 8);
                
                // Create blood particles at collision point
                createParticles(state.player.x, state.player.y, 'blood', 3);
                
                // Play damage sound
                playSound('damage');
                
                if (state.player.health <= 0) {
                  state.gameState = "gameOver";
                  setGameState("gameOver");
                }
              }
              break; // Only take damage from one enemy per frame
            }
          }
        }
      }

      // Powerup collisions removed for simplified gameplay

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

      // Update objectives with DYNAMIC EVENTS
      state.objectives.forEach(objective => {
        if (objective.type === 'survive' && objective.timeRemaining !== undefined) {
          objective.timeRemaining -= 16; // Assuming 60fps
          
          // DYNAMIC EVENT TRIGGERS!
          if (objective.id === 'reinforcements_warning') {
            // Spawn reinforcements at specific time intervals
            if (objective.timeRemaining === 30000) { // 30 seconds left
              // Spawn 3 additional guards
              for (let i = 0; i < 3; i++) {
                const spawnX = state.player.x + 300 + (i * 100); // Spawn ahead of player
                state.enemies.push({
                  x: spawnX,
                  y: GAME_CONFIG.world.groundLevel - GAME_CONFIG.enemy.size,
                  velocityY: 0,
                  health: GAME_CONFIG.enemy.health,
                  maxHealth: GAME_CONFIG.enemy.health,
                  type: 'guard',
                  lastShotTime: 0,
                  onGround: true,
                  aiState: 'chase', // Start aggressive!
                  alertLevel: 100, // Fully alert!
                  lastPlayerSeen: Date.now(),
                });
              }
              // Visual effect for reinforcement arrival
              state.camera.shake = Math.max(state.camera.shake, 20);
              const lastSpawnX = state.player.x + 300 + (2 * 100); // Use last spawn position
              createParticles(lastSpawnX, GAME_CONFIG.world.groundLevel - 20, 'explosion', 10);
            }
            
            if (objective.timeRemaining === 15000) { // 15 seconds left
              // Spawn attack dogs!
              for (let i = 0; i < 2; i++) {
                const spawnX = state.player.x + 200 + (i * 80);
                state.enemies.push({
                  x: spawnX,
                  y: GAME_CONFIG.world.groundLevel - GAME_CONFIG.enemy.size,
                  velocityY: 0,
                  health: GAME_CONFIG.enemy.health * 0.7, // Less health but faster
                  maxHealth: GAME_CONFIG.enemy.health * 0.7,
                  type: 'dog',
                  lastShotTime: 0,
                  onGround: true,
                  aiState: 'chase',
                  alertLevel: 100,
                  lastPlayerSeen: Date.now(),
                });
              }
              state.camera.shake = Math.max(state.camera.shake, 15);
            }
          }
          
          if (objective.id === 'lockdown_imminent') {
            // Increase global alert level as lockdown approaches
            const timePercent = objective.timeRemaining / (objective.timeLimit || 30000);
            state.alertLevel = Math.min(100, state.alertLevel + (1 - timePercent) * 2);
            
            // Make all enemies more aggressive as time runs out
            if (objective.timeRemaining < 10000) { // Last 10 seconds
              state.enemies.forEach(enemy => {
                enemy.alertLevel = 100;
                enemy.aiState = 'chase';
              });
            }
          }
          
          if (objective.timeRemaining <= 0) {
            if (objective.id === 'reinforcements_warning' || objective.id === 'lockdown_imminent') {
              // Time's up! GAME OVER
              state.gameState = "gameOver";
              setGameState("gameOver");
              return;
            }
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
    
    // Distance markers removed per user request
    
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
          if (obstacle.type === 'door') {
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

      // Powerups removed for simplified gameplay

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
      
      // Add visual effect for spawn immunity
      if (state.player.spawnImmunity > 0) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 100); // Flashing effect
      }
      
      drawPlayer(ctx, playerScreenX, state.player.y);
      
      // Reset alpha after drawing player
      ctx.globalAlpha = 1.0;

      // Draw enemies
      state.enemies.forEach((enemy) => {
        const screenX = enemy.x - state.camera.x;
        if (screenX > -GAME_CONFIG.enemy.size && screenX < GAME_CONFIG.canvas.width) {
          drawEnemy(ctx, enemy, screenX, state.player.x);
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
      
      // === SIMPLIFIED HUD ===
      // Big health bar at top
      const healthBarX = 20;
      const healthBarY = 20;
      const healthBarWidth = 300;
      const healthBarHeight = 30;
      
      // Health bar background
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(healthBarX - 2, healthBarY - 2, healthBarWidth + 4, healthBarHeight + 4);
      
      // Health bar fill
      const healthPercent = state.player.health / GAME_CONFIG.player.maxHealth;
      const healthGradient = ctx.createLinearGradient(healthBarX, healthBarY, healthBarX + healthBarWidth, healthBarY);
      if (healthPercent > 0.6) {
        healthGradient.addColorStop(0, "#00ff00");
        healthGradient.addColorStop(1, "#00cc00");
      } else if (healthPercent > 0.3) {
        healthGradient.addColorStop(0, "#ffaa00");
        healthGradient.addColorStop(1, "#ff8800");
      } else {
        healthGradient.addColorStop(0, "#ff0000");
        healthGradient.addColorStop(1, "#cc0000");
      }
      ctx.fillStyle = healthGradient;
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
      
      // Health bar border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
      
      // Health text (large and clear)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.ceil(state.player.health)} / ${GAME_CONFIG.player.maxHealth}`, healthBarX + healthBarWidth/2, healthBarY + healthBarHeight/2 + 7);
      
      // Score and Distance (below health)
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(healthBarX - 2, healthBarY + 40, 150, 30);
      ctx.fillRect(healthBarX + 168, healthBarY + 40, 150, 30);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`Score: ${state.score}`, healthBarX + 75, healthBarY + 60);
      ctx.fillText(`${state.distance}m`, healthBarX + 243, healthBarY + 60);
      
      // Weapon and Ammo (simple)
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(healthBarX - 2, healthBarY + 80, 320, 30);
      
      ctx.fillStyle = WEAPONS_INFO[state.player.weapon].color;
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`${WEAPONS_INFO[state.player.weapon].name} [${state.player.ammo}]`, healthBarX + 10, healthBarY + 100);
      
      // Simple objective display
      const objStartY = healthBarY + 120;
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(healthBarX - 2, objStartY, 320, 60);
      
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("OBJECTIVES:", healthBarX + 10, objStartY + 20);
      
      // Display objectives simply
      ctx.font = "12px Arial";
      let objY = objStartY + 35;
      state.objectives.forEach((objective, index) => {
        if (index >= 2) return; // Only show first 2 objectives
        const color = objective.completed ? "#00ff00" : "#ffffff";
        ctx.fillStyle = color;
        const status = objective.completed ? "✓" : "•";
        let text = `${status} ${objective.description}`;
        
        if (objective.targetCount) {
          text += ` (${objective.currentCount}/${objective.targetCount})`;
        }
        
        ctx.fillText(text, healthBarX + 10, objY);
        objY += 15;
      });
      
      
      
      // Progress bar to boss at top of screen
      const progressBarWidth = 600;
      const progressBarHeight = 25;
      const progressBarX = (GAME_CONFIG.canvas.width - progressBarWidth) / 2;
      const progressBarY = 15;
      const progress = Math.min(1, state.distance / 300);
      
      // Progress bar background
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(progressBarX - 2, progressBarY - 2, progressBarWidth + 4, progressBarHeight + 4);
      
      // Progress bar border
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 2;
      ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
      
      // Progress bar fill
      const progressGradient = ctx.createLinearGradient(progressBarX, progressBarY, progressBarX + progressBarWidth * progress, progressBarY);
      progressGradient.addColorStop(0, "#00ff00");
      progressGradient.addColorStop(0.5, "#ffff00");
      progressGradient.addColorStop(1, "#ff0000");
      ctx.fillStyle = progressGradient;
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight);
      
      // Distance text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`Distance: ${state.distance}m / 300m`, GAME_CONFIG.canvas.width / 2, progressBarY + 18);
      
      // Boss warning when close
      if (state.distance > 250 && !state.level.bossSpawned) {
        ctx.fillStyle = "#ff0000";
        ctx.font = "bold 16px Arial";
        ctx.fillText(`⚠️ BOSS APPROACHING! ⚠️`, GAME_CONFIG.canvas.width / 2, progressBarY + 40);
      }
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

  // Handle window resize for responsive canvas scaling
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      const canvasAspectRatio = GAME_CONFIG.canvas.width / GAME_CONFIG.canvas.height;
      const containerAspectRatio = containerWidth / containerHeight;
      
      let scale;
      let x = 0;
      let y = 0;
      
      if (containerAspectRatio > canvasAspectRatio) {
        // Container is wider than canvas aspect ratio
        scale = containerHeight / GAME_CONFIG.canvas.height;
        x = (containerWidth - GAME_CONFIG.canvas.width * scale) / 2;
      } else {
        // Container is taller than canvas aspect ratio
        scale = containerWidth / GAME_CONFIG.canvas.width;
        y = (containerHeight - GAME_CONFIG.canvas.height * scale) / 2;
      }
      
      setCanvasScale(scale);
      setCanvasPosition({ x, y });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
      if (e.code === "KeyQ") {
        e.preventDefault();
        rebelDash();
      }
      if (e.code === "KeyE") {
        e.preventDefault();
        switchWeapon();
      }
      if (e.code === "Escape") {
        e.preventDefault();
        const state = gameStateRef.current;
        if (state.gameState === "playing") {
          state.gameState = "paused";
          setGameState("paused");
        } else if (state.gameState === "paused") {
          state.gameState = "playing";
          setGameState("playing");
        }
      }
      if (e.code === "KeyC") {
        e.preventDefault();
        setShowControls(!showControls);
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
  }, [jump, shoot, rebelDash, berserkerMode, startGame, switchWeapon]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Canvas container with scaling */}
      <div ref={containerRef} className="absolute inset-0">
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.canvas.width}
          height={GAME_CONFIG.canvas.height}
          className="block cursor-crosshair"
          style={{
            width: `${GAME_CONFIG.canvas.width * canvasScale}px`,
            height: `${GAME_CONFIG.canvas.height * canvasScale}px`,
            position: 'absolute',
            left: `${canvasPosition.x}px`,
            top: `${canvasPosition.y}px`,
          }}
        />
      </div>
      
      {/* UI Overlays - positioned above canvas */}
      {gameState === "start" && (
        <div 
          className="absolute inset-0 z-10"
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
        <div className="absolute inset-0 z-10 bg-black flex flex-col">
          <div className="flex-1 flex flex-col justify-center items-center p-4 min-h-0">
            {(() => {
              const slide = STORY_SLIDES[storySlide];
              return (
                <div className="w-full max-w-4xl text-center text-white flex flex-col h-full">
                  {/* Chapter Indicator */}
                  <div 
                    className="text-base sm:text-lg font-bold text-white mb-4 flex-shrink-0"
                    style={{
                      fontFamily: 'monospace',
                      letterSpacing: '3px'
                    }}
                  >
                    CHAPTER {storySlide + 1} / {STORY_SLIDES.length}
                  </div>
                  
                  {/* Content Container - Flexible */}
                  <div className="flex-1 flex flex-col justify-center min-h-0">
                    {/* Illustration */}
                    <div className="flex-shrink-0 mb-4">
                      <img 
                        src={slide.image}
                        alt={`Story panel ${storySlide + 1}`}
                        className="w-full h-auto max-h-[40vh] sm:max-h-[45vh] object-contain mx-auto"
                        style={{
                          filter: 'contrast(1.1) saturate(1.2)',
                          imageRendering: 'crisp-edges'
                        }}
                        onError={(e) => {
                          console.log(`Failed to load image: ${slide.image}`);
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNPTUlORyBTT09OPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                    </div>
                    
                    {/* Story Text */}
                    <div className="flex-shrink-0">
                      <p 
                        className="text-sm sm:text-base md:text-lg text-white leading-relaxed"
                        style={{
                          fontFamily: 'monospace',
                          letterSpacing: '1px',
                          lineHeight: '1.6'
                        }}
                      >
                        {slide.text}
                      </p>
                    </div>
                  </div>
                  
                  {/* Navigation Buttons - Always at bottom */}
                  <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 flex-shrink-0">
                    <button
                      onClick={skipStory}
                      className="text-sm sm:text-base font-bold px-4 py-2 sm:px-6 sm:py-3 border-2 text-gray-300 border-gray-300 bg-black hover:bg-gray-300 hover:text-black transition-colors"
                      style={{
                        fontFamily: 'monospace',
                        letterSpacing: '2px'
                      }}
                    >
                      SKIP STORY
                    </button>
                    <button
                      onClick={nextStorySlide}
                      className="text-base sm:text-lg font-bold px-6 py-3 sm:px-8 sm:py-4 border-2 text-yellow-300 border-yellow-300 bg-black hover:bg-yellow-300 hover:text-black transition-colors"
                      style={{
                        fontFamily: 'monospace',
                        letterSpacing: '3px'
                      }}
                    >
                      {storySlide < STORY_SLIDES.length - 1 ? 
                        "CONTINUE" : "START GAME"}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {gameState === "paused" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-yellow-400">PAUSED</h2>
            <p className="text-xl sm:text-2xl mb-8">Press ESC to Resume</p>
            <div className="text-5xl sm:text-6xl mb-6">⏸️</div>
            <div className="text-sm sm:text-base opacity-75 space-y-2">
              <p>Move: A/D or Arrow Keys</p>
              <p>Jump: Space/W/↑</p>
              <p>Shoot: X/Z/Click</p>
              <p>Switch Weapon: E</p>
              <p>Dash: Q</p>
            </div>
          </div>
        </div>
      )}

      {gameState === "gameOver" && (
        <div className="absolute inset-0 z-10 bg-black flex flex-col">
          <div className="flex-1 flex flex-col justify-center items-center p-4 min-h-0">
            <div className="w-full max-w-4xl text-center text-white flex flex-col h-full">
              {/* Mission Status */}
              <div 
                className="text-base sm:text-lg font-bold text-red-500 mb-4 flex-shrink-0"
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: '3px'
                }}
              >
                MISSION FAILED
              </div>
              
              {/* Content Container - Flexible */}
              <div className="flex-1 flex flex-col justify-center min-h-0">
                {/* Illustration */}
                <div className="flex-shrink-0 mb-4">
                  <img 
                    src="/endscreengameover.png"
                    alt="Game Over Screen"
                    className="w-full h-auto max-h-[40vh] sm:max-h-[45vh] object-contain mx-auto"
                    style={{
                      filter: 'contrast(1.1) saturate(1.2)',
                      imageRendering: 'crisp-edges'
                    }}
                    onError={(e) => {
                      console.log('Failed to load image: /endscreengameover.png');
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdBTUUgT1ZFUjwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                </div>
                
                {/* Story Text */}
                <div className="flex-shrink-0">
                  <p 
                    className="text-sm sm:text-base md:text-lg leading-relaxed text-white italic"
                    style={{
                      fontFamily: 'monospace',
                      letterSpacing: '1px'
                    }}
                  >
                    "I'm coming, Wilbur... The truth will live on."
                  </p>
                </div>
              </div>
              
              {/* Action Buttons - Always at bottom */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 flex-shrink-0">
                <button
                  onClick={restartCurrentLevel}
                  className="text-base sm:text-lg font-bold px-6 py-3 sm:px-8 sm:py-4 border-2 text-yellow-300 border-yellow-300 bg-black bg-opacity-80 hover:bg-yellow-300 hover:text-black transition-colors"
                  style={{
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                    animation: 'blink 1.5s infinite'
                  }}
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
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
        <div className="absolute inset-0 z-10 bg-black flex flex-col">
          <div className="flex-1 flex flex-col justify-center items-center p-4 min-h-0">
            <div className="w-full max-w-4xl text-center text-white flex flex-col h-full">
              {/* Mission Status */}
              <div 
                className="text-base sm:text-lg font-bold text-green-500 mb-4 flex-shrink-0"
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: '3px'
                }}
              >
                MISSION ACCOMPLISHED
              </div>
              
              {/* Content Container - Flexible */}
              <div className="flex-1 flex flex-col justify-center min-h-0">
              
              
                {/* Illustration */}
                <div className="flex-shrink-0 mb-4">
                  <img 
                    src="/newendscreenvictory.png"
                    alt="Victory Screen"
                    className="w-full h-auto max-h-[40vh] sm:max-h-[45vh] object-contain mx-auto"
                  style={{
                    filter: 'contrast(1.1) saturate(1.2)',
                    imageRendering: 'crisp-edges'
                  }}
                  onError={(e) => {
                    console.log('Failed to load image: /newendscreenvictory.png');
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNPTklORyBTT09OPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              </div>
                
                {/* Story Text */}
                <div className="flex-shrink-0">
                  <p 
                    className="text-sm sm:text-base md:text-lg leading-relaxed text-white italic"
                    style={{
                      fontFamily: 'monospace',
                      letterSpacing: '1px'
                    }}
                  >
                    "Justice served. The road ahead is mine, Wilbur."
                  </p>
                </div>
              </div>
              
              {/* Action Buttons - Always at bottom */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 flex-shrink-0">
                <button
                  onClick={() => {
                    const state = gameStateRef.current;
                    state.gameState = "missionComplete";
                    setGameState("missionComplete");
                  }}
                  className="text-base sm:text-lg font-bold px-6 py-3 sm:px-8 sm:py-4 border-2 text-cyan-300 border-cyan-300 bg-black hover:bg-cyan-300 hover:text-black transition-colors"
                  style={{
                    fontFamily: 'monospace',
                    letterSpacing: '4px',
                    textShadow: '0 0 10px currentColor, 2px 2px 4px rgba(0, 0, 0, 0.8)',
                    animation: 'blink 1s infinite',
                    boxShadow: '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.1)'
                  }}
                >
                  CONTINUE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === "missionComplete" && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black"
        >
          {/* Arcade Victory Title */}
          <div className="text-center mb-12">
            <h1 
              className="text-6xl sm:text-8xl font-bold text-cyan-300 mb-6"
              style={{
                fontFamily: 'monospace',
                textShadow: '0 0 20px currentColor, 4px 4px 8px rgba(0, 0, 0, 0.8)',
                letterSpacing: '8px',
                animation: 'blink 2s infinite'
              }}
            >
              GAME CLEAR
            </h1>
            <h2 
              className="text-2xl sm:text-4xl font-bold text-yellow-300"
              style={{
                fontFamily: 'monospace',
                textShadow: '0 0 10px currentColor, 2px 2px 4px rgba(0, 0, 0, 0.8)',
                letterSpacing: '4px'
              }}
            >
              CONGRATULATIONS
            </h2>
          </div>

          {/* Arcade Stats Display */}
          <div className="bg-black border-4 border-cyan-300 p-8 mb-12" style={{
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 30px rgba(0, 255, 255, 0.1)'
          }}>
            <div className="text-center text-white space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="text-center">
                  <p className="text-4xl sm:text-5xl font-bold text-yellow-300" style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px currentColor'
                  }}>
                    {displayScore.toLocaleString()}
                  </p>
                  <p className="text-lg text-cyan-300" style={{
                    fontFamily: 'monospace',
                    letterSpacing: '2px'
                  }}>
                    HIGH SCORE
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl sm:text-5xl font-bold text-yellow-300" style={{
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px currentColor'
                  }}>
                    {distance}M
                  </p>
                  <p className="text-lg text-cyan-300" style={{
                    fontFamily: 'monospace',
                    letterSpacing: '2px'
                  }}>
                    DISTANCE
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Play Again Button */}
          <button
            onClick={resetGame}
            className="text-3xl sm:text-4xl font-bold px-8 sm:px-12 py-4 sm:py-6 border-4 text-yellow-300 border-yellow-300 bg-black hover:bg-yellow-300 hover:text-black transition-colors"
            style={{
              fontFamily: 'monospace',
              letterSpacing: '4px',
              textShadow: '0 0 10px currentColor, 2px 2px 4px rgba(0, 0, 0, 0.8)',
              animation: 'blink 1.5s infinite',
              boxShadow: '0 0 20px rgba(255, 255, 0, 0.5), inset 0 0 20px rgba(255, 255, 0, 0.1)'
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Controls Hint Button */}
      {(gameState === "playing" || gameState === "paused") && !showControls && (
        <div className="absolute top-4 right-4 z-40">
          <button
            onClick={() => setShowControls(true)}
            className="px-3 py-2 bg-gray-800 bg-opacity-80 border border-gray-500 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            title="Show Controls (Press C)"
          >
            <span className="font-mono">Controls (C)</span>
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <div className="max-w-4xl mx-auto p-8 text-center">
            <div className="bg-gray-900 border-2 border-cyan-300 rounded-lg p-8 shadow-2xl">
              <h2 className="text-4xl font-bold mb-6 text-cyan-300" style={{ fontFamily: 'monospace' }}>
                GAME CONTROLS
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white">
                {/* Movement Controls */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4" style={{ fontFamily: 'monospace' }}>
                    MOVEMENT
                  </h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-center min-w-[40px]">←</kbd>
                        <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-center min-w-[40px]">A</kbd>
                      </div>
                      <span>Move Left</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-center min-w-[40px]">→</kbd>
                        <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-center min-w-[40px]">D</kbd>
                      </div>
                      <span>Move Right</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-center min-w-[40px]">↑</kbd>
                        <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-center min-w-[40px]">W</kbd>
                        <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded">SPACE</kbd>
                      </div>
                      <span>Jump</span>
                    </div>
                  </div>
                </div>

                {/* Combat Controls */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-red-400 mb-4" style={{ fontFamily: 'monospace' }}>
                    COMBAT
                  </h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-center min-w-[40px]">X</kbd>
                        <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-center min-w-[40px]">Z</kbd>
                      </div>
                      <span>Shoot</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-center min-w-[40px]">Q</kbd>
                      <span className="text-yellow-300">Rebel Dash</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-center min-w-[40px]">E</kbd>
                      <span className="text-orange-300">Switch Weapon</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Controls */}
              <div className="mt-8 pt-6 border-t border-gray-600">
                <h3 className="text-2xl font-bold text-green-400 mb-4" style={{ fontFamily: 'monospace' }}>
                  GAME
                </h3>
                <div className="flex justify-center gap-8 text-left">
                  <div className="flex items-center gap-4">
                    <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded">ESC</kbd>
                    <span>Pause/Resume</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <kbd className="px-3 py-2 bg-gray-700 border border-gray-500 rounded text-center min-w-[40px]">C</kbd>
                    <span>Show/Hide Controls</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setShowControls(false)}
                  className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xl font-bold"
                  style={{ fontFamily: 'monospace' }}
                >
                  CLOSE (C)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}