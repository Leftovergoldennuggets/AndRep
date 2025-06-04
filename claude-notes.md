# Claude Code Session Notes

## Current Session
- **Step**: 9 - Completely reimplemented as prison escape game
- **Start Commit**: d149214 feat: add epic fire dragons with flame shooting attacks and collision detection
- **Session Commits**: d149214 (previous version completed)

## Project Transformation Progress
- ✅ Previous: Completed enhanced Flappy Bird with rebel rooster, dragons, Van Gogh backgrounds
- ✅ NEW: Completely replaced with 2D prison escape game
- ✅ Implemented rooster player character with WASD/arrow key movement
- ✅ Added weapon system: pistol, shotgun, rifle, grenade with different stats
- ✅ Created enemy AI: guards, dogs, cameras with shooting behavior
- ✅ Built level generation: obstacles (walls, crates, fences), powerups, scaling difficulty
- ✅ Added collision detection: player vs obstacles, bullets vs enemies/obstacles
- ✅ Implemented game progression: 5 levels, victory condition, score system
- ✅ Added visual feedback: prison grid background, different enemy types, HUD display

## App Details
- **Type**: "Prison Break Rooster" - 2D top-down action game
- **Character**: Pixel art rooster with weapon system
- **Gameplay**: Fight through high-security chicken farm using various weapons
- **Enemies**: Guards (blue uniforms, shoot bullets), Guard Dogs (brown, chase player), Security Cameras (red lens)
- **Weapons**: Pistol (fast, accurate), Shotgun (spread damage), Rifle (high damage), Grenade (explosive damage)
- **Core Mechanics**: WASD movement, space/click to shoot, collect powerups, avoid enemy bullets
- **Features**: 5 levels of increasing difficulty, health/ammo/weapon powerups, victory escape condition

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