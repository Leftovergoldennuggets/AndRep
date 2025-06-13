/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback } from "react";
import { 
  GameState, 
  WeaponType, 
  Enemy, 
  Bullet, 
  Obstacle, 
  ObstacleType,
  Powerup, 
  Vector2D,
  Particle,
  LevelTheme
} from "./game/types";
import { 
  GAME_DIMENSIONS, 
  PHYSICS, 
  PLAYER, 
  ENEMY_SIZES, 
  UI, 
  COMBAT, 
  AI, 
  SPECIAL_ABILITIES,
  COLORS
} from "./game/constants";
import { WEAPONS, canFire } from "./game/weapons";
import { 
  STORY_SLIDES, 
  LEVELS, 
  BOSS_CONFIGS, 
  ANIMAL_TYPES, 
  ANIMAL_SIZES 
} from "./game/config";
import { 
  clamp, 
  distance, 
  angle, 
  randomRange, 
  randomInt, 
  checkCollision, 
  isInViewport, 
  applyGravity,
  applyKnockback,
  drawHealthBar,
  drawProgressBar,
  updateCameraShake,
  applyCameraShake
} from "./game/utils";
import { 
  createParticles, 
  updateParticles, 
  drawParticles, 
  createExplosion, 
  createBloodSplatter 
} from "./game/particles";
import { AudioSystem } from "./game/audio";

// Initialize default game state
const createInitialGameState = (): GameState => ({
  player: {
    x: 400,
    y: GAME_DIMENSIONS.GROUND_HEIGHT - PLAYER.HEIGHT,
    velocityY: 0,
    health: PLAYER.MAX_HEALTH,
    weapon: 'pistol',
    ammo: WEAPONS.pistol.ammo,
    onGround: true,
    animationFrame: 0,
    direction: 'right',
    spawnImmunity: PLAYER.SPAWN_IMMUNITY_DURATION,
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
  camera: { x: 0, shake: 0 },
  objectives: LEVELS[1].objectives.map(obj => ({ ...obj })),
  score: 0,
  gameOver: false,
  gameStarted: false,
  gamePaused: false,
  gameWon: false,
  currentObjective: 0,
  comboCount: 0,
  lastKillTime: 0,
  dialogueText: "",
  dialogueTimer: 0,
  currentSlide: 0,
  slideTransition: false,
  specialAbilitiesUsed: {},
});

export default function FlappyBirdGameRefactored() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(createInitialGameState());
  const animationRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotTime = useRef<number>(0);
  
  // Special ability cooldowns
  const lastMultiShotTime = useRef<number>(0);
  const lastDashTime = useRef<number>(0);
  const lastBerserkerTime = useRef<number>(0);
  const berserkerEndTime = useRef<number>(0);
  
  // Audio system
  const audioSystemRef = useRef<AudioSystem>(new AudioSystem());
  
  // React state for UI updates
  const [displayScore, setDisplayScore] = useState(0);
  const [gameState, setGameState] = useState<"start" | "story" | "playing" | "paused" | "gameOver" | "missionComplete" | "victoryIllustration" | "levelComplete">("start");
  const [distance, setDistance] = useState(0);
  const [storySlide, setStorySlide] = useState(0);
  
  // Initialize audio on mount
  useEffect(() => {
    audioSystemRef.current.initialize();
    return () => {
      audioSystemRef.current.cleanup();
    };
  }, []);
  
  // Game loop update function
  const updateGame = useCallback((currentTime: number) => {
    const state = gameStateRef.current;
    const { player, enemies, bullets, enemyBullets, particles, camera, level } = state;
    
    // Update camera shake
    updateCameraShake(camera);
    
    // Update player
    updatePlayer(state, currentTime);
    
    // Update enemies
    updateEnemies(state, currentTime);
    
    // Update projectiles
    updateBullets(state);
    updateEnemyBullets(state);
    
    // Update particles
    state.particles = updateParticles(particles, 16);
    
    // Check collisions
    checkAllCollisions(state);
    
    // Update camera position
    updateCamera(state);
    
    // Check objectives
    checkObjectives(state);
    
    // Update UI state
    setDisplayScore(state.score);
    setDistance(Math.floor(player.x / 100));
    
    // Check win/lose conditions
    if (player.health <= 0 && !state.gameOver) {
      state.gameOver = true;
      setGameState("gameOver");
    }
    
    if (level.bossDefeated && level.current === 4) {
      setGameState("victoryIllustration");
    } else if (level.bossDefeated) {
      advanceLevel(state);
    }
  }, []);
  
  // Update player physics and input
  const updatePlayer = (state: GameState, currentTime: number) => {
    const { player } = state;
    const keys = keysRef.current;
    
    // Apply gravity
    applyGravity(player, PHYSICS.GRAVITY);
    
    // Update position
    player.y += player.velocityY;
    
    // Ground collision
    if (player.y > GAME_DIMENSIONS.GROUND_HEIGHT - PLAYER.HEIGHT) {
      player.y = GAME_DIMENSIONS.GROUND_HEIGHT - PLAYER.HEIGHT;
      player.velocityY = 0;
      player.onGround = true;
    }
    
    // Handle input
    if (keys.has('ArrowLeft') || keys.has('a')) {
      player.x -= PHYSICS.PLAYER_SPEED;
      player.direction = 'left';
      player.animationFrame = (player.animationFrame + 1) % 20;
    }
    if (keys.has('ArrowRight') || keys.has('d')) {
      player.x += PHYSICS.PLAYER_SPEED;
      player.direction = 'right';
      player.animationFrame = (player.animationFrame + 1) % 20;
    }
    if ((keys.has('ArrowUp') || keys.has('w') || keys.has(' ')) && player.onGround) {
      player.velocityY = PHYSICS.JUMP_FORCE;
      player.onGround = false;
      audioSystemRef.current.playSound('jump');
    }
    
    // Shooting
    if (keys.has('Enter') || keys.has('e')) {
      shoot(state, currentTime);
    }
    
    // Special abilities
    if (keys.has('q')) {
      multiShot(state, currentTime);
    }
    if (keys.has('Shift')) {
      executionDash(state, currentTime);
    }
    if (keys.has('r')) {
      berserkerMode(state, currentTime);
    }
    
    // Update spawn immunity
    if (player.spawnImmunity > 0) {
      player.spawnImmunity -= 16;
    }
    
    // Keep player in bounds
    player.x = clamp(player.x, 0, state.level.endX - PLAYER.WIDTH);
  };
  
  // Shooting mechanics
  const shoot = (state: GameState, currentTime: number) => {
    const { player } = state;
    
    if (!canFire(player.weapon, lastShotTime.current, currentTime, player.ammo)) {
      return;
    }
    
    const weapon = WEAPONS[player.weapon];
    player.ammo--;
    lastShotTime.current = currentTime;
    
    audioSystemRef.current.playSound('shoot');
    
    // Create bullet(s)
    const bulletCount = weapon.bulletCount || 1;
    for (let i = 0; i < bulletCount; i++) {
      const spreadAngle = (i - (bulletCount - 1) / 2) * weapon.spread;
      const velocityX = player.direction === 'right' ? weapon.bulletSpeed : -weapon.bulletSpeed;
      
      state.bullets.push({
        x: player.x + (player.direction === 'right' ? PLAYER.WIDTH : 0),
        y: player.y + PLAYER.HEIGHT / 2,
        velocityX: velocityX * Math.cos(spreadAngle),
        velocityY: velocityX * Math.sin(spreadAngle),
        damage: weapon.damage * (berserkerEndTime.current > currentTime ? 2 : 1),
        trail: [],
      });
    }
    
    // Add muzzle flash
    state.particles.push(...createParticles(
      { x: player.x + (player.direction === 'right' ? PLAYER.WIDTH : 0), y: player.y + PLAYER.HEIGHT / 2 },
      'spark',
      5
    ));
  };
  
  // Special ability: Multi-shot
  const multiShot = (state: GameState, currentTime: number) => {
    if (currentTime - lastMultiShotTime.current < SPECIAL_ABILITIES.MULTI_SHOT.COOLDOWN) {
      return;
    }
    
    lastMultiShotTime.current = currentTime;
    const { player } = state;
    
    audioSystemRef.current.playSound('powerup');
    
    for (let i = 0; i < SPECIAL_ABILITIES.MULTI_SHOT.BULLET_COUNT; i++) {
      const angleOffset = (i - 1) * SPECIAL_ABILITIES.MULTI_SHOT.SPREAD_ANGLE;
      const baseVelocity = player.direction === 'right' ? PHYSICS.BULLET_SPEED : -PHYSICS.BULLET_SPEED;
      
      state.bullets.push({
        x: player.x + (player.direction === 'right' ? PLAYER.WIDTH : 0),
        y: player.y + PLAYER.HEIGHT / 2,
        velocityX: baseVelocity * Math.cos(angleOffset),
        velocityY: baseVelocity * Math.sin(angleOffset),
        damage: WEAPONS[player.weapon].damage,
        trail: [],
      });
    }
    
    state.specialAbilitiesUsed.multiShot = true;
  };
  
  // Special ability: Execution dash
  const executionDash = (state: GameState, currentTime: number) => {
    if (currentTime - lastDashTime.current < SPECIAL_ABILITIES.EXECUTION_DASH.COOLDOWN) {
      return;
    }
    
    lastDashTime.current = currentTime;
    const { player, enemies } = state;
    
    audioSystemRef.current.playSound('dash');
    
    // Dash forward
    const dashDistance = SPECIAL_ABILITIES.EXECUTION_DASH.DISTANCE;
    const targetX = player.x + (player.direction === 'right' ? dashDistance : -dashDistance);
    
    // Check for enemies in dash path
    enemies.forEach(enemy => {
      const inPath = player.direction === 'right' 
        ? enemy.x > player.x && enemy.x < targetX
        : enemy.x < player.x && enemy.x > targetX;
        
      if (inPath && Math.abs(enemy.y - player.y) < 100) {
        enemy.health -= SPECIAL_ABILITIES.EXECUTION_DASH.DAMAGE;
        state.particles.push(...createBloodSplatter(
          { x: enemy.x, y: enemy.y },
          player.direction === 'right' ? 0 : Math.PI
        ));
        state.camera.shake = 10;
      }
    });
    
    player.x = clamp(targetX, 0, state.level.endX - PLAYER.WIDTH);
    state.specialAbilitiesUsed.executionDash = true;
  };
  
  // Special ability: Berserker mode
  const berserkerMode = (state: GameState, currentTime: number) => {
    if (currentTime - lastBerserkerTime.current < SPECIAL_ABILITIES.BERSERKER_MODE.COOLDOWN) {
      return;
    }
    
    lastBerserkerTime.current = currentTime;
    berserkerEndTime.current = currentTime + SPECIAL_ABILITIES.BERSERKER_MODE.DURATION;
    
    audioSystemRef.current.playSound('berserker');
    state.camera.shake = 20;
    state.specialAbilitiesUsed.berserkerMode = true;
  };
  
  // Update enemies
  const updateEnemies = (state: GameState, currentTime: number) => {
    state.enemies.forEach(enemy => {
      // Apply gravity
      applyGravity(enemy, PHYSICS.GRAVITY);
      enemy.y += enemy.velocityY;
      
      // Ground collision
      if (enemy.y > GAME_DIMENSIONS.GROUND_HEIGHT - ENEMY_SIZES[enemy.type].HEIGHT) {
        enemy.y = GAME_DIMENSIONS.GROUND_HEIGHT - ENEMY_SIZES[enemy.type].HEIGHT;
        enemy.velocityY = 0;
        enemy.onGround = true;
      }
      
      // Update AI
      updateEnemyAI(enemy, state, currentTime);
      
      // Update hit flash
      if (enemy.hitFlash && enemy.hitFlash > 0) {
        enemy.hitFlash--;
      }
    });
    
    // Remove dead enemies
    state.enemies = state.enemies.filter(enemy => {
      if (enemy.health <= 0) {
        handleEnemyDeath(state, enemy, currentTime);
        return false;
      }
      return true;
    });
  };
  
  // Update enemy AI
  const updateEnemyAI = (enemy: Enemy, state: GameState, currentTime: number) => {
    const { player } = state;
    const dist = distance(enemy, player);
    
    // Update alert level
    if (dist < AI.DETECTION_RANGE) {
      enemy.alertLevel = Math.min(100, enemy.alertLevel + 2);
      enemy.lastPlayerSeen = currentTime;
    } else {
      enemy.alertLevel = Math.max(0, enemy.alertLevel - AI.ALERT_DECAY_RATE);
    }
    
    // State machine
    switch (enemy.aiState) {
      case 'patrol':
        if (enemy.alertLevel > 50) {
          enemy.aiState = 'chase';
        } else {
          // Patrol behavior
          if (!enemy.patrolDirection) enemy.patrolDirection = 1;
          enemy.x += AI.PATROL_SPEED * enemy.patrolDirection;
          
          if (Math.abs(enemy.x - (enemy.patrolStartX || enemy.x)) > 200) {
            enemy.patrolDirection *= -1;
          }
        }
        break;
        
      case 'chase':
        if (dist > AI.DETECTION_RANGE * 1.5) {
          enemy.aiState = 'patrol';
        } else if (dist < AI.ATTACK_RANGE) {
          enemy.aiState = 'attack';
        } else {
          // Chase player
          const dx = player.x - enemy.x;
          enemy.x += Math.sign(dx) * AI.CHASE_SPEED;
        }
        break;
        
      case 'attack':
        if (dist > AI.ATTACK_RANGE) {
          enemy.aiState = 'chase';
        } else if (currentTime - enemy.lastShotTime > 1500) {
          // Shoot at player
          enemyShoot(state, enemy, currentTime);
        }
        break;
        
      case 'cover':
        // Move to cover position
        if (enemy.coverPosition) {
          const coverDist = distance(enemy, enemy.coverPosition);
          if (coverDist > 10) {
            const dx = enemy.coverPosition.x - enemy.x;
            enemy.x += Math.sign(dx) * AI.CHASE_SPEED;
          }
        }
        break;
        
      case 'retreat': {
        // Move away from player
        const dx = enemy.x - player.x;
        enemy.x += Math.sign(dx) * AI.CHASE_SPEED;
        
        if (dist > AI.DETECTION_RANGE) {
          enemy.aiState = 'patrol';
        }
        break;
      }
    }
  };
  
  // Enemy shooting
  const enemyShoot = (state: GameState, enemy: Enemy, currentTime: number) => {
    const { player } = state;
    enemy.lastShotTime = currentTime;
    
    const angleToPlayer = angle(enemy, player);
    
    state.enemyBullets.push({
      x: enemy.x + ENEMY_SIZES[enemy.type].WIDTH / 2,
      y: enemy.y + ENEMY_SIZES[enemy.type].HEIGHT / 2,
      velocityX: Math.cos(angleToPlayer) * PHYSICS.ENEMY_BULLET_SPEED,
      velocityY: Math.sin(angleToPlayer) * PHYSICS.ENEMY_BULLET_SPEED,
      damage: 10,
    });
    
    audioSystemRef.current.playSound('shoot');
  };
  
  // Handle enemy death
  const handleEnemyDeath = (state: GameState, enemy: Enemy, currentTime: number) => {
    // Add score
    const baseScore = enemy.type === 'boss' ? 1000 : enemy.type === 'dog' ? 50 : 100;
    const comboMultiplier = Math.min(state.comboCount * 0.1 + 1, 3);
    state.score += Math.floor(baseScore * comboMultiplier);
    
    // Update combo
    if (currentTime - state.lastKillTime < 2000) {
      state.comboCount++;
    } else {
      state.comboCount = 1;
    }
    state.lastKillTime = currentTime;
    
    // Create death effects
    state.particles.push(...createExplosion(enemy, 1.5));
    state.camera.shake = enemy.type === 'boss' ? 30 : 15;
    
    // Drop powerups
    if (Math.random() < 0.3) {
      const powerupTypes: Array<'health' | 'ammo' | 'weapon'> = ['health', 'ammo', 'weapon'];
      const type = powerupTypes[randomInt(0, powerupTypes.length - 1)];
      
      state.powerups.push({
        x: enemy.x,
        y: enemy.y,
        type,
        weaponType: type === 'weapon' ? (['rifle', 'shotgun', 'sniper', 'machinegun'] as WeaponType[])[randomInt(0, 3)] : undefined,
      });
    }
    
    // Check boss defeat
    if (enemy.type === 'boss') {
      state.level.bossDefeated = true;
    }
  };
  
  // Update bullets
  const updateBullets = (state: GameState) => {
    state.bullets = state.bullets.filter(bullet => {
      bullet.x += bullet.velocityX;
      bullet.y += bullet.velocityY;
      
      // Add to trail
      if (bullet.trail) {
        bullet.trail.push({ x: bullet.x, y: bullet.y });
        if (bullet.trail.length > 10) {
          bullet.trail.shift();
        }
      }
      
      return isInViewport(bullet, state.camera.x, 200);
    });
  };
  
  // Update enemy bullets
  const updateEnemyBullets = (state: GameState) => {
    state.enemyBullets = state.enemyBullets.filter(bullet => {
      bullet.x += bullet.velocityX;
      bullet.y += bullet.velocityY;
      
      return isInViewport(bullet, state.camera.x, 200);
    });
  };
  
  // Check all collisions
  const checkAllCollisions = (state: GameState) => {
    const { player, enemies, bullets, enemyBullets, obstacles, powerups } = state;
    
    // Player-enemy collisions
    if (player.spawnImmunity <= 0) {
      enemies.forEach(enemy => {
        if (checkCollision(
          { ...player, width: PLAYER.WIDTH, height: PLAYER.HEIGHT },
          { ...enemy, width: ENEMY_SIZES[enemy.type].WIDTH, height: ENEMY_SIZES[enemy.type].HEIGHT }
        )) {
          player.health -= 10;
          player.spawnImmunity = 1000;
          applyKnockback(player, COMBAT.KNOCKBACK_FORCE, angle(enemy, player));
          audioSystemRef.current.playSound('damage');
          state.camera.shake = 10;
        }
      });
    }
    
    // Bullet-enemy collisions
    bullets.forEach((bullet, bulletIndex) => {
      enemies.forEach(enemy => {
        if (checkCollision(
          { ...bullet, width: 10, height: 10 },
          { ...enemy, width: ENEMY_SIZES[enemy.type].WIDTH, height: ENEMY_SIZES[enemy.type].HEIGHT }
        )) {
          enemy.health -= bullet.damage;
          enemy.hitFlash = 10;
          state.bullets.splice(bulletIndex, 1);
          state.particles.push(...createParticles(bullet, 'spark', 5));
          audioSystemRef.current.playSound('hit');
        }
      });
    });
    
    // Enemy bullet-player collisions
    if (player.spawnImmunity <= 0) {
      enemyBullets.forEach((bullet, index) => {
        if (checkCollision(
          { ...player, width: PLAYER.WIDTH, height: PLAYER.HEIGHT },
          { ...bullet, width: 10, height: 10 }
        )) {
          player.health -= bullet.damage;
          player.spawnImmunity = 500;
          state.enemyBullets.splice(index, 1);
          audioSystemRef.current.playSound('damage');
          state.camera.shake = 10;
        }
      });
    }
    
    // Player-powerup collisions
    state.powerups = powerups.filter(powerup => {
      if (checkCollision(
        { ...player, width: PLAYER.WIDTH, height: PLAYER.HEIGHT },
        { ...powerup, width: 30, height: 30 }
      )) {
        handlePowerupPickup(state, powerup);
        return false;
      }
      return true;
    });
  };
  
  // Handle powerup pickup
  const handlePowerupPickup = (state: GameState, powerup: Powerup) => {
    const { player } = state;
    
    switch (powerup.type) {
      case 'health':
        player.health = Math.min(player.health + 30, PLAYER.MAX_HEALTH);
        break;
      case 'ammo':
        player.ammo += 20;
        break;
      case 'weapon':
        if (powerup.weaponType) {
          player.weapon = powerup.weaponType;
          player.ammo = WEAPONS[powerup.weaponType].ammo;
        }
        break;
    }
    
    audioSystemRef.current.playSound('powerup');
    state.particles.push(...createParticles(powerup, 'spark', 10));
  };
  
  // Update camera
  const updateCamera = (state: GameState) => {
    const { player, camera } = state;
    const targetX = player.x - GAME_DIMENSIONS.WIDTH / 2;
    camera.x = clamp(targetX, 0, state.level.endX - GAME_DIMENSIONS.WIDTH);
  };
  
  // Check objectives
  const checkObjectives = (state: GameState) => {
    state.objectives.forEach(objective => {
      if (objective.completed) return;
      
      switch (objective.type) {
        case 'escape':
          if (objective.target && distance(state.player, objective.target) < 50) {
            objective.completed = true;
            objective.currentCount = 1;
          }
          break;
        case 'destroy':
          // Check boss defeat or other destruction objectives
          if (state.level.bossDefeated && objective.id.includes('boss')) {
            objective.completed = true;
            objective.currentCount = 1;
          }
          break;
      }
    });
  };
  
  // Advance to next level
  const advanceLevel = (state: GameState) => {
    const nextLevel = state.level.current + 1;
    if (LEVELS[nextLevel]) {
      state.level = {
        current: nextLevel,
        name: LEVELS[nextLevel].name,
        theme: LEVELS[nextLevel].theme,
        startX: 0,
        endX: LEVELS[nextLevel].length,
        bossSpawned: false,
        bossDefeated: false,
      };
      state.objectives = LEVELS[nextLevel].objectives.map(obj => ({ ...obj }));
      state.player.x = 400;
      state.player.y = GAME_DIMENSIONS.GROUND_HEIGHT - PLAYER.HEIGHT;
      state.enemies = [];
      state.bullets = [];
      state.enemyBullets = [];
      state.particles = [];
      state.powerups = [];
      generateLevel(state);
      setGameState("playing");
    }
  };
  
  // Generate level
  const generateLevel = (state: GameState) => {
    const level = LEVELS[state.level.current];
    
    // Generate obstacles
    for (let x = 600; x < level.length; x += randomInt(200, 400)) {
      if (Math.random() < level.obstacleDensity) {
        const types: ObstacleType[] = ['fence', 'crate', 'platform'];
        const type = types[randomInt(0, types.length - 1)];
        
        state.obstacles.push({
          x,
          y: type === 'platform' ? randomInt(300, 400) : GAME_DIMENSIONS.GROUND_HEIGHT - 60,
          width: type === 'fence' ? 20 : 60,
          height: 60,
          type,
          isDestructible: type === 'crate',
          isInteractive: false,
          health: type === 'crate' ? 50 : undefined,
          maxHealth: type === 'crate' ? 50 : undefined,
        });
      }
    }
    
    // Generate enemies
    for (let x = 800; x < level.length - 1000; x += randomInt(300, 600)) {
      if (Math.random() < level.enemyDensity) {
        const enemyType = selectWeightedRandom(level.enemyTypes);
        
        state.enemies.push({
          x,
          y: GAME_DIMENSIONS.GROUND_HEIGHT - ENEMY_SIZES[enemyType].HEIGHT,
          velocityY: 0,
          health: enemyType === 'dog' ? 40 : 60,
          maxHealth: enemyType === 'dog' ? 40 : 60,
          type: enemyType,
          lastShotTime: 0,
          onGround: true,
          aiState: 'patrol',
          alertLevel: 0,
          lastPlayerSeen: 0,
          patrolStartX: x,
          patrolDirection: Math.random() > 0.5 ? 1 : -1,
        });
      }
    }
  };
  
  // Helper function for weighted random selection
  const selectWeightedRandom = <T extends { type: any; weight: number }>(items: T[]): T['type'] => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item.type;
      }
    }
    
    return items[0].type;
  };
  
  // Drawing functions
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    
    // Clear canvas
    ctx.fillStyle = COLORS.BACKGROUND[state.level.theme];
    ctx.fillRect(0, 0, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
    
    // Save context and apply camera transform
    ctx.save();
    applyCameraShake(ctx, state.camera);
    
    // Draw background elements
    drawBackground(ctx, state);
    
    // Draw game objects
    drawObstacles(ctx, state);
    drawPowerups(ctx, state);
    drawEnemies(ctx, state);
    drawPlayer(ctx, state);
    drawBullets(ctx, state);
    drawParticles(ctx, state.particles);
    
    // Restore context
    ctx.restore();
    
    // Draw UI (not affected by camera)
    drawUI(ctx, state);
  }, []);
  
  // Draw background
  const drawBackground = (ctx: CanvasRenderingContext2D, state: GameState) => {
    // Draw ground
    ctx.fillStyle = '#3B2F2F';
    ctx.fillRect(
      state.camera.x,
      GAME_DIMENSIONS.GROUND_HEIGHT,
      GAME_DIMENSIONS.WIDTH,
      GAME_DIMENSIONS.HEIGHT - GAME_DIMENSIONS.GROUND_HEIGHT
    );
    
    // Draw background decorations based on theme
    // This is simplified - you can add more detailed backgrounds
  };
  
  // Draw obstacles
  const drawObstacles = (ctx: CanvasRenderingContext2D, state: GameState) => {
    state.obstacles.forEach(obstacle => {
      if (!isInViewport(obstacle, state.camera.x)) return;
      
      ctx.fillStyle = obstacle.type === 'crate' ? '#8B7355' : '#696969';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      if (obstacle.health !== undefined && obstacle.maxHealth) {
        drawHealthBar(
          ctx,
          obstacle.x,
          obstacle.y - 10,
          obstacle.width,
          5,
          obstacle.health,
          obstacle.maxHealth
        );
      }
    });
  };
  
  // Draw powerups
  const drawPowerups = (ctx: CanvasRenderingContext2D, state: GameState) => {
    state.powerups.forEach(powerup => {
      if (!isInViewport(powerup, state.camera.x)) return;
      
      ctx.fillStyle = powerup.type === 'health' ? COLORS.HEALTH 
        : powerup.type === 'ammo' ? COLORS.AMMO 
        : '#9B59B6';
      
      // Draw as rotating square
      ctx.save();
      ctx.translate(powerup.x + 15, powerup.y + 15);
      ctx.rotate(Date.now() * 0.002);
      ctx.fillRect(-15, -15, 30, 30);
      ctx.restore();
    });
  };
  
  // Draw enemies
  const drawEnemies = (ctx: CanvasRenderingContext2D, state: GameState) => {
    state.enemies.forEach(enemy => {
      if (!isInViewport(enemy, state.camera.x)) return;
      
      const size = ENEMY_SIZES[enemy.type];
      
      // Apply hit flash
      if (enemy.hitFlash && enemy.hitFlash > 0) {
        ctx.filter = 'brightness(2)';
      }
      
      // Draw enemy based on type
      ctx.fillStyle = enemy.type === 'boss' ? COLORS.BOSS : COLORS.ENEMY;
      ctx.fillRect(enemy.x, enemy.y, size.WIDTH, size.HEIGHT);
      
      // Draw health bar
      drawHealthBar(
        ctx,
        enemy.x,
        enemy.y - 10,
        size.WIDTH,
        5,
        enemy.health,
        enemy.maxHealth
      );
      
      ctx.filter = 'none';
    });
  };
  
  // Draw player
  const drawPlayer = (ctx: CanvasRenderingContext2D, state: GameState) => {
    const { player } = state;
    
    // Apply spawn immunity flashing
    if (player.spawnImmunity > 0 && Math.floor(player.spawnImmunity / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    // Apply berserker mode effect
    if (berserkerEndTime.current > Date.now()) {
      ctx.filter = 'hue-rotate(180deg) saturate(2)';
    }
    
    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(player.x, player.y, PLAYER.WIDTH, PLAYER.HEIGHT);
    
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
  };
  
  // Draw bullets
  const drawBullets = (ctx: CanvasRenderingContext2D, state: GameState) => {
    // Player bullets
    ctx.fillStyle = '#FFD700';
    state.bullets.forEach(bullet => {
      // Draw trail
      if (bullet.trail) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        bullet.trail.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
      
      ctx.fillRect(bullet.x - 5, bullet.y - 5, 10, 10);
    });
    
    // Enemy bullets
    ctx.fillStyle = '#FF4500';
    state.enemyBullets.forEach(bullet => {
      ctx.fillRect(bullet.x - 4, bullet.y - 4, 8, 8);
    });
  };
  
  // Draw UI
  const drawUI = (ctx: CanvasRenderingContext2D, state: GameState) => {
    // Health bar
    drawHealthBar(
      ctx,
      UI.HEALTH_BAR.X,
      UI.HEALTH_BAR.Y,
      UI.HEALTH_BAR.WIDTH,
      UI.HEALTH_BAR.HEIGHT,
      state.player.health,
      PLAYER.MAX_HEALTH
    );
    
    // Score
    ctx.fillStyle = 'white';
    ctx.font = UI.FONT.MEDIUM;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${state.score}`, 20, 60);
    
    // Ammo
    ctx.fillText(`Ammo: ${state.player.ammo}`, 20, 90);
    
    // Weapon
    ctx.fillText(`Weapon: ${state.player.weapon.toUpperCase()}`, 20, 120);
    
    // Distance
    ctx.textAlign = 'right';
    ctx.fillText(`Distance: ${Math.floor(state.player.x / 100)}m`, GAME_DIMENSIONS.WIDTH - 20, 60);
    
    // Combo
    if (state.comboCount > 1) {
      ctx.fillStyle = '#FFD700';
      ctx.font = UI.FONT.LARGE;
      ctx.textAlign = 'center';
      ctx.fillText(`${state.comboCount}x COMBO!`, GAME_DIMENSIONS.WIDTH / 2, 100);
    }
    
    // Special ability cooldowns
    const currentTime = Date.now();
    let yOffset = 150;
    
    // Multi-shot cooldown
    const multiShotCooldown = Math.max(0, SPECIAL_ABILITIES.MULTI_SHOT.COOLDOWN - (currentTime - lastMultiShotTime.current));
    if (multiShotCooldown > 0) {
      drawProgressBar(
        ctx,
        20,
        yOffset,
        100,
        10,
        SPECIAL_ABILITIES.MULTI_SHOT.COOLDOWN - multiShotCooldown,
        SPECIAL_ABILITIES.MULTI_SHOT.COOLDOWN,
        '#4A90E2',
        'Q - Multi-shot'
      );
      yOffset += 30;
    }
    
    // Dash cooldown
    const dashCooldown = Math.max(0, SPECIAL_ABILITIES.EXECUTION_DASH.COOLDOWN - (currentTime - lastDashTime.current));
    if (dashCooldown > 0) {
      drawProgressBar(
        ctx,
        20,
        yOffset,
        100,
        10,
        SPECIAL_ABILITIES.EXECUTION_DASH.COOLDOWN - dashCooldown,
        SPECIAL_ABILITIES.EXECUTION_DASH.COOLDOWN,
        '#E25449',
        'Shift - Dash'
      );
      yOffset += 30;
    }
    
    // Berserker cooldown
    const berserkerCooldown = Math.max(0, SPECIAL_ABILITIES.BERSERKER_MODE.COOLDOWN - (currentTime - lastBerserkerTime.current));
    if (berserkerCooldown > 0) {
      drawProgressBar(
        ctx,
        20,
        yOffset,
        100,
        10,
        SPECIAL_ABILITIES.BERSERKER_MODE.COOLDOWN - berserkerCooldown,
        SPECIAL_ABILITIES.BERSERKER_MODE.COOLDOWN,
        '#9B59B6',
        'R - Berserker'
      );
    }
    
    // Berserker mode active indicator
    if (berserkerEndTime.current > currentTime) {
      ctx.fillStyle = '#9B59B6';
      ctx.font = UI.FONT.LARGE;
      ctx.textAlign = 'center';
      ctx.fillText('BERSERKER MODE!', GAME_DIMENSIONS.WIDTH / 2, 50);
    }
  };
  
  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;
    
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const currentTime = Date.now();
    
    updateGame(currentTime);
    draw(ctx);
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, updateGame, draw]);
  
  // Start game
  const startGame = () => {
    gameStateRef.current = createInitialGameState();
    generateLevel(gameStateRef.current);
    setGameState("story");
    setStorySlide(0);
  };
  
  // Continue from story
  const continueFromStory = () => {
    if (storySlide < STORY_SLIDES.length - 1) {
      setStorySlide(storySlide + 1);
    } else {
      setGameState("playing");
    }
  };
  
  // Skip story
  const skipStory = () => {
    setGameState("playing");
  };
  
  // Reset game
  const resetGame = () => {
    gameStateRef.current = createInitialGameState();
    generateLevel(gameStateRef.current);
    setGameState("start");
    setDisplayScore(0);
    setDistance(0);
  };
  
  // Restart current level
  const restartCurrentLevel = () => {
    const currentLevel = gameStateRef.current.level.current;
    gameStateRef.current = createInitialGameState();
    gameStateRef.current.level.current = currentLevel;
    gameStateRef.current.level.name = LEVELS[currentLevel].name;
    gameStateRef.current.level.theme = LEVELS[currentLevel].theme;
    gameStateRef.current.level.endX = LEVELS[currentLevel].length;
    gameStateRef.current.objectives = LEVELS[currentLevel].objectives.map(obj => ({ ...obj }));
    generateLevel(gameStateRef.current);
    setGameState("playing");
  };
  
  // Input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      
      if (e.key === 'p' && gameState === "playing") {
        setGameState(gameStateRef.current.gamePaused ? "playing" : "paused");
        gameStateRef.current.gamePaused = !gameStateRef.current.gamePaused;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);
  
  // Game loop effect
  useEffect(() => {
    if (gameState === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gameLoop]);
  
  // Render
  return (
    <div className="relative w-full max-w-6xl mx-auto p-4">
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      
      <div className="relative bg-black rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={GAME_DIMENSIONS.WIDTH}
          height={GAME_DIMENSIONS.HEIGHT}
          className="w-full h-auto"
          style={{ imageRendering: 'crisp-edges' }}
        />
        
        {/* Start screen */}
        {gameState === "start" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
            <div className="text-center text-white">
              <h1 className="text-6xl font-bold mb-4 text-red-500">RED'S REVENGE</h1>
              <h2 className="text-2xl mb-8 text-yellow-400">A Tale of Justice and Freedom</h2>
              <button
                onClick={startGame}
                className="text-2xl px-8 py-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                START GAME
              </button>
              <div className="mt-8 text-sm opacity-80">
                <p>Use WASD/Arrow Keys to move, Space to jump</p>
                <p>Enter to shoot, Q/Shift/R for special abilities</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Story slides */}
        {gameState === "story" && (
          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${STORY_SLIDES[storySlide].bgColor} transition-all duration-1000`}>
            <div className="max-w-4xl mx-auto p-8 text-center">
              <div className={`${STORY_SLIDES[storySlide].panelBg} rounded-lg p-8 shadow-2xl`}>
                <h2 className={`text-4xl font-bold mb-2 ${STORY_SLIDES[storySlide].color}`}>
                  {STORY_SLIDES[storySlide].title}
                </h2>
                <h3 className="text-2xl mb-6 opacity-80">
                  {STORY_SLIDES[storySlide].subtitle}
                </h3>
                <img 
                  src={STORY_SLIDES[storySlide].image} 
                  alt={STORY_SLIDES[storySlide].title}
                  className="w-full max-w-2xl mx-auto mb-6 rounded-lg shadow-lg"
                />
                <p className="text-lg leading-relaxed mb-8">
                  {STORY_SLIDES[storySlide].text}
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={continueFromStory}
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {storySlide < STORY_SLIDES.length - 1 ? 'Continue' : 'Begin Mission'}
                  </button>
                  <button
                    onClick={skipStory}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Skip Story
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Paused overlay */}
        {gameState === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">PAUSED</h2>
              <p className="text-xl">Press P to resume</p>
            </div>
          </div>
        )}
        
        {/* Game over screen */}
        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white max-w-4xl mx-4 px-4">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-5xl font-bold text-red-500" style={{ fontFamily: 'monospace' }}>
                    CAPTURED
                  </h2>
                  <h3 className="text-3xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                    THE REBELLION ENDS
                  </h3>
                </div>
                
                <div className="py-4">
                  <img 
                    src="/endscreengameover.png"
                    alt="Game Over"
                    className="w-full h-auto max-h-96 object-contain"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
                
                <p className="text-lg italic" style={{ fontFamily: 'monospace' }}>
                  "I'm coming, Wilbur... The truth will live on."
                </p>
                
                <button
                  onClick={restartCurrentLevel}
                  className="text-2xl font-bold px-8 py-4 border-4 text-yellow-300 border-yellow-300 bg-black hover:bg-yellow-300 hover:text-black transition-colors"
                  style={{ fontFamily: 'monospace', animation: 'blink 1.5s infinite' }}
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Victory screen */}
        {gameState === "victoryIllustration" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white max-w-4xl mx-4 px-4">
              <div className="space-y-8">
                <div className="text-xl font-bold text-green-500" style={{ fontFamily: 'monospace' }}>
                  MISSION ACCOMPLISHED
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-5xl font-bold text-yellow-300" style={{ fontFamily: 'monospace' }}>
                    VICTORY
                  </h2>
                  <h3 className="text-3xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                    THE LEGEND LIVES ON
                  </h3>
                </div>
                
                <div className="py-4">
                  <img 
                    src="/newendscreenvictory.png"
                    alt="Victory"
                    className="w-full h-auto max-h-96 object-contain"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
                
                <p className="text-lg italic" style={{ fontFamily: 'monospace' }}>
                  "Justice served. The road ahead is mine, Wilbur."
                </p>
                
                <button
                  onClick={() => setGameState("missionComplete")}
                  className="text-3xl font-bold px-12 py-6 border-4 text-cyan-300 border-cyan-300 bg-black hover:bg-cyan-300 hover:text-black transition-colors"
                  style={{ fontFamily: 'monospace', animation: 'blink 1s infinite' }}
                >
                  CONTINUE
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Mission complete screen */}
        {gameState === "missionComplete" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <div className="text-center mb-12">
              <h1 className="text-8xl font-bold text-cyan-300 mb-6" style={{ fontFamily: 'monospace', animation: 'blink 2s infinite' }}>
                GAME CLEAR
              </h1>
              <h2 className="text-4xl font-bold text-yellow-300" style={{ fontFamily: 'monospace' }}>
                CONGRATULATIONS
              </h2>
            </div>
            
            <div className="bg-black border-4 border-cyan-300 p-8 mb-12">
              <div className="grid grid-cols-2 gap-8 text-white">
                <div className="text-center">
                  <p className="text-5xl font-bold text-yellow-300" style={{ fontFamily: 'monospace' }}>
                    {displayScore.toLocaleString()}
                  </p>
                  <p className="text-lg text-cyan-300" style={{ fontFamily: 'monospace' }}>
                    HIGH SCORE
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-bold text-yellow-300" style={{ fontFamily: 'monospace' }}>
                    {distance}M
                  </p>
                  <p className="text-lg text-cyan-300" style={{ fontFamily: 'monospace' }}>
                    DISTANCE
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={resetGame}
              className="text-4xl font-bold px-12 py-6 border-4 text-yellow-300 border-yellow-300 bg-black hover:bg-yellow-300 hover:text-black transition-colors"
              style={{ fontFamily: 'monospace', animation: 'blink 1.5s infinite' }}
            >
              PLAY AGAIN
            </button>
          </div>
        )}
        
        {/* Level complete overlay */}
        {gameState === "levelComplete" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4 text-green-500">LEVEL COMPLETE!</h2>
              <h3 className="text-xl mb-2 text-yellow-400">
                {gameStateRef.current.level?.name} - Cleared!
              </h3>
              <p className="text-lg mb-6">Advancing to next level...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-white">
        <p className="text-sm opacity-80">
          Keep running, rebel rooster! The prison never ends! 🐓🏃‍♂️
        </p>
      </div>
    </div>
  );
}