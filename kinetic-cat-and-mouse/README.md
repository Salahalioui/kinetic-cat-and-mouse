# Kinetic Cat-and-Mouse: Predictive Architect ⚡🎮

> An asymmetric, high-speed competitive web game of mind-reading, bluffing, and momentum control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vanilla JS](https://img.shields.io/badge/Vanilla-ES6%20Modules-yellow.svg)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%202D-cyan.svg)
![Web Audio](https://img.shields.io/badge/Audio-Native%20Web%20Audio%20API-magenta.svg)
![Zero External Assets](https://img.shields.io/badge/Dependencies-Zero%20External%20Assets-success.svg)

---

## 🕹️ Game Overview

**Kinetic Cat-and-Mouse** pits two players in an asymmetric, predictive platforming showdown:
- **Player 1 (The Hero):** A cybernetic speed-runner navigating 3 vertical platform lanes across a 4,800m course, fleeing from a lethal creeping laser wall.
- **Player 2 (The Architect / GM):** A strategic master placing physical traps, hologram bluffs, and kinetic hazards ahead on a 40px grid, manipulating momentum and predicting the runner's path.
- **Stopwatch Role-Swap Format:** Two rounds determine the champion. In Round 1, Player 1 runs as Hero while Player 2 acts as GM. In Round 2, players swap roles on the exact same procedural level layout. The new Hero must surpass Round 1's distance or finish time to claim victory!

---

## ⚡ Kinetic Economy & Mechanics

### 1. The Anti-Spam "Safe Zone" Halo (220px)
The Architect cannot spam obstacles directly on top of the runner. A dynamic 220px radius halo surrounds the Hero at all times, forcing the Architect to look down the track and set up ambushes in advance.

### 2. The Pacing Wall
A towering, glowing red laser wall with sawtooth energy teeth advances at a constant pace from the left ($2.2\text{ px/frame}$). If the Hero hesitates or falls behind, they are instantly disintegrated.

### 3. Adrenaline Harvesting (Dash Tax)
Whenever the Hero performs a supersonic Dash Burst (`Shift`), the Architect absorbs the residual kinetic energy, gaining $+15\text{ NRG}$ instantly to construct hazards ahead.

### 4. Trap Salvaging (50% Refund)
Once the Hero runs safely past a static trap, it isn't wasted. The Architect can right-click any passed trap (`trap.x < hero.x - 60`) to recycle it and recover $50\%$ of its energy cost.

### 5. Hazard Categories & Overclocking
| Trap | Type | Cost | Properties |
| :--- | :--- | :---: | :--- |
| **Laser Spikes** | Static | $25\text{ NRG}$ | Lethal floor spikes dealing 1 damage with upward knockback. |
| **Cryo Pad** | Surface | $20\text{ NRG}$ | Low-friction surface ($0.96$ friction multiplier) that causes the Hero to slide into hazards. |
| **Repulsor Fan** | Dynamic | $40\text{ NRG}$ | Repels the Hero backward and upward within a 160px beam. **Can be Overclocked:** Left-clicking an active fan ahead of the Hero costs $20\text{ NRG}$ and doubles its thrust for 3 seconds! |
| **Hologram Bluff** | Bluff | $10\text{ NRG}$ | Appears visually identical to Laser Spikes to the Hero, but deals $0$ damage and flickers away upon contact. Forces panic jumps and suboptimal routes. |

---

## 🎮 Controls

### 🏃 Hero Controls (Keyboard)
| Key | Action |
| :--- | :--- |
| <kbd>A</kbd> / <kbd>D</kbd> | Sprint Left / Right |
| <kbd>W</kbd> or <kbd>Space</kbd> | Jump & Mid-Air Double Jump |
| <kbd>Shift</kbd> | Supersonic Dash Burst ($+15\text{ NRG}$ Architect Tax) |

### 🛠️ Architect / GM Controls (Mouse & Keys)
| Input | Action |
| :--- | :--- |
| **Mouse Hover** | Aim 40px grid snapped cursor |
| <kbd>1</kbd> - <kbd>4</kbd> | Select Trap: `[1] Spikes`, `[2] Ice`, `[3] Fan`, `[4] Bluff` |
| **Left-Click (Empty Grid)** | Construct selected trap (costs energy) |
| **Left-Click (Active Fan)** | **Overclock Repulsor Fan** (costs $20\text{ NRG}$, doubles push force for 3s) |
| **Right-Click (Passed Trap)** | **Salvage Trap** behind Hero (recovers $50\%$ energy) |

---

## 🏗️ Architecture & Philosophy

Built strictly following the **5 Core Operating Directives**:
1. **Zero External Assets:** All visuals are procedural HTML5 Canvas 2D primitives (`fillRect`, `arc`, `shadowBlur` neon glow, `clipPath`). All sound effects (`jump`, `dash`, `placeTrap`, `hit`, `win`) are synthesized in real-time using native `AudioContext` oscillators.
2. **Vanilla ES Modules Only:** No React, Phaser, Three.js, or external runtime dependencies.
3. **Separate X and Y Collision:** Horizontal movement and collisions are strictly resolved BEFORE vertical movement to prevent corner-clipping.
4. **Deterministic Constants & State:** Flat 8-file structure keeping all state mutable through a single centralized `GameState` store.
5. **Preserved Specification Signatures:** Standard API contracts for clean extensibility.

### Directory Topology
```text
kinetic-cat-and-mouse/
├── index.html          # Viewport, HUD overlay, and module entry point
├── style.css           # Neon cyber-grid styling and HUD layout
└── src/
    ├── config.js       # Physics constants, trap schemas, and palette
    ├── state.js        # Central mutable GameState object and procedural level generator
    ├── input.js        # Keyboard (Hero) + Mouse (Architect) listeners & 40px grid snapping
    ├── physics.js      # AABB collision, Hero movement, and Trap logic
    ├── renderer.js     # Canvas 2D drawing, camera transform, and Web Audio synthesizer
    └── main.js         # 60 FPS requestAnimationFrame loop & Stopwatch role-swap manager
```

---

## 🚀 Getting Started

Simply clone and serve with any static web server:

```bash
# Clone the repository
git clone https://github.com/Salahalioui/kinetic-cat-and-mouse.git

# Enter project directory
cd kinetic-cat-and-mouse

# Start any local HTTP server (e.g., with npx serve or Python)
npx serve .
# Or:
python -m http.server 8080
```

Open `http://localhost:8080` in your web browser and start the match!

---

## 📜 License
MIT © [Salah Alioui](https://github.com/Salahalioui)
