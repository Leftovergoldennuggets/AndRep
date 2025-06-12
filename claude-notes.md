# Claude Code Session Notes

## Current Feature: Shotgun Implementation & Weapon Switching
- Fixed hard-coded bullet count for shotgun weapon
- Added bulletCount property to shotgun configuration in GAME_CONFIG
- Shotgun now properly uses the bulletCount from configuration (5 pellets)
- Changed starting weapon from pistol to shotgun
- Added E key weapon switching between pistol and shotgun
- Updated control instructions to show E key for weapon switching
- Removed berserker mode from E key to avoid conflict

## Commits Made This Session:
1. fix: use weapon bulletCount property for shotgun instead of hard-coded value
2. [pending] feat: add weapon switching with E key and start with shotgun

## Status:
- Shotgun weapon is fully implemented and fixed
- Player now starts with shotgun
- E key toggles between pistol and shotgun
- Each weapon switch gives full ammo for the new weapon

## Next Steps:
- Consider keeping ammo counts separate per weapon
- Add visual indicator for current weapon in HUD