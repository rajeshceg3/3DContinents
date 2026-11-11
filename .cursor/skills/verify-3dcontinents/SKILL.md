# Verify 3DContinents
3D Continents - WebGL continent explorer (vite).
## Launch
`npm install`, then `npm run dev` or `npm run build && npm run preview`.
## Doctor
`python3 .cursor/skills/verify-3dcontinents/verify.py`
## Drive
Runs the vitest suites (9 tests), builds with vite, then renders the built app in headless Chromium (swiftshader WebGL) asserting boot and zero JS console errors.
## Evidence
`.cursor/skills/verify-3dcontinents/evidence.json`
## Cleanup
Static server terminated after the render.
## Known boundaries
Scene interaction quality unverified (render smoke only).
