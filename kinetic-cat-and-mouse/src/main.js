/**
 * Kinetic Cat-and-Mouse: Predictive Architect
 * src/main.js - 60 FPS Game Loop & Stopwatch Role-Swap Manager
 * Module entry point.
 */

import { CONFIG } from './config.js';
import { GameState, resetRound, resetMatch } from './state.js';
import { inputState, initInput, syncWorldMouse, clearFrameInputs } from './input.js';
import { updatePhysics } from './physics.js';
import { render, playSound } from './renderer.js';

let canvas = null;
let ctx = null;
let overlayTimeout = null;

// DOM Cached Elements
let domOverlay = null;
let domHeader = null;
let domTitle = null;
let domSubtitle = null;
let domStats = null;
let domActionBtn = null;

/**
 * Initializes the canvas, input listeners, HUD modal bindings, and starts the game loop
 */
function init() {
  canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas #gameCanvas not found!');
    return;
  }

  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;
  ctx = canvas.getContext('2d');

  // Cache modal overlay elements
  domOverlay = document.getElementById('actionOverlay');
  domHeader = document.getElementById('actionHeader');
  domTitle = document.getElementById('actionTitle');
  domSubtitle = document.getElementById('actionSubtitle');
  domStats = document.getElementById('actionStats');
  domActionBtn = document.getElementById('actionBtn');

  if (domActionBtn) {
    domActionBtn.addEventListener('click', handleActionClick);
  }

  // Keyboard shortcut (Space / Enter) to advance overlay modal
  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'Enter') && GameState.phase !== 'PLAYING') {
      handleActionClick();
    }
  });

  // Initialize Input System
  initInput(canvas);

  // Initialize Round 1
  resetRound(1);

  // Start 60 FPS requestAnimationFrame loop
  requestAnimationFrame(gameLoop);
}

/**
 * Core 60 FPS requestAnimationFrame loop
 */
function gameLoop() {
  // 1. Synchronize mouse world coordinates with camera position
  syncWorldMouse();

  // 2. State & Physics Update
  if (GameState.phase === 'PLAYING') {
    const physicsStatus = updatePhysics(inputState, playSound);

    // Instant Win Condition for Round 2:
    // If Round 1 Hero didn't finish, and Round 2 Hero surpasses Round 1's distance
    if (
      GameState.currentRound === 2 &&
      GameState.roundScores.round1Distance < GameState.finishPortal.x &&
      GameState.hero.x > GameState.roundScores.round1Distance &&
      GameState.hero.hp > 0
    ) {
      endRound('SURPASSED');
    } else if (physicsStatus === 'FINISHED') {
      endRound('FINISHED');
    } else if (physicsStatus === 'DIED') {
      endRound('ELIMINATED');
    }
  }

  // 3. Render Canvas & HUD
  render(ctx);

  // 4. Clear single-frame impulse inputs
  clearFrameInputs();

  // 5. Schedule next frame
  requestAnimationFrame(gameLoop);
}

/**
 * Formats frames (at 60 FPS) into MM:SS.s
 * @param {number} frames
 * @returns {string}
 */
function formatTime(frames) {
  const totalSeconds = frames / 60;
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds * 10) % 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

/**
 * Handles round conclusion and triggers Stopwatch Role-Swap / Match Winner
 * @param {'FINISHED'|'ELIMINATED'|'SURPASSED'} reason
 */
export function endRound(reason) {
  if (GameState.phase !== 'PLAYING') return;

  if (GameState.currentRound === 1) {
    // -----------------------------------------------------------------------
    // ROUND 1 COMPLETE -> PREPARE ROLE-SWAP
    // -----------------------------------------------------------------------
    GameState.phase = 'ROUND_OVER';
    GameState.roundScores.round1Distance = GameState.hero.x;
    GameState.roundScores.round1TimeFrames = GameState.frameCount;

    const distPct = Math.floor(
      Math.min(100, (GameState.roundScores.round1Distance / GameState.finishPortal.x) * 100)
    );
    const timeStr = formatTime(GameState.roundScores.round1TimeFrames);

    if (reason === 'FINISHED') {
      playSound('win');
    } else {
      playSound('hit');
    }

    if (domHeader) domHeader.textContent = 'STOPWATCH ROLE-SWAP';
    if (domTitle) domTitle.textContent = 'ROUND 1 COMPLETE';
    if (domSubtitle) domSubtitle.textContent = 'SWAP ROLES: PASS KEYBOARD & MOUSE!';
    if (domStats) {
      domStats.innerHTML = `
        <div><strong>P1 (Hero) Distance:</strong> ${Math.floor(GameState.roundScores.round1Distance)}m (${distPct}%)</div>
        <div><strong>P1 (Hero) Time:</strong> ${timeStr}</div>
        <div style="margin-top: 6px; color: #ffd700;"><strong>P2 Objective:</strong> Surpass ${Math.floor(GameState.roundScores.round1Distance)}m or beat ${timeStr}!</div>
      `;
    }
    if (domActionBtn) domActionBtn.textContent = 'START ROUND 2 (ROLE-SWAP)';
    showOverlay();

  } else {
    // -----------------------------------------------------------------------
    // ROUND 2 COMPLETE -> MATCH DECISION
    // -----------------------------------------------------------------------
    GameState.phase = 'MATCH_OVER';
    GameState.roundScores.round2Distance = GameState.hero.x;
    GameState.roundScores.round2TimeFrames = GameState.frameCount;

    const r1Dist = GameState.roundScores.round1Distance;
    const r1Time = GameState.roundScores.round1TimeFrames;
    const r2Dist = GameState.roundScores.round2Distance;
    const r2Time = GameState.roundScores.round2TimeFrames;

    let winner = 'PLAYER 1';
    let winReason = '';

    const p1Completed = r1Dist >= GameState.finishPortal.x;
    const p2Completed = r2Dist >= GameState.finishPortal.x || reason === 'FINISHED';

    if (reason === 'SURPASSED') {
      // P2 surpassed P1's death distance
      winner = 'PLAYER 2';
      winReason = `Player 2 surpassed Player 1's distance (${Math.floor(r2Dist)}m vs ${Math.floor(r1Dist)}m)!`;
    } else if (p1Completed && p2Completed) {
      // Both reached portal, lowest time wins
      if (r2Time < r1Time) {
        winner = 'PLAYER 2';
        winReason = `Player 2 reached extraction faster (${formatTime(r2Time)} vs ${formatTime(r1Time)})!`;
      } else if (r1Time < r2Time) {
        winner = 'PLAYER 1';
        winReason = `Player 1 reached extraction faster (${formatTime(r1Time)} vs ${formatTime(r2Time)})!`;
      } else {
        winner = 'DRAW';
        winReason = 'Exact time tie between both competitors!';
      }
    } else if (p1Completed && !p2Completed) {
      winner = 'PLAYER 1';
      winReason = 'Player 1 completed the course, while Player 2 was eliminated!';
    } else if (!p1Completed && p2Completed) {
      winner = 'PLAYER 2';
      winReason = 'Player 2 completed the course, while Player 1 was eliminated!';
    } else {
      // Neither completed
      if (r2Dist > r1Dist) {
        winner = 'PLAYER 2';
        winReason = `Player 2 traveled further (${Math.floor(r2Dist)}m vs ${Math.floor(r1Dist)}m)!`;
      } else {
        winner = 'PLAYER 1';
        winReason = `Player 1 traveled further (${Math.floor(r1Dist)}m vs ${Math.floor(r2Dist)}m)!`;
      }
    }

    playSound('win');

    if (domHeader) domHeader.textContent = 'MATCH RESULT';
    if (domTitle) domTitle.textContent = winner === 'DRAW' ? "IT'S A DRAW!" : `${winner} WINS!`;
    if (domSubtitle) domSubtitle.textContent = winReason;
    if (domStats) {
      domStats.innerHTML = `
        <div><strong>Round 1 (P1 Hero, P2 GM):</strong> ${Math.floor(r1Dist)}m in ${formatTime(r1Time)}</div>
        <div><strong>Round 2 (P2 Hero, P1 GM):</strong> ${Math.floor(r2Dist)}m in ${formatTime(r2Time)}</div>
      `;
    }
    if (domActionBtn) domActionBtn.textContent = 'PLAY NEW MATCH';
    showOverlay();
  }
}

function handleActionClick() {
  if (GameState.phase === 'ROUND_OVER') {
    hideOverlay();
    resetRound(2);
  } else if (GameState.phase === 'MATCH_OVER') {
    hideOverlay();
    resetMatch();
  }
}

function showOverlay() {
  if (domOverlay) {
    domOverlay.classList.remove('hidden');
  }
}

function hideOverlay() {
  if (domOverlay) {
    domOverlay.classList.add('hidden');
  }
}

// Bootstrap on DOMContentLoaded (in browser)
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
