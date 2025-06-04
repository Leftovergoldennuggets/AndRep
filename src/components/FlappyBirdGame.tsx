import { useEffect, useRef, useState, useCallback } from "react";
import { Play, RotateCcw } from "lucide-react";

interface GameState {
  player: {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    health: number;
    weapon: WeaponType;
    ammo: number;
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
    velocityX: number;
    velocityY: number;
    health: number;
    type: 'guard' | 'dog' | 'camera';
    lastShotTime: number;
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
    type: 'wall' | 'fence' | 'crate';
  }>;
  powerups: Array<{
    x: number;
    y: number;
    type: 'health' | 'ammo' | 'weapon';
    weaponType?: WeaponType;
  }>;
  score: number;
  level: number;
  gameState: "start" | "playing" | "gameOver" | "victory";
}

type WeaponType = 'pistol' | 'shotgun' | 'rifle' | 'grenade';

const GAME_CONFIG = {
  canvas: {
    width: 800,
    height: 600,
  },
  player: {
    size: 16,
    speed: 3,
    maxHealth: 100,
    gravity: 0.3,
    jumpForce: -8,
  },
  weapons: {
    pistol: { damage: 20, fireRate: 300, ammo: 50, spread: 0 },
    shotgun: { damage: 15, fireRate: 800, ammo: 20, spread: 0.3 },
    rifle: { damage: 35, fireRate: 150, ammo: 30, spread: 0.1 },
    grenade: { damage: 80, fireRate: 2000, ammo: 5, spread: 0 },
  },
  enemy: {
    size: 14,
    speed: 1,
    health: 60,
    fireRate: 1500,
  },
  bullet: {
    speed: 8,
    size: 3,
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
      x: 100,
      y: GAME_CONFIG.canvas.height / 2,
      velocityX: 0,
      velocityY: 0,
      health: GAME_CONFIG.player.maxHealth,
      weapon: 'pistol',
      ammo: GAME_CONFIG.weapons.pistol.ammo,
    },
    bullets: [],
    enemies: [],
    enemyBullets: [],
    obstacles: [],
    powerups: [],
    score: 0,
    level: 1,
    gameState: "start",
  });
  
  const animationRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotTime = useRef<number>(0);

  const [displayScore, setDisplayScore] = useState(0);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameOver" | "victory">("start");

  const resetGame = useCallback(() => {
    gameStateRef.current = {
      player: {
        x: 100,
        y: GAME_CONFIG.canvas.height / 2,
        velocityX: 0,
        velocityY: 0,
        health: GAME_CONFIG.player.maxHealth,
        weapon: 'pistol',
        ammo: GAME_CONFIG.weapons.pistol.ammo,
      },
      bullets: [],
      enemies: [],
      enemyBullets: [],
      obstacles: [],
      powerups: [],
      score: 0,
      level: 1,
      gameState: "start",
    };
    setDisplayScore(0);
    setGameState("start");
    keysRef.current.clear();
  }, []);

  const generateLevel = useCallback(() => {
    const state = gameStateRef.current;
    
    // Clear existing entities
    state.enemies = [];
    state.obstacles = [];
    state.powerups = [];
    
    // Generate prison walls and obstacles
    for (let i = 0; i < 15 + state.level * 3; i++) {
      state.obstacles.push({
        x: Math.random() * (GAME_CONFIG.canvas.width - 100) + 200,
        y: Math.random() * (GAME_CONFIG.canvas.height - 100) + 50,
        width: 20 + Math.random() * 40,
        height: 20 + Math.random() * 40,
        type: Math.random() < 0.6 ? 'wall' : Math.random() < 0.8 ? 'crate' : 'fence',
      });
    }
    
    // Generate enemies
    for (let i = 0; i < 3 + state.level; i++) {
      state.enemies.push({
        x: Math.random() * (GAME_CONFIG.canvas.width - 200) + 300,
        y: Math.random() * (GAME_CONFIG.canvas.height - 100) + 50,
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: (Math.random() - 0.5) * 2,
        health: GAME_CONFIG.enemy.health + state.level * 10,
        type: Math.random() < 0.7 ? 'guard' : Math.random() < 0.9 ? 'dog' : 'camera',
        lastShotTime: 0,
      });
    }
    
    // Generate powerups
    for (let i = 0; i < 2 + Math.floor(state.level / 2); i++) {
      const powerupType = Math.random() < 0.4 ? 'health' : Math.random() < 0.7 ? 'ammo' : 'weapon';
      state.powerups.push({
        x: Math.random() * (GAME_CONFIG.canvas.width - 100) + 50,
        y: Math.random() * (GAME_CONFIG.canvas.height - 100) + 50,
        type: powerupType,
        weaponType: powerupType === 'weapon' ? 
          (['shotgun', 'rifle', 'grenade'] as WeaponType[])[Math.floor(Math.random() * 3)] : 
          undefined,
      });
    }
  }, []);

  const startGame = useCallback(() => {
    gameStateRef.current.gameState = "playing";
    setGameState("playing");
    generateLevel();
  }, [generateLevel]);

  const shoot = useCallback(() => {
    const state = gameStateRef.current;
    const currentTime = Date.now();
    const weapon = GAME_CONFIG.weapons[state.player.weapon];
    
    if (currentTime - lastShotTime.current < weapon.fireRate || state.player.ammo <= 0) {
      return;
    }
    
    lastShotTime.current = currentTime;
    state.player.ammo--;
    
    // Calculate bullet direction (towards mouse or default right)
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

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: any) => {
    const size = GAME_CONFIG.enemy.size;
    
    if (enemy.type === 'guard') {
      // Draw guard (blue uniform)
      ctx.fillStyle = "#000080";
      ctx.fillRect(enemy.x, enemy.y, size, size);
      
      // Draw hat
      ctx.fillStyle = "#000040";
      ctx.fillRect(enemy.x + 2, enemy.y - 2, size - 4, 3);
      
      // Draw face
      ctx.fillStyle = "#ffdbac";
      ctx.fillRect(enemy.x + 3, enemy.y + 3, size - 6, size - 8);
    } else if (enemy.type === 'dog') {
      // Draw guard dog (brown)
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(enemy.x, enemy.y, size, size - 4);
      
      // Draw head
      ctx.fillStyle = "#A0522D";
      ctx.fillRect(enemy.x + 2, enemy.y - 4, size - 4, 8);
      
      // Draw ears
      ctx.fillStyle = "#654321";
      ctx.fillRect(enemy.x + 1, enemy.y - 3, 2, 3);
      ctx.fillRect(enemy.x + size - 3, enemy.y - 3, 2, 3);
    } else if (enemy.type === 'camera') {
      // Draw security camera (gray/black)
      ctx.fillStyle = "#404040";
      ctx.fillRect(enemy.x, enemy.y, size, size - 6);
      
      // Draw lens
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(enemy.x + 4, enemy.y + 2, 6, 6);
    }
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;

    if (state.gameState === "playing") {
      // Handle player movement
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
        state.player.velocityX = -GAME_CONFIG.player.speed;
      } else if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
        state.player.velocityX = GAME_CONFIG.player.speed;
      } else {
        state.player.velocityX *= 0.8; // Friction
      }

      if (keysRef.current.has('ArrowUp') || keysRef.current.has('KeyW')) {
        state.player.velocityY = -GAME_CONFIG.player.speed;
      } else if (keysRef.current.has('ArrowDown') || keysRef.current.has('KeyS')) {
        state.player.velocityY = GAME_CONFIG.player.speed;
      } else {
        state.player.velocityY *= 0.8; // Friction
      }

      // Check obstacle collision before moving
      const newPlayerX = state.player.x + state.player.velocityX;
      const newPlayerY = state.player.y + state.player.velocityY;
      
      let canMoveX = true;
      let canMoveY = true;
      
      for (const obstacle of state.obstacles) {
        // Check X movement
        if (checkCollision({ x: newPlayerX, y: state.player.y, size: GAME_CONFIG.player.size }, obstacle)) {
          canMoveX = false;
        }
        // Check Y movement
        if (checkCollision({ x: state.player.x, y: newPlayerY, size: GAME_CONFIG.player.size }, obstacle)) {
          canMoveY = false;
        }
      }
      
      // Update position only if no collision
      if (canMoveX) {
        state.player.x = newPlayerX;
      }
      if (canMoveY) {
        state.player.y = newPlayerY;
      }

      // Keep player in bounds
      state.player.x = Math.max(0, Math.min(GAME_CONFIG.canvas.width - GAME_CONFIG.player.size, state.player.x));
      state.player.y = Math.max(0, Math.min(GAME_CONFIG.canvas.height - GAME_CONFIG.player.size, state.player.y));

      // Update bullets
      state.bullets.forEach((bullet) => {
        bullet.x += bullet.velocityX;
        bullet.y += bullet.velocityY;
      });

      // Remove bullets that are off screen or hit obstacles
      state.bullets = state.bullets.filter(bullet => {
        // Check if bullet is off screen
        if (bullet.x < -10 || bullet.x > GAME_CONFIG.canvas.width + 10 ||
            bullet.y < -10 || bullet.y > GAME_CONFIG.canvas.height + 10) {
          return false;
        }
        
        // Check if bullet hits obstacle
        for (const obstacle of state.obstacles) {
          if (checkCollision(bullet, { ...obstacle, size: GAME_CONFIG.bullet.size })) {
            return false;
          }
        }
        
        return true;
      });

      // Update enemies
      const currentTime = Date.now();
      state.enemies.forEach((enemy) => {
        // Simple AI - move towards player
        const dx = state.player.x - enemy.x;
        const dy = state.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          enemy.velocityX = (dx / distance) * GAME_CONFIG.enemy.speed;
          enemy.velocityY = (dy / distance) * GAME_CONFIG.enemy.speed;
        }
        
        enemy.x += enemy.velocityX;
        enemy.y += enemy.velocityY;

        // Enemy shooting
        if (enemy.type === 'guard' && distance < 200 && currentTime - enemy.lastShotTime > GAME_CONFIG.enemy.fireRate) {
          enemy.lastShotTime = currentTime;
          const bulletSpeed = GAME_CONFIG.bullet.speed * 0.7;
          state.enemyBullets.push({
            x: enemy.x + GAME_CONFIG.enemy.size / 2,
            y: enemy.y + GAME_CONFIG.enemy.size / 2,
            velocityX: (dx / distance) * bulletSpeed,
            velocityY: (dy / distance) * bulletSpeed,
          });
        }
      });

      // Update enemy bullets
      state.enemyBullets.forEach((bullet) => {
        bullet.x += bullet.velocityX;
        bullet.y += bullet.velocityY;
      });

      // Remove enemy bullets that are off screen
      state.enemyBullets = state.enemyBullets.filter(bullet => 
        bullet.x > -10 && bullet.x < GAME_CONFIG.canvas.width + 10 &&
        bullet.y > -10 && bullet.y < GAME_CONFIG.canvas.height + 10
      );

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
        if (checkCollision(bullet, { ...state.player, width: GAME_CONFIG.player.size, height: GAME_CONFIG.player.size })) {
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
        if (checkCollision(state.player, { ...powerup, width: 12, height: 12 })) {
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

      // Check if level is complete (all enemies defeated)
      if (state.enemies.length === 0) {
        state.level++;
        if (state.level > 5) {
          state.gameState = "victory";
          setGameState("victory");
        } else {
          generateLevel();
        }
      }
    }

    // Clear canvas
    ctx.clearRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);

    // Draw prison background
    ctx.fillStyle = "#2F4F4F";
    ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);
    
    // Draw grid pattern for prison floor
    ctx.strokeStyle = "#696969";
    ctx.lineWidth = 1;
    for (let x = 0; x < GAME_CONFIG.canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_CONFIG.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < GAME_CONFIG.canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_CONFIG.canvas.width, y);
      ctx.stroke();
    }

    if (state.gameState !== "start") {
      // Draw obstacles
      state.obstacles.forEach((obstacle) => {
        if (obstacle.type === 'wall') {
          ctx.fillStyle = "#8B4513";
        } else if (obstacle.type === 'crate') {
          ctx.fillStyle = "#D2691E";
        } else {
          ctx.fillStyle = "#708090";
        }
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add some detail
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });

      // Draw powerups
      state.powerups.forEach((powerup) => {
        if (powerup.type === 'health') {
          ctx.fillStyle = "#ff0000";
        } else if (powerup.type === 'ammo') {
          ctx.fillStyle = "#ffff00";
        } else {
          ctx.fillStyle = "#00ff00";
        }
        ctx.fillRect(powerup.x, powerup.y, 12, 12);
        
        // Add icon
        ctx.fillStyle = "#ffffff";
        ctx.font = "8px Arial";
        ctx.textAlign = "center";
        const text = powerup.type === 'health' ? '+' : powerup.type === 'ammo' ? 'A' : 'W';
        ctx.fillText(text, powerup.x + 6, powerup.y + 8);
      });

      // Draw player
      drawPlayer(ctx, state.player.x, state.player.y);

      // Draw enemies
      state.enemies.forEach((enemy) => {
        drawEnemy(ctx, enemy);
      });

      // Draw bullets
      ctx.fillStyle = "#ffff00";
      state.bullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, GAME_CONFIG.bullet.size, GAME_CONFIG.bullet.size);
      });

      // Draw enemy bullets
      ctx.fillStyle = "#ff4444";
      state.enemyBullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, GAME_CONFIG.bullet.size, GAME_CONFIG.bullet.size);
      });

      // Draw HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${state.score}`, 10, 25);
      ctx.fillText(`Level: ${state.level}`, 10, 50);
      ctx.fillText(`Health: ${state.player.health}`, 10, 75);
      ctx.fillText(`${WEAPONS_INFO[state.player.weapon].name}: ${state.player.ammo}`, 10, 100);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [drawPlayer, drawEnemy, checkCollision, generateLevel]);

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
      
      if (e.code === "Space") {
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
  }, [shoot, startGame]);

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
            <p className="mb-4">A rebellious rooster fights through a high-security chicken farm!</p>
            <p className="mb-2 text-sm">WASD/Arrow Keys: Move</p>
            <p className="mb-2 text-sm">Space/Click: Shoot</p>
            <p className="mb-6 text-sm">Collect powerups and escape through 5 levels!</p>
            <button
              onClick={startGame}
              className="btn btn-primary btn-lg not-prose"
            >
              <Play className="w-6 h-6 mr-2" />
              Start Prison Break
            </button>
          </div>
        </div>
      )}

      {gameState === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4 text-red-500">Captured!</h2>
            <p className="text-xl mb-2">Final Score: {displayScore}</p>
            <p className="text-lg mb-6">Reached Level: {gameStateRef.current.level}</p>
            <button
              onClick={resetGame}
              className="btn btn-secondary btn-lg not-prose"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {gameState === "victory" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4 text-green-500">FREEDOM!</h2>
            <p className="text-xl mb-2">You escaped the prison farm!</p>
            <p className="text-lg mb-2">Final Score: {displayScore}</p>
            <p className="text-lg mb-6">You're a true rebel rooster! 🐓</p>
            <button
              onClick={resetGame}
              className="btn btn-primary btn-lg not-prose"
            >
              <Play className="w-6 h-6 mr-2" />
              Play Again
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-center text-white">
        <p className="text-sm opacity-80">
          Fight your way to freedom, rebel rooster! 🐓💥
        </p>
      </div>
    </div>
  );
}