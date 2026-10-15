/**
 * Kinetic Cat-and-Mouse: Predictive Architect
 * src/state.js - Central mutable GameState object and procedural level generator
 */

import { CONFIG } from './config.js';

export const GameState = {
  phase: 'PLAYING', // 'PLAYING' | 'ROUND_OVER' | 'MATCH_OVER'
  currentRound: 1,  // Round 1: P1 is Hero, P2 is GM. Round 2: Roles swap.
  frameCount: 0,
  cameraX: 0,

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
    isGrounded: false,
    jumpsRemaining: 2,
    dashTimer: 0,
    dashCooldown: 0,
    invulnTimer: 0,
    onIce: false,
    facing: 1 // 1 for right, -1 for left
  },

  gm: {
    energy: CONFIG.GM.START_ENERGY,
    selectedTrapKey: 'SPIKE',
    mouseX: 0,
    mouseY: 0,
    worldMouseX: 0,
    worldMouseY: 0,
    canPlaceAtCursor: false
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

  platforms: [], // Array of { x, y, width, height, lane: 'HIGH'|'MID'|'LOW' }
  traps: []      // Array of { uid, type, x, y, width, height, overclockTimer, active }
};

/**
 * Procedural Level Generator
 * Populates GameState.platforms across 4800px across Low (y=620), Mid (y=440), and High (y=260) lanes
 * with jumpable gaps between 80px and 180px, ending at finish portal (x=4650).
 */
export function initLevel() {
  const platforms = [];

  // Seeded deterministic pseudo-random generator
  let seed = 42891;
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  // 1. Starting Safety Runway for Hero spawn (x=120, y=500)
  platforms.push({
    x: 40,
    y: 620,
    width: 380,
    height: 20,
    lane: 'LOW'
  });

  // 2. Generate Low Lane (y = 620) from x = 480 to x = 4580
  let curX = 480;
  while (curX < 4550) {
    const gap = 80 + Math.floor(pseudoRandom() * 80); // 80 - 160px gap
    curX += gap;
    const width = 160 + Math.floor(pseudoRandom() * 160); // 160 - 320px width
    if (curX + width > 4600) break;
    platforms.push({
      x: curX,
      y: 620,
      width,
      height: 20,
      lane: 'LOW'
    });
    curX += width;
  }

  // 3. Generate Mid Lane (y = 440) from x = 240 to x = 4580
  curX = 240;
  while (curX < 4550) {
    const width = 180 + Math.floor(pseudoRandom() * 140); // 180 - 320px
    platforms.push({
      x: curX,
      y: 440,
      width,
      height: 20,
      lane: 'MID'
    });
    curX += width;
    const gap = 90 + Math.floor(pseudoRandom() * 80); // 90 - 170px gap
    curX += gap;
  }

  // 4. Generate High Lane (y = 260) from x = 400 to x = 4550
  curX = 400;
  while (curX < 4550) {
    const width = 140 + Math.floor(pseudoRandom() * 140); // 140 - 280px
    platforms.push({
      x: curX,
      y: 260,
      width,
      height: 20,
      lane: 'HIGH'
    });
    curX += width;
    const gap = 110 + Math.floor(pseudoRandom() * 70); // 110 - 180px gap
    curX += gap;
  }

  // 5. Inter-lane connector / transition steps (allowing smooth vertical route changes)
  const connectorXs = [600, 1100, 1600, 2100, 2600, 3100, 3600, 4100];
  connectorXs.forEach((cx, index) => {
    // Stepping stone between LOW (620) and MID (440)
    platforms.push({
      x: cx,
      y: 530,
      width: 70,
      height: 18,
      lane: 'MID'
    });
    // Stepping stone between MID (440) and HIGH (260)
    platforms.push({
      x: cx + 160,
      y: 350,
      width: 70,
      height: 18,
      lane: 'HIGH'
    });
  });

  // 6. Final Finish Gateway Platform (x: 4560 - 4800)
  platforms.push({
    x: 4560,
    y: 440,
    width: 240,
    height: 24,
    lane: 'MID'
  });
  platforms.push({
    x: 4560,
    y: 620,
    width: 240,
    height: 24,
    lane: 'LOW'
  });

  GameState.platforms = platforms;
  return platforms;
}

/**
 * Resets the Hero state for round start
 */
export function resetHero() {
  GameState.hero.x = 120;
  GameState.hero.y = 500;
  GameState.hero.vx = 0;
  GameState.hero.vy = 0;
  GameState.hero.hp = CONFIG.HERO.MAX_HP;
  GameState.hero.isGrounded = false;
  GameState.hero.jumpsRemaining = 2;
  GameState.hero.dashTimer = 0;
  GameState.hero.dashCooldown = 0;
  GameState.hero.invulnTimer = 0;
  GameState.hero.onIce = false;
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

  resetHero();

  GameState.gm.energy = CONFIG.GM.START_ENERGY;
  GameState.gm.selectedTrapKey = 'SPIKE';
  GameState.gm.canPlaceAtCursor = false;

  GameState.pacingWall.x = -100;
  GameState.pacingWall.speed = CONFIG.GM.WALL_BASE_SPEED;

  GameState.traps = [];
  initLevel();
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
