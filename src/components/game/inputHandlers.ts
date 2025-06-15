import { GameState } from './types';
import { jump, shoot, switchWeapon, rebelDash, berserkerMode, multiShot } from './playerActions';

export interface GameRefs {
  keysRef: React.MutableRefObject<Set<string>>;
  lastShotTime: React.MutableRefObject<number>;
  lastDashTime: React.MutableRefObject<number>;
  lastBerserkerTime: React.MutableRefObject<number>;
  berserkerEndTime: React.MutableRefObject<number>;
  lastMultiShotTime: React.MutableRefObject<number>;
}

export function createKeyboardHandlers(
  gameState: React.MutableRefObject<GameState>,
  gameRefs: GameRefs,
  playSound: (type: string) => void,
  initAudio: () => void
) {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Initialize audio on first interaction
    if (!gameRefs.keysRef.current.size) {
      initAudio();
    }
    
    gameRefs.keysRef.current.add(e.key.toLowerCase());
    
    const currentTime = Date.now();
    const state = gameState.current;
    
    switch (e.key.toLowerCase()) {
      case ' ':
      case 'w':
      case 'arrowup':
        e.preventDefault();
        if (state.gameStarted && !state.gamePaused) {
          jump(state.player);
          playSound('jump');
        }
        break;
        
      case 'enter':
        e.preventDefault();
        if (!state.gameStarted) {
          // Start game logic would go here
        }
        break;
        
      case 'escape':
        e.preventDefault();
        if (state.gameStarted) {
          state.gamePaused = !state.gamePaused;
        }
        break;
        
      case 'e':
        e.preventDefault();
        if (state.gameStarted && !state.gamePaused) {
          switchWeapon(state.player, 'next');
        }
        break;
        
      case 'q':
        e.preventDefault();
        if (state.gameStarted && !state.gamePaused) {
          rebelDash(state, currentTime, gameRefs.lastDashTime, playSound);
        }
        break;
        
      case 'f':
        e.preventDefault();
        if (state.gameStarted && !state.gamePaused) {
          berserkerMode(state, currentTime, gameRefs.lastBerserkerTime, gameRefs.berserkerEndTime, playSound);
        }
        break;
        
      case 'r':
        e.preventDefault();
        if (state.gameStarted && !state.gamePaused) {
          multiShot(state, currentTime, gameRefs.lastMultiShotTime, playSound);
        }
        break;
    }
  };
  
  const handleKeyUp = (e: KeyboardEvent) => {
    gameRefs.keysRef.current.delete(e.key.toLowerCase());
  };
  
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    const currentTime = Date.now();
    const state = gameState.current;
    
    if (state.gameStarted && !state.gamePaused) {
      shoot(state, currentTime, gameRefs.lastShotTime, playSound);
    }
  };
  
  return {
    handleKeyDown,
    handleKeyUp,
    handleMouseDown,
  };
}

export function processMovementInput(
  keysRef: React.MutableRefObject<Set<string>>,
  player: GameState['player'],
  playerSpeed: number
): void {
  const keys = keysRef.current;
  
  if (keys.has('a') || keys.has('arrowleft')) {
    player.x -= playerSpeed;
    player.direction = 'left';
  }
  
  if (keys.has('d') || keys.has('arrowright')) {
    player.x += playerSpeed;
    player.direction = 'right';
  }
}