/**
 * Kinetic Cat-and-Mouse: Predictive Architect
 * src/main.js - 60 FPS Game Loop, Main Menu, Pause System, How To Play Guide,
 * Settings & Audio Controller, and Stopwatch Role-Swap Manager.
 */

import { CONFIG } from './config.js';
import { GameState, resetRound, resetMatch } from './state.js';
import { inputState, initInput, syncWorldMouse, clearFrameInputs, syncChannel, confirmBuildAndLaunch, setSyncRoundOverCallback } from './input.js';
import { updatePhysics, updateGM } from './physics.js';
import { render, playSound } from './renderer.js';

let canvas = null;
let ctx = null;
let slowMoStepCounter = 0;

// DOM Cached Elements
let domOverlay = null;
let domHeader = null;
let domTitle = null;
let domSubtitle = null;
let domStats = null;
let domActionBtn = null;
let domLaunchBtn = null;
let domConfirmLaunchBtn = null;
let domArchitectBuildBar = null;
let domHeroWaitingOverlay = null;

let domPlayStyleSelect = null;
let domGameModeSelect = null;
let domOpenGmWindowBtn = null;

// Modal Overlays
let domMainMenuOverlay = null;
let domPauseOverlay = null;
let domHowToPlayOverlay = null;
let domSettingsOverlay = null;

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

  // Cache DOM modal overlay elements
  domOverlay = document.getElementById('actionOverlay');
  domHeader = document.getElementById('actionHeader');
  domTitle = document.getElementById('actionTitle');
  domSubtitle = document.getElementById('actionSubtitle');
  domStats = document.getElementById('actionStats');
  domActionBtn = document.getElementById('actionBtn');
  domLaunchBtn = document.getElementById('launchHeroBtn');
  domConfirmLaunchBtn = document.getElementById('confirmLaunchBtn');
  domArchitectBuildBar = document.getElementById('architectBuildBar');
  domHeroWaitingOverlay = document.getElementById('heroWaitingOverlay');

  domPlayStyleSelect = document.getElementById('playStyleSelect');
  domGameModeSelect = document.getElementById('gameModeSelect');
  domOpenGmWindowBtn = document.getElementById('openGmWindowBtn');

  domMainMenuOverlay = document.getElementById('mainMenuOverlay');
  domPauseOverlay = document.getElementById('pauseOverlay');
  domHowToPlayOverlay = document.getElementById('howToPlayOverlay');
  domSettingsOverlay = document.getElementById('settingsOverlay');

  // Setup Button Event Listeners
  setupEventListeners();

  // Initialize Input System
  initInput(canvas);

  // Check URL parameters for role (?role=gm)
  if (typeof window !== 'undefined' && window.location.search.includes('role=gm')) {
    GameState.twoScreenConnected = true;
    document.body.classList.add('role-gm');
    document.title = 'Kinetic Cat-and-Mouse // GM Blueprint View';
  }

  // Initialize Round 1 on Level 1
  GameState.initLevel(1);
  resetRound(1);

  // Register Round Over sync callback
  setSyncRoundOverCallback(endRound);

  // Start 60 FPS requestAnimationFrame loop
  requestAnimationFrame(gameLoop);
}

/**
 * Wires up UI buttons for Main Menu, Pause, How To Play, and Settings
 */
function setupEventListeners() {
  if (domActionBtn) {
    domActionBtn.addEventListener('click', handleActionClick);
  }

  // Turn-Based Confirm & Launch Run Button
  if (domConfirmLaunchBtn) {
    domConfirmLaunchBtn.addEventListener('click', () => {
      confirmBuildAndLaunch();
      playSound('placeTrap');
    });
  }

  // Turn-Based Launch Hero Button (legacy ID support)
  if (domLaunchBtn) {
    domLaunchBtn.addEventListener('click', () => {
      confirmBuildAndLaunch();
      playSound('placeTrap');
    });
  }

  // HUD Top Navigation Buttons
  const hudMenuBtn = document.getElementById('hudMenuBtn');
  const hudPauseBtn = document.getElementById('hudPauseBtn');
  const hudGuideBtn = document.getElementById('hudGuideBtn');
  const hudSettingsBtn = document.getElementById('hudSettingsBtn');

  if (hudMenuBtn) hudMenuBtn.addEventListener('click', showMainMenu);
  if (hudPauseBtn) hudPauseBtn.addEventListener('click', togglePause);
  if (hudGuideBtn) hudGuideBtn.addEventListener('click', () => showHowToPlay('hero'));
  if (hudSettingsBtn) hudSettingsBtn.addEventListener('click', showSettings);

  // Play Style Switcher
  if (domPlayStyleSelect) {
    domPlayStyleSelect.value = GameState.playStyle;
    domPlayStyleSelect.addEventListener('change', (e) => {
      GameState.playStyle = e.target.value;
      resetRound(GameState.currentRound);
    });
  }

  // Game Mode Switcher
  if (domGameModeSelect) {
    domGameModeSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'ENDLESS') {
        GameState.initLevel('ENDLESS');
      } else if (val.startsWith('CAMPAIGN_')) {
        const lvl = parseInt(val.split('_')[1], 10);
        GameState.initLevel(lvl);
      }
      resetRound(1);
    });
  }

  // Two-Screen Window Opener
  if (domOpenGmWindowBtn) {
    domOpenGmWindowBtn.addEventListener('click', openGmWindow);
  }

  // Main Menu Buttons
  const menuBtnPlayCampaign = document.getElementById('menuBtnPlayCampaign');
  const menuBtnPlayEndless = document.getElementById('menuBtnPlayEndless');
  const menuBtnHowToPlay = document.getElementById('menuBtnHowToPlay');
  const menuBtnSettings = document.getElementById('menuBtnSettings');
  const menuBtnTwoScreen = document.getElementById('menuBtnTwoScreen');

  if (menuBtnPlayCampaign) {
    menuBtnPlayCampaign.addEventListener('click', () => {
      hideMainMenu();
      GameState.initLevel(1);
      if (domGameModeSelect) domGameModeSelect.value = 'CAMPAIGN_1';
      resetRound(1);
    });
  }

  if (menuBtnPlayEndless) {
    menuBtnPlayEndless.addEventListener('click', () => {
      hideMainMenu();
      GameState.initLevel('ENDLESS');
      if (domGameModeSelect) domGameModeSelect.value = 'ENDLESS';
      resetRound(1);
    });
  }

  if (menuBtnHowToPlay) menuBtnHowToPlay.addEventListener('click', () => showHowToPlay('hero'));
  if (menuBtnSettings) menuBtnSettings.addEventListener('click', showSettings);
  if (menuBtnTwoScreen) menuBtnTwoScreen.addEventListener('click', openGmWindow);

  // Pause Menu Buttons
  const pauseBtnResume = document.getElementById('pauseBtnResume');
  const pauseBtnRestart = document.getElementById('pauseBtnRestart');
  const pauseBtnHowToPlay = document.getElementById('pauseBtnHowToPlay');
  const pauseBtnSettings = document.getElementById('pauseBtnSettings');
  const pauseBtnQuitMenu = document.getElementById('pauseBtnQuitMenu');

  if (pauseBtnResume) pauseBtnResume.addEventListener('click', togglePause);
  if (pauseBtnRestart) {
    pauseBtnRestart.addEventListener('click', () => {
      togglePause();
      resetRound(GameState.currentRound);
      if (syncChannel) syncChannel.postMessage({ type: 'RESTART_ROUND', roundNumber: GameState.currentRound });
    });
  }
  if (pauseBtnHowToPlay) pauseBtnHowToPlay.addEventListener('click', () => showHowToPlay('hero'));
  if (pauseBtnSettings) pauseBtnSettings.addEventListener('click', showSettings);
  if (pauseBtnQuitMenu) {
    pauseBtnQuitMenu.addEventListener('click', () => {
      togglePause();
      showMainMenu();
    });
  }

  // How To Play Tab Buttons
  const tabBtnHero = document.getElementById('tabBtnHero');
  const tabBtnArchitect = document.getElementById('tabBtnArchitect');
  const tabBtnRules = document.getElementById('tabBtnRules');
  const howToPlayCloseBtn = document.getElementById('howToPlayCloseBtn');

  if (tabBtnHero) tabBtnHero.addEventListener('click', () => switchGuideTab('hero'));
  if (tabBtnArchitect) tabBtnArchitect.addEventListener('click', () => switchGuideTab('architect'));
  if (tabBtnRules) tabBtnRules.addEventListener('click', () => switchGuideTab('rules'));
  if (howToPlayCloseBtn) howToPlayCloseBtn.addEventListener('click', hideHowToPlay);

  // Settings Buttons & Sliders
  const settingAudioMuteBtn = document.getElementById('settingAudioMuteBtn');
  const settingVolume = document.getElementById('settingVolume');
  const settingVolumeVal = document.getElementById('settingVolumeVal');
  const settingPlayStyle = document.getElementById('settingPlayStyle');
  const settingsCloseBtn = document.getElementById('settingsCloseBtn');

  if (settingAudioMuteBtn) {
    settingAudioMuteBtn.addEventListener('click', () => {
      GameState.soundMuted = !GameState.soundMuted;
      settingAudioMuteBtn.textContent = GameState.soundMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO';
      if (!GameState.soundMuted) playSound('dash');
    });
  }

  if (settingVolume) {
    settingVolume.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value, 10);
      GameState.soundVolume = vol / 100;
      if (settingVolumeVal) settingVolumeVal.textContent = `${vol}%`;
    });
  }

  if (settingPlayStyle) {
    settingPlayStyle.value = GameState.playStyle;
    settingPlayStyle.addEventListener('change', (e) => {
      GameState.playStyle = e.target.value;
      if (domPlayStyleSelect) domPlayStyleSelect.value = e.target.value;
      resetRound(GameState.currentRound);
    });
  }

  if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', hideSettings);

  // Keyboard Shortcuts: ESC (Pause), P (Pause), R (Restart when paused)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (!domHowToPlayOverlay?.classList.contains('hidden')) {
        hideHowToPlay();
      } else if (!domSettingsOverlay?.classList.contains('hidden')) {
        hideSettings();
      } else if (!domMainMenuOverlay?.classList.contains('hidden')) {
        hideMainMenu();
      } else if (GameState.phase === 'PLAYING') {
        togglePause();
      }
    } else if (e.code === 'KeyR' && GameState.isPaused) {
      togglePause();
      resetRound(GameState.currentRound);
    } else if ((e.code === 'Space' || e.code === 'Enter') && GameState.phase !== 'PLAYING') {
      handleActionClick();
    }
  });
}

function openGmWindow() {
  GameState.twoScreenConnected = true;
  const url = window.location.origin + window.location.pathname + '?role=gm';
  window.open(url, '_blank', 'width=1280,height=720,menubar=no,toolbar=no');
}

export function togglePause() {
  GameState.isPaused = !GameState.isPaused;
  if (domPauseOverlay) {
    if (GameState.isPaused) {
      domPauseOverlay.classList.remove('hidden');
    } else {
      domPauseOverlay.classList.add('hidden');
    }
  }
}

export function showMainMenu() {
  GameState.isPaused = true;
  if (domMainMenuOverlay) domMainMenuOverlay.classList.remove('hidden');
}

export function hideMainMenu() {
  if (domPauseOverlay?.classList.contains('hidden')) {
    GameState.isPaused = false;
  }
  if (domMainMenuOverlay) domMainMenuOverlay.classList.add('hidden');
}

export function showHowToPlay(tab = 'hero') {
  GameState.isPaused = true;
  if (domHowToPlayOverlay) domHowToPlayOverlay.classList.remove('hidden');
  switchGuideTab(tab);
}

export function hideHowToPlay() {
  if (domPauseOverlay?.classList.contains('hidden') && domMainMenuOverlay?.classList.contains('hidden')) {
    GameState.isPaused = false;
  }
  if (domHowToPlayOverlay) domHowToPlayOverlay.classList.add('hidden');
}

export function switchGuideTab(tabName) {
  const tabs = ['hero', 'architect', 'rules'];
  tabs.forEach((t) => {
    const btn = document.getElementById(`tabBtn${capitalize(t)}`);
    const content = document.getElementById(`tabContent${capitalize(t)}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (content) content.classList.toggle('active', t === tabName);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function showSettings() {
  GameState.isPaused = true;
  if (domSettingsOverlay) domSettingsOverlay.classList.remove('hidden');
}

export function hideSettings() {
  if (domPauseOverlay?.classList.contains('hidden') && domMainMenuOverlay?.classList.contains('hidden')) {
    GameState.isPaused = false;
  }
  if (domSettingsOverlay) domSettingsOverlay.classList.add('hidden');
}

/**
 * Core 60 FPS requestAnimationFrame loop
 */
function gameLoop() {
  // 1. Synchronize mouse world coordinates with camera position
  syncWorldMouse();

  // 2. State & Physics Update (Frozen when paused)
  if (GameState.phase === 'PLAYING' && !GameState.isPaused) {
    const isGmRole = typeof window !== 'undefined' && window.location.search.includes('role=gm');

    if (isGmRole) {
      // In GM Blueprint View: GM places/salvages traps & pans camera
      updateGM(inputState, playSound);

      // Camera smoothly tracks Hero during RUN phase
      if (GameState.turnPhase === 'RUN') {
        const targetCamX = Math.max(0, GameState.hero.x - 280);
        const maxCam = CONFIG.LEVEL_WIDTH - CONFIG.CANVAS_WIDTH;
        GameState.cameraX += (Math.min(maxCam, targetCamX) - GameState.cameraX) * 0.1;
      }
    } else {
      let shouldStepPhysics = true;

      // Tactical Slow-Mo Bullet Time (25% speed)
      if (GameState.playStyle === 'SLOW_MO' && GameState.gm.slowMoActive) {
        slowMoStepCounter++;
        if (slowMoStepCounter % 4 !== 0) {
          shouldStepPhysics = false;
        }
      }

      if (shouldStepPhysics) {
        const physicsStatus = updatePhysics(inputState, playSound);

        // Instant Win Condition for Round 2 in Levels Mode:
        // If Round 1 Hero didn't finish, and Round 2 Hero surpasses Round 1's distance
        if (
          GameState.gameMode !== 'ENDLESS' &&
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
    }

    // Manage Turn-Based Launch & Standby Overlays
    const isTurnBasedBuild = GameState.playStyle === 'TURN_BASED' && GameState.turnPhase === 'BUILD';
    const isTwoScreen = GameState.twoScreenConnected || isGmRole;

    if (isTurnBasedBuild) {
      if (isGmRole) {
        // GM window: show architect build bar, hide hero waiting overlay
        if (domArchitectBuildBar) domArchitectBuildBar.style.display = 'flex';
        if (domHeroWaitingOverlay) domHeroWaitingOverlay.classList.add('hidden');
      } else if (isTwoScreen) {
        // Hero window in 2-screen mode: show waiting overlay, hide architect build bar
        if (domHeroWaitingOverlay) domHeroWaitingOverlay.classList.remove('hidden');
        if (domArchitectBuildBar) domArchitectBuildBar.style.display = 'none';
      } else {
        // Single-screen local turn-based mode: show architect build bar so GM can click confirm
        if (domArchitectBuildBar) domArchitectBuildBar.style.display = 'flex';
        if (domHeroWaitingOverlay) domHeroWaitingOverlay.classList.add('hidden');
      }
    } else {
      if (domArchitectBuildBar) domArchitectBuildBar.style.display = 'none';
      if (domHeroWaitingOverlay) domHeroWaitingOverlay.classList.add('hidden');
    }

    // 3. Two-Screen State Broadcast (Hero window streams state to GM window)
    if (
      syncChannel &&
      typeof window !== 'undefined' &&
      !isGmRole &&
      GameState.frameCount % 2 === 0
    ) {
      syncChannel.postMessage({
        type: 'STATE_SNAPSHOT',
        heroX: GameState.hero.x,
        heroY: GameState.hero.y,
        heroHp: GameState.hero.hp,
        heroShield: GameState.hero.shield,
        heroFacing: GameState.hero.facing,
        heroDashTimer: GameState.hero.dashTimer,
        heroIsGrounded: GameState.hero.isGrounded,
        wallX: GameState.pacingWall.x,
        energy: GameState.gm.energy,
        traps: GameState.traps,
        frameCount: GameState.frameCount,
        turnPhase: GameState.turnPhase,
        phase: GameState.phase
      });
    }
  }

  // 4. Render Canvas & HUD
  render(ctx);

  // 5. Clear single-frame impulse inputs
  clearFrameInputs();

  // 6. Schedule next frame
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
  if (GameState.isPaused) return;

  if (syncChannel && typeof window !== 'undefined' && !window.location.search.includes('role=gm')) {
    syncChannel.postMessage({
      type: 'ROUND_OVER',
      reason,
      heroX: GameState.hero.x,
      frameCount: GameState.frameCount
    });
  }

  // Endless Mode Game Over
  if (GameState.gameMode === 'ENDLESS') {
    GameState.phase = 'MATCH_OVER';
    playSound('hit');

    const dist = Math.floor(GameState.hero.x);
    if (dist > GameState.endlessBestDistance) {
      GameState.endlessBestDistance = dist;
    }

    if (domHeader) domHeader.textContent = 'UNLIMITED RUN CONCLUDED';
    if (domTitle) domTitle.textContent = `${dist} METERS`;
    if (domSubtitle) domSubtitle.textContent = `New Personal Record: ${GameState.endlessBestDistance}m`;
    if (domStats) {
      domStats.innerHTML = `
        <div><strong>Distance Traveled:</strong> ${dist}m</div>
        <div><strong>Survival Time:</strong> ${formatTime(GameState.frameCount)}</div>
        <div style="margin-top: 6px; color: #00ff88;"><strong>Best Run:</strong> ${GameState.endlessBestDistance}m</div>
      `;
    }
    if (domActionBtn) domActionBtn.textContent = 'RUN AGAIN';
    showOverlay();
    return;
  }

  // Levels Mode Round 1 & Round 2
  if (GameState.currentRound === 1) {
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
    if (domTitle) domTitle.textContent = reason === 'FINISHED' ? 'EXTRACTION DOOR REACHED!' : 'ROUND 1 COMPLETE';
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
      winner = 'PLAYER 2';
      winReason = `Player 2 surpassed Player 1's distance (${Math.floor(r2Dist)}m vs ${Math.floor(r1Dist)}m)!`;
    } else if (p1Completed && p2Completed) {
      if (r2Time < r1Time) {
        winner = 'PLAYER 2';
        winReason = `Player 2 extracted faster (${formatTime(r2Time)} vs ${formatTime(r1Time)})!`;
      } else if (r1Time < r2Time) {
        winner = 'PLAYER 1';
        winReason = `Player 1 extracted faster (${formatTime(r1Time)} vs ${formatTime(r2Time)})!`;
      } else {
        winner = 'DRAW';
        winReason = 'Exact time tie between both competitors!';
      }
    } else if (p1Completed && !p2Completed) {
      winner = 'PLAYER 1';
      winReason = 'Player 1 reached the Extraction Door, while Player 2 was eliminated!';
    } else if (!p1Completed && p2Completed) {
      winner = 'PLAYER 2';
      winReason = 'Player 2 reached the Extraction Door, while Player 1 was eliminated!';
    } else {
      if (r2Dist > r1Dist) {
        winner = 'PLAYER 2';
        winReason = `Player 2 traveled further (${Math.floor(r2Dist)}m vs ${Math.floor(r1Dist)}m)!`;
      } else {
        winner = 'PLAYER 1';
        winReason = `Player 1 traveled further (${Math.floor(r1Dist)}m vs ${Math.floor(r2Dist)}m)!`;
      }
    }

    playSound('win');

    if (domHeader) domHeader.textContent = `LEVEL ${GameState.currentLevel} COMPLETE`;
    if (domTitle) domTitle.textContent = winner === 'DRAW' ? "IT'S A DRAW!" : `${winner} WINS!`;
    if (domSubtitle) domSubtitle.textContent = winReason;
    if (domStats) {
      domStats.innerHTML = `
        <div><strong>Round 1 (P1 Hero, P2 GM):</strong> ${Math.floor(r1Dist)}m in ${formatTime(r1Time)}</div>
        <div><strong>Round 2 (P2 Hero, P1 GM):</strong> ${Math.floor(r2Dist)}m in ${formatTime(r2Time)}</div>
      `;
    }

    if (GameState.currentLevel < 4) {
      if (domActionBtn) domActionBtn.textContent = `PROCEED TO LEVEL ${GameState.currentLevel + 1}`;
    } else {
      if (domActionBtn) domActionBtn.textContent = 'PLAY NEW MATCH';
    }
    showOverlay();
  }
}

function handleActionClick() {
  if (GameState.phase === 'ROUND_OVER') {
    hideOverlay();
    resetRound(2);
    if (syncChannel) {
      syncChannel.postMessage({ type: 'RESTART_ROUND', roundNumber: 2 });
    }
  } else if (GameState.phase === 'MATCH_OVER') {
    hideOverlay();
    if (GameState.gameMode !== 'ENDLESS' && GameState.currentLevel < 4) {
      GameState.initLevel(GameState.currentLevel + 1);
      if (domGameModeSelect) domGameModeSelect.value = `CAMPAIGN_${GameState.currentLevel}`;
      resetRound(1);
      if (syncChannel) {
        syncChannel.postMessage({ type: 'RESTART_ROUND', roundNumber: 1 });
      }
    } else {
      resetMatch();
      if (syncChannel) {
        syncChannel.postMessage({ type: 'RESTART_ROUND', roundNumber: 1 });
      }
    }
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
