/**
 * Kinetic Cat-and-Mouse: Predictive Architect
 * src/input.js - Asymmetric Keyboard (Hero), Mouse (GM), BroadcastChannel Two-Screen Sync,
 * Turn-Based Camera Panning, and Tactical Slow-Mo triggers.
 */

import { CONFIG } from './config.js';
import { GameState } from './state.js';

export const inputState = {
  // Hero Keyboard Controls
  left: false,
  right: false,
  down: false,
  downPressed: false,
  jump: false,
  jumpPressed: false,
  dashPressed: false,

  // GM Mouse Actions
  leftClick: false,
  rightClick: false,
  isInsideCanvas: false,
  isDraggingPan: false,
  dragStartX: 0,
  camStartX: 0
};

let boundCanvas = null;

// Hotkeys 1 through 6 for all 6 Traps
const TRAP_KEY_MAP = {
  Digit1: 'SPIKE',
  Digit2: 'ICE',
  Digit3: 'WIND',
  Digit4: 'PHANTOM',
  Digit5: 'SPRING',
  Digit6: 'LASER_GATE'
};

// Native Two-Screen BroadcastChannel synchronization
export const syncChannel = (typeof window !== 'undefined' && 'BroadcastChannel' in window)
  ? new BroadcastChannel('kinetic_sync')
  : null;

/**
 * Initializes Keyboard, Mouse, Wheel, and HUD listeners
 * @param {HTMLCanvasElement} canvas
 */
export function initInput(canvas) {
  boundCanvas = canvas;

  if (typeof window === 'undefined') return;

  // 1. Keyboard event listeners
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // 2. Mouse event listeners on canvas
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseenter', () => { inputState.isInsideCanvas = true; });
  canvas.addEventListener('mouseleave', () => { inputState.isInsideCanvas = false; });

  // 3. Mouse Wheel listener for camera panning in Turn-Based Build Phase
  canvas.addEventListener('wheel', handleMouseWheel, { passive: false });

  // 4. Prevent browser context menu on right click to allow trap salvaging
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // 5. Bind HUD Trap Selector Buttons
  Object.keys(CONFIG.TRAPS).forEach((trapKey) => {
    const btn = document.getElementById(`trapBtn_${trapKey}`);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setTrapSelection(trapKey);
      });
    }
  });

  // 6. Two-Screen Network Synchronization Listener
  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      handleSyncMessage(event.data);
    };

    // If opening as GM window, request full state snapshot from Hero authoritative window
    if (typeof window !== 'undefined' && window.location.search.includes('role=gm')) {
      syncChannel.postMessage({ type: 'REQUEST_SYNC' });
    }
  }
}

/**
 * Confirms the Architect build phase and launches the run simultaneously on both screens
 */
export function confirmBuildAndLaunch() {
  if (GameState.turnPhase !== 'BUILD') return;
  GameState.turnPhase = 'RUN';

  if (syncChannel) {
    syncChannel.postMessage({
      type: 'CONFIRM_BUILD',
      senderRole: (typeof window !== 'undefined' && window.location.search.includes('role=gm')) ? 'gm' : 'hero'
    });
  }

  if (typeof document !== 'undefined') {
    const heroWaiting = document.getElementById('heroWaitingOverlay');
    if (heroWaiting) heroWaiting.classList.add('hidden');
    const architectBar = document.getElementById('architectBuildBar');
    if (architectBar) architectBar.style.display = 'none';
    const launchBar = document.getElementById('turnBasedLaunchBar');
    if (launchBar) launchBar.style.display = 'none';
  }
}

/**
 * Handles incoming BroadcastChannel synchronization messages
 */
function handleSyncMessage(data) {
  if (!data) return;

  if (data.type === 'CONFIRM_BUILD') {
    GameState.turnPhase = 'RUN';
    if (typeof document !== 'undefined') {
      const heroWaiting = document.getElementById('heroWaitingOverlay');
      if (heroWaiting) heroWaiting.classList.add('hidden');
      const architectBar = document.getElementById('architectBuildBar');
      if (architectBar) architectBar.style.display = 'none';
      const launchBar = document.getElementById('turnBasedLaunchBar');
      if (launchBar) launchBar.style.display = 'none';
    }
  } else if (data.type === 'REQUEST_SYNC') {
    // Authoritative Hero window marks two-screen connected and sends complete level and match data
    GameState.twoScreenConnected = true;
    if (syncChannel && typeof window !== 'undefined' && !window.location.search.includes('role=gm')) {
      syncChannel.postMessage({
        type: 'FULL_SYNC',
        platforms: GameState.platforms,
        pickups: GameState.pickups,
        traps: GameState.traps,
        finishPortal: GameState.finishPortal,
        currentLevel: GameState.currentLevel,
        currentRound: GameState.currentRound,
        gameMode: GameState.gameMode,
        playStyle: GameState.playStyle,
        turnPhase: GameState.turnPhase,
        energy: GameState.gm.energy,
        pacingWall: GameState.pacingWall,
        hero: GameState.hero,
        roundScores: GameState.roundScores
      });
    }
  } else if (data.type === 'FULL_SYNC') {
    // GM window receives complete level data
    if (typeof window !== 'undefined' && window.location.search.includes('role=gm')) {
      if (data.platforms && data.platforms.length > 0) GameState.platforms = data.platforms;
      if (data.pickups) GameState.pickups = data.pickups;
      if (data.traps) GameState.traps = data.traps;
      if (data.finishPortal) GameState.finishPortal = data.finishPortal;
      if (data.currentLevel) GameState.currentLevel = data.currentLevel;
      if (data.currentRound) GameState.currentRound = data.currentRound;
      if (data.gameMode) GameState.gameMode = data.gameMode;
      if (data.playStyle) GameState.playStyle = data.playStyle;
      if (data.turnPhase) GameState.turnPhase = data.turnPhase;
      if (data.energy !== undefined) GameState.gm.energy = data.energy;
      if (data.pacingWall) GameState.pacingWall = data.pacingWall;
      if (data.hero) Object.assign(GameState.hero, data.hero);
      if (data.roundScores) GameState.roundScores = data.roundScores;
    }
  } else if (data.type === 'GM_ACTION') {
    // Action from GM window executed in Hero authoritative window
    if (data.action === 'SELECT_TRAP') {
      setTrapSelection(data.trapKey);
    } else if (data.action === 'PLACE_TRAP') {
      GameState.gm.worldMouseX = data.x;
      GameState.gm.worldMouseY = data.y;
      GameState.gm.snapY = data.snapY !== undefined ? data.snapY : data.y;
      inputState.leftClick = true;
    } else if (data.action === 'SALVAGE') {
      GameState.gm.worldMouseX = data.x;
      GameState.gm.worldMouseY = data.y;
      inputState.rightClick = true;
    } else if (data.action === 'TOGGLE_SLOWMO') {
      GameState.gm.slowMoActive = data.active;
    }
  } else if (data.type === 'STATE_SNAPSHOT') {
    // GM window receives live state snapshot from Hero window
    if (typeof window !== 'undefined' && window.location.search.includes('role=gm')) {
      GameState.hero.x = data.heroX;
      GameState.hero.y = data.heroY;
      GameState.hero.hp = data.heroHp;
      GameState.hero.shield = data.heroShield;
      GameState.hero.facing = data.heroFacing !== undefined ? data.heroFacing : 1;
      GameState.hero.dashTimer = data.heroDashTimer || 0;
      GameState.hero.isGrounded = data.heroIsGrounded || false;
      GameState.pacingWall.x = data.wallX;
      GameState.gm.energy = data.energy;
      GameState.traps = data.traps || [];
      GameState.frameCount = data.frameCount;
      if (data.turnPhase) GameState.turnPhase = data.turnPhase;
      if (data.phase) GameState.phase = data.phase;
    }
  } else if (data.type === 'ROUND_OVER') {
    if (typeof window !== 'undefined' && window.location.search.includes('role=gm')) {
      if (data.heroX !== undefined) GameState.hero.x = data.heroX;
      if (data.frameCount !== undefined) GameState.frameCount = data.frameCount;
      if (onSyncRoundOver) onSyncRoundOver(data.reason);
    }
  } else if (data.type === 'RESTART_ROUND') {
    if (typeof window !== 'undefined' && window.location.search.includes('role=gm')) {
      GameState.turnPhase = 'BUILD';
      GameState.traps = [];
    }
  }
}

let onSyncRoundOver = null;
export function setSyncRoundOverCallback(cb) {
  onSyncRoundOver = cb;
}

/**
 * Sets the selected GM trap and updates HUD button highlights
 * @param {string} trapKey
 */
export function setTrapSelection(trapKey) {
  if (CONFIG.TRAPS[trapKey]) {
    GameState.gm.selectedTrapKey = trapKey;
    updateTrapButtonUI();

    // Broadcast if GM in two-screen mode
    if (syncChannel && typeof window !== 'undefined' && window.location.search.includes('role=gm')) {
      syncChannel.postMessage({ type: 'GM_ACTION', action: 'SELECT_TRAP', trapKey });
    }
  }
}

/**
 * Updates UI active state of trap selector buttons
 */
export function updateTrapButtonUI() {
  if (typeof document === 'undefined') return;

  Object.keys(CONFIG.TRAPS).forEach((key) => {
    const btn = document.getElementById(`trapBtn_${key}`);
    if (btn) {
      if (key === GameState.gm.selectedTrapKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

function handleKeyDown(e) {
  // Prevent browser scrolling for movement keys & Tab
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
    e.preventDefault();
  }

  // Tactical Slow-Mo Toggle (Tab or KeyQ)
  if (e.code === 'Tab' || e.code === 'KeyQ') {
    if (GameState.playStyle === 'SLOW_MO') {
      GameState.gm.slowMoActive = !GameState.gm.slowMoActive;
      if (syncChannel) {
        syncChannel.postMessage({
          type: 'GM_ACTION',
          action: 'TOGGLE_SLOWMO',
          active: GameState.gm.slowMoActive
        });
      }
    }
  }

  // Turn-Based BUILD phase: Hero controls are completely locked; GM camera panning & launch trigger
  if (GameState.playStyle === 'TURN_BASED' && GameState.turnPhase === 'BUILD') {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      GameState.cameraX = Math.max(0, GameState.cameraX - 60);
      return;
    }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      const maxCam = CONFIG.LEVEL_WIDTH - CONFIG.CANVAS_WIDTH;
      GameState.cameraX = Math.min(maxCam, GameState.cameraX + 60);
      return;
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      confirmBuildAndLaunch();
      return;
    }
    // Allow trap selection keys 1-6 during build phase
    if (TRAP_KEY_MAP[e.code]) {
      setTrapSelection(TRAP_KEY_MAP[e.code]);
      return;
    }
    // Block all other keys from moving the Hero during build phase
    return;
  }

  // Hero Controls
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
    inputState.left = true;
  }
  if (e.code === 'KeyD' || e.code === 'ArrowRight') {
    inputState.right = true;
  }
  if (e.code === 'KeyS' || e.code === 'ArrowDown') {
    inputState.down = true;
    inputState.downPressed = true;
  }
  if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
    if (!inputState.jump) {
      inputState.jumpPressed = true;
    }
    inputState.jump = true;
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    inputState.dashPressed = true;
  }

  // GM Trap Selector Hotkeys (1-6)
  if (TRAP_KEY_MAP[e.code]) {
    setTrapSelection(TRAP_KEY_MAP[e.code]);
  }
}

function handleKeyUp(e) {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
    inputState.left = false;
  }
  if (e.code === 'KeyD' || e.code === 'ArrowRight') {
    inputState.right = false;
  }
  if (e.code === 'KeyS' || e.code === 'ArrowDown') {
    inputState.down = false;
  }
  if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
    inputState.jump = false;
  }
}

function handleMouseMove(e) {
  updateMouseCoordinates(e.clientX, e.clientY);

  // Turn-Based camera dragging with middle mouse or left click pan
  if (inputState.isDraggingPan) {
    const dx = e.clientX - inputState.dragStartX;
    const maxCam = CONFIG.LEVEL_WIDTH - CONFIG.CANVAS_WIDTH;
    GameState.cameraX = Math.max(0, Math.min(maxCam, inputState.camStartX - dx));
  }
}

function handleMouseDown(e) {
  updateMouseCoordinates(e.clientX, e.clientY);

  if (e.button === 1 || (e.button === 0 && e.altKey)) {
    // Middle click or Alt+Left Click for camera dragging
    inputState.isDraggingPan = true;
    inputState.dragStartX = e.clientX;
    inputState.camStartX = GameState.cameraX;
    return;
  }

  if (e.button === 0) {
    // Left-click: place or overclock
    inputState.leftClick = true;

    if (syncChannel && typeof window !== 'undefined' && window.location.search.includes('role=gm')) {
      syncChannel.postMessage({
        type: 'GM_ACTION',
        action: 'PLACE_TRAP',
        x: GameState.gm.worldMouseX,
        y: GameState.gm.snapY || GameState.gm.worldMouseY
      });
    }
  } else if (e.button === 2) {
    // Right-click: salvage trap
    inputState.rightClick = true;

    if (syncChannel && typeof window !== 'undefined' && window.location.search.includes('role=gm')) {
      syncChannel.postMessage({
        type: 'GM_ACTION',
        action: 'SALVAGE',
        x: GameState.gm.worldMouseX,
        y: GameState.gm.worldMouseY
      });
    }
  }
}

function handleMouseUp(e) {
  if (e.button === 1 || e.button === 0) {
    inputState.isDraggingPan = false;
  }
}

function handleMouseWheel(e) {
  // Free scroll camera along level in Turn-Based Build phase
  if (GameState.playStyle === 'TURN_BASED' && GameState.turnPhase === 'BUILD') {
    e.preventDefault();
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    const maxCam = CONFIG.LEVEL_WIDTH - CONFIG.CANVAS_WIDTH;
    GameState.cameraX = Math.max(0, Math.min(maxCam, GameState.cameraX + delta * 1.5));
  }
}

/**
 * Converts screen mouse coordinates to scaled canvas coordinates
 * and snaps to CONFIG.GRID_SIZE in world coordinates.
 */
export function updateMouseCoordinates(clientX, clientY) {
  if (!boundCanvas) return;
  const rect = boundCanvas.getBoundingClientRect();
  const scaleX = boundCanvas.width / rect.width;
  const scaleY = boundCanvas.height / rect.height;

  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;

  GameState.gm.mouseX = canvasX;
  GameState.gm.mouseY = canvasY;

  syncWorldMouse();
}

/**
 * Recalculates snapped world coordinates based on current GameState.cameraX
 */
export function syncWorldMouse() {
  const worldX = GameState.gm.mouseX + GameState.cameraX;
  const worldY = GameState.gm.mouseY;

  // Snap to 40px grid
  GameState.gm.worldMouseX = Math.floor(worldX / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
  GameState.gm.worldMouseY = Math.floor(worldY / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
}

/**
 * Resets single-frame impulse input flags at end of frame
 */
export function clearFrameInputs() {
  inputState.jumpPressed = false;
  inputState.dashPressed = false;
  inputState.downPressed = false;
  inputState.leftClick = false;
  inputState.rightClick = false;
}
