

## Strict Operating Directives
1. **Zero External Assets:** Do NOT load external PNG, JPG, or MP3 files. Render all entities using HTML5 Canvas 2D primitives (`fillRect`, `arc`, `beginPath`, `shadowBlur` neon styling) and synthesize sound effects using the native Web Audio API.
2. **Vanilla ES Modules Only:** Use plain HTML5, CSS3, and Vanilla JavaScript (ES6 Modules). Do NOT install heavy game frameworks (no Phaser, no Three.js, no React) to prevent dependency conflicts.
3. **Separate X and Y Collision:** Always resolve horizontal (X-axis) movement and collisions BEFORE vertical (Y-axis) movement and collisions to prevent corner-clipping bugs.
4. **Sequential Stage Execution:** Implement only ONE Phase at a time. After completing a phase, verify syntax and imports before proceeding to the next phase.
5. **Preserve Signatures:** Never rename exported constants, class names, or object keys defined in the Master Specification.