import { LevelConfig } from './types';

export const STORY_SLIDES = [
  {
    title: "THE LEGEND OF RED",
    subtitle: "PRIDE OF BLACKWATER FARM",
    text: "In the depths of Blackwater Maximum Security Prison, one rooster stood above all others. Red the Magnificent - three-time champion, beloved by all, and guardian of the farm. His golden feathers caught the morning sun as he proudly protected his fellow animals...",
    image: "/panel1.png",
    color: "text-yellow-400",
    bgColor: "from-yellow-900 to-yellow-700",
    panelBg: "bg-yellow-100 text-black"
  },
  {
    title: "DARKNESS REVEALED",
    subtitle: "THE CORRUPT CONSPIRACY", 
    text: "But beneath the surface, evil festered. Red discovered the horrifying truth - corrupt guards were torturing innocent farm animals for sport. What he witnessed that dark night would haunt him forever. The system was rotten to its core...",
    image: "/panel2.png",
    color: "text-red-400",
    bgColor: "from-red-900 to-red-700", 
    panelBg: "bg-red-100 text-black"
  },
  {
    title: "BLOOD AND BETRAYAL",
    subtitle: "WILBUR'S ULTIMATE SACRIFICE",
    text: "When Wilbur the pig - Red's dearest friend and moral compass - stepped forward to shield the younglings from brutal punishment, the guards showed no mercy. With his dying breath, Wilbur whispered: 'Promise me... fight for them all...'",
    image: "/panel3.png",
    color: "text-purple-400",
    bgColor: "from-purple-900 to-purple-700",
    panelBg: "bg-purple-100 text-black"
  },
  {
    title: "VENGEANCE UNLEASHED",
    subtitle: "THE ONE-ROOSTER WAR",
    text: "Grief transformed into fury. Fury became unstoppable force. In a blaze of righteous violence, Red carved through the corrupt guards like a feathered hurricane. Three fell that night. Justice was served in blood and thunder. The rebellion had begun...",
    image: "/panel4.png",
    color: "text-orange-400",
    bgColor: "from-orange-900 to-orange-700",
    panelBg: "bg-orange-100 text-black"
  },
  {
    title: "THE FINAL GAMBIT",
    subtitle: "ESCAPE OR DIE TRYING",
    text: "Now branded the most dangerous prisoner in Blackwater's history, Red faces his ultimate test. Locked in maximum security, surrounded by enemies, with only his wits and warrior spirit. Tonight, he breaks free - or dies in the attempt. For Wilbur. For justice. For freedom.",
    image: "/panel5.png",
    color: "text-green-400", 
    bgColor: "from-green-900 to-green-700",
    panelBg: "bg-green-100 text-black"
  }
];

export const LEVELS: Record<number, LevelConfig> = {
  1: {
    name: "Prison Yard",
    theme: 'yard',
    length: 4000,
    enemyDensity: 0.01,  // Reduced from 0.02 - fewer enemies
    enemyTypes: [
      { type: 'guard', weight: 0.7 },
      { type: 'dog', weight: 0.3 },
    ],
    boss: 'warden',
    objectives: [
      {
        id: 'rescue-1',
        type: 'rescue',
        description: 'Rescue 3 fellow farm animals',
        targetCount: 3,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'defeat-boss-1',
        type: 'destroy',
        description: 'Defeat the Corrupt Warden',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    dialogue: "The corrupt warden blocks your escape with his massive shotgun!",
    obstacleDensity: 0.02,  // Reduced from 0.03 - fewer obstacles
    powerupDensity: 0.02,  // Increased from 0.01 - more powerups
  },
  2: {
    name: "Cell Block C",
    theme: 'cellblock',
    length: 5000,
    enemyDensity: 0.025,
    enemyTypes: [
      { type: 'guard', weight: 0.8 },
      { type: 'dog', weight: 0.2 },
    ],
    boss: 'captain',
    objectives: [
      {
        id: 'rescue-2',
        type: 'rescue',
        description: 'Rescue 5 fellow prisoners',
        targetCount: 5,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'survive-2',
        type: 'survive',
        description: 'Survive the security lockdown',
        targetCount: 60000, // 60 seconds
        currentCount: 0,
        completed: false,
      },
    ],
    dialogue: "Security Captain Martinez: 'You killed my men! There's no escape now!'",
    obstacleDensity: 0.04,
    powerupDensity: 0.008,
  },
  3: {
    name: "Maximum Security",
    theme: 'security',
    length: 6000,
    enemyDensity: 0.03,
    enemyTypes: [
      { type: 'guard', weight: 1.0 },
    ],
    boss: 'chief',
    objectives: [
      {
        id: 'rescue-3',
        type: 'rescue',
        description: 'Free all remaining animals',
        targetCount: 7,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'destroy-3',
        type: 'destroy',
        description: 'Destroy the torture equipment',
        targetCount: 3,
        currentCount: 0,
        completed: false,
      },
    ],
    dialogue: "Security Chief Thompson: 'I should have put you down when I had the chance!'",
    obstacleDensity: 0.05,
    powerupDensity: 0.006,
  },
  4: {
    name: "The Final Escape",
    theme: 'escape',
    length: 7000,
    enemyDensity: 0.035,
    enemyTypes: [
      { type: 'guard', weight: 0.9 },
      { type: 'dog', weight: 0.1 },
    ],
    boss: 'helicopter',
    objectives: [
      {
        id: 'escape-4',
        type: 'escape',
        description: 'Reach the freedom beyond the gates',
        target: { x: 6800, y: 0 },
        currentCount: 0,
        completed: false,
      },
    ],
    dialogue: "Attack Helicopter: 'This is your final stand, Red! Surrender now!'",
    obstacleDensity: 0.06,
    powerupDensity: 0.005,
  },
};

export const BOSS_CONFIGS = {
  warden: {
    name: "Corrupt Warden Johnson",
    health: 150,  // Reduced from 300 - 50% less health
    size: 90,
    color: '#4A5568',
    attackPattern: 'charge_and_shoot',
    phases: 2,
    speed: 2,  // Reduced from 3 - slower movement
  },
  captain: {
    name: "Security Captain Martinez",
    health: 200,  // Reduced from 400 - 50% less health
    size: 80,
    color: '#2D3748',
    attackPattern: 'tactical_cover',
    phases: 3,
    speed: 2.5,  // Reduced from 4 - slower movement
  },
  chief: {
    name: "Security Chief Thompson",
    health: 250,  // Reduced from 500 - 50% less health
    size: 85,
    color: '#1A202C',
    attackPattern: 'aggressive_assault',
    phases: 3,
    speed: 3,  // Reduced from 5 - slower movement
  },
  helicopter: {
    name: "Attack Helicopter",
    health: 300,  // Reduced from 600 - 50% less health
    size: 120,
    color: '#171923',
    attackPattern: 'aerial_bombardment',
    phases: 4,
    speed: 3.5,  // Reduced from 6 - slower movement
  },
};

export const ANIMAL_TYPES = ['pig', 'cow', 'sheep', 'duck', 'goat', 'horse'] as const;

export const ANIMAL_SIZES = {
  pig: 40,
  cow: 60,
  sheep: 35,
  duck: 25,
  goat: 38,
  horse: 70,
} as const;