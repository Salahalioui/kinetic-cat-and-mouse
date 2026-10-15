/**
 * Kinetic Cat-and-Mouse: Predictive Architect
 * src/config.js - Physics constants, trap schemas, and visual palette
 */

export const CONFIG = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  GRID_SIZE: 40,               // All tiles and traps snap to a 40x40 pixel grid
  LEVEL_WIDTH: 4800,           // Total horizontal length of the course (120 tiles)
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
    INVULNERABLE_FRAMES: 60
  },

  // Game Master (GM) & Economy Constants
  GM: {
    SAFE_ZONE_RADIUS: 220,     // Minimum pixel distance from Hero to place traps
    START_ENERGY: 100,
    MAX_ENERGY: 200,
    PASSIVE_REGEN_PER_SEC: 8,
    DASH_TAX_BONUS: 15,        // Bonus GM energy when Hero dashes
    SALVAGE_REFUND_RATE: 0.5,  // 50% refund when clicking traps behind the Hero
    OVERCLOCK_COST: 20,        // Cost to double a dynamic trap's speed for 3 seconds
    WALL_BASE_SPEED: 2.2       // Speed of the deadly Pacing Wall chasing the Hero
  },

  // Trap Definitions (Keys: 1, 2, 3, 4 or UI Toolbar Click)
  TRAPS: {
    SPIKE: {
      id: 'SPIKE',
      name: 'Laser Spikes',
      cost: 25,
      width: 40,
      height: 20,
      color: '#ff2a6d',
      type: 'STATIC',
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
      damage: 0
    }
  }
};

export const COLORS = {
  BG_DARK: '#0d0f18',
  CYAN: '#00f0ff',
  MAGENTA: '#ff2a6d',
  YELLOW: '#f9f871',
  BLUE: '#05d5fa',
  LANE_LOW: '#05d5fa',    // Low lane color
  LANE_MID: '#a855f7',    // Mid lane color
  LANE_HIGH: '#00f0ff',   // High lane color
  PACING_WALL: '#ff003c',
  FINISH_GOLD: '#ffd700'
};
