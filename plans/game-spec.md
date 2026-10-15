# Kinetic Cat-and-Mouse (Predictive Architect) - Master Specification

## 1. Overview
Kinetic Cat-and-Mouse is a high-speed asymmetric browser game of mind-reading, bluffing, and momentum control.
- **Hero (Player 1 in Round 1):** Keyboard controlled (`WASD` / `Space` + `Shift`). Platforming, double-jumping, dashing, avoiding hazards, staying ahead of the Pacing Wall.
- **Game Master / GM (Player 2 in Round 1):** Mouse controlled. Places traps on a 40x40 grid, manages energy, overclocks dynamic traps, and salvages traps behind the hero.
- **Stopwatch Role-Swap:** After Round 1, roles swap. In Round 2, the new Hero must beat Round 1's distance or finish time.

## 2. Strict Operating Directives (from AGENTS.md)
1. **Zero External Assets:** Render all entities using HTML5 Canvas 2D primitives (`fillRect`, `arc`, `beginPath`, `shadowBlur` neon styling) and synthesize sound effects using the native Web Audio API.
2. **Vanilla ES Modules Only:** Plain HTML5, CSS3, and Vanilla JavaScript (ES6 Modules). No external frameworks.
3. **Separate X and Y Collision:** Always resolve horizontal (X-axis) movement and collisions BEFORE vertical (Y-axis) movement and collisions.
4. **Sequential Stage Execution:** Implement only ONE Phase at a time. Verify syntax and imports before proceeding.
5. **Preserve Signatures:** Never rename exported constants, class names, or object keys defined in the Master Specification.

## 3. Architecture & File Topology
```text
kinetic-cat-and-mouse/
├── index.html          # Viewport, HUD overlay, and module entry point
├── style.css           # Neon cyber-grid styling and HUD layout
└── src/
    ├── config.js       # All physics constants, trap definitions, and colors
    ├── state.js        # Central mutable GameState object and reset logic
    ├── input.js        # Keyboard (Hero) + Mouse (Game Master) listeners
    ├── physics.js      # AABB collision, Hero movement, and Trap logic
    ├── renderer.js     # Canvas 2D drawing, camera transform, and UI overlays
    └── main.js         # 60 FPS requestAnimationFrame loop & Round Swap manager
```

## 4. Master Specification Reference
### A. Config (`src/config.js`)
- `CANVAS_WIDTH`: 1280, `CANVAS_HEIGHT`: 720, `GRID_SIZE`: 40, `LEVEL_WIDTH`: 4800, `LEVEL_HEIGHT`: 720
- `HERO`: `WIDTH: 28`, `HEIGHT: 36`, `MOVE_SPEED: 5.5`, `JUMP_FORCE: -12.5`, `DOUBLE_JUMP_FORCE: -10.5`, `GRAVITY: 0.55`, `MAX_FALL_SPEED: 14`, `DASH_SPEED: 14`, `DASH_DURATION_FRAMES: 10`, `DASH_COOLDOWN_FRAMES: 60`, `MAX_HP: 3`, `INVULNERABLE_FRAMES: 60`
- `GM`: `SAFE_ZONE_RADIUS: 220`, `START_ENERGY: 100`, `MAX_ENERGY: 200`, `PASSIVE_REGEN_PER_SEC: 8`, `DASH_TAX_BONUS: 15`, `SALVAGE_REFUND_RATE: 0.5`, `OVERCLOCK_COST: 20`, `WALL_BASE_SPEED: 2.2`
- `TRAPS`: `SPIKE` (cost 25), `ICE` (cost 20, friction 0.96), `WIND` (cost 40, pushForceX -3.5, pushForceY -4.0, range 160), `PHANTOM` (cost 10, bluff)

### B. State Architecture (`src/state.js`)
- `GameState`: `phase`, `currentRound`, `frameCount`, `cameraX`, `roundScores`, `hero`, `gm`, `pacingWall`, `platforms`, `traps`

### C. Mathematical & Mechanical Formulas
1. AABB overlap check.
2. Safe-zone placement formula: $D \ge 220$ from hero center to snapped grid cursor.
3. Camera tracking: `cameraX = Math.max(0, Math.min(LEVEL_WIDTH - CANVAS_WIDTH, hero.x - 380))`.
4. Salvage (right-click behind hero `trap.x < hero.x - 60`) & Overclock (left click on dynamic trap ahead, 20 energy, 180 frames).

## 5. Sequential Implementation Stages
- Phase 1: Scaffolding, HTML/CSS HUD, and Config
- Phase 2: Input Controller (Asymmetric Keyboard + Mouse)
- Phase 3: Hero Platforming Physics & Pacing Wall
- Phase 4: GM Trap Placement, Salvaging, and Hazard Collisions
- Phase 5: Neon Canvas Renderer & Visual Feedback
- Phase 6: Stopwatch Role-Swap Loop & Web Audio Synth
