/**
 * Kinetic Cat-and-Mouse: Predictive Architect
 * src/renderer.js - HTML5 Canvas 2D Neon Renderer, Parallax Cyber Grid,
 * Safe-Zone Halo, Entity Visuals, Mini-Map Radar Bar, DOM HUD, and Native Web Audio API Synthesizer.
 *
 * Strict Directive 1: Zero External Assets (Canvas 2D primitives + Web Audio API).
 */

import { CONFIG, COLORS } from './config.js';
import { GameState } from './state.js';

// =============================================================================
// NATIVE WEB AUDIO API SYNTHESIZER (ZERO EXTERNAL MP3s)
// =============================================================================
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Procedural Web Audio Sound Synthesizer
 * @param {'jump'|'dash'|'placeTrap'|'hit'|'win'|'spring'|'orb'|'shieldBreak'|'salvage'} type
 */
export function playSound(type) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'jump': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.12);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'dash': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
        break;
      }

      case 'placeTrap': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.04);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
        break;
      }

      case 'hit': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.42);
        break;
      }

      case 'win': {
        const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;

          const start = now + idx * 0.07;
          gain.gain.setValueAtTime(0.22, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.26);
        });
        break;
      }

      case 'spring': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'orb': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.setValueAtTime(987.77, now + 0.08);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      case 'shieldBreak': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'salvage': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(600, now + 0.05);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      }
    }
  } catch (e) {
    // Graceful fallback if Web Audio is suspended
  }
}

// Hero Motion Trail Buffer for Dash effect
const heroTrailBuffer = [];

// =============================================================================
// MAIN CANVAS RENDER FUNCTION
// =============================================================================

/**
 * Renders one frame of the game onto the HTML5 2D canvas
 * @param {CanvasRenderingContext2D} ctx
 */
export function render(ctx) {
  if (!ctx) return;

  // 1. Clear Canvas & Draw Background with Parallax Cyber Grid
  ctx.fillStyle = COLORS.BG_DARK;
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  drawParallaxCyberGrid(ctx);

  // 2. World Coordinate Transform
  ctx.save();
  ctx.translate(-GameState.cameraX, 0);

  // Draw Level Architecture (Platforms color-coded by lane)
  drawPlatforms(ctx);

  // Draw Shield Pickups
  drawPickups(ctx);

  // Draw Finish Portal (Campaign Mode)
  if (GameState.gameMode === 'CAMPAIGN') {
    drawFinishPortal(ctx);
  }

  // Round 2 Target Marker Line
  if (GameState.currentRound === 2 && GameState.roundScores.round1Distance > 0) {
    drawTargetToBeatMarker(ctx);
  }

  // Draw Placed Traps
  drawTraps(ctx);

  // Draw Safe-Zone Halo (translucent dashed anti-spam circle around Hero)
  drawSafeZoneHalo(ctx);

  // Draw Hero (with dash trails, shield aura, and invulnerability blink)
  drawHero(ctx);

  // Draw Deadly Pacing Wall
  drawPacingWall(ctx);

  // Draw GM Snapped Grid Ghost Preview
  drawGMPreview(ctx);

  ctx.restore(); // End World Transform

  // 3. Screen-Space Overlays (Mini-Map Radar, Slow-Mo Vignette, Turn-Based Banner)
  drawMiniMapRadar(ctx);

  if (GameState.playStyle === 'SLOW_MO' && GameState.gm.slowMoActive) {
    drawSlowMoVignette(ctx);
  }

  if (GameState.playStyle === 'TURN_BASED' && GameState.turnPhase === 'BUILD') {
    drawTurnBasedBanner(ctx);
  }

  // 4. Update DOM HUD Elements
  updateDOMHUD();
}

/**
 * Draws scrolling background cyber grid offset by cameraX * 0.5 (parallax effect)
 */
function drawParallaxCyberGrid(ctx) {
  const gridSize = 40;
  const offsetX = -(GameState.cameraX * 0.5) % gridSize;

  ctx.save();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  for (let x = offsetX; x < CONFIG.CANVAS_WIDTH; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
  }
  for (let y = 0; y < CONFIG.CANVAS_HEIGHT; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
  }
  ctx.stroke();

  // Subtle horizon glow line
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 440);
  ctx.lineTo(CONFIG.CANVAS_WIDTH, 440);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws platforms color-coded by lane:
 * Low: Blue (#05d5fa), Mid: Purple (#a855f7), High: Cyan (#00f0ff)
 */
function drawPlatforms(ctx) {
  for (const plat of GameState.platforms) {
    let laneColor = COLORS.LANE_MID;
    if (plat.lane === 'LOW') laneColor = COLORS.LANE_LOW;
    if (plat.lane === 'HIGH') laneColor = COLORS.LANE_HIGH;

    // Platform solid slab
    ctx.fillStyle = '#0f1322';
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

    // Border
    ctx.strokeStyle = '#1d2744';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

    // Glowing Top Running Rail
    ctx.save();
    ctx.strokeStyle = laneColor;
    ctx.shadowColor = laneColor;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(plat.x, plat.y);
    ctx.lineTo(plat.x + plat.width, plat.y);
    ctx.stroke();
    ctx.restore();

    // Rivet accents
    ctx.fillStyle = laneColor;
    ctx.fillRect(plat.x + 3, plat.y + 4, 2, 2);
    ctx.fillRect(plat.x + plat.width - 5, plat.y + 4, 2, 2);
  }
}

/**
 * Draws collectible Shield / Energy Orbs on High Lanes
 */
function drawPickups(ctx) {
  const time = performance.now() * 0.005;

  for (const p of GameState.pickups) {
    if (p.collected) continue;

    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2 + Math.sin(time * 3 + p.x) * 4;

    ctx.save();
    // Green energy glow
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing outer ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 12 + Math.sin(time * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Draws Safe-Zone Halo around Hero (radius = 220px)
 */
function drawSafeZoneHalo(ctx) {
  const heroCenterX = GameState.hero.x + CONFIG.HERO.WIDTH / 2;
  const heroCenterY = GameState.hero.y + CONFIG.HERO.HEIGHT / 2;

  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
  ctx.fillStyle = 'rgba(0, 240, 255, 0.03)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(heroCenterX, heroCenterY, CONFIG.GM.SAFE_ZONE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Subtle "NO-BUILD ZONE" indicator label
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.textAlign = 'center';
  ctx.fillText('SAFE ZONE (220px)', heroCenterX, heroCenterY - CONFIG.GM.SAFE_ZONE_RADIUS - 6);

  ctx.restore();
}

/**
 * Draws all placed traps:
 * SPIKE, ICE, WIND, PHANTOM, SPRING, LASER_GATE
 */
function drawTraps(ctx) {
  const time = performance.now() * 0.005;

  for (const trap of GameState.traps) {
    if (!trap.active) continue;

    ctx.save();

    switch (trap.type) {
      case 'SPIKE':
      case 'PHANTOM': {
        // Red / Magenta Laser Spikes (Phantom looks identical to keep Hero guessing)
        ctx.fillStyle = CONFIG.TRAPS.SPIKE.color;
        ctx.shadowColor = CONFIG.TRAPS.SPIKE.color;
        ctx.shadowBlur = 12;

        const toothCount = 3;
        const toothW = trap.width / toothCount;
        for (let i = 0; i < toothCount; i++) {
          ctx.beginPath();
          ctx.moveTo(trap.x + i * toothW, trap.y + trap.height);
          ctx.lineTo(trap.x + (i + 0.5) * toothW, trap.y);
          ctx.lineTo(trap.x + (i + 1) * toothW, trap.y + trap.height);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillRect(trap.x, trap.y + trap.height - 3, trap.width, 3);
        break;
      }

      case 'ICE': {
        ctx.fillStyle = CONFIG.TRAPS.ICE.color;
        ctx.shadowColor = CONFIG.TRAPS.ICE.color;
        ctx.shadowBlur = 14;

        ctx.fillRect(trap.x, trap.y, trap.width, trap.height);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(trap.x + 8, trap.y + trap.height / 2);
        ctx.lineTo(trap.x + trap.width - 8, trap.y + trap.height / 2);
        ctx.stroke();
        break;
      }

      case 'WIND': {
        const isOverclocked = trap.overclockTimer > 0;
        const fanColor = isOverclocked ? '#ffaa00' : CONFIG.TRAPS.WIND.color;

        ctx.fillStyle = '#1a1805';
        ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
        ctx.strokeStyle = fanColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = fanColor;
        ctx.shadowBlur = isOverclocked ? 20 : 10;
        ctx.strokeRect(trap.x, trap.y, trap.width, trap.height);

        const cx = trap.x + trap.width / 2;
        const cy = trap.y + trap.height / 2;
        const spinSpeed = isOverclocked ? time * 12 : time * 6;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(spinSpeed);
        ctx.strokeStyle = fanColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(14, 0);
        ctx.moveTo(0, -14);
        ctx.lineTo(0, 14);
        ctx.stroke();
        ctx.restore();

        const streamCount = 4;
        const streamRange = CONFIG.TRAPS.WIND.range;
        ctx.strokeStyle = isOverclocked ? 'rgba(255, 170, 0, 0.4)' : 'rgba(249, 248, 113, 0.3)';
        ctx.lineWidth = 1.5;

        for (let s = 0; s < streamCount; s++) {
          const streamOffset = ((time * 200 + s * 40) % streamRange);
          ctx.beginPath();
          ctx.moveTo(cx - streamOffset * 0.7, cy - streamOffset * 0.7);
          ctx.lineTo(cx - (streamOffset + 20) * 0.7, cy - (streamOffset + 20) * 0.7);
          ctx.stroke();
        }

        if (isOverclocked) {
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#ffaa00';
          ctx.textAlign = 'center';
          ctx.fillText('OVERCLOCK', cx, trap.y - 4);
        }
        break;
      }

      case 'SPRING': {
        // Neon Bounce Pad
        ctx.fillStyle = '#0a2218';
        ctx.fillRect(trap.x, trap.y + trap.height - 6, trap.width, 6);
        ctx.strokeStyle = CONFIG.TRAPS.SPRING.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = CONFIG.TRAPS.SPRING.color;
        ctx.shadowBlur = 12;
        ctx.strokeRect(trap.x, trap.y + trap.height - 6, trap.width, 6);

        // Spring coil
        const cx = trap.x + trap.width / 2;
        const bouncePulse = Math.abs(Math.sin(time * 6)) * 4;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 10, trap.y + trap.height - 6);
        ctx.lineTo(cx, trap.y + 4 + bouncePulse);
        ctx.lineTo(cx + 10, trap.y + trap.height - 6);
        ctx.stroke();

        // Repulsor pad plate
        ctx.fillStyle = CONFIG.TRAPS.SPRING.color;
        ctx.fillRect(trap.x + 4, trap.y + bouncePulse, trap.width - 8, 4);
        break;
      }

      case 'LASER_GATE': {
        const isOverclocked = trap.overclockTimer > 0;
        const gateColor = isOverclocked ? '#ffaa00' : CONFIG.TRAPS.LASER_GATE.color;

        // Top and bottom emitter nodes
        ctx.fillStyle = '#1a0505';
        ctx.strokeStyle = gateColor;
        ctx.lineWidth = 2;
        ctx.fillRect(trap.x, trap.y, trap.width, 10);
        ctx.strokeRect(trap.x, trap.y, trap.width, 10);
        ctx.fillRect(trap.x, trap.y + trap.height - 10, trap.width, 10);
        ctx.strokeRect(trap.x, trap.y + trap.height - 10, trap.width, 10);

        if (trap.beamActive) {
          // Pulsing vertical laser beam
          ctx.fillStyle = gateColor;
          ctx.shadowColor = gateColor;
          ctx.shadowBlur = 18;
          ctx.fillRect(trap.x + 6, trap.y + 10, trap.width - 12, trap.height - 20);

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(trap.x + trap.width / 2, trap.y + 10);
          ctx.lineTo(trap.x + trap.width / 2, trap.y + trap.height - 10);
          ctx.stroke();
        } else {
          // Inactive warning beam guide
          ctx.strokeStyle = 'rgba(255, 77, 0, 0.2)';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(trap.x + trap.width / 2, trap.y + 10);
          ctx.lineTo(trap.x + trap.width / 2, trap.y + trap.height - 10);
          ctx.stroke();
        }
        break;
      }
    }

    ctx.restore();
  }
}

/**
 * Draws Hero with motion trail, shield barrier aura, and invulnerability blink
 */
function drawHero(ctx) {
  const hero = GameState.hero;
  if (hero.hp <= 0) return;

  // Record motion trail if dashing
  if (hero.dashTimer > 0) {
    heroTrailBuffer.push({
      x: hero.x,
      y: hero.y,
      alpha: 0.7,
      facing: hero.facing
    });
  }

  // Draw and decay trail ghosts
  for (let i = heroTrailBuffer.length - 1; i >= 0; i--) {
    const t = heroTrailBuffer[i];
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = COLORS.CYAN;
    ctx.shadowColor = COLORS.CYAN;
    ctx.shadowBlur = 12;
    ctx.fillRect(t.x, t.y, CONFIG.HERO.WIDTH, CONFIG.HERO.HEIGHT);
    ctx.restore();

    t.alpha -= 0.08;
    if (t.alpha <= 0) {
      heroTrailBuffer.splice(i, 1);
    }
  }

  // Invulnerability Blinking
  if (hero.invulnTimer > 0 && Math.floor(hero.invulnTimer / 4) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(hero.x, hero.y);

  // Shield Bubble Aura if active
  if (hero.shield > 0) {
    ctx.save();
    ctx.strokeStyle = '#00ff88';
    ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CONFIG.HERO.WIDTH / 2, CONFIG.HERO.HEIGHT / 2, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Main Hero Cyber Body
  ctx.fillStyle = COLORS.CYAN;
  ctx.shadowColor = COLORS.CYAN;
  ctx.shadowBlur = hero.dashTimer > 0 ? 25 : 12;
  ctx.fillRect(4, 8, CONFIG.HERO.WIDTH - 8, CONFIG.HERO.HEIGHT - 12);

  // Helmet / Glowing Visor
  ctx.fillStyle = '#ffffff';
  const visorX = hero.facing === 1 ? CONFIG.HERO.WIDTH - 12 : 4;
  ctx.fillRect(visorX, 4, 8, 5);

  // Energy Core (Backpack)
  ctx.fillStyle = COLORS.MAGENTA;
  const packX = hero.facing === 1 ? 0 : CONFIG.HERO.WIDTH - 4;
  ctx.fillRect(packX, 10, 4, 12);

  // Feet / Running Animation
  ctx.fillStyle = COLORS.BLUE;
  if (hero.isGrounded) {
    const runAnim = Math.sin(GameState.frameCount * 0.3) * 3;
    if (Math.abs(hero.vx) > 0.5) {
      ctx.fillRect(4, CONFIG.HERO.HEIGHT - 4, 4, 4 + runAnim);
      ctx.fillRect(CONFIG.HERO.WIDTH - 8, CONFIG.HERO.HEIGHT - 4, 4, 4 - runAnim);
    } else {
      ctx.fillRect(4, CONFIG.HERO.HEIGHT - 4, 5, 4);
      ctx.fillRect(CONFIG.HERO.WIDTH - 9, CONFIG.HERO.HEIGHT - 4, 5, 4);
    }
  } else {
    // Airborne jump pose
    ctx.fillRect(3, CONFIG.HERO.HEIGHT - 6, 6, 6);
    ctx.fillRect(CONFIG.HERO.WIDTH - 9, CONFIG.HERO.HEIGHT - 6, 6, 6);
  }

  ctx.restore();
}

/**
 * Draws the Pacing Wall (glowing red laser wall with sawtooth energy teeth)
 */
function drawPacingWall(ctx) {
  const wallX = GameState.pacingWall.x;
  const time = performance.now() * 0.005;

  ctx.save();

  // Danger gradient
  const grad = ctx.createLinearGradient(Math.max(0, wallX - 180), 0, wallX, 0);
  grad.addColorStop(0, 'rgba(255, 0, 60, 0.45)');
  grad.addColorStop(1, 'rgba(255, 0, 60, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, wallX, CONFIG.LEVEL_HEIGHT);

  // Main vertical laser beam line
  ctx.strokeStyle = COLORS.PACING_WALL;
  ctx.shadowColor = COLORS.PACING_WALL;
  ctx.shadowBlur = 25;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(wallX, 0);
  ctx.lineTo(wallX, CONFIG.LEVEL_HEIGHT);
  ctx.stroke();

  // Sawtooth energy teeth
  ctx.fillStyle = COLORS.PACING_WALL;
  const toothH = 24;
  const numTeeth = Math.ceil(CONFIG.LEVEL_HEIGHT / toothH);

  for (let i = 0; i < numTeeth; i++) {
    const toothOffset = Math.sin(time * 3 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(wallX, i * toothH);
    ctx.lineTo(wallX + 10 + toothOffset, (i + 0.5) * toothH);
    ctx.lineTo(wallX, (i + 1) * toothH);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws the Finish Extraction Portal at x = 4650
 */
function drawFinishPortal(ctx) {
  const portal = GameState.finishPortal;
  const cx = portal.x + portal.width / 2;
  const cy = portal.y + portal.height / 2;
  const time = performance.now() * 0.003;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.strokeStyle = COLORS.FINISH_GOLD;
  ctx.shadowColor = COLORS.FINISH_GOLD;
  ctx.shadowBlur = 24;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 42, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.rotate(time);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-12, -18, 24, 36);

  ctx.restore();

  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = COLORS.FINISH_GOLD;
  ctx.textAlign = 'center';
  ctx.fillText('FINISH PORTAL', cx, portal.y - 12);
}

/**
 * Draws Round 2 "Target To Beat" vertical line at Round 1 distance
 */
function drawTargetToBeatMarker(ctx) {
  const targetX = GameState.roundScores.round1Distance;

  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = COLORS.FINISH_GOLD;
  ctx.shadowColor = COLORS.FINISH_GOLD;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(targetX, 0);
  ctx.lineTo(targetX, CONFIG.LEVEL_HEIGHT);
  ctx.stroke();

  ctx.fillStyle = COLORS.FINISH_GOLD;
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`TARGET TO BEAT: ${Math.floor(targetX)}m`, targetX, 40);

  ctx.restore();
}

/**
 * Draws the Game Master snapped grid ghost preview with magnetic snapping guideline
 */
function drawGMPreview(ctx) {
  const selectedDef = CONFIG.TRAPS[GameState.gm.selectedTrapKey];
  if (!selectedDef) return;

  const gx = GameState.gm.worldMouseX;
  const rawY = GameState.gm.worldMouseY;
  const gy = GameState.gm.snapY !== undefined ? GameState.gm.snapY : rawY;
  const canPlace = GameState.gm.canPlaceAtCursor;

  ctx.save();

  // If magnetic snapped to a platform, draw a subtle dashed guide line from raw cursor to snap Y
  if (Math.abs(rawY - gy) > 4) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx + selectedDef.width / 2, rawY);
    ctx.lineTo(gx + selectedDef.width / 2, gy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.lineWidth = 2;
  if (canPlace) {
    ctx.strokeStyle = '#00ff66';
    ctx.fillStyle = 'rgba(0, 255, 102, 0.2)';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 10;
  } else {
    ctx.strokeStyle = '#ff0033';
    ctx.fillStyle = 'rgba(255, 0, 51, 0.2)';
  }

  ctx.fillRect(gx, gy, selectedDef.width, selectedDef.height);
  ctx.strokeRect(gx, gy, selectedDef.width, selectedDef.height);

  // If Hologram Bluff (PHANTOM): draw small 'P' marker only for GM
  if (selectedDef.id === 'PHANTOM') {
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#00ff66';
    ctx.textAlign = 'center';
    ctx.fillText('P', gx + selectedDef.width / 2, gy + selectedDef.height - 4);
  }

  // Crosshair
  ctx.strokeStyle = canPlace ? '#00ff66' : '#ff0033';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx - 6, gy + selectedDef.height / 2);
  ctx.lineTo(gx + selectedDef.width + 6, gy + selectedDef.height / 2);
  ctx.moveTo(gx + selectedDef.width / 2, gy - 6);
  ctx.lineTo(gx + selectedDef.width / 2, gy + selectedDef.height + 6);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws Mini-Map Radar Bar at top of canvas in screen coordinates
 */
function drawMiniMapRadar(ctx) {
  const radarW = 460;
  const radarH = 10;
  const radarX = (CONFIG.CANVAS_WIDTH - radarW) / 2;
  const radarY = 8;

  const totalDist = GameState.gameMode === 'CAMPAIGN'
    ? GameState.finishPortal.x
    : Math.max(4000, GameState.hero.x + 1600);

  ctx.save();

  // Radar Background Track
  ctx.fillStyle = 'rgba(10, 15, 26, 0.85)';
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.fillRect(radarX, radarY, radarW, radarH);
  ctx.strokeRect(radarX, radarY, radarW, radarH);

  // Current Camera Viewport bracket on Radar
  const camStartPct = Math.max(0, Math.min(1, GameState.cameraX / totalDist));
  const camEndPct = Math.max(0, Math.min(1, (GameState.cameraX + CONFIG.CANVAS_WIDTH) / totalDist));
  ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
  ctx.fillRect(radarX + camStartPct * radarW, radarY, (camEndPct - camStartPct) * radarW, radarH);

  // Pacing Wall Marker (Red)
  const wallPct = Math.max(0, Math.min(1, GameState.pacingWall.x / totalDist));
  ctx.fillStyle = '#ff003c';
  ctx.fillRect(radarX + wallPct * radarW - 2, radarY - 2, 4, radarH + 4);

  // Traps markers (Yellow/Magenta tiny dots)
  ctx.fillStyle = '#f9f871';
  for (const trap of GameState.traps) {
    if (!trap.active) continue;
    const trapPct = Math.max(0, Math.min(1, trap.x / totalDist));
    ctx.fillRect(radarX + trapPct * radarW - 1, radarY + 2, 2, radarH - 4);
  }

  // Hero Marker (Cyan pulsing dot)
  const heroPct = Math.max(0, Math.min(1, GameState.hero.x / totalDist));
  ctx.fillStyle = COLORS.CYAN;
  ctx.shadowColor = COLORS.CYAN;
  ctx.shadowBlur = 6;
  ctx.fillRect(radarX + heroPct * radarW - 2, radarY - 3, 4, radarH + 6);

  // Finish Portal Marker (Gold)
  if (GameState.gameMode === 'CAMPAIGN') {
    ctx.fillStyle = COLORS.FINISH_GOLD;
    ctx.fillRect(radarX + radarW - 3, radarY - 2, 4, radarH + 4);
  }

  ctx.restore();
}

/**
 * Draws Tactical Slow-Mo screen-edge chromatic blur vignette
 */
function drawSlowMoVignette(ctx) {
  ctx.save();
  const grad = ctx.createRadialGradient(
    CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, 280,
    CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, 600
  );
  grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
  grad.addColorStop(1, 'rgba(0, 240, 255, 0.22)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  // Slow-Mo Fuel Meter at bottom center
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = COLORS.CYAN;
  ctx.textAlign = 'center';
  ctx.fillText(`SLOW-MO ACTIVE: ${Math.floor(GameState.gm.slowMoFuel)}%`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 90);
  ctx.restore();
}

/**
 * Draws Turn-Based Build Phase Notice Banner
 */
function drawTurnBasedBanner(ctx) {
  ctx.save();
  const bannerW = 480;
  const bannerH = 46;
  const bx = (CONFIG.CANVAS_WIDTH - bannerW) / 2;
  const by = 80;

  ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
  ctx.strokeStyle = COLORS.YELLOW;
  ctx.lineWidth = 1.5;
  ctx.fillRect(bx, by, bannerW, bannerH);
  ctx.strokeRect(bx, by, bannerW, bannerH);

  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = COLORS.YELLOW;
  ctx.textAlign = 'center';
  const remainingSecs = Math.ceil(GameState.buildTimer / 60);
  ctx.fillText(`ARCHITECT BUILD PHASE // TIME REMAINING: ${remainingSecs}s`, CONFIG.CANVAS_WIDTH / 2, by + 18);

  ctx.font = '10px monospace';
  ctx.fillStyle = '#f0f6fc';
  ctx.fillText('Scroll mouse wheel / A & D to pan camera. Place traps with 150 NRG budget!', CONFIG.CANVAS_WIDTH / 2, by + 34);

  ctx.restore();
}

/**
 * Updates DOM HUD elements (HP hearts, stopwatch, energy bar, distances, buttons)
 */
export function updateDOMHUD() {
  if (typeof document === 'undefined') return;

  // 1. Hero HP Hearts
  const heart1 = document.getElementById('hpHeart1');
  const heart2 = document.getElementById('hpHeart2');
  const heart3 = document.getElementById('hpHeart3');
  const hp = GameState.hero.hp;

  if (heart1) heart1.className = `hp-heart ${hp >= 1 ? 'active' : 'inactive'}`;
  if (heart2) heart2.className = `hp-heart ${hp >= 2 ? 'active' : 'inactive'}`;
  if (heart3) heart3.className = `hp-heart ${hp >= 3 ? 'active' : 'inactive'}`;

  // Shield badge display if present
  let shieldBadge = document.getElementById('heroShieldBadge');
  if (!shieldBadge && heart3 && heart3.parentNode) {
    shieldBadge = document.createElement('span');
    shieldBadge.id = 'heroShieldBadge';
    shieldBadge.className = 'shield-badge';
    heart3.parentNode.appendChild(shieldBadge);
  }
  if (shieldBadge) {
    if (GameState.hero.shield > 0) {
      shieldBadge.style.display = 'inline-block';
      shieldBadge.textContent = `SHIELD x${GameState.hero.shield}`;
    } else {
      shieldBadge.style.display = 'none';
    }
  }

  // 2. Stopwatch Timer
  const domTimer = document.getElementById('hudTimer');
  if (domTimer) {
    const totalSeconds = GameState.frameCount / 60;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const tenths = Math.floor((totalSeconds * 10) % 10);
    domTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
  }

  // 3. Round Display & Distance Progress
  const domRound = document.getElementById('hudRound');
  if (domRound) {
    if (GameState.gameMode === 'ENDLESS') {
      domRound.textContent = `UNLIMITED RUN // BEST: ${Math.floor(GameState.endlessBestDistance)}m`;
    } else {
      domRound.textContent = `LEVEL ${GameState.currentLevel} (ROUND ${GameState.currentRound} / 2)`;
    }
  }

  const domDist = document.getElementById('hudDistance');
  if (domDist) {
    if (GameState.gameMode === 'ENDLESS') {
      domDist.textContent = `${Math.floor(GameState.hero.x)}m (Pacing Wall: ${Math.floor(GameState.pacingWall.x)}m)`;
    } else {
      const pct = Math.floor(Math.min(100, (GameState.hero.x / GameState.finishPortal.x) * 100));
      domDist.textContent = `${pct}% (${Math.floor(GameState.hero.x)} / ${GameState.finishPortal.x}m)`;
    }
  }

  // 4. GM Energy Bar & Text
  const energyFill = document.getElementById('energyBarFill');
  const energyText = document.getElementById('energyText');
  if (energyFill) {
    const pct = Math.max(0, Math.min(100, (GameState.gm.energy / CONFIG.GM.MAX_ENERGY) * 100));
    energyFill.style.width = `${pct}%`;
  }
  if (energyText) {
    energyText.textContent = `${Math.floor(GameState.gm.energy)} / ${CONFIG.GM.MAX_ENERGY}`;
  }

  // 5. Active Trap Buttons & Affordability
  Object.keys(CONFIG.TRAPS).forEach((key) => {
    const btn = document.getElementById(`trapBtn_${key}`);
    if (btn) {
      const def = CONFIG.TRAPS[key];
      const canAfford = GameState.gm.energy >= def.cost;

      if (!canAfford) {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }

      if (key === GameState.gm.selectedTrapKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });

  // 6. Role Badges
  const p1Role = GameState.currentRound === 1 ? 'P1: HERO' : 'P1: GM';
  const p2Role = GameState.currentRound === 1 ? 'P2: GM' : 'P2: HERO';
  const heroBadge = document.getElementById('heroRoleBadge');
  const gmBadge = document.getElementById('gmRoleBadge');

  if (heroBadge) heroBadge.textContent = GameState.currentRound === 1 ? p1Role : p2Role;
  if (gmBadge) gmBadge.textContent = GameState.currentRound === 1 ? p2Role : p1Role;
}
