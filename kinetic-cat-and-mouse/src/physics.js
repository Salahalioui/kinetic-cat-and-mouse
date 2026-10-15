/**
 * Kinetic Cat-and-Mouse: Predictive Architect
 * src/physics.js - AABB collision, Hero movement, GM Trap logic, and Pacing Wall
 * Strict Directive 3: Separate X and Y Collision (Resolve X BEFORE Y).
 */

import { CONFIG } from './config.js';
import { GameState } from './state.js';

let trapIdCounter = 0;

/**
 * Standard Axis-Aligned Bounding Box (AABB) intersection check
 * Rectangles A and B overlap if and only if all 4 conditions are met.
 */
export function checkAABB(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Updates Hero Platforming Physics
 * @param {Object} input - inputState flags
 * @param {Function} playSound - optional audio synthesis callback
 */
export function updateHero(input, playSound) {
  const hero = GameState.hero;
  if (hero.hp <= 0) return;

  // 1. Dash Timer and Cooldown
  if (hero.dashCooldown > 0) {
    hero.dashCooldown--;
  }

  if (hero.invulnTimer > 0) {
    hero.invulnTimer--;
  }

  // Check Dash Trigger
  if (input.dashPressed && hero.dashCooldown === 0 && hero.dashTimer === 0) {
    hero.dashTimer = CONFIG.HERO.DASH_DURATION_FRAMES;
    hero.dashCooldown = CONFIG.HERO.DASH_COOLDOWN_FRAMES;
    hero.vy = 0;
    hero.vx = hero.facing * CONFIG.HERO.DASH_SPEED;

    // Dash Tax: GM absorbs kinetic energy (+15 NRG)
    GameState.gm.energy = Math.min(
      CONFIG.GM.MAX_ENERGY,
      GameState.gm.energy + CONFIG.GM.DASH_TAX_BONUS
    );

    if (playSound) playSound('dash');
  }

  if (hero.dashTimer > 0) {
    hero.dashTimer--;
    hero.vy = 0;
    hero.vx = hero.facing * CONFIG.HERO.DASH_SPEED;
  } else {
    // 2. Horizontal Velocity Evaluation
    let moveDir = 0;
    if (input.right) moveDir += 1;
    if (input.left) moveDir -= 1;

    if (moveDir !== 0) {
      hero.facing = moveDir;
    }

    if (hero.onIce) {
      // Ice surface: blend velocity using friction multiplier
      if (moveDir !== 0) {
        hero.vx = hero.vx * CONFIG.TRAPS.ICE.frictionMultiplier + moveDir * CONFIG.HERO.MOVE_SPEED * 0.12;
      } else {
        hero.vx *= CONFIG.TRAPS.ICE.frictionMultiplier;
      }
    } else {
      // Normal ground / air: responsive movement
      if (moveDir !== 0) {
        hero.vx = moveDir * CONFIG.HERO.MOVE_SPEED;
      } else {
        hero.vx = 0;
      }
    }

    // 3. Jump and Double-Jump
    if (input.jumpPressed) {
      if (hero.isGrounded) {
        hero.vy = CONFIG.HERO.JUMP_FORCE;
        hero.isGrounded = false;
        hero.jumpsRemaining = 1;
        if (playSound) playSound('jump');
      } else if (hero.jumpsRemaining > 0) {
        hero.vy = CONFIG.HERO.DOUBLE_JUMP_FORCE;
        hero.jumpsRemaining--;
        if (playSound) playSound('jump');
      }
    }

    // Apply Gravity (capped at MAX_FALL_SPEED)
    hero.vy = Math.min(CONFIG.HERO.MAX_FALL_SPEED, hero.vy + CONFIG.HERO.GRAVITY);
  }

  // -------------------------------------------------------------------------
  // STRICT DIRECTIVE 3: SEPARATE X AND Y COLLISION RESOLUTION
  // Always resolve horizontal (X) movement BEFORE vertical (Y) movement!
  // -------------------------------------------------------------------------

  // --- STEP 1: RESOLVE HORIZONTAL (X-AXIS) MOVEMENT & COLLISION ---
  hero.x += hero.vx;

  // Level boundaries clamping
  if (hero.x < 0) {
    hero.x = 0;
    hero.vx = 0;
  } else if (hero.x + CONFIG.HERO.WIDTH > CONFIG.LEVEL_WIDTH) {
    hero.x = CONFIG.LEVEL_WIDTH - CONFIG.HERO.WIDTH;
    hero.vx = 0;
  }

  const heroBoxX = {
    x: hero.x,
    y: hero.y,
    width: CONFIG.HERO.WIDTH,
    height: CONFIG.HERO.HEIGHT
  };

  for (const plat of GameState.platforms) {
    if (checkAABB(heroBoxX, plat)) {
      if (hero.vx > 0) {
        // Moving right -> snap to left edge of platform
        hero.x = plat.x - CONFIG.HERO.WIDTH;
        hero.vx = 0;
      } else if (hero.vx < 0) {
        // Moving left -> snap to right edge of platform
        hero.x = plat.x + plat.width;
        hero.vx = 0;
      }
      heroBoxX.x = hero.x;
    }
  }

  // --- STEP 2: RESOLVE VERTICAL (Y-AXIS) MOVEMENT & COLLISION ---
  hero.isGrounded = false;
  hero.y += hero.vy;

  const heroBoxY = {
    x: hero.x,
    y: hero.y,
    width: CONFIG.HERO.WIDTH,
    height: CONFIG.HERO.HEIGHT
  };

  for (const plat of GameState.platforms) {
    if (checkAABB(heroBoxY, plat)) {
      if (hero.vy > 0) {
        // Falling down -> land on top of platform
        hero.y = plat.y - CONFIG.HERO.HEIGHT;
        hero.vy = 0;
        hero.isGrounded = true;
        hero.jumpsRemaining = 2; // Reset double-jump on landing
      } else if (hero.vy < 0) {
        // Jumping up -> bonk against platform underside
        hero.y = plat.y + plat.height;
        hero.vy = 0;
      }
      heroBoxY.y = hero.y;
    }
  }

  // 4. Update Camera Tracking
  // cameraX = max(0, min(LEVEL_WIDTH - CANVAS_WIDTH, hero.x - 380))
  GameState.cameraX = Math.max(
    0,
    Math.min(CONFIG.LEVEL_WIDTH - CONFIG.CANVAS_WIDTH, hero.x - 380)
  );

  // 5. Environmental Death Check (Fell into abyss)
  if (hero.y > CONFIG.LEVEL_HEIGHT) {
    hero.hp = 0;
    if (playSound) playSound('hit');
  }
}

/**
 * Advances the deadly Pacing Wall chasing the Hero from the left
 * @param {Function} playSound - optional audio callback
 */
export function updatePacingWall(playSound) {
  GameState.pacingWall.x += GameState.pacingWall.speed;

  // If Hero is engulfed by the Pacing Wall, instant elimination
  if (GameState.hero.x < GameState.pacingWall.x && GameState.hero.hp > 0) {
    GameState.hero.hp = 0;
    if (playSound) playSound('hit');
  }
}

/**
 * Updates Game Master energy regen, cursor validation, placement, overclocking, and salvaging
 * @param {Object} input - inputState flags
 * @param {Function} playSound - optional audio synthesis callback
 */
export function updateGM(input, playSound) {
  // 1. Passive Energy Regen (8 per second at 60 FPS = 8/60 per frame)
  GameState.gm.energy = Math.min(
    CONFIG.GM.MAX_ENERGY,
    GameState.gm.energy + CONFIG.GM.PASSIVE_REGEN_PER_SEC / 60
  );

  const heroCenterX = GameState.hero.x + CONFIG.HERO.WIDTH / 2;
  const heroCenterY = GameState.hero.y + CONFIG.HERO.HEIGHT / 2;
  const gridX = GameState.gm.worldMouseX;
  const gridY = GameState.gm.worldMouseY;

  // 2. Safe-Zone Placement Formula (Anti-Spam Halo: D >= 220px)
  const distToHero = Math.hypot(gridX - heroCenterX, gridY - heroCenterY);

  const selectedDef = CONFIG.TRAPS[GameState.gm.selectedTrapKey];
  const canAfford = selectedDef && GameState.gm.energy >= selectedDef.cost;

  // Check if cell already contains a trap
  const cellOccupied = GameState.traps.some(
    (t) => t.x === gridX && t.y === gridY && t.active
  );

  // Bounds check
  const inBounds =
    gridX >= 0 &&
    gridX + (selectedDef?.width || 40) <= CONFIG.LEVEL_WIDTH &&
    gridY >= 0 &&
    gridY + (selectedDef?.height || 20) <= CONFIG.LEVEL_HEIGHT;

  GameState.gm.canPlaceAtCursor =
    distToHero >= CONFIG.GM.SAFE_ZONE_RADIUS &&
    canAfford &&
    !cellOccupied &&
    inBounds;

  // 3. Handle Left-Click (Place new trap OR Overclock existing dynamic trap)
  if (input.leftClick) {
    // Check if clicked directly on an existing WIND trap ahead of Hero for Overclock
    const clickedTrap = GameState.traps.find(
      (t) =>
        t.active &&
        gridX >= t.x &&
        gridX < t.x + t.width &&
        gridY >= t.y &&
        gridY < t.y + t.height
    );

    if (clickedTrap && clickedTrap.type === 'WIND') {
      // Overclock existing dynamic trap
      if (GameState.gm.energy >= CONFIG.GM.OVERCLOCK_COST) {
        GameState.gm.energy -= CONFIG.GM.OVERCLOCK_COST;
        clickedTrap.overclockTimer = 180; // 3 seconds at 60 FPS
        if (playSound) playSound('placeTrap');
      }
    } else if (GameState.gm.canPlaceAtCursor) {
      // Place new trap
      GameState.gm.energy -= selectedDef.cost;
      GameState.traps.push({
        uid: ++trapIdCounter,
        type: selectedDef.id,
        x: gridX,
        y: gridY,
        width: selectedDef.width,
        height: selectedDef.height,
        color: selectedDef.color,
        cost: selectedDef.cost,
        overclockTimer: 0,
        active: true
      });
      if (playSound) playSound('placeTrap');
    }
  }

  // 4. Handle Right-Click (Salvage trap behind the Hero: trap.x < hero.x - 60)
  if (input.rightClick) {
    for (let i = GameState.traps.length - 1; i >= 0; i--) {
      const trap = GameState.traps[i];
      if (trap.active && trap.x < GameState.hero.x - 60) {
        // Check if cursor clicked on or near this trap
        if (
          gridX >= trap.x - 20 &&
          gridX <= trap.x + trap.width + 20 &&
          gridY >= trap.y - 20 &&
          gridY <= trap.y + trap.height + 20
        ) {
          // Salvage 50% energy refund
          const refund = Math.floor(trap.cost * CONFIG.GM.SALVAGE_REFUND_RATE);
          GameState.gm.energy = Math.min(
            CONFIG.GM.MAX_ENERGY,
            GameState.gm.energy + refund
          );
          trap.active = false;
          GameState.traps.splice(i, 1);
          if (playSound) playSound('placeTrap');
          break;
        }
      }
    }
  }

  // 5. Update Trap timers (overclock decay)
  for (const trap of GameState.traps) {
    if (trap.overclockTimer > 0) {
      trap.overclockTimer--;
    }
  }
}

/**
 * Checks and resolves interactions between the Hero and placed Traps
 * @param {Function} playSound - optional audio synthesis callback
 */
export function checkTrapInteractions(playSound) {
  const hero = GameState.hero;
  if (hero.hp <= 0) return;

  const heroBox = {
    x: hero.x,
    y: hero.y,
    width: CONFIG.HERO.WIDTH,
    height: CONFIG.HERO.HEIGHT
  };

  let touchingIce = false;

  for (let i = GameState.traps.length - 1; i >= 0; i--) {
    const trap = GameState.traps[i];
    if (!trap.active) continue;

    switch (trap.type) {
      case 'SPIKE': {
        if (checkAABB(heroBox, trap)) {
          if (hero.invulnTimer === 0) {
            hero.hp -= CONFIG.TRAPS.SPIKE.damage;
            hero.invulnTimer = CONFIG.HERO.INVULNERABLE_FRAMES;
            hero.vy = -8; // Upward knockback
            if (playSound) playSound('hit');
          }
        }
        break;
      }

      case 'ICE': {
        if (checkAABB(heroBox, trap)) {
          touchingIce = true;
        }
        break;
      }

      case 'WIND': {
        // Wind beam zone: 160px upward or backward beam
        const isOverclocked = trap.overclockTimer > 0;
        const mult = isOverclocked ? 2.0 : 1.0;
        const windRange = CONFIG.TRAPS.WIND.range;

        // Beam pushes upward and leftward within range
        const windZone = {
          x: trap.x - windRange,
          y: trap.y - windRange,
          width: trap.width + windRange,
          height: trap.height + windRange
        };

        if (checkAABB(heroBox, windZone)) {
          hero.vx += CONFIG.TRAPS.WIND.pushForceX * mult;
          hero.vy += CONFIG.TRAPS.WIND.pushForceY * mult;
        }
        break;
      }

      case 'PHANTOM': {
        // Hologram bluff: deals 0 damage, flickers and disappears when touched
        if (checkAABB(heroBox, trap)) {
          trap.active = false;
          GameState.traps.splice(i, 1);
          // Hero Near-miss / bluff revealed sound
          if (playSound) playSound('dash');
        }
        break;
      }
    }
  }

  hero.onIce = touchingIce;
}

/**
 * Master Physics Tick (called every 60 FPS frame)
 * @param {Object} input - inputState flags
 * @param {Function} playSound - optional audio synthesis callback
 */
export function updatePhysics(input, playSound) {
  if (GameState.phase !== 'PLAYING') return;

  GameState.frameCount++;

  // 1. Update Game Master energy & trap placement
  updateGM(input, playSound);

  // 2. Update Hero Platforming Movement & Collision
  updateHero(input, playSound);

  // 3. Update Pacing Wall
  updatePacingWall(playSound);

  // 4. Update Trap interactions
  checkTrapInteractions(playSound);

  // 5. Check Finish Portal (x = 4650)
  if (GameState.hero.x >= GameState.finishPortal.x && GameState.hero.hp > 0) {
    // Hero reached the finish portal!
    return 'FINISHED';
  }

  // 6. Check Hero Death
  if (GameState.hero.hp <= 0) {
    return 'DIED';
  }

  return 'ACTIVE';
}
