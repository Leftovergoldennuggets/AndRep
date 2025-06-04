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
    type: 'guard' | 'dog' | 'camera';
    lastShotTime: number;
    onGround: boolean;
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
    type: 'wall' | 'fence' | 'crate' | 'platform' | 'ground';
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
  score: number;
  distance: number;
  gameState: "start" | "playing" | "gameOver";
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
    score: 0,
    distance: 0,
    gameState: "start",
  });
  
  const animationRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotTime = useRef<number>(0);

  const [displayScore, setDisplayScore] = useState(0);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameOver">("start");
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
      });
    }
    
    // Generate prison walls and obstacles
    for (let x = startX; x < endX; x += 200 + Math.random() * 200) {
      const obstacleType = Math.random();
      
      if (obstacleType < 0.3) {
        // Wall obstacle
        const height = 80 + Math.random() * 120;
        obstacles.push({
          x: x + Math.random() * 100,
          y: GAME_CONFIG.world.groundLevel - height,
          width: 20 + Math.random() * 40,
          height: height,
          type: 'wall',
        });
      } else if (obstacleType < 0.6) {
        // Platform obstacle
        obstacles.push({
          x: x + Math.random() * 100,
          y: GAME_CONFIG.world.groundLevel - 120 - Math.random() * 100,
          width: 60 + Math.random() * 80,
          height: 20,
          type: 'platform',
        });
      } else {
        // Fence obstacle
        obstacles.push({
          x: x + Math.random() * 100,
          y: GAME_CONFIG.world.groundLevel - 60,
          width: 10,
          height: 60,
          type: 'fence',
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
        type: enemyType,
        lastShotTime: 0,
        onGround: enemyType !== 'camera',
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

  const startGame = useCallback(() => {
    const state = gameStateRef.current;
    state.gameState = "playing";
    setGameState("playing");
    
    // Generate large static world content (much bigger area)
    const worldSize = 5000; // 5000 units wide world
    const newObstacles = generateObstacles(-worldSize/2, worldSize/2);
    const newEnemies = generateEnemies(-worldSize/2 + 400, worldSize/2 - 400);
    const newPowerups = generatePowerups(-worldSize/2 + 200, worldSize/2 - 200);
    
    state.obstacles = newObstacles;
    state.enemies = newEnemies;
    state.powerups = newPowerups;
  }, [generateObstacles, generateEnemies, generatePowerups]);

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
    
    // Create muzzle flash particles
    const muzzleX = state.player.x + GAME_CONFIG.player.size;
    const muzzleY = state.player.y + GAME_CONFIG.player.size / 2;
    createParticles(muzzleX, muzzleY, 'spark', 3);
    
    const bulletSpeed = GAME_CONFIG.bullet.speed;
    
    if (state.player.weapon === 'shotgun') {
      // Shotgun fires multiple pellets
      for (let i = 0; i < 5; i++) {
        const spread = (Math.random() - 0.5) * weapon.spread;
        state.bullets.push({
          x: muzzleX,
          y: muzzleY,
          velocityX: bulletSpeed + spread * 2,
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
      // BADASS GUARD - Military tactical style
      
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(screenX, enemy.y + size + 2, size, 4);
      
      // Draw TACTICAL ARMOR body
      const armorGradient = ctx.createLinearGradient(screenX, enemy.y, screenX, enemy.y + size);
      armorGradient.addColorStop(0, "#2d4a2d");
      armorGradient.addColorStop(0.5, "#1a2e1a");
      armorGradient.addColorStop(1, "#0f1f0f");
      ctx.fillStyle = armorGradient;
      ctx.fillRect(screenX + 2, enemy.y + 6, size - 4, size - 8);
      
      // Armor plates and details
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(screenX + 4, enemy.y + 8, size - 8, 2);
      ctx.fillRect(screenX + 4, enemy.y + 12, size - 8, 2);
      ctx.fillRect(screenX + 4, enemy.y + 16, size - 8, 2);
      
      // Draw TACTICAL HELMET
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(screenX + 3, enemy.y + 2, size - 6, 8);
      
      // Helmet visor/goggles - BADASS
      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX + 4, enemy.y + 4, size - 8, 4);
      // Visor reflection
      ctx.fillStyle = "#333333";
      ctx.fillRect(screenX + 5, enemy.y + 5, 2, 1);
      ctx.fillRect(screenX + size - 7, enemy.y + 5, 2, 1);
      
      // Draw TACTICAL WEAPON
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(screenX - 8, enemy.y + 10, 12, 4);
      ctx.fillStyle = "#666666";
      ctx.fillRect(screenX - 6, enemy.y + 11, 2, 2);
      
      // Combat boots
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(screenX + 4, enemy.y + size - 2, 4, 6);
      ctx.fillRect(screenX + size - 8, enemy.y + size - 2, 4, 6);
      
    } else if (enemy.type === 'dog') {
      // BADASS GUARD DOG - Cybernetic style
      
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(screenX, enemy.y + size, size, 3);
      
      // Draw cybernetic dog body
      const dogGradient = ctx.createLinearGradient(screenX, enemy.y, screenX, enemy.y + size);
      dogGradient.addColorStop(0, "#4a4a4a");
      dogGradient.addColorStop(0.5, "#2a2a2a");
      dogGradient.addColorStop(1, "#1a1a1a");
      ctx.fillStyle = dogGradient;
      ctx.fillRect(screenX, enemy.y, size, size - 4);
      
      // Cybernetic implants
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(screenX + 2, enemy.y + 2, 2, 2);
      ctx.fillRect(screenX + size - 4, enemy.y + 2, 2, 2);
      
      // Draw robotic head
      ctx.fillStyle = "#333333";
      ctx.fillRect(screenX + 2, enemy.y - 4, size - 4, 8);
      
      // Glowing red eyes
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(screenX + 4, enemy.y - 2, 3, 3);
      ctx.fillRect(screenX + size - 7, enemy.y - 2, 3, 3);
      
      // Mechanical ears
      ctx.fillStyle = "#666666";
      ctx.fillRect(screenX + 1, enemy.y - 3, 3, 2);
      ctx.fillRect(screenX + size - 4, enemy.y - 3, 3, 2);
      
    } else if (enemy.type === 'camera') {
      // BADASS SECURITY CAMERA - High-tech surveillance
      
      // Draw mounting bracket
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(screenX + size/2 - 2, enemy.y - 4, 4, 8);
      
      // Draw main camera body - sleek design
      const cameraGradient = ctx.createLinearGradient(screenX, enemy.y, screenX + size, enemy.y);
      cameraGradient.addColorStop(0, "#1a1a1a");
      cameraGradient.addColorStop(0.5, "#000000");
      cameraGradient.addColorStop(1, "#333333");
      ctx.fillStyle = cameraGradient;
      ctx.fillRect(screenX, enemy.y, size, size - 6);
      
      // Draw large surveillance lens
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(screenX + 3, enemy.y + 2, size - 6, size - 10);
      
      // Lens reflection/glare
      ctx.fillStyle = "#ff6666";
      ctx.fillRect(screenX + 4, enemy.y + 3, 3, 2);
      
      // Additional sensors
      ctx.fillStyle = "#00ff00";
      ctx.fillRect(screenX + 1, enemy.y + 1, 2, 2);
      ctx.fillRect(screenX + size - 3, enemy.y + 1, 2, 2);
      
      // Warning lights
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(screenX + 2, enemy.y + size - 4, 2, 1);
      ctx.fillRect(screenX + size - 4, enemy.y + size - 4, 2, 1);
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
        
        for (const obstacle of state.obstacles) {
          if (checkCollision(
            { x: bullet.x, y: bullet.y, width: GAME_CONFIG.bullet.size, height: GAME_CONFIG.bullet.size },
            { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height }
          )) {
            return false;
          }
        }
        
        return true;
      });

      // Update enemies
      const currentTime = Date.now();
      state.enemies.forEach((enemy) => {
        // Apply gravity to enemies
        if (enemy.type !== 'camera') {
          applyGravity(enemy);
        }
        
        const screenX = enemy.x - state.camera.x;
        const dx = state.player.x - enemy.x;
        const dy = state.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Enemy shooting
        if (enemy.type === 'guard' && distance < 200 && screenX > -100 && screenX < GAME_CONFIG.canvas.width + 100) {
          if (currentTime - enemy.lastShotTime > GAME_CONFIG.enemy.fireRate) {
            enemy.lastShotTime = currentTime;
            const bulletSpeed = GAME_CONFIG.bullet.speed * 0.7;
            state.enemyBullets.push({
              x: enemy.x,
              y: enemy.y + GAME_CONFIG.enemy.size / 2,
              velocityX: (dx / distance) * bulletSpeed,
              velocityY: (dy / distance) * bulletSpeed,
            });
          }
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

      // No need to generate or remove content - static world
    }

    // Clear canvas
    ctx.clearRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);

    // Draw gradient sky background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.world.groundLevel);
    gradient.addColorStop(0, "#ff6b6b");
    gradient.addColorStop(0.4, "#ffa726");
    gradient.addColorStop(1, "#ffcc80");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.world.groundLevel);

    // Draw prison background elements with depth
    const parallaxOffset = state.camera.x * 0.3;
    
    // Background prison walls
    ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
    for (let x = -(parallaxOffset % 120); x < GAME_CONFIG.canvas.width; x += 120) {
      ctx.fillRect(x, 0, 8, GAME_CONFIG.world.groundLevel);
    }
    
    // Foreground fence pattern
    ctx.strokeStyle = "#556b2f";
    ctx.lineWidth = 2;
    for (let x = -(state.camera.x % 20); x < GAME_CONFIG.canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, GAME_CONFIG.world.groundLevel - 60);
      ctx.lineTo(x, GAME_CONFIG.world.groundLevel);
      ctx.stroke();
      
      // Barbed wire effect
      if (x % 40 === 0) {
        ctx.strokeStyle = "#8b4513";
        ctx.beginPath();
        ctx.moveTo(x - 10, GAME_CONFIG.world.groundLevel - 80);
        ctx.lineTo(x + 10, GAME_CONFIG.world.groundLevel - 80);
        ctx.stroke();
        ctx.strokeStyle = "#556b2f";
      }
    }

    if (state.gameState !== "start") {
      // Draw obstacles
      state.obstacles.forEach((obstacle) => {
        const screenX = obstacle.x - state.camera.x;
        if (screenX > -obstacle.width && screenX < GAME_CONFIG.canvas.width) {
          if (obstacle.type === 'ground') {
            ctx.fillStyle = "#8B4513";
          } else if (obstacle.type === 'wall') {
            ctx.fillStyle = "#696969";
          } else if (obstacle.type === 'platform') {
            ctx.fillStyle = "#8B8B8B";
          } else if (obstacle.type === 'crate') {
            ctx.fillStyle = "#D2691E";
          } else {
            ctx.fillStyle = "#708090";
          }
          ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
          
          // Add border
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX, obstacle.y, obstacle.width, obstacle.height);
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

      // Draw bullets with trails
      state.bullets.forEach((bullet) => {
        const screenX = bullet.x - state.camera.x;
        if (screenX > -GAME_CONFIG.bullet.size && screenX < GAME_CONFIG.canvas.width) {
          // Draw trail
          ctx.strokeStyle = "rgba(255, 255, 136, 0.6)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < bullet.trail.length; i++) {
            const trailScreenX = bullet.trail[i].x - state.camera.x;
            if (i === 0) {
              ctx.moveTo(trailScreenX, bullet.trail[i].y);
            } else {
              ctx.lineTo(trailScreenX, bullet.trail[i].y);
            }
          }
          ctx.stroke();
          
          // Draw bullet with glow
          const bulletGradient = ctx.createRadialGradient(
            screenX + GAME_CONFIG.bullet.size/2, bullet.y + GAME_CONFIG.bullet.size/2, 0,
            screenX + GAME_CONFIG.bullet.size/2, bullet.y + GAME_CONFIG.bullet.size/2, GAME_CONFIG.bullet.size
          );
          bulletGradient.addColorStop(0, "#ffff88");
          bulletGradient.addColorStop(1, "#ff8800");
          ctx.fillStyle = bulletGradient;
          ctx.fillRect(screenX, bullet.y, GAME_CONFIG.bullet.size, GAME_CONFIG.bullet.size);
        }
      });

      // Draw enemy bullets
      ctx.fillStyle = "#ff4444";
      state.enemyBullets.forEach((bullet) => {
        const screenX = bullet.x - state.camera.x;
        if (screenX > -GAME_CONFIG.bullet.size && screenX < GAME_CONFIG.canvas.width) {
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
      
      // Draw HUD background
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(5, 5, 200, 110);
      
      // Score with glow effect
      ctx.shadowColor = "#ffff88";
      ctx.shadowBlur = 2;
      ctx.fillStyle = "#ffff88";
      ctx.fillText(`Score: ${state.score}`, 15, 30);
      
      // Distance
      ctx.shadowColor = "#88ff88";
      ctx.fillStyle = "#88ff88";
      ctx.fillText(`Distance: ${state.distance}m`, 15, 55);
      
      // Health bar
      ctx.shadowColor = "none";
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(15, 65, 100, 10);
      ctx.fillStyle = "#44ff44";
      const healthPercent = state.player.health / GAME_CONFIG.player.maxHealth;
      ctx.fillRect(15, 65, 100 * healthPercent, 10);
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.fillText(`Health: ${state.player.health}`, 15, 85);
      
      // Weapon info with color coding
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = WEAPONS_INFO[state.player.weapon].color;
      ctx.shadowColor = WEAPONS_INFO[state.player.weapon].color;
      ctx.shadowBlur = 1;
      ctx.fillText(`${WEAPONS_INFO[state.player.weapon].name}: ${state.player.ammo}`, 15, 105);
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [drawPlayer, drawEnemy, checkCollision, applyGravity, generateObstacles, generateEnemies, generatePowerups, createParticles, updateParticles]);

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
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4 text-red-500">Prison Break Rooster</h1>
            <p className="mb-4">Endless escape through the prison compound!</p>
            <p className="mb-2 text-sm">Space/W/↑: Jump</p>
            <p className="mb-2 text-sm">A/D/←/→: Move Left/Right</p>
            <p className="mb-2 text-sm">X/Z/Click: Shoot</p>
            <p className="mb-6 text-sm">How far can you escape?</p>
            <button
              onClick={startGame}
              className="btn btn-primary btn-lg not-prose"
            >
              <Play className="w-6 h-6 mr-2" />
              Start Endless Escape
            </button>
          </div>
        </div>
      )}

      {gameState === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4 text-red-500">Captured!</h2>
            <p className="text-xl mb-2">Final Score: {displayScore}</p>
            <p className="text-lg mb-6">Distance Escaped: {distance}m</p>
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

      <div className="mt-4 text-center text-white">
        <p className="text-sm opacity-80">
          Keep running, rebel rooster! The prison never ends! 🐓🏃‍♂️
        </p>
      </div>
    </div>
  );
}