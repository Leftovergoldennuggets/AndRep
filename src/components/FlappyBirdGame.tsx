import { useEffect, useRef, useState, useCallback } from "react";
import { Play, RotateCcw } from "lucide-react";

interface GameState {
  bird: {
    x: number;
    y: number;
    velocity: number;
  };
  pipes: Array<{
    x: number;
    topHeight: number;
    bottomY: number;
    passed: boolean;
  }>;
  dragons: Array<{
    x: number;
    y: number;
    velocity: number;
    lastFireTime: number;
    flames: Array<{
      x: number;
      y: number;
      velocityX: number;
      velocityY: number;
      life: number;
    }>;
  }>;
  score: number;
  gameState: "start" | "playing" | "gameOver";
}

const GAME_CONFIG = {
  canvas: {
    width: 400,
    height: 600,
  },
  bird: {
    x: 100,
    size: 20,
    gravity: 0.3,
    jumpForce: -6,
  },
  pipes: {
    width: 60,
    gap: 180,
    speed: 2,
    spacing: 300,
  },
  dragons: {
    size: 30,
    speed: 1.5,
    fireRate: 2000, // milliseconds between fire shots
    spawnRate: 8000, // milliseconds between dragon spawns
  },
  flames: {
    speed: 3,
    life: 60, // frames
    size: 8,
  },
};

// Van Gogh inspired color palette
const VAN_GOGH_COLORS = [
  "#FFD700", // Sunflower yellow
  "#FF6347", // Vibrant orange-red
  "#4169E1", // Royal blue
  "#32CD32", // Lime green
  "#FF1493", // Deep pink
  "#8A2BE2", // Blue violet
  "#FF4500", // Orange red
  "#1E90FF", // Dodger blue
  "#FFFF00", // Pure yellow
  "#FF69B4", // Hot pink
  "#00CED1", // Dark turquoise
  "#9370DB", // Medium purple
  "#FF8C00", // Dark orange
  "#7B68EE", // Medium slate blue
  "#00FF7F", // Spring green
];

function drawVanGoghKaleidoscope(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const time = Date.now() * 0.001; // Time in seconds for animation
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Create multiple layers of swirling patterns
  for (let layer = 0; layer < 8; layer++) {
    const radius = (layer + 1) * 30 + Math.sin(time + layer) * 15;
    const segments = 12 + layer * 2;
    const rotation = time * (0.5 + layer * 0.1);
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + rotation;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2 + rotation;
      
      // Calculate swirl effect
      const swirlFactor = Math.sin(time * 2 + layer + i * 0.5) * 0.3;
      const adjustedRadius = radius + swirlFactor * 20;
      
      // Create gradient for each segment
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, adjustedRadius
      );
      
      const colorIndex1 = (i + layer + Math.floor(time * 2)) % VAN_GOGH_COLORS.length;
      const colorIndex2 = (i + layer + Math.floor(time * 2) + 3) % VAN_GOGH_COLORS.length;
      
      gradient.addColorStop(0, VAN_GOGH_COLORS[colorIndex1] + "80"); // Semi-transparent
      gradient.addColorStop(1, VAN_GOGH_COLORS[colorIndex2] + "40"); // More transparent
      
      ctx.fillStyle = gradient;
      
      // Draw swirling segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      
      // Create curved, organic shapes inspired by Van Gogh's brushstrokes
      const numCurvePoints = 8;
      for (let j = 0; j <= numCurvePoints; j++) {
        const t = j / numCurvePoints;
        const segmentAngle = angle + (nextAngle - angle) * t;
        
        // Add organic variation to radius
        const variation = Math.sin(segmentAngle * 3 + time * 3 + layer) * 10;
        const pointRadius = adjustedRadius + variation;
        
        const x = centerX + Math.cos(segmentAngle) * pointRadius;
        const y = centerY + Math.sin(segmentAngle) * pointRadius;
        
        if (j === 0) {
          ctx.lineTo(x, y);
        } else {
          // Create smooth curves
          const prevT = (j - 1) / numCurvePoints;
          const prevAngle = angle + (nextAngle - angle) * prevT;
          const prevVariation = Math.sin(prevAngle * 3 + time * 3 + layer) * 10;
          const prevRadius = adjustedRadius + prevVariation;
          const prevX = centerX + Math.cos(prevAngle) * prevRadius;
          const prevY = centerY + Math.sin(prevAngle) * prevRadius;
          
          const cpX = (prevX + x) / 2 + Math.sin(time + i + j) * 5;
          const cpY = (prevY + y) / 2 + Math.cos(time + i + j) * 5;
          
          ctx.quadraticCurveTo(cpX, cpY, x, y);
        }
      }
      
      ctx.closePath();
      ctx.fill();
    }
  }
  
  // Add swirling brushstroke effects
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + time;
    const distance = 50 + Math.sin(time + i) * 30;
    
    ctx.strokeStyle = VAN_GOGH_COLORS[i % VAN_GOGH_COLORS.length] + "60";
    ctx.lineWidth = 2 + Math.sin(time * 2 + i) * 1;
    
    ctx.beginPath();
    const startX = centerX + Math.cos(angle) * distance;
    const startY = centerY + Math.sin(angle) * distance;
    
    for (let j = 0; j < 10; j++) {
      const t = j / 10;
      const swirl = angle + t * Math.PI * 2 + Math.sin(time + i) * 2;
      const r = distance + t * 40 + Math.sin(time * 3 + j) * 15;
      
      const x = centerX + Math.cos(swirl) * r;
      const y = centerY + Math.sin(swirl) * r;
      
      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }
}

function drawDragon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // Dragon body (dark red/maroon)
  ctx.fillStyle = "#8B0000";
  ctx.fillRect(x, y + 8, size - 6, size - 16);
  
  // Dragon head (darker red)
  ctx.fillStyle = "#660000";
  ctx.fillRect(x - 8, y + 6, 12, 12);
  
  // Dragon horns (black)
  ctx.fillStyle = "#000000";
  ctx.fillRect(x - 6, y + 4, 2, 4);
  ctx.fillRect(x - 2, y + 4, 2, 4);
  
  // Dragon eyes (glowing red)
  ctx.fillStyle = "#FF0000";
  ctx.fillRect(x - 6, y + 8, 2, 2);
  ctx.fillRect(x - 2, y + 8, 2, 2);
  
  // Dragon wings (dark purple)
  ctx.fillStyle = "#4B0082";
  ctx.fillRect(x + 2, y, 6, 8);
  ctx.fillRect(x + 2, y + 16, 6, 8);
  
  // Wing details (lighter purple)
  ctx.fillStyle = "#663399";
  ctx.fillRect(x + 4, y + 2, 2, 4);
  ctx.fillRect(x + 4, y + 18, 2, 4);
  
  // Dragon tail (red gradient)
  ctx.fillStyle = "#AA0000";
  ctx.fillRect(x + size - 6, y + 10, 8, 4);
  ctx.fillRect(x + size - 2, y + 12, 4, 2);
  
  // Spikes on tail (black)
  ctx.fillStyle = "#000000";
  ctx.fillRect(x + size - 4, y + 8, 1, 2);
  ctx.fillRect(x + size - 2, y + 8, 1, 2);
  ctx.fillRect(x + size, y + 8, 1, 2);
}

function drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, life: number) {
  const alpha = life / GAME_CONFIG.flames.life;
  
  // Flame core (bright orange-red)
  ctx.fillStyle = `rgba(255, 69, 0, ${alpha})`;
  ctx.fillRect(x - size/2, y - size/2, size, size);
  
  // Flame outer (yellow-orange)
  ctx.fillStyle = `rgba(255, 140, 0, ${alpha * 0.7})`;
  ctx.fillRect(x - size/3, y - size/3, size/1.5, size/1.5);
  
  // Flame center (bright yellow)
  ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.5})`;
  ctx.fillRect(x - size/4, y - size/4, size/2, size/2);
}

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    bird: {
      x: GAME_CONFIG.bird.x,
      y: GAME_CONFIG.canvas.height / 2,
      velocity: 0,
    },
    pipes: [],
    dragons: [],
    score: 0,
    gameState: "start",
  });
  const animationRef = useRef<number>();

  const [displayScore, setDisplayScore] = useState(0);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameOver">("start");


  const resetGame = useCallback(() => {
    gameStateRef.current = {
      bird: {
        x: GAME_CONFIG.bird.x,
        y: GAME_CONFIG.canvas.height / 2,
        velocity: 0,
      },
      pipes: [],
      dragons: [],
      score: 0,
      gameState: "start",
    };
    setDisplayScore(0);
    setGameState("start");
  }, []);

  const startGame = useCallback(() => {
    gameStateRef.current.gameState = "playing";
    setGameState("playing");
  }, []);

  const jump = useCallback(() => {
    if (gameStateRef.current.gameState === "start") {
      startGame();
    }
    if (gameStateRef.current.gameState === "playing") {
      gameStateRef.current.bird.velocity = GAME_CONFIG.bird.jumpForce;
    }
  }, [startGame]);

  const generatePipe = useCallback((x: number) => {
    const minTopHeight = 50;
    const maxTopHeight = GAME_CONFIG.canvas.height - GAME_CONFIG.pipes.gap - 50;
    const topHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight;
    
    return {
      x,
      topHeight,
      bottomY: topHeight + GAME_CONFIG.pipes.gap,
      passed: false,
    };
  }, []);

  const checkCollision = useCallback((bird: GameState["bird"], pipes: GameState["pipes"], dragons: GameState["dragons"]) => {
    // Check ground/ceiling collision  
    if (bird.y <= 0 || bird.y + GAME_CONFIG.bird.size >= GAME_CONFIG.canvas.height) {
      return true;
    }

    // Check pipe collision
    for (const pipe of pipes) {
      if (
        bird.x + GAME_CONFIG.bird.size > pipe.x &&
        bird.x < pipe.x + GAME_CONFIG.pipes.width
      ) {
        if (bird.y < pipe.topHeight || bird.y + GAME_CONFIG.bird.size > pipe.bottomY) {
          return true;
        }
      }
    }

    // Check dragon collision
    for (const dragon of dragons) {
      if (
        bird.x + GAME_CONFIG.bird.size > dragon.x &&
        bird.x < dragon.x + GAME_CONFIG.dragons.size &&
        bird.y + GAME_CONFIG.bird.size > dragon.y &&
        bird.y < dragon.y + GAME_CONFIG.dragons.size
      ) {
        return true;
      }

      // Check flame collision
      for (const flame of dragon.flames) {
        if (
          bird.x + GAME_CONFIG.bird.size > flame.x &&
          bird.x < flame.x + GAME_CONFIG.flames.size &&
          bird.y + GAME_CONFIG.bird.size > flame.y &&
          bird.y < flame.y + GAME_CONFIG.flames.size
        ) {
          return true;
        }
      }
    }

    return false;
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;

    if (state.gameState === "playing") {
      // Update bird physics
      state.bird.velocity += GAME_CONFIG.bird.gravity;
      state.bird.y += state.bird.velocity;

      // Update pipes
      state.pipes.forEach((pipe) => {
        pipe.x -= GAME_CONFIG.pipes.speed;

        // Check if bird passed pipe
        if (!pipe.passed && pipe.x + GAME_CONFIG.pipes.width < state.bird.x) {
          pipe.passed = true;
          state.score++;
          setDisplayScore(state.score);
        }
      });

      // Remove pipes that are off screen
      state.pipes = state.pipes.filter(pipe => pipe.x + GAME_CONFIG.pipes.width > -50);

      // Add new pipes
      if (state.pipes.length === 0 || 
          state.pipes[state.pipes.length - 1].x < GAME_CONFIG.canvas.width - GAME_CONFIG.pipes.spacing) {
        state.pipes.push(generatePipe(GAME_CONFIG.canvas.width));
      }

      // Update dragons
      const currentTime = Date.now();
      
      // Spawn new dragons occasionally (check if enough time has passed since game start)
      const gameStartTime = state.gameState === "playing" ? currentTime : 0;
      if (state.dragons.length === 0 || (state.dragons.length < 3 && Math.random() < 0.01)) {
        state.dragons.push({
          x: GAME_CONFIG.canvas.width,
          y: Math.random() * (GAME_CONFIG.canvas.height - GAME_CONFIG.dragons.size),
          velocity: Math.random() * 2 - 1, // Random vertical movement
          lastFireTime: currentTime - GAME_CONFIG.dragons.fireRate, // Allow immediate firing
          flames: []
        });
      }

      // Update each dragon
      state.dragons.forEach((dragon) => {
        dragon.x -= GAME_CONFIG.dragons.speed;
        dragon.y += dragon.velocity;
        
        // Keep dragons on screen vertically
        if (dragon.y <= 0 || dragon.y >= GAME_CONFIG.canvas.height - GAME_CONFIG.dragons.size) {
          dragon.velocity *= -1;
        }
        
        // Dragon shoots fire
        if (currentTime - dragon.lastFireTime > GAME_CONFIG.dragons.fireRate) {
          dragon.flames.push({
            x: dragon.x - 10,
            y: dragon.y + GAME_CONFIG.dragons.size / 2,
            velocityX: -GAME_CONFIG.flames.speed,
            velocityY: (Math.random() - 0.5) * 2, // Slight random spread
            life: GAME_CONFIG.flames.life
          });
          dragon.lastFireTime = currentTime;
        }
        
        // Update flames
        dragon.flames.forEach((flame) => {
          flame.x += flame.velocityX;
          flame.y += flame.velocityY;
          flame.life--;
        });
        
        // Remove dead flames
        dragon.flames = dragon.flames.filter(flame => flame.life > 0 && flame.x > -50);
      });

      // Remove dragons that are off screen
      state.dragons = state.dragons.filter(dragon => dragon.x > -GAME_CONFIG.dragons.size);

      // Check collision
      if (checkCollision(state.bird, state.pipes, state.dragons)) {
        state.gameState = "gameOver";
        setGameState("gameOver");
      }
    }

    // Clear canvas
    ctx.clearRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);

    // Draw Van Gogh kaleidoscope background
    drawVanGoghKaleidoscope(ctx, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);

    // Draw pipes (only if playing or game over)
    if (state.gameState !== "start") {
      ctx.fillStyle = "#228B22";
      state.pipes.forEach((pipe) => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, GAME_CONFIG.pipes.width, pipe.topHeight);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, GAME_CONFIG.pipes.width, GAME_CONFIG.canvas.height - pipe.bottomY);
        
        // Pipe caps
        ctx.fillStyle = "#32CD32";
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, GAME_CONFIG.pipes.width + 10, 30);
        ctx.fillRect(pipe.x - 5, pipe.bottomY, GAME_CONFIG.pipes.width + 10, 30);
        ctx.fillStyle = "#228B22";
      });
    }

    // Draw dragons and flames (only if playing or game over)
    if (state.gameState !== "start") {
      state.dragons.forEach((dragon) => {
        drawDragon(ctx, dragon.x, dragon.y, GAME_CONFIG.dragons.size);
        
        // Draw flames
        dragon.flames.forEach((flame) => {
          drawFlame(ctx, flame.x, flame.y, GAME_CONFIG.flames.size, flame.life);
        });
      });
    }

    // Draw 8-bit rooster (only if playing or game over)
    if (state.gameState !== "start") {
      const birdX = state.bird.x;
      const birdY = state.bird.y;
      const size = GAME_CONFIG.bird.size;
      
      // Draw leather jacket (black body)
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(birdX + 2, birdY + 8, size - 4, size - 10);
      
      // Draw jacket details (zippers/buttons)
      ctx.fillStyle = "#silver";
      ctx.fillRect(birdX + 4, birdY + 10, 1, 6);
      ctx.fillRect(birdX + size - 6, birdY + 12, 2, 2);
      
      // Draw rooster head (orange-red)
      ctx.fillStyle = "#ff6b35";
      ctx.fillRect(birdX + 4, birdY + 2, size - 8, 8);
      
      // Draw rooster comb (red spiky top)
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(birdX + 6, birdY, 2, 3);
      ctx.fillRect(birdX + 8, birdY - 1, 2, 4);
      ctx.fillRect(birdX + 10, birdY, 2, 3);
      
      // Draw beak (yellow-orange)
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(birdX + 1, birdY + 5, 3, 2);
      
      // Draw sunglasses (black frames)
      ctx.fillStyle = "#000000";
      ctx.fillRect(birdX + 5, birdY + 3, 3, 3);
      ctx.fillRect(birdX + 9, birdY + 3, 3, 3);
      ctx.fillRect(birdX + 8, birdY + 4, 1, 1); // bridge
      
      // Draw sunglasses lenses (dark blue/black)
      ctx.fillStyle = "#001122";
      ctx.fillRect(birdX + 6, birdY + 4, 1, 1);
      ctx.fillRect(birdX + 10, birdY + 4, 1, 1);
      
      // Draw cigarette (white stick)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(birdX + 0, birdY + 6, 4, 1);
      
      // Draw cigarette tip (orange glow)
      ctx.fillStyle = "#ff4400";
      ctx.fillRect(birdX - 1, birdY + 6, 1, 1);
      
      // Draw smoke (light gray pixels)
      ctx.fillStyle = "#cccccc";
      ctx.fillRect(birdX - 2, birdY + 4, 1, 1);
      ctx.fillRect(birdX - 3, birdY + 2, 1, 1);
      ctx.fillRect(birdX - 2, birdY + 1, 1, 1);
      
      // Draw legs/talons (yellow)
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(birdX + 6, birdY + size - 2, 1, 3);
      ctx.fillRect(birdX + 10, birdY + size - 2, 1, 3);
      
      // Draw tail feathers (dark red/brown)
      ctx.fillStyle = "#8b0000";
      ctx.fillRect(birdX + size - 2, birdY + 6, 3, 2);
      ctx.fillRect(birdX + size - 1, birdY + 4, 2, 2);
    }

    // Draw score (only if playing or game over)
    if (state.gameState !== "start") {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(state.score.toString(), GAME_CONFIG.canvas.width / 2, 50);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [generatePipe, checkCollision]);

  useEffect(() => {
    gameLoop();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    };

    const handleClick = () => {
      jump();
    };

    document.addEventListener("keydown", handleKeyPress);
    const canvas = canvasRef.current;
    canvas?.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      canvas?.removeEventListener("click", handleClick);
    };
  }, [jump]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.canvas.width}
        height={GAME_CONFIG.canvas.height}
        className="border-4 border-white rounded-lg shadow-2xl cursor-pointer"
      />
      
{gameState === "start" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Rebel Rooster</h1>
            <p className="mb-6">Click or press Space to fly, badass!</p>
            <button
              onClick={jump}
              className="btn btn-primary btn-lg not-prose"
            >
              <Play className="w-6 h-6 mr-2" />
              Start Game
            </button>
          </div>
        </div>
      )}

      {gameState === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
            <p className="text-xl mb-6">Score: {displayScore}</p>
            <button
              onClick={resetGame}
              className="btn btn-secondary btn-lg not-prose"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Play Again
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-center text-white">
        <p className="text-sm opacity-80">
          Click the game area or press Space to keep flying, rebel! 🚬😎
        </p>
      </div>
    </div>
  );
}