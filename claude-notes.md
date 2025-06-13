# Claude Code Notes

## Current Feature
- Redesigning prison guards to be less blocky and more dynamic

## Session Commits
- feat: make all obstacles destructible
- feat: streamline intro story for better pacing
- feat: add emotional depth to story while keeping it concise
- feat: redesign guards with dynamic animations
- fix: resolve guard rendering crash by passing playerX parameter

## Progress Status
- Made all obstacles destructible (completed)
- Streamlined story with emotional impact (completed)
- Redesigned guard sprites:
  - Added walking animation with 4 frames
  - Rounded head shape using arc instead of rectangles
  - Dynamic shadow using ellipse
  - Eyes that track the player
  - Animated arms that swing while walking
  - Legs with walking cycle animation
  - More detailed uniform with tapered torso
  - Star-shaped badge on cap
  - Shield-shaped badge on chest
  - Nightstick held at an angle

## Important Context
- Game was not loading due to missing VITE_CONVEX_URL
- Temporarily modified main.tsx to handle missing Convex URL
- Guards now have much more fluid movement and detail
- Animation uses Date.now() for consistent timing

## File Locations
- Game component: src/components/FlappyBirdGame.tsx
- Guard rendering: lines 1450-1683
- Main app: src/main.tsx