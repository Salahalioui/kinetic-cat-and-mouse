/**
 * Kinetic Cat-and-Mouse: Predictive Architect
 * src/state.js - Central mutable GameState object, modular chunk templates, and level generator
 */

import { CONFIG } from './config.js';

export const GameState = {
  phase: 'PLAYING', // 'PLAYING' | 'ROUND_OVER' | 'MATCH_OVER'
  playStyle: 'TURN_BASED', // 'TURN_BASED' | 'DUAL_SCREEN' | 'REAL_TIME_SLOWMO'
  gameMode: 'LEVELS',      // 'LEVELS' | 'ENDLESS'
  currentLevel: 1,         // 1 to 4 in LEVELS mode
  turnPhase: 'BUILD',      // 'BUILD' | 'RUN' in TURN_BASED style
  buildTimer: CONFIG.GM.BUILD_PHASE_SECONDS * 60,

  isPaused: false,
  soundVolume: 1.0,
  soundMuted: false,

  currentRound: 1,  // Round 1: P1 is Hero, P2 is GM. Round 2: Roles swap.
  frameCount: 0,
  cameraX: 0,
  endlessDistance: 0,
  endlessBestDistance: 0,

  roundScores: {
    round1Distance: 0,
    round1TimeFrames: 0,
    round2Distance: 0,
    round2TimeFrames: 0
  },

  hero: {
    x: 120,
    y: 500,
    vx: 0,
    vy: 0,
    hp: CONFIG.HERO.MAX_HP,
    shield: 0,              // 1-Hit Barrier Shield
    isGrounded: false,
    jumpsRemaining: 2,
    dashTimer: 0,
    dashCooldown: 0,
    invulnTimer: 0,
    onIce: false,
    iceDecayTimer: 0,
    coyoteTimer: 0,         // Frames remaining to jump after leaving platform
    jumpBufferTimer: 0,     // Frames queued jump input before landing
    isSlamming: false,      // Fast-fall / ground slam downward thrust
    facing: 1               // 1 for right, -1 for left
  },

  gm: {
    energy: CONFIG.GM.START_ENERGY,
    selectedTrapKey: 'SPIKE',
    mouseX: 0,
    mouseY: 0,
    worldMouseX: 0,
    worldMouseY: 0,
    snapY: 0,               // Magnetic platform snapping Y coordinate
    hasSnapPlatform: false,
    canPlaceAtCursor: false,
    slowMoActive: false,
    slowMoFuel: CONFIG.GM.MAX_SLOWMO_FRAMES
  },

  pacingWall: {
    x: -100,
    speed: CONFIG.GM.WALL_BASE_SPEED
  },

  finishPortal: {
    x: 4650,
    y: 360,
    width: 44,
    height: 80
  },

  platforms: [],      // Array of { x, y, width, height, lane: 'HIGH'|'MID'|'LOW' }
  traps: [],          // Array of { uid, type, x, y, width, height, overclockTimer, active, cost, timer, isLaserOn }
  pickups: [],        // Array of { uid, type: 'SHIELD', x, y, width, height, active }

  lastGeneratedX: 0,  // Tracking pointer for endless streaming
  distanceSurvived: 0 // In Endless mode
};

let pickupIdCounter = 0;

/**
 * Modular Chunk Templates (Each chunk is 800px wide)
 */
export const CHUNK_TEMPLATES = [
  // 1. The Split Highway Chunk: Safe mid lane with ceiling cover + risky High lane with Shield Orb
  function createSplitHighway(startX) {
    const plats = [];
    const picks = [];

    // Low Lane (Support / Safety fall)
    plats.push({ x: startX, y: 620, width: 340, height: 20, lane: 'LOW' });
    plats.push({ x: startX + 420, y: 620, width: 380, height: 20, lane: 'LOW' });

    // Middle Lane (Covered corridor)
    plats.push({ x: startX + 60, y: 440, width: 680, height: 20, lane: 'MID' });
    // Low ceiling obstacle over middle lane
    plats.push({ x: startX + 240, y: 380, width: 220, height: 16, lane: 'MID' });

    // High Lane (Risky elevated jump runway)
    plats.push({ x: startX + 160, y: 260, width: 200, height: 20, lane: 'HIGH' });
    plats.push({ x: startX + 460, y: 260, width: 240, height: 20, lane: 'HIGH' });

    // Glowing Green Shield Barrier Orb on High Lane
    picks.push({
      uid: ++pickupIdCounter,
      type: 'SHIELD',
      x: startX + 560,
      y: 220,
      width: 24,
      height: 24,
      active: true
    });

    return { platforms: plats, pickups: picks };
  },

  // 2. The Staircase Ascent Chunk: 4 climbing stepping stones from Low -> Mid -> High
  function createStaircaseAscent(startX) {
    const plats = [];
    const picks = [];

    plats.push({ x: startX + 40, y: 620, width: 140, height: 20, lane: 'LOW' });
    plats.push({ x: startX + 220, y: 530, width: 130, height: 20, lane: 'MID' });
    plats.push({ x: startX + 390, y: 440, width: 150, height: 20, lane: 'MID' });
    plats.push({ x: startX + 580, y: 350, width: 140, height: 20, lane: 'HIGH' });
    plats.push({ x: startX + 740, y: 260, width: 60, height: 20, lane: 'HIGH' });

    // Mid stepping recovery platform
    plats.push({ x: startX + 480, y: 620, width: 260, height: 20, lane: 'LOW' });

    return { platforms: plats, pickups: picks };
  },

  // 3. The Canyon Leap Chunk: Long runways separated by a 200px chasm requiring Jump + Dash
  function createCanyonLeap(startX) {
    const plats = [];
    const picks = [];

    // Mid Lane Takeoff & Landing
    plats.push({ x: startX, y: 440, width: 280, height: 20, lane: 'MID' });
    // 200px Leap Gap!
    plats.push({ x: startX + 480, y: 440, width: 320, height: 20, lane: 'MID' });

    // High lane bridge above
    plats.push({ x: startX + 180, y: 260, width: 180, height: 20, lane: 'HIGH' });
    plats.push({ x: startX + 460, y: 260, width: 220, height: 20, lane: 'HIGH' });

    // Low Lane landing pit
    plats.push({ x: startX + 260, y: 620, width: 300, height: 20, lane: 'LOW' });

    // Shield Orb over high canyon
    picks.push({
      uid: ++pickupIdCounter,
      type: 'SHIELD',
      x: startX + 370,
      y: 210,
      width: 24,
      height: 24,
      active: true
    });

    return { platforms: plats, pickups: picks };
  },

  // 4. The Funnel Chunk: 3 lanes converge into a single narrow bridge (choke point)
  function createFunnel(startX) {
    const plats = [];
    const picks = [];

    // Approaches on Low and High
    plats.push({ x: startX, y: 620, width: 220, height: 20, lane: 'LOW' });
    plats.push({ x: startX + 20, y: 260, width: 200, height: 20, lane: 'HIGH' });

    // Single Central Funnel Bridge Choke Point
    plats.push({ x: startX + 260, y: 440, width: 280, height: 24, lane: 'MID' });

    // Exit Splice
    plats.push({ x: startX + 580, y: 620, width: 220, height: 20, lane: 'LOW' });
    plats.push({ x: startX + 580, y: 260, width: 220, height: 20, lane: 'HIGH' });
    plats.push({ x: startX + 620, y: 440, width: 180, height: 20, lane: 'MID' });

    return { platforms: plats, pickups: picks };
  }
];

/**
 * Level Initializer with Campaign Progression & Endless Support
 */
export function initLevel(levelNumber = 1, mode = 'LEVELS') {
  if (levelNumber === 'ENDLESS') {
    mode = 'ENDLESS';
    levelNumber = 1;
  }
  GameState.gameMode = mode;
  GameState.currentLevel = levelNumber;

  const platforms = [];
  const pickups = [];

  // 1. Initial Hero Spawn Safety Runway (x = 0 to 480)
  platforms.push({ x: 20, y: 620, width: 440, height: 20, lane: 'LOW' });
  platforms.push({ x: 180, y: 440, width: 280, height: 20, lane: 'MID' });

  let curX = 480;
  let targetLength = 4800;
  let wallSpeed = CONFIG.GM.WALL_BASE_SPEED;

  if (mode === 'LEVELS') {
    const levelDef = CONFIG.LEVELS[levelNumber - 1] || CONFIG.LEVELS[0];
    targetLength = levelDef.length;
    wallSpeed = levelDef.wallSpeed;
  } else {
    // Endless mode starts with 2400px initial track
    targetLength = 2400;
    wallSpeed = 1.6;
  }

  GameState.pacingWall.speed = wallSpeed;

  // 2. Stitch Modular Chunk Templates
  let chunkIdx = 0;
  while (curX < targetLength - 400) {
    const template = CHUNK_TEMPLATES[chunkIdx % CHUNK_TEMPLATES.length];
    const chunkData = template(curX);

    platforms.push(...chunkData.platforms);
    pickups.push(...chunkData.pickups);

    curX += 800;
    chunkIdx++;
  }

  // 3. Finish Runway & Extraction Portal (in LEVELS mode)
  if (mode !== 'ENDLESS') {
    // Generous final extraction landing pad
    platforms.push({ x: curX, y: 440, width: 600, height: 24, lane: 'MID' });
    platforms.push({ x: curX, y: 620, width: 600, height: 24, lane: 'LOW' });

    GameState.finishPortal.x = curX + 260;
    GameState.finishPortal.y = 440 - 100; // Sits firmly on top of the 440 platform
    GameState.finishPortal.width = 60;
    GameState.finishPortal.height = 100;
  } else {
    // Endless has no finish portal
    GameState.finishPortal.x = 99999999;
  }

  GameState.platforms = platforms;
  GameState.pickups = pickups;
  GameState.lastGeneratedX = curX;

  return platforms;
}

/**
 * Appends a new 800px chunk for Endless Mode streaming
 */
export function streamNextChunk() {
  const templateIdx = Math.floor(Math.random() * CHUNK_TEMPLATES.length);
  const template = CHUNK_TEMPLATES[templateIdx];
  const chunkData = template(GameState.lastGeneratedX);

  GameState.platforms.push(...chunkData.platforms);
  GameState.pickups.push(...chunkData.pickups);
  GameState.lastGeneratedX += 800;
}

/**
 * Resets the Hero entity to initial spawn coordinates
 */
export function resetHero() {
  GameState.hero.x = 120;
  GameState.hero.y = 500;
  GameState.hero.vx = 0;
  GameState.hero.vy = 0;
  GameState.hero.hp = CONFIG.HERO.MAX_HP;
  GameState.hero.shield = 0;
  GameState.hero.isGrounded = false;
  GameState.hero.jumpsRemaining = 2;
  GameState.hero.dashTimer = 0;
  GameState.hero.dashCooldown = 0;
  GameState.hero.invulnTimer = 0;
  GameState.hero.onIce = false;
  GameState.hero.iceDecayTimer = 0;
  GameState.hero.coyoteTimer = 0;
  GameState.hero.jumpBufferTimer = 0;
  GameState.hero.isSlamming = false;
  GameState.hero.facing = 1;
}

/**
 * Resets state for a specific round (1 or 2)
 */
export function resetRound(roundNumber = 1) {
  GameState.currentRound = roundNumber;
  GameState.phase = 'PLAYING';
  GameState.frameCount = 0;
  GameState.cameraX = 0;

  // Turn-Based Architect Phase setup
  if (GameState.playStyle === 'TURN_BASED') {
    GameState.turnPhase = 'BUILD';
    GameState.buildTimer = CONFIG.GM.BUILD_PHASE_SECONDS * 60;
    GameState.gm.energy = CONFIG.GM.BUILD_PHASE_ENERGY;
  } else {
    GameState.turnPhase = 'RUN';
    GameState.gm.energy = CONFIG.GM.START_ENERGY;
  }

  resetHero();

  GameState.gm.selectedTrapKey = 'SPIKE';
  GameState.gm.canPlaceAtCursor = false;
  GameState.gm.slowMoActive = false;
  GameState.gm.slowMoFuel = CONFIG.GM.MAX_SLOWMO_FRAMES;

  GameState.pacingWall.x = -100;
  GameState.traps = [];

  initLevel(GameState.currentLevel, GameState.gameMode);
}

/**
 * Resets entire match to Round 1
 */
export function resetMatch() {
  GameState.roundScores = {
    round1Distance: 0,
    round1TimeFrames: 0,
    round2Distance: 0,
    round2TimeFrames: 0
  };
  resetRound(1);
}

GameState.initLevel = initLevel;
GameState.streamNextChunk = streamNextChunk;
