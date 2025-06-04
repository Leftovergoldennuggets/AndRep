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
    gravity: 0.6,
    jumpForce: -12,
  },
  pipes: {
    width: 60,
    gap: 150,
    speed: 3,
    spacing: 250,
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
    if (bird.y <= 0 || bird.y >= GAME_CONFIG.canvas.height - GAME_CONFIG.bird.size) {
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

    // Draw pipes
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

    // Draw bird
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(
      state.bird.x + GAME_CONFIG.bird.size / 2,
      state.bird.y + GAME_CONFIG.bird.size / 2,
      GAME_CONFIG.bird.size / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw eye
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(
      state.bird.x + GAME_CONFIG.bird.size / 2 + 5,
      state.bird.y + GAME_CONFIG.bird.size / 2 - 3,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw score
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(state.score.toString(), GAME_CONFIG.canvas.width / 2, 50);

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
            <h1 className="text-4xl font-bold mb-4">Flappy Bird</h1>
            <p className="mb-6">Click or press Space to flap</p>
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
          Click the game area or press Space to flap
        </p>
      </div>
    </div>
  );
}