/**
 * Kinetic Cat-and-Mouse: Predictive Architect
 * src/config.js - Physics constants, trap schemas, level progression, and visual palette
 */

export const CONFIG = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  GRID_SIZE: 40,               // All tiles and traps snap to a 40x40 pixel grid
  LEVEL_WIDTH: 4800,           // Total horizontal length of the standard course (120 tiles)
  LEVEL_HEIGHT: 720,

  // Hero Physics Constants (Per Frame at 60 FPS)
  HERO: {
    WIDTH: 28,
    HEIGHT: 36,
    MOVE_SPEED: 5.5,
    JUMP_FORCE: -12.5,
    DOUBLE_JUMP_FORCE: -10.5,
    GRAVITY: 0.55,
    MAX_FALL_SPEED: 14,
    DASH_SPEED: 14,
    DASH_DURATION_FRAMES: 10,
    DASH_COOLDOWN_FRAMES: 60,
    MAX_HP: 3,
    INVULNERABLE_FRAMES: 60,

    // Hero Platforming Enhancements
    COYOTE_FRAMES: 8,          // Jump allowed up to 8 frames after walking off ledge
    JUMP_BUFFER_FRAMES: 8,     // Jump queued up to 8 frames before landing
    GROUND_SLAM_SPEED: 18,     // Downward slam speed when pressing S in mid-air
    ICE_DECAY_FRAMES: 15       // Residual ice slide duration
  },

  // Game Master (GM) & Economy Constants
  GM: {
    SAFE_ZONE_RADIUS: 220,     // Minimum pixel distance from Hero to place traps
    START_ENERGY: 100,
    MAX_ENERGY: 200,
    PASSIVE_REGEN_PER_SEC: 8,
    DASH_TAX_BONUS: 15,        // Bonus GM energy when Hero dashes
    SALVAGE_REFUND_RATE: 0.5,  // 50% refund when recycling traps
    OVERCLOCK_COST: 20,        // Cost to double dynamic trap speed for 3 seconds
    WALL_BASE_SPEED: 2.2,      // Speed of the deadly Pacing Wall chasing the Hero
    MIN_TRAP_SPACING: 80,      // Minimum 80px (2 tiles) gap between damage traps
    SLOWMO_FACTOR: 0.25,       // Tactical slow-mo speed (Bullet Time)
    MAX_SLOWMO_FRAMES: 240,    // 4 seconds maximum slow-mo fuel
    BUILD_PHASE_ENERGY: 150,   // Fixed budget for Turn-Based Architect mode
    BUILD_PHASE_SECONDS: 20    // Default timer for Turn-Based build phase
  },

  // Trap Definitions (Keys: 1, 2, 3, 4, 5, 6 or UI Toolbar Click)
  TRAPS: {
    SPIKE: {
      id: 'SPIKE',
      name: 'Laser Spikes',
      cost: 25,
      width: 40,
      height: 20,
      color: '#ff2a6d',
      type: 'STATIC',
      surfaceSnap: true,
      damage: 1
    },
    ICE: {
      id: 'ICE',
      name: 'Cryo Pad',
      cost: 20,
      width: 80,
      height: 12,
      color: '#05d5fa',
      type: 'SURFACE',         // Reduces Hero friction (slides horizontally)
      surfaceSnap: true,
      damage: 0,
      frictionMultiplier: 0.96
    },
    WIND: {
      id: 'WIND',
      name: 'Repulsor Fan',
      cost: 40,
      width: 40,
      height: 40,
      color: '#f9f871',
      type: 'DYNAMIC',         // Pushes Hero upward or backward within a 160px beam
      surfaceSnap: false,
      damage: 0,
      pushForceX: -3.5,
      pushForceY: -4.0,
      range: 160
    },
    PHANTOM: {
      id: 'PHANTOM',
      name: 'Hologram Bluff',
      cost: 10,
      width: 40,
      height: 20,
      color: '#ff2a6d',        // Looks identical to SPIKE to the Hero, deals 0 damage
      type: 'BLUFF',
      surfaceSnap: true,
      damage: 0
    },
    SPRING: {
      id: 'SPRING',
      name: 'Bounce Pad',
      cost: 25,
      width: 40,
      height: 16,
      color: '#00ffcc',
      type: 'DYNAMIC',
      surfaceSnap: true,
      damage: 0,
      bounceForceY: -16        // Extreme upward bounce
    },
    LASER_GATE: {
      id: 'LASER_GATE',
      name: 'Laser Gate',
      cost: 35,
      width: 20,
      height: 140,
      color: '#ff0055',
      type: 'TIMED',
      surfaceSnap: false,
      damage: 1,
      cycleFrames: 90          // 1.5s ON, 1.5s OFF at 60 FPS
    }
  },

  // Levels Campaign Definitions
  LEVELS: [
    {
      levelNumber: 1,
      name: 'Training Grounds',
      length: 2400,
      wallSpeed: 1.4,
      unlockedTraps: ['SPIKE', 'ICE'],
      description: 'Wide platforms, gentle pacing laser wall. Master basic jumping and sliding.'
    },
    {
      levelNumber: 2,
      name: 'Wind Tunnel',
      length: 3200,
      wallSpeed: 1.9,
      unlockedTraps: ['SPIKE', 'ICE', 'WIND', 'SPRING'],
      description: 'High-lane altitude gaps and turbulent wind currents test momentum control.'
    },
    {
      levelNumber: 3,
      name: 'Mind Games',
      length: 4000,
      wallSpeed: 2.3,
      unlockedTraps: ['SPIKE', 'ICE', 'WIND', 'PHANTOM', 'SPRING', 'LASER_GATE'],
      description: 'Timed laser grids and deceptive hologram bluffs demand split-second discernment.'
    },
    {
      levelNumber: 4,
      name: 'Hyper-Drive',
      length: 4800,
      wallSpeed: 2.8,
      regenMultiplier: 1.5,
      doubleDash: true,
      unlockedTraps: ['SPIKE', 'ICE', 'WIND', 'PHANTOM', 'SPRING', 'LASER_GATE'],
      description: 'Blistering laser speed, hyper GM energy generation, and supersonic double-dash.'
    }
  ],

  // Endless Mode Settings
  ENDLESS: {
    CHUNK_WIDTH: 800,
    DIFFICULTY_STEP_METERS: 1000,
    SPEED_INCREMENT: 0.15,
    REGEN_INCREMENT: 1.0,
    ORB_SPAWN_INTERVAL: 1000
  }
};

export const COLORS = {
  BG_DARK: '#0d0f18',
  CYAN: '#00f0ff',
  MAGENTA: '#ff2a6d',
  YELLOW: '#f9f871',
  BLUE: '#05d5fa',
  GREEN: '#00ffcc',
  ORB_GREEN: '#39ff14',
  LANE_LOW: '#05d5fa',    // Low lane color
  LANE_MID: '#a855f7',    // Mid lane color
  LANE_HIGH: '#00f0ff',   // High lane color
  PACING_WALL: '#ff003c',
  FINISH_GOLD: '#ffd700'
};
