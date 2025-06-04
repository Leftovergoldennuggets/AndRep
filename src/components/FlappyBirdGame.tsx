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
  };
  bullets: Array<{
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    damage: number;
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
  camera: {
    x: number;
  };
  score: number;
  distance: number;
  gameState: "start" | "playing" | "gameOver";
}

type WeaponType = 'pistol' | 'shotgun' | 'rifle' | 'grenade';

const GAME_CONFIG = {
  canvas: {
    width: 800,
    height: 600,
  },
  player: {
    size: 16,
    maxHealth: 100,
    gravity: 0.4,
    jumpForce: -12,
    moveSpeed: 2,
    scrollSpeed: 3, // How fast the world moves left
  },
  weapons: {
    pistol: { damage: 20, fireRate: 300, ammo: 50, spread: 0 },
    shotgun: { damage: 15, fireRate: 800, ammo: 20, spread: 0.3 },
    rifle: { damage: 35, fireRate: 150, ammo: 30, spread: 0.1 },
    grenade: { damage: 80, fireRate: 2000, ammo: 5, spread: 0 },
  },
  enemy: {
    size: 14,
    health: 60,
    fireRate: 1500,
    gravity: 0.4,
  },
  bullet: {
    speed: 8,
    size: 3,
  },
  world: {
    groundLevel: 550, // Y position of the ground
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
    },
    bullets: [],
    enemies: [],
    enemyBullets: [],
    obstacles: [],
    powerups: [],
    camera: {
      x: 0,
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
      },
      bullets: [],
      enemies: [],
      enemyBullets: [],
      obstacles: [],
      powerups: [],
      camera: {
        x: 0,
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
    
    const bulletSpeed = GAME_CONFIG.bullet.speed;
    
    if (state.player.weapon === 'shotgun') {
      // Shotgun fires multiple pellets
      for (let i = 0; i < 5; i++) {
        const spread = (Math.random() - 0.5) * weapon.spread;
        state.bullets.push({
          x: state.player.x + GAME_CONFIG.player.size,
          y: state.player.y + GAME_CONFIG.player.size / 2,
          velocityX: bulletSpeed + spread * 2,
          velocityY: spread,
          damage: weapon.damage,
        });
      }
    } else {
      const spread = (Math.random() - 0.5) * weapon.spread;
      state.bullets.push({
        x: state.player.x + GAME_CONFIG.player.size,
        y: state.player.y + GAME_CONFIG.player.size / 2,
        velocityX: bulletSpeed,
        velocityY: spread,
        damage: weapon.damage,
      });
    }
  }, []);

  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + (rect1.size || rect1.width) > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + (rect1.size || rect1.height) > rect2.y;
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
    
    // Draw rooster body (orange-red)
    ctx.fillStyle = "#ff6b35";
    ctx.fillRect(x + 2, y + 6, size - 4, size - 8);
    
    // Draw comb (red)
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(x + 4, y, 2, 4);
    ctx.fillRect(x + 6, y - 1, 2, 5);
    ctx.fillRect(x + 8, y, 2, 4);
    
    // Draw beak (yellow)
    ctx.fillStyle = "#ffaa00";
    ctx.fillRect(x - 1, y + 7, 3, 2);
    
    // Draw eye (black)
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + 5, y + 6, 2, 2);
    
    // Draw legs (yellow)
    ctx.fillStyle = "#ffaa00";
    ctx.fillRect(x + 4, y + size - 2, 1, 3);
    ctx.fillRect(x + 8, y + size - 2, 1, 3);
    
    // Draw weapon
    const weapon = gameStateRef.current.player.weapon;
    ctx.fillStyle = WEAPONS_INFO[weapon].color;
    ctx.fillRect(x + size, y + 8, 8, 2);
  }, []);

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: any, screenX: number) => {
    const size = GAME_CONFIG.enemy.size;
    
    if (enemy.type === 'guard') {
      // Draw guard (blue uniform)
      ctx.fillStyle = "#000080";
      ctx.fillRect(screenX, enemy.y, size, size);
      
      // Draw hat
      ctx.fillStyle = "#000040";
      ctx.fillRect(screenX + 2, enemy.y - 2, size - 4, 3);
      
      // Draw face
      ctx.fillStyle = "#ffdbac";
      ctx.fillRect(screenX + 3, enemy.y + 3, size - 6, size - 8);
    } else if (enemy.type === 'dog') {
      // Draw guard dog (brown)
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(screenX, enemy.y, size, size - 4);
      
      // Draw head
      ctx.fillStyle = "#A0522D";
      ctx.fillRect(screenX + 2, enemy.y - 4, size - 4, 8);
      
      // Draw ears
      ctx.fillStyle = "#654321";
      ctx.fillRect(screenX + 1, enemy.y - 3, 2, 3);
      ctx.fillRect(screenX + size - 3, enemy.y - 3, 2, 3);
    } else if (enemy.type === 'camera') {
      // Draw security camera (gray/black)
      ctx.fillStyle = "#404040";
      ctx.fillRect(screenX, enemy.y, size, size - 6);
      
      // Draw lens
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(screenX + 4, enemy.y + 2, 6, 6);
    }
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;

    if (state.gameState === "playing") {
      // Handle player horizontal movement (unlimited)
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
        state.player.x -= GAME_CONFIG.player.moveSpeed;
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
        state.player.x += GAME_CONFIG.player.moveSpeed;
      }

      // Camera follows player (keep player centered)
      state.camera.x = state.player.x - GAME_CONFIG.canvas.width / 2;
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
              { x: state.player.x, y: state.player.y, size: GAME_CONFIG.player.size },
              { x: screenX, y: obstacle.y, width: obstacle.width, height: obstacle.height }
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

      // Update bullets
      state.bullets.forEach((bullet) => {
        bullet.x += bullet.velocityX;
        bullet.y += bullet.velocityY;
      });

      // Remove bullets that are off screen or hit obstacles
      state.bullets = state.bullets.filter(bullet => {
        const screenX = bullet.x - state.camera.x;
        if (screenX < -50 || screenX > GAME_CONFIG.canvas.width + 50 ||
            bullet.y < -10 || bullet.y > GAME_CONFIG.canvas.height + 10) {
          return false;
        }
        
        for (const obstacle of state.obstacles) {
          const obstacleScreenX = obstacle.x - state.camera.x;
          if (checkCollision(bullet, { x: obstacleScreenX, y: obstacle.y, width: obstacle.width, height: obstacle.height })) {
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
          if (checkCollision(bullet, { ...enemy, width: GAME_CONFIG.enemy.size, height: GAME_CONFIG.enemy.size })) {
            enemy.health -= bullet.damage;
            state.bullets.splice(i, 1);
            
            if (enemy.health <= 0) {
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
          { x: state.player.x, y: state.player.y, size: GAME_CONFIG.player.size },
          { x: powerup.x, y: powerup.y, width: 12, height: 12 }
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

    // Draw sky background
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.world.groundLevel);

    // Draw prison background elements (moving with camera)
    ctx.strokeStyle = "#696969";
    ctx.lineWidth = 1;
    for (let x = -(state.camera.x % 40); x < GAME_CONFIG.canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_CONFIG.canvas.height);
      ctx.stroke();
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
        if (screenX > -12 && screenX < GAME_CONFIG.canvas.width) {
          if (powerup.type === 'health') {
            ctx.fillStyle = "#ff0000";
          } else if (powerup.type === 'ammo') {
            ctx.fillStyle = "#ffff00";
          } else {
            ctx.fillStyle = "#00ff00";
          }
          ctx.fillRect(screenX, powerup.y, 12, 12);
          
          // Add icon
          ctx.fillStyle = "#ffffff";
          ctx.font = "8px Arial";
          ctx.textAlign = "center";
          const text = powerup.type === 'health' ? '+' : powerup.type === 'ammo' ? 'A' : 'W';
          ctx.fillText(text, screenX + 6, powerup.y + 8);
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

      // Draw bullets
      ctx.fillStyle = "#ffff00";
      state.bullets.forEach((bullet) => {
        const screenX = bullet.x - state.camera.x;
        if (screenX > -GAME_CONFIG.bullet.size && screenX < GAME_CONFIG.canvas.width) {
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

      // Draw HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${state.score}`, 10, 25);
      ctx.fillText(`Distance: ${state.distance}m`, 10, 50);
      ctx.fillText(`Health: ${state.player.health}`, 10, 75);
      ctx.fillText(`${WEAPONS_INFO[state.player.weapon].name}: ${state.player.ammo}`, 10, 100);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [drawPlayer, drawEnemy, checkCollision, applyGravity, generateObstacles, generateEnemies, generatePowerups]);

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