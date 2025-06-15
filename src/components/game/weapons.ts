import { WeaponType, WeaponInfo } from './types';

export const WEAPONS: Record<WeaponType, WeaponInfo> = {
  pistol: {
    damage: 25,  // Moderate increase from original 20
    fireRate: 250,  // Slightly faster than original 300
    ammo: 75,  // 50% more than original 50
    spread: 0,
    range: 900,  // Slightly increased from 800
    bulletSpeed: 22,  // Slightly increased from 18
    specialEffect: 'none',
  },
  rifle: {
    damage: 45,  // Moderate increase from original 35
    fireRate: 125,  // Slightly faster than original 150
    ammo: 45,  // 50% more than original 30
    spread: 0.08,  // Slightly better than original 0.1
    range: 1350,  // Increased from 1200
    bulletSpeed: 30,  // Increased from 25
    specialEffect: 'penetrating',
  },
  shotgun: {
    damage: 20,  // Moderate increase from original 15
    fireRate: 700,  // Slightly faster than original 800
    ammo: 30,  // 50% more than original 20
    spread: 0.28,  // Slightly better than original 0.3
    range: 450,  // Slightly increased from 400
    bulletSpeed: 18,  // Increased from 15
    bulletCount: 6,  // Increased from 5
    specialEffect: 'knockback',
  },
  grenade: {
    damage: 80,  // Powerful but not one-shot
    fireRate: 1800,  // Slower fire rate
    ammo: 8,  // Limited ammo
    spread: 0,
    range: 600,
    bulletSpeed: 12,  // Slower projectile
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