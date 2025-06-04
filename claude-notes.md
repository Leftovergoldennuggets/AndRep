# Claude Code Session Notes

## Current Session
- **Step**: 10 - Transformed into endless side-scrolling prison escape with gravity
- **Start Commit**: d149214 feat: add epic fire dragons with flame shooting attacks and collision detection
- **Session Commits**: d149214 (previous version), 31696c5 (2D prison escape)

## Project Evolution Progress
- ✅ Step 1-8: Enhanced Flappy Bird with rebel rooster, dragons, Van Gogh backgrounds  
- ✅ Step 9: Reimplemented as 2D top-down prison escape game
- ✅ Step 10: NEW: Transformed into side-scrolling endless runner with gravity physics
- ✅ Added gravity system: rooster falls and jumps with physics
- ✅ Converted to side-scrolling: camera moves forward automatically, world scrolls left
- ✅ Endless generation: infinite prison compound with procedural obstacles, enemies, powerups
- ✅ Platform mechanics: rooster can jump on platforms and obstacles
- ✅ Limited horizontal movement: player can move left/right within screen boundaries
- ✅ Distance tracking: escape progress measured in meters
- ✅ Redesigned controls: Space/W/↑ to jump, A/D/arrows for horizontal movement, X/Z/click to shoot

## App Details
- **Type**: "Prison Break Rooster" - Side-scrolling endless runner with gravity
- **Character**: Pixel art rooster with gravity physics and weapons
- **Gameplay**: Jump and shoot through endless prison compound while automatically moving forward
- **Enemies**: Guards (shoot at player), Guard Dogs (ground-based), Security Cameras (wall-mounted)
- **Weapons**: Pistol, Shotgun, Rifle, Grenade - same weapon system but with side-scrolling bullets
- **Core Mechanics**: Gravity + jumping, limited horizontal movement, endless auto-scrolling, shooting enemies
- **Features**: Infinite procedural generation, platform collision, distance scoring, powerup collection

## MVP Implementation Plan
- **Frontend**: Canvas-based game with HTML5 Canvas and requestAnimationFrame
- **Game Loop**: 60fps animation with player physics and collision detection
- **No Auth Required**: Game playable immediately without login
- **Screens**: Start screen → Game → Game over with restart
- **Data**: Optional high score storage with Convex
- **Responsive**: Works on mobile and desktop

## Important Context
- This is a template repository being initialized into a new application
- Using project:init-app command workflow
- Need to reread project:init-app command content if starting from fresh session

## Tech Stack
- Full-stack TypeScript: React + Vite + TanStack Router (frontend)
- Convex (backend), Clerk (auth)
- Tailwind CSS 4, daisyUI 5