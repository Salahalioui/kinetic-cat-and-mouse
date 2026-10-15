/**
 * Kinetic Cat-and-Mouse: Automated Headless Verification Suite
 * Tests all 5 Bug Fixes, 3 Play Styles, 2 Game Modes, Modular Chunks, and Strict Directives.
 */

import { CONFIG } from '../src/config.js';
import { GameState, resetRound, resetHero } from '../src/state.js';
import { updateHero, updateGM, updatePacingWall, checkTrapInteractions, updatePhysics, checkAABB } from '../src/physics.js';
import { inputState, clearFrameInputs, confirmBuildAndLaunch } from '../src/input.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

console.log('--- TEST SUITE 1: 5 Gameplay Bug Fixes ---');

// Bug 1: Magnetic Platform Snapping
GameState.initLevel(1);
resetRound(1);
GameState.gm.selectedTrapKey = 'SPIKE';
// Platform at x=180 to 460, y=440
GameState.gm.worldMouseX = 300;
GameState.gm.worldMouseY = 200; // in the air above platform
updateGM({ leftClick: false, rightClick: false });
assert(
  GameState.gm.snapY === 440 - CONFIG.TRAPS.SPIKE.height,
  `Bug 1: Magnetic Snapping snapped cursor to platform top (${GameState.gm.snapY} === ${440 - CONFIG.TRAPS.SPIKE.height})`
);

// Bug 2: Coyote Time & Jump Buffering
resetRound(1);
// Walk hero off ledge
GameState.hero.x = 420;
GameState.hero.y = 440 - CONFIG.HERO.HEIGHT;
GameState.hero.isGrounded = true;
GameState.hero.coyoteTimer = 8;
// Next frame in air
GameState.hero.isGrounded = false;
updateHero({ right: true, jumpPressed: true }); // jump pressed right as walking off
assert(GameState.hero.vy < 0, `Bug 2: Coyote Jump succeeded after leaving ledge (vy = ${GameState.hero.vy} < 0)`);

// Jump buffer
resetRound(1);
GameState.hero.x = 240; // Over middle platform (x: 180-460, y: 440)
GameState.hero.isGrounded = false;
GameState.hero.coyoteTimer = 0;
GameState.hero.jumpsRemaining = 0; // double jumps already spent
GameState.hero.vy = 4;
// Buffer jump 2 frames before landing
updateHero({ jumpPressed: true });
assert(GameState.hero.jumpBufferTimer > 0, `Bug 2: Jump buffer stored when pressing jump before landing (timer = ${GameState.hero.jumpBufferTimer})`);

// Simulate landing
GameState.hero.y = 440 - CONFIG.HERO.HEIGHT - 2;
updateHero({});
assert(GameState.hero.vy < 0, `Bug 2: Buffered jump executed automatically upon landing (vy = ${GameState.hero.vy} < 0)`);

// Bug 3: Auto-Salvage Vacuum
resetRound(1);
GameState.gm.energy = 50;
GameState.traps.push({
  uid: 999,
  type: 'SPIKE',
  x: 200,
  y: 420,
  width: 40,
  height: 20,
  cost: 25,
  active: true
});
GameState.pacingWall.x = 260; // Pacing wall passes the trap
updatePacingWall();
assert(
  GameState.traps.find(t => t.uid === 999) === undefined,
  'Bug 3: Auto-Salvage Vacuum cleaned up trap passed by Pacing Wall'
);
assert(
  GameState.gm.energy === 50 + Math.floor(25 * 0.5),
  `Bug 3: GM refunded 50% energy by vacuum (${GameState.gm.energy} === ${50 + Math.floor(25 * 0.5)})`
);

// Bug 4: Minimum Trap Spacing
resetRound(1);
GameState.gm.energy = 150;
GameState.gm.selectedTrapKey = 'SPIKE';
GameState.traps.push({
  uid: 100,
  type: 'SPIKE',
  x: 300,
  y: 420,
  width: 40,
  height: 20,
  cost: 25,
  active: true
});
// Attempt to place another SPIKE only 40px away (x = 340) on the same platform
GameState.gm.worldMouseX = 340;
GameState.gm.worldMouseY = 420;
updateGM({ leftClick: false, rightClick: false });
assert(
  GameState.gm.canPlaceAtCursor === false,
  'Bug 4: Minimum Trap Spacing rejects placing static damage traps closer than 80px'
);

// Bug 5: Ice Physics Decay Reset
resetRound(1);
GameState.hero.onIce = false;
GameState.hero.iceDecayTimer = 15;
updateHero({});
assert(GameState.hero.onIce === true, 'Bug 5: Ice decay active slides smoothly');
GameState.hero.iceDecayTimer = 0;
updateHero({});
assert(GameState.hero.onIce === false, 'Bug 5: Hero cleanly exits ice without perpetual lock');

console.log('\n--- TEST SUITE 2: Hero & GM Upgrades ---');

// Ground Slam (Fast-fall with Down key)
resetRound(1);
GameState.hero.isGrounded = false;
GameState.hero.vy = 2;
updateHero({ down: true });
assert(GameState.hero.isSlamming === true && GameState.hero.vy === 18, 'Hero Fast-Fall / Ground Slam executes with vy = 18');

// Dash Immunity to Spikes
resetRound(1);
GameState.hero.x = 500;
GameState.hero.y = 420;
GameState.hero.hp = 3;
GameState.hero.dashTimer = 5; // mid-dash
GameState.traps.push({
  uid: 201,
  type: 'SPIKE',
  x: 500,
  y: 420,
  width: 40,
  height: 20,
  active: true
});
checkTrapInteractions();
assert(GameState.hero.hp === 3, 'Hero passes through Spikes unharmed during Dash');

// Shield Orb Pickup & Damage Absorption
resetRound(1);
GameState.hero.x = 600;
GameState.hero.y = 400;
GameState.hero.shield = 0;
GameState.pickups.push({
  x: 600,
  y: 400,
  width: 24,
  height: 24,
  type: 'SHIELD',
  collected: false
});
updateHero({});
assert(GameState.hero.shield === 1, 'Hero collected Shield Orb (+1 Shield)');

// Shield absorbs next damage hit
GameState.traps.push({
  uid: 202,
  type: 'SPIKE',
  x: 600,
  y: 400,
  width: 40,
  height: 20,
  active: true
});
checkTrapInteractions();
assert(GameState.hero.hp === 3 && GameState.hero.shield === 0, 'Shield absorbed spike hit, preserving Hero HP at 3');

// Spring Trap (High Bounce)
resetRound(1);
GameState.hero.x = 700;
GameState.hero.y = 420;
GameState.traps.push({
  uid: 203,
  type: 'SPRING',
  x: 700,
  y: 420,
  width: 40,
  height: 20,
  active: true
});
checkTrapInteractions();
assert(GameState.hero.vy === -16 && GameState.hero.jumpsRemaining === 2, 'Spring Trap launched hero with vy = -16 and reset jumps');

// Laser Gate Trap
resetRound(1);
GameState.hero.x = 800;
GameState.hero.y = 350;
GameState.traps.push({
  uid: 204,
  type: 'LASER_GATE',
  x: 800,
  y: 350,
  width: 20,
  height: 100,
  active: true,
  cycleOffset: 0
});
GameState.frameCount = 10; // active beam
checkTrapInteractions();
assert(GameState.hero.hp === 2, 'Laser Gate dealt damage during active beam cycle');

console.log('\n--- TEST SUITE 3: Play Styles & Game Modes ---');

// Turn-Based Architect Mode: BUILD Phase
GameState.playStyle = 'TURN_BASED';
GameState.turnPhase = 'BUILD';
GameState.buildTimer = 100;
const status = updatePhysics({});
assert(status === 'BUILD', 'Turn-Based Mode returns BUILD status during build phase');
assert(GameState.buildTimer === 99, 'Turn-Based build timer counts down');

// Endless Run Mode & Chunk Streaming
GameState.gameMode = 'ENDLESS';
GameState.playStyle = 'REAL_TIME';
GameState.turnPhase = 'RUN';
GameState.initLevel('ENDLESS');
resetRound(1);
GameState.playStyle = 'REAL_TIME';
GameState.turnPhase = 'RUN';
const initialPlatformCount = GameState.platforms.length;
// Move hero far ahead to trigger chunk streaming
GameState.hero.x = 3500;
updatePhysics({});
assert(
  GameState.platforms.length > initialPlatformCount,
  `Endless Mode streamed new chunk templates ahead of Hero (${GameState.platforms.length} > ${initialPlatformCount})`
);

console.log('\n--- TEST SUITE 4: Directive 3 Verification ---');
// Verify Separate X and Y Collision
resetRound(1);
GameState.hero.x = 390;
GameState.hero.y = 440;
GameState.hero.vx = 8;
GameState.hero.vy = 8;
updateHero({});
assert(GameState.hero.vx === 0, 'Directive 3: Horizontal collision stopped X movement before Y collision');

console.log('\n--- TEST SUITE 5: Universal Magnetic Snapping for ALL 6 Traps ---');
// Test magnetic snapping on platform at x=180-460, y=440
const allTraps = ['SPIKE', 'ICE', 'WIND', 'PHANTOM', 'SPRING', 'LASER_GATE'];
allTraps.forEach((trapKey) => {
  resetRound(1);
  GameState.gm.selectedTrapKey = trapKey;
  GameState.gm.worldMouseX = 300;
  GameState.gm.worldMouseY = 220; // In air above platform
  updateGM({ leftClick: false, rightClick: false });

  const def = CONFIG.TRAPS[trapKey];
  const expectedSnapY = 440 - def.height;
  assert(
    GameState.gm.snapY === expectedSnapY,
    `Universal Snap: Trap ${trapKey} (h=${def.height}) snapped to platform top (${GameState.gm.snapY} === ${expectedSnapY})`
  );
  assert(
    GameState.gm.hasSnapPlatform === true,
    `Universal Snap: Trap ${trapKey} detected snap platform (hasSnapPlatform === true)`
  );
});

console.log('\n--- TEST SUITE 6: Turn-Based Confirmation Gate ---');
resetRound(1);
GameState.playStyle = 'TURN_BASED';
GameState.turnPhase = 'BUILD';
GameState.buildTimer = 0; // Timer expires!
updatePhysics({});
assert(
  GameState.turnPhase === 'BUILD',
  'Turn-Based Gate: Run did NOT auto-start on timer expiry (turnPhase remains BUILD)'
);

// Explicit Architect Confirmation launches the run
confirmBuildAndLaunch();
assert(
  GameState.turnPhase === 'RUN',
  'Turn-Based Gate: confirmBuildAndLaunch() successfully transitioned turnPhase to RUN'
);

console.log(`\n=============================================`);
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log(`=============================================`);

if (failed > 0) {
  process.exit(1);
}

