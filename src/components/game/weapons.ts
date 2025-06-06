import { WeaponType, WeaponInfo } from './types';

export const WEAPONS: Record<WeaponType, WeaponInfo> = {
  pistol: {
    damage: 20,
    fireRate: 300,
    ammo: 50,
    spread: 0,
    range: 800,
    bulletSpeed: 18,
    specialEffect: 'none',
  },
  rifle: {
    damage: 35,
    fireRate: 150,
    ammo: 30,
    spread: 0.1,
    range: 1200,
    bulletSpeed: 25,
    specialEffect: 'penetrating',
  },
  shotgun: {
    damage: 15,
    fireRate: 800,
    ammo: 20,
    spread: 0.3,
    range: 400,
    bulletSpeed: 15,
    bulletCount: 5,
    specialEffect: 'knockback',
  },
  sniper: {
    damage: 80,
    fireRate: 2000,
    ammo: 10,
    spread: 0,
    range: 2000,
    bulletSpeed: 40,
    specialEffect: 'headshot',
  },
  machinegun: {
    damage: 15,
    fireRate: 100,
    ammo: 100,
    spread: 0.2,
    range: 600,
    bulletSpeed: 20,
    specialEffect: 'suppressing',
  },
};

export const WEAPON_COLORS: Record<WeaponType, string> = {
  pistol: '#888888',
  rifle: '#2F4F4F',
  shotgun: '#8B4513',
  sniper: '#1E3A8A',
  machinegun: '#374151',
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