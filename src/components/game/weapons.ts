import { WeaponType, WeaponInfo } from './types';

export const WEAPONS: Record<WeaponType, WeaponInfo> = {
  pistol: {
    damage: 40,  // Doubled from 20
    fireRate: 200,  // Reduced from 300 - faster shooting
    ammo: 100,  // Doubled from 50
    spread: 0,
    range: 1000,  // Increased from 800
    bulletSpeed: 25,  // Increased from 18
    specialEffect: 'none',
  },
  rifle: {
    damage: 70,  // Doubled from 35
    fireRate: 100,  // Reduced from 150 - faster shooting
    ammo: 60,  // Doubled from 30
    spread: 0.05,  // Reduced from 0.1 - more accurate
    range: 1500,  // Increased from 1200
    bulletSpeed: 35,  // Increased from 25
    specialEffect: 'penetrating',
  },
  shotgun: {
    damage: 30,  // Doubled from 15
    fireRate: 600,  // Reduced from 800 - faster shooting
    ammo: 40,  // Doubled from 20
    spread: 0.25,  // Reduced from 0.3 - tighter spread
    range: 500,  // Increased from 400
    bulletSpeed: 20,  // Increased from 15
    bulletCount: 7,  // Increased from 5 - more pellets
    specialEffect: 'knockback',
  },
  grenade: {
    damage: 150,  // High damage explosive
    fireRate: 1500,  // Slower fire rate
    ammo: 10,  // Limited ammo
    spread: 0,
    range: 800,
    bulletSpeed: 15,  // Slower projectile
    specialEffect: 'explosive',
  },
};

export const WEAPON_COLORS: Record<WeaponType, string> = {
  pistol: '#888888',
  rifle: '#2F4F4F',
  shotgun: '#8B4513',
  grenade: '#8B4513',
};

export const getWeaponInfo = (weaponType: WeaponType): WeaponInfo => {
  return WEAPONS[weaponType];
};

export const canFire = (
  weaponType: WeaponType,
  lastShotTime: number,
  currentTime: number,
  ammo: number
): boolean => {
  const weapon = WEAPONS[weaponType];
  return ammo > 0 && currentTime - lastShotTime >= weapon.fireRate;
};