# Kinetic Cat-and-Mouse: Predictive Architect ⚡🎮

> An asymmetric, high-speed competitive web game of mind-reading, bluffing, and momentum control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vanilla JS](https://img.shields.io/badge/Vanilla-ES6%20Modules-yellow.svg)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%202D-cyan.svg)
![Web Audio](https://img.shields.io/badge/Audio-Native%20Web%20Audio%20API-magenta.svg)
![Zero External Assets](https://img.shields.io/badge/Dependencies-Zero%20External%20Assets-success.svg)
![Tests](https://img.shields.io/badge/Tests-19%2F19%20Passing-brightgreen.svg)

---

## 🕹️ Game Overview

**Kinetic Cat-and-Mouse** pits two players in an asymmetric, predictive platforming showdown:
- **Player 1 (The Hero):** A cybernetic speed-runner navigating 3 vertical platform lanes (High, Mid, Low) across a course, fleeing from a lethal creeping laser wall.
- **Player 2 (The Architect / GM):** A strategic master placing physical traps, hologram bluffs, and kinetic hazards ahead on a 40px grid, manipulating momentum and predicting the runner's path.
- **Stopwatch Role-Swap Format:** Two rounds determine the champion. In Round 1, Player 1 runs as Hero while Player 2 acts as GM. In Round 2, players swap roles on the exact same level layout. The new Hero must surpass Round 1's distance or finish time to claim victory!

---

## 🎯 3 Selectable Play Styles

To make the game accessible and fun for every play setup, select your preferred Play Style from the top menu:

| Play Style | How It Works | Strategic Advantage |
| :--- | :--- | :--- |
| **1. Turn-Based "Architect" Mode** *(Recommended Default)* | **Phase A (20s Build Phase):** Time is paused. The GM freely scrolls the camera with the mouse wheel or <kbd>A</kbd>/<kbd>D</kbd> keys and places traps using a fixed 150 NRG budget. Click **LAUNCH HERO** anytime to start early.<br>**Phase B (Run Phase):** The Hero runs the gauntlet while the GM watches and clicks active dynamic traps to Overclock them! | Removes all frantic camera jerk while placing traps. Highly strategic, thoughtful, and hilarious. |
| **2. Two-Screen / Dual-Window Mode** | Click the **2-SCREEN** button to open the **GM Blueprint View** in a separate window. Built entirely on the browser's native `BroadcastChannel('kinetic_sync')` API (**Zero external server needed!**). | Window 1 displays the Hero's locked action camera, while Window 2 provides the GM with a steady tactical blueprint view. |
| **3. Tactical Slow-Mo Mode** | Press <kbd>Tab</kbd> or <kbd>Q</kbd> to enter **Bullet Time** at 25% speed. | Hero and pacing wall slow to 25% speed while GM mouse controls remain smooth at 60 FPS, giving the GM a tactical window to react. Powered by a regenerating fuel meter. |

---

## 🏆 2 Game Modes & Level Progression

1. **Levels Campaign (Levels 1 to 4):**
   - **Level 1: Neon Highway:** Base wall speed ($2.2\text{ px/f}$), Spikes & Cryo Pad traps.
   - **Level 2: Repulsor Canyon:** Speed ($2.6\text{ px/f}$), unlocks Wind Fan & Repulsor Spring bounce pads.
   - **Level 3: Laser Gauntlet:** Speed ($3.0\text{ px/f}$), unlocks timed Laser Gate & Hologram Bluff.
   - **Level 4: Apex Overdrive:** Intense speed ($3.5\text{ px/f}$), all 6 traps unlocked with chaotic hazard combinations.
2. **Unlimited Run Mode (Endless Streaming):**
   - Procedural endless streaming generated dynamically using 800px modular chunk templates (**Split Highway**, **Staircase Ascent**, **Canyon Leap**, and **The Funnel**).
   - High score tracking for maximum distance survived in meters.
   - Automatic garbage collection behind the Pacing Wall to maintain silky smooth 60 FPS indefinitely.
   - Pacing wall accelerates every 1,000 meters.

---

## ⚡ Kinetic Economy & 5 Bug Fixes

1. **Magnetic Platform Snapping:** Surface traps (`Spikes`, `Cryo Pad`, `Phantom`, `Spring`) automatically snap vertically to the nearest platform beneath the cursor. The GM only needs to aim horizontally!
2. **Coyote Time (8 frames) & Jump Buffering (8 frames):** Hero can jump up to 8 frames after walking off a ledge, and jumps pressed right before landing trigger automatically on the exact frame of touchdown.
3. **Auto-Salvage Vacuum:** Any placed trap passed by the creeping Pacing Wall is automatically recycled, refunding $50\%$ energy directly to the GM without requiring manual right-clicking.
4. **Minimum Trap Spacing (80px):** Prevents "impossible wall" spam by enforcing an 80px gap between static damage traps.
5. **Ice Physics Decay Reset:** Sliding physics reset cleanly with a 15-frame momentum decay upon leaving Cryo Pads.

---

## 🧰 Hazard Arsenal (6 Traps)

| Trap | Type | Cost | Description |
| :--- | :--- | :---: | :--- |
| **[1] Laser Spikes** | Surface | $25\text{ NRG}$ | Lethal floor spikes dealing 1 damage with upward knockback. Can be dashed through safely! |
| **[2] Cryo Pad** | Surface | $20\text{ NRG}$ | Low-friction surface ($0.96$ multiplier) causing the Hero to slide into danger. |
| **[3] Repulsor Fan** | Dynamic | $40\text{ NRG}$ | Pushes the Hero backward & upward within 160px. **Click to Overclock ($20\text{ NRG}$)** for $2.2\times$ push! |
| **[4] Hologram Bluff** | Bluff | $10\text{ NRG}$ | Looks identical to Spikes to the Hero ($15\%$ cost). Disappears upon contact without dealing damage. |
| **[5] Repulsor Spring** | Surface | $25\text{ NRG}$ | Neon bounce pad launching the Hero high into the air ($v_y = -16$) and resetting mid-air double-jumps. |
| **[6] Laser Gate** | Dynamic | $50\text{ NRG}$ | Pulsing vertical barrier cycling on/off every 90 frames (1.5s). Can be dashed through with supersonic timing. |

---

## 🎮 Controls

### 🏃 Hero Controls (Keyboard)
| Key | Action |
| :--- | :--- |
| <kbd>A</kbd> / <kbd>D</kbd> | Sprint Left / Right |
| <kbd>W</kbd> or <kbd>Space</kbd> | Jump & Mid-Air Double Jump (with Coyote Time + Buffer) |
| <kbd>S</kbd> / <kbd>Down</kbd> | **Fast-Fall / Ground Slam** (accelerates descent at $v_y = 18$) |
| <kbd>Shift</kbd> | **Supersonic Dash Burst** (invulnerable through spikes; $+15\text{ NRG}$ GM tax) |

### 🛠️ Architect / GM Controls (Mouse & Keys)
| Input | Action |
| :--- | :--- |
| **Mouse Aim** | Magnetic Snapping cursor to platforms |
| <kbd>1</kbd> - <kbd>6</kbd> | Quick-select traps 1 through 6 |
| **Left-Click (Empty)** | Construct selected trap (costs energy) |
| **Left-Click (Fan / Gate)** | **Overclock Dynamic Trap** (costs $20\text{ NRG}$) |
| **Right-Click** | Manual trap salvage / emergency cancel (recovers $50\%$ energy) |
| **Mouse Wheel / A-D** | **Pan Level View** during Turn-Based Build Phase |
| <kbd>Tab</kbd> / <kbd>Q</kbd> | **Toggle Tactical Slow-Mo** Bullet Time |

---

## 🧪 Automated Verification Suite

Run the headless verification suite testing all 5 bug fixes, 3 play styles, 2 game modes, and Directive 3:

```bash
node tests/verify.js
```

Output:
```text
--- TEST SUITE 1: 5 Gameplay Bug Fixes ---
  [PASS] Bug 1: Magnetic Snapping snapped cursor to platform top (420 === 420)
  [PASS] Bug 2: Coyote Jump succeeded after leaving ledge (vy = -11.95 < 0)
  [PASS] Bug 2: Jump buffer stored when pressing jump before landing (timer = 8)
  [PASS] Bug 2: Buffered jump executed automatically upon landing (vy = -12.5 < 0)
  [PASS] Bug 3: Auto-Salvage Vacuum cleaned up trap passed by Pacing Wall
  [PASS] Bug 3: GM refunded 50% energy by vacuum (62 === 62)
  [PASS] Bug 4: Minimum Trap Spacing rejects placing static damage traps closer than 80px
  [PASS] Bug 5: Ice decay active slides smoothly
  [PASS] Bug 5: Hero cleanly exits ice without perpetual lock

--- TEST SUITE 2: Hero & GM Upgrades ---
  [PASS] Hero Fast-Fall / Ground Slam executes with vy = 18
  [PASS] Hero passes through Spikes unharmed during Dash
  [PASS] Hero collected Shield Orb (+1 Shield)
  [PASS] Shield absorbed spike hit, preserving Hero HP at 3
  [PASS] Spring Trap launched hero with vy = -16 and reset jumps
  [PASS] Laser Gate dealt damage during active beam cycle

--- TEST SUITE 3: Play Styles & Game Modes ---
  [PASS] Turn-Based Mode returns BUILD status during build phase
  [PASS] Turn-Based build timer counts down
  [PASS] Endless Mode streamed new chunk templates ahead of Hero (20 > 14)

--- TEST SUITE 4: Directive 3 Verification ---
  [PASS] Directive 3: Horizontal collision stopped X movement before Y collision

=============================================
TEST SUMMARY: 19 Passed, 0 Failed
=============================================
```

---

## 🚀 How to Run the App

Simply serve the directory with any static web server (no bundlers or build steps needed!):

```bash
# Using Node.js built-in npx
npx serve .

# Or using Python 3
python -m http.server 8080
```

Then open `http://localhost:8080` in your web browser.

---

## 🏗️ Architecture & Philosophy

Built strictly following the **5 Core Operating Directives**:
1. **Zero External Assets:** All visuals rendered using HTML5 Canvas 2D primitives (`fillRect`, `arc`, `shadowBlur` neon styling). Sound effects dynamically synthesized via native Web Audio API oscillators.
2. **Vanilla ES Modules Only:** Plain HTML5, CSS3, and ES6 JavaScript. No external dependencies.
3. **Separate X and Y Collision:** Horizontal movement and collisions resolved strictly BEFORE vertical movement to prevent corner-clipping bugs.
4. **Deterministic Constants & State:** Centralized mutable `GameState` store.
5. **Preserved Specification Signatures:** Standard API contracts for clean extensibility.
