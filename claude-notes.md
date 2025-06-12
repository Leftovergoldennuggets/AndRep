# Claude Notes

## Current Session - Weapon Switching Feature

### Feature: Add weapon switching with R key
- Status: Complete
- Date: 2025-12-06

### Changes Made:
1. Added `switchWeapon` function in FlappyBirdGame.tsx that:
   - Cycles through weapons in order: pistol → shotgun → rifle → grenade → pistol
   - Provides half ammo if switching to an empty weapon
   - Plays pickup sound effect
   - Shows visual feedback with colored particles matching the weapon

2. Updated keyboard event handler:
   - Added R key handler to trigger weapon switching
   - Added `switchWeapon` to the useEffect dependency array

3. Updated UI controls display:
   - Added "Switch Weapon: R" to the pause menu controls
   - Also added the special abilities (Q for Dash, E for Berserk) to make controls complete

### Commits Made:
- feat: add weapon switching with R key

### Important Context:
- E key was already taken for berserkerMode, so used R key instead
- Weapon order follows logical progression from weakest to strongest
- Visual feedback uses weapon-specific colors defined in WEAPONS_INFO
- Sound feedback reuses existing pickup sound

### File Locations:
- /Users/AndersEidesvik/projects/AndRep/src/components/FlappyBirdGame.tsx - Main game file with all changes