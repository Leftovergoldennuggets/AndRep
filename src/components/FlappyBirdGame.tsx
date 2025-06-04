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
};

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    bird: {
      x: GAME_CONFIG.bird.x,
      y: GAME_CONFIG.canvas.height / 2,
      velocity: 0,
    },
    pipes: [],
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

  const checkCollision = useCallback((bird: GameState["bird"], pipes: GameState["pipes"]) => {
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

      // Check collision
      if (checkCollision(state.bird, state.pipes)) {
        state.gameState = "gameOver";
        setGameState("gameOver");
      }
    }

    // Clear canvas
    ctx.clearRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#98D8E8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);

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