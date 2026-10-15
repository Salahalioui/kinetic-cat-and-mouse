/**
 * Kinetic Cat-and-Mouse: Predictive Architect
 * src/physics.js - AABB collision, Hero movement, GM Trap logic, Pacing Wall,
 * Magnetic Snapping, Coyote Time, Jump Buffering, Endless Streaming & Turn-Based phases.
 *
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

  // 1. Timers and Cooldowns
  if (hero.dashCooldown > 0) hero.dashCooldown--;
  if (hero.invulnTimer > 0) hero.invulnTimer--;

  // Coyote Timer & Jump Buffer
  if (input.jumpPressed) {
    hero.jumpBufferTimer = CONFIG.HERO.JUMP_BUFFER_FRAMES; // 8 frames
  } else if (hero.jumpBufferTimer > 0) {
    hero.jumpBufferTimer--;
  }

  // Ice decay timer
  if (hero.iceDecayTimer > 0) {
    hero.iceDecayTimer--;
    hero.onIce = true;
  } else {
    hero.onIce = false;
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

    // Fast-Fall / Ground Slam (Airborne KeyS / Down)
    if (!hero.isGrounded && input.down) {
      hero.isSlamming = true;
      hero.vy = 18; // Fast fall speed
    }

    // 3. Jump Execution with Coyote Time & Jump Buffering
    if (hero.jumpBufferTimer > 0) {
      if (hero.isGrounded || hero.coyoteTimer > 0) {
        // Normal or coyote ground jump
        hero.vy = CONFIG.HERO.JUMP_FORCE;
        hero.isGrounded = false;
        hero.coyoteTimer = 0;
        hero.jumpBufferTimer = 0;
        hero.jumpsRemaining = 1;
        if (playSound) playSound('jump');
      } else if (hero.jumpsRemaining > 0 && input.jumpPressed) {
        // Double-jump in mid-air
        hero.vy = CONFIG.HERO.DOUBLE_JUMP_FORCE;
        hero.jumpsRemaining--;
        hero.jumpBufferTimer = 0;
        if (playSound) playSound('jump');
      }
    }

    // Apply Gravity (capped at MAX_FALL_SPEED)
    if (!hero.isSlamming) {
      hero.vy = Math.min(CONFIG.HERO.MAX_FALL_SPEED, hero.vy + CONFIG.HERO.GRAVITY);
    }
  }

  // -------------------------------------------------------------------------
  // STRICT DIRECTIVE 3: SEPARATE X AND Y COLLISION RESOLUTION
  // Always resolve horizontal (X) movement BEFORE vertical (Y) movement!
  // -------------------------------------------------------------------------

  // --- STEP 1: RESOLVE HORIZONTAL (X-AXIS) MOVEMENT & COLLISION ---
  hero.x += hero.vx;

  // Level boundaries clamping
  const levelW = GameState.gameMode === 'ENDLESS' ? Infinity : CONFIG.LEVEL_WIDTH;
  if (hero.x < 0) {
    hero.x = 0;
    hero.vx = 0;
  } else if (hero.x + CONFIG.HERO.WIDTH > levelW) {
    hero.x = levelW - CONFIG.HERO.WIDTH;
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
  const wasGrounded = hero.isGrounded;
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
        hero.coyoteTimer = CONFIG.HERO.COYOTE_FRAMES;
        hero.jumpsRemaining = 2; // Reset double-jump on landing

        if (hero.isSlamming) {
          hero.isSlamming = false;
          if (playSound) playSound('hit');
        }

        // Jump Buffer: jump automatically the exact frame of landing
        if (hero.jumpBufferTimer > 0) {
          hero.vy = CONFIG.HERO.JUMP_FORCE;
          hero.isGrounded = false;
          hero.coyoteTimer = 0;
          hero.jumpBufferTimer = 0;
          hero.jumpsRemaining = 1;
          if (playSound) playSound('jump');
        }
      } else if (hero.vy < 0) {
        // Jumping up -> bonk against platform underside
        hero.y = plat.y + plat.height;
        hero.vy = 0;
      }
      heroBoxY.y = hero.y;
    }
  }

  // If was grounded and walked off a ledge, coyoteTimer counts down in air
  if (wasGrounded && !hero.isGrounded) {
    hero.coyoteTimer = CONFIG.HERO.COYOTE_FRAMES;
  } else if (!hero.isGrounded && hero.coyoteTimer > 0) {
    hero.coyoteTimer--;
  }

  // 4. Check Shield / Energy Orbs Pickups
  for (let i = GameState.pickups.length - 1; i >= 0; i--) {
    const pickup = GameState.pickups[i];
    if (!pickup.collected && checkAABB(heroBoxY, pickup)) {
      pickup.collected = true;
      hero.shield = Math.min(2, (hero.shield || 0) + 1);
      hero.hp = Math.min(3, hero.hp + 1);
      GameState.pickups.splice(i, 1);
      if (playSound) playSound('orb');
    }
  }

  // 5. Update Camera Tracking
  if (GameState.playStyle !== 'TURN_BASED' || GameState.turnPhase === 'RUN') {
    const maxCamX = GameState.gameMode === 'ENDLESS' ? Infinity : (CONFIG.LEVEL_WIDTH - CONFIG.CANVAS_WIDTH);
    GameState.cameraX = Math.max(0, Math.min(maxCamX, hero.x - 380));
  }

  // 6. Environmental Death Check (Fell into abyss)
  if (hero.y > CONFIG.LEVEL_HEIGHT) {
    hero.hp = 0;
    if (playSound) playSound('hit');
  }
}

/**
 * Advances the deadly Pacing Wall chasing the Hero from the left
 * and recycles traps passed by the wall (Auto-Salvage Vacuum)
 * @param {Function} playSound - optional audio callback
 */
export function updatePacingWall(playSound) {
  GameState.pacingWall.x += GameState.pacingWall.speed;

  // Auto-Salvage Vacuum: destroy passed traps and refund 50% energy to GM
  for (let i = GameState.traps.length - 1; i >= 0; i--) {
    const trap = GameState.traps[i];
    if (trap.active && trap.x + trap.width < GameState.pacingWall.x) {
      const refund = Math.floor(trap.cost * CONFIG.GM.SALVAGE_REFUND_RATE);
      GameState.gm.energy = Math.min(
        CONFIG.GM.MAX_ENERGY,
        GameState.gm.energy + refund
      );
      trap.active = false;
      GameState.traps.splice(i, 1);
      if (playSound) playSound('salvage');
    }
  }

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
  // 1. Passive Energy Regen (8 per second at 60 FPS)
  // In TURN_BASED BUILD phase, passive regen is stopped (fixed round budget)
  if (GameState.playStyle !== 'TURN_BASED' || GameState.turnPhase === 'RUN') {
    GameState.gm.energy = Math.min(
      CONFIG.GM.MAX_ENERGY,
      GameState.gm.energy + CONFIG.GM.PASSIVE_REGEN_PER_SEC / 60
    );
  }

  // Tactical Slow-Mo consumption & recharge
  if (GameState.playStyle === 'SLOW_MO') {
    if (GameState.gm.slowMoActive && GameState.gm.slowMoFuel > 0) {
      GameState.gm.slowMoFuel = Math.max(0, GameState.gm.slowMoFuel - 0.4);
      if (GameState.gm.slowMoFuel <= 0) {
        GameState.gm.slowMoActive = false;
      }
    } else if (!GameState.gm.slowMoActive && GameState.gm.slowMoFuel < 100) {
      GameState.gm.slowMoFuel = Math.min(100, GameState.gm.slowMoFuel + 0.2);
    }
  }

  const heroCenterX = GameState.hero.x + CONFIG.HERO.WIDTH / 2;
  const heroCenterY = GameState.hero.y + CONFIG.HERO.HEIGHT / 2;
  const gridX = GameState.gm.worldMouseX;
  const rawGridY = GameState.gm.worldMouseY;

  const selectedDef = CONFIG.TRAPS[GameState.gm.selectedTrapKey];
  const trapW = selectedDef?.width || 40;
  const trapH = selectedDef?.height || 20;

  // 2. Universal Magnetic Platform Snapping for ALL Traps (Spikes, Ice, Wind, Phantom, Spring, Laser Gate)
  let placeY = rawGridY;
  let bestPlat = null;
  let minDy = Infinity;

  // Search for the most appropriate platform in the cursor's column:
  for (const plat of GameState.platforms) {
    if (gridX + trapW > plat.x && gridX < plat.x + plat.width) {
      const dy = plat.y - (rawGridY + trapH);
      // Prioritize platforms below or at cursor level
      if (dy >= -40 && dy < minDy) {
        minDy = dy;
        bestPlat = plat;
      }
    }
  }

  // Fallback: If no platform below cursor, snap to closest platform vertically in this column
  if (!bestPlat) {
    for (const plat of GameState.platforms) {
      if (gridX + trapW > plat.x && gridX < plat.x + plat.width) {
        const distY = Math.abs(plat.y - (rawGridY + trapH));
        if (distY < minDy) {
          minDy = distY;
          bestPlat = plat;
        }
      }
    }
  }

  if (bestPlat) {
    placeY = bestPlat.y - trapH;
    GameState.gm.hasSnapPlatform = true;
  } else {
    GameState.gm.hasSnapPlatform = false;
  }
  GameState.gm.snapY = placeY;

  // 3. Safe-Zone Placement Formula (Anti-Spam Halo: D >= 220px)
  const distToHero = Math.hypot(gridX - heroCenterX, placeY - heroCenterY);
  const canAfford = selectedDef && GameState.gm.energy >= selectedDef.cost;

  // Check if cell already contains an active trap
  const cellOccupied = GameState.traps.some(
    (t) => t.active && Math.abs(t.x - gridX) < 10 && Math.abs(t.y - placeY) < 10
  );

  // Minimum Trap Spacing: 80px gap between static damage traps (SPIKE)
  let tooCloseToOtherTrap = false;
  if (selectedDef?.id === 'SPIKE') {
    tooCloseToOtherTrap = GameState.traps.some(
      (t) => t.active && t.type === 'SPIKE' && Math.abs(t.x - gridX) < 80 && Math.abs(t.y - placeY) <= 60
    );
  }

  // Bounds check
  const levelW = GameState.gameMode === 'ENDLESS' ? Infinity : CONFIG.LEVEL_WIDTH;
  const inBounds =
    gridX >= 0 &&
    gridX + trapW <= levelW &&
    placeY >= 0 &&
    placeY + trapH <= CONFIG.LEVEL_HEIGHT;

  GameState.gm.canPlaceAtCursor =
    distToHero >= CONFIG.GM.SAFE_ZONE_RADIUS &&
    canAfford &&
    !cellOccupied &&
    !tooCloseToOtherTrap &&
    inBounds;

  // 4. Handle Left-Click (Place new trap OR Overclock dynamic trap)
  if (input.leftClick) {
    // Check if clicked directly on an existing dynamic trap ahead of Hero for Overclock
    const clickedTrap = GameState.traps.find(
      (t) =>
        t.active &&
        gridX >= t.x &&
        gridX < t.x + t.width &&
        rawGridY >= t.y &&
        rawGridY < t.y + t.height
    );

    if (clickedTrap && (clickedTrap.type === 'WIND' || clickedTrap.type === 'LASER_GATE')) {
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
        y: placeY,
        width: selectedDef.width,
        height: selectedDef.height,
        color: selectedDef.color,
        cost: selectedDef.cost,
        overclockTimer: 0,
        active: true,
        cycleOffset: GameState.frameCount % 180
      });
      if (playSound) playSound('placeTrap');
    }
  }

  // 5. Handle Right-Click (Salvage trap ahead or behind in emergency)
  if (input.rightClick) {
    for (let i = GameState.traps.length - 1; i >= 0; i--) {
      const trap = GameState.traps[i];
      if (
        trap.active &&
        gridX >= trap.x - 20 &&
        gridX <= trap.x + trap.width + 20 &&
        rawGridY >= trap.y - 20 &&
        rawGridY <= trap.y + trap.height + 20
      ) {
        // Salvage 50% energy refund
        const refund = Math.floor(trap.cost * CONFIG.GM.SALVAGE_REFUND_RATE);
        GameState.gm.energy = Math.min(
          CONFIG.GM.MAX_ENERGY,
          GameState.gm.energy + refund
        );
        trap.active = false;
        GameState.traps.splice(i, 1);
        if (playSound) playSound('salvage');
        break;
      }
    }
  }

  // 6. Update Trap timers (overclock decay)
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
          // Hero Invulnerability during supersonic dash
          if (hero.dashTimer > 0) {
            // Dodged through spikes smoothly!
            break;
          }

          if (hero.invulnTimer === 0) {
            if (hero.shield > 0) {
              hero.shield--;
              hero.invulnTimer = 60;
              hero.vy = -6;
              if (playSound) playSound('shieldBreak');
            } else {
              hero.hp -= CONFIG.TRAPS.SPIKE.damage;
              hero.invulnTimer = CONFIG.HERO.INVULNERABLE_FRAMES;
              hero.vy = -8; // Upward knockback
              if (playSound) playSound('hit');
            }
          }
        }
        break;
      }

      case 'ICE': {
        if (checkAABB(heroBox, trap)) {
          touchingIce = true;
          hero.iceDecayTimer = 15;
        }
        break;
      }

      case 'WIND': {
        // Wind beam zone: pushes upward and leftward
        const isOverclocked = trap.overclockTimer > 0;
        const mult = isOverclocked ? 2.2 : 1.0;
        const windRange = CONFIG.TRAPS.WIND.range;

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
          if (playSound) playSound('dash');
        }
        break;
      }

      case 'SPRING': {
        // Bounce Pad: super launch upward & reset air jumps
        if (checkAABB(heroBox, trap)) {
          hero.vy = -16;
          hero.jumpsRemaining = 2;
          hero.isGrounded = false;
          if (playSound) playSound('spring');
        }
        break;
      }

      case 'LASER_GATE': {
        // Laser Gate cycles on and off every 90 frames (1.5 seconds)
        const isOverclocked = trap.overclockTimer > 0;
        const cyclePeriod = isOverclocked ? 120 : 180;
        const activeDuration = isOverclocked ? 80 : 90;
        const cycle = (GameState.frameCount + (trap.cycleOffset || 0)) % cyclePeriod;
        trap.beamActive = cycle < activeDuration;

        if (trap.beamActive && checkAABB(heroBox, trap)) {
          if (hero.dashTimer > 0) {
            // Dash through laser gate unharmed!
            break;
          }
          if (hero.invulnTimer === 0) {
            if (hero.shield > 0) {
              hero.shield--;
              hero.invulnTimer = 60;
              hero.vx = -6;
              if (playSound) playSound('shieldBreak');
            } else {
              hero.hp -= 1;
              hero.invulnTimer = 60;
              hero.vx = -8;
              if (playSound) playSound('hit');
            }
          }
        }
        break;
      }
    }
  }

  hero.onIce = touchingIce || hero.iceDecayTimer > 0;
}

/**
 * Handles chunk streaming and garbage collection in Endless Mode
 */
function updateEndlessStream() {
  if (GameState.gameMode !== 'ENDLESS') return;

  const hero = GameState.hero;
  GameState.endlessDistance = Math.floor(hero.x);

  // 1. Stream ahead if approaching generation horizon
  if (hero.x + 1800 > GameState.lastGeneratedX) {
    GameState.streamNextChunk();
  }

  // 2. Difficulty scaling every 1000m
  const scaleTier = Math.floor(hero.x / 1000);
  GameState.pacingWall.speed = 2.4 + scaleTier * 0.2;

  // 3. Garbage collection behind the pacing wall
  const gcThreshold = GameState.pacingWall.x - 300;

  for (let i = GameState.platforms.length - 1; i >= 0; i--) {
    const plat = GameState.platforms[i];
    if (plat.x + plat.width < gcThreshold) {
      GameState.platforms.splice(i, 1);
    }
  }

  for (let i = GameState.traps.length - 1; i >= 0; i--) {
    const trap = GameState.traps[i];
    if (trap.x + trap.width < gcThreshold) {
      GameState.traps.splice(i, 1);
    }
  }

  for (let i = GameState.pickups.length - 1; i >= 0; i--) {
    const p = GameState.pickups[i];
    if (p.x + p.width < gcThreshold) {
      GameState.pickups.splice(i, 1);
    }
  }
}

/**
 * Master Physics Tick (called every 60 FPS frame)
 * @param {Object} input - inputState flags
 * @param {Function} playSound - optional audio synthesis callback
 */
export function updatePhysics(input, playSound) {
  if (GameState.phase !== 'PLAYING') return 'IDLE';

  // TURN-BASED ARCHITECT MODE: BUILD PHASE
  if (GameState.playStyle === 'TURN_BASED' && GameState.turnPhase === 'BUILD') {
    if (GameState.buildTimer > 0) {
      GameState.buildTimer--;
    }
    // Note: The run phase strictly begins only when the Architect confirms via button or shortcut.
    // The Hero remains stopped and waiting on their screen until confirmation.
    updateGM(input, playSound);
    return 'BUILD';
  }

  GameState.frameCount++;

  // 1. Update Game Master energy & trap placement
  updateGM(input, playSound);

  // 2. Update Hero Platforming Movement & Collision
  updateHero(input, playSound);

  // 3. Update Pacing Wall
  updatePacingWall(playSound);

  // 4. Update Trap interactions
  checkTrapInteractions(playSound);

  // 5. Endless Mode Streaming & GC
  if (GameState.gameMode === 'ENDLESS') {
    updateEndlessStream();
  }

  // 6. Check Finish Portal (Campaign / Levels Mode)
  if (GameState.gameMode !== 'ENDLESS') {
    if (GameState.hero.x >= GameState.finishPortal.x && GameState.hero.hp > 0) {
      return 'FINISHED';
    }
  }

  // 7. Check Hero Death
  if (GameState.hero.hp <= 0) {
    return 'DIED';
  }

  return 'ACTIVE';
}
