# Node Game — Multiplayer

This is a minimal Vite + Canvas + lil-gui prototype for the node game

## Run locally

```bash
cd node-game
npm install
npm run dev
```

Open the local URL Vite prints in the terminal.

## Build a production bundle

```bash
npm run build
npm run preview
```

## What changed in this step

- Moved from a single HTML sketch to a tiny modern dev setup
- Added a live browser control panel with lil-gui
- Added configurable segment trails with hold and fade timing
- Expanded movement, node, grid, and debug controls

## Main files

- `index.html`
- `src/main.js`
- `src/style.css`

## Notes

- The node remains locked to grid segments by only changing direction at intersections
- Pointer movement updates the desired target, and the node reroutes on the next intersection
- Touch works through pointer events, so mobile taps and drags should both work
