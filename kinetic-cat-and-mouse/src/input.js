/**
 * Kinetic Cat-and-Mouse: Predictive Architect
 * src/input.js - Asymmetric Keyboard (Hero) & Mouse (Game Master) Input Controller
 */

import { CONFIG } from './config.js';
import { GameState } from './state.js';

export const inputState = {
  // Hero Keyboard Controls
  left: false,
  right: false,
  jump: false,
  jumpPressed: false,
  dashPressed: false,

  // GM Mouse Actions
  leftClick: false,
  rightClick: false,
  isInsideCanvas: false
};

let boundCanvas = null;

const TRAP_KEY_MAP = {
  Digit1: 'SPIKE',
  Digit2: 'ICE',
  Digit3: 'WIND',
  Digit4: 'PHANTOM'
};

/**
 * Initializes Keyboard, Mouse, and HUD listeners
 * @param {HTMLCanvasElement} canvas
 */
export function initInput(canvas) {
  boundCanvas = canvas;

  // 1. Keyboard event listeners
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // 2. Mouse event listeners on canvas
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mouseenter', () => { inputState.isInsideCanvas = true; });
  canvas.addEventListener('mouseleave', () => { inputState.isInsideCanvas = false; });

  // 3. Prevent browser context menu on right click to allow trap salvaging
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // 4. Bind HUD Trap Selector Buttons
  Object.keys(CONFIG.TRAPS).forEach((trapKey) => {
    const btn = document.getElementById(`trapBtn_${trapKey}`);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setTrapSelection(trapKey);
      });
    }
  });
}

/**
 * Sets the selected GM trap and updates HUD button highlights
 * @param {string} trapKey
 */
export function setTrapSelection(trapKey) {
  if (CONFIG.TRAPS[trapKey]) {
    GameState.gm.selectedTrapKey = trapKey;
    updateTrapButtonUI();
  }
}

/**
 * Updates UI active state of trap selector buttons
 */
export function updateTrapButtonUI() {
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
  // Prevent browser scrolling for movement keys
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }

  // Hero Controls
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
    inputState.left = true;
  }
  if (e.code === 'KeyD' || e.code === 'ArrowRight') {
    inputState.right = true;
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

  // GM Trap Selector Hotkeys (1, 2, 3, 4)
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
  if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
    inputState.jump = false;
  }
}

function handleMouseMove(e) {
  updateMouseCoordinates(e.clientX, e.clientY);
}

function handleMouseDown(e) {
  updateMouseCoordinates(e.clientX, e.clientY);
  if (e.button === 0) {
    // Left-click: place or overclock
    inputState.leftClick = true;
  } else if (e.button === 2) {
    // Right-click: salvage trap
    inputState.rightClick = true;
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
  inputState.leftClick = false;
  inputState.rightClick = false;
}
