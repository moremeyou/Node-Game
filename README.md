# Node-Game Prototype

Multiplayer teaser prototype built around a shared fixed grid, world-anchored hidden image, and cooperative node-driven cell reveal.

Built with:
- Vite
- vanilla JavaScript
- Canvas 2D
- lil-gui
- a lightweight WebSocket server for multiplayer rooms

## Current model

Players move nodes along Manhattan paths between fixed grid intersections. The room/image space is canonical and shared. The browser is a viewport onto that room.

The current reveal mechanic is now primarily **node-driven cell energy**, not edge-enclosure driven:
- nodes charge nearby cells
- outer rings receive less charge based on ring falloff
- cells decay continuously when not reinforced
- cells only lock/hold after reaching `100%`
- co-op can buff charge, ring spread, decay, and hold timing

Trails still exist visually as feedback, but they are now local/client-side visuals rather than a separate shared reveal mechanic.

## Current features

- fullscreen grid-based interaction
- desktop mouse and mobile tap input
- canonical room/world metadata from the server
- world-to-screen viewport rendering
- base grid rendering beyond the fixed image/reveal room
- node movement beyond the image/reveal bounds
- world-anchored reveal image with configurable vignette
- local-only NPC helpers for co-op tuning
- node-driven cell energy reveal with lock/decay behavior
- linked lock fade option for connected held cells
- active edge glow/trails as visual feedback
- auto-matched multiplayer rooms
- max 5 players per room
- lil-gui controls with hover/tap help descriptions
- config copy/paste for fast tuning snapshots
- page title includes version plus Vite build timestamp

## Project structure

- `src/main.js` - frontend app logic, rendering, GUI, local reveal model
- `server.cjs` - multiplayer WebSocket server
- `public/teaser-hidden.jpg` - hidden reveal image
- `vite.config.js` - lightweight Vite config including build timestamp define
- `package.json` - scripts and dependencies

## Install

From the project root:

```bash
npm install
```

## Running the project

Open two terminals from the project root.

### Server

```bash
node server.cjs
```

Optional watch mode:

```bash
node --watch server.cjs
```

### Frontend

```bash
npm run dev -- --host
```

The frontend runs at:

```text
http://localhost:5173
```

The frontend page should connect to the websocket server on port `8080`.

## LAN testing

To test with other devices on the same network:

1. Start `server.cjs`
2. Start the Vite frontend
3. Find your machine's IP address
4. Other devices open:

```text
http://YOUR-IP:5173
```

Important:
- the browser URL is `5173`
- the websocket server still needs to be reachable on `8080`
- everyone must be on the same LAN / Wi-Fi
- firewall rules may need to allow Node on the private network

## Hidden image

The reveal image lives at:

```text
public/teaser-hidden.jpg
```

If that file is missing or fails to load, the reveal source will fall back.

## lil-gui controls

The current GUI includes controls for:
- background and grid
- movement and node visuals
- trail visuals
- reveal image placement and vignette
- cell energy behavior
- co-op buff behavior
- NPC count
- debug overlays
- network status
- config copy/paste

Current testing defaults keep these sections open:
- `Buffs`
- `NPCs`
- `Cell Energy`
- `Debug`

The GUI also includes a floating help tooltip for all current non-Network / non-Utilities properties.

Recommended collaborative image defaults:
- `Image Fit` = `native`
- `Image Scale` = `1`
- `Image Offset X` = `0`
- `Image Offset Y` = `0`

## Status

- Canonical room/world pass is in place.
  - the server sends fixed room/world metadata
  - clients render the same fixed room through a viewport transform
  - the visual grid can extend beyond the image room
  - node movement can continue beyond the image area
  - the reveal image is world-anchored and vignetted at the edges
- The reveal mechanic has moved away from edge-enclosure hold logic and into a more direct node/cell energy model.
- Local NPCs can now stand in for co-op partners during tuning and count toward local co-op buffs.
- The title now shows `nodegame v<version> (<build timestamp>)` so it is easier to confirm the current frontend build.

Known mobile browser note:
- Safari mobile landscape can render the full available width.
- Chrome mobile landscape may reserve non-drawable side areas in a normal tab even when the canvas fills Chrome's reported viewport.

## Near-term direction

- tune the cell energy model:
  - base charge
  - ring falloff / floor / count
  - decay timing
  - lock hold timing
  - linked fade behavior
- continue testing how co-op should change the feel:
  - charge
  - spread
  - decay
  - hold
  - pulse / glow feedback
- keep validating that the cell-energy model is strong enough without bringing enclosure logic back

## Later direction

- once the mechanic feels right, move the important reveal/cell state toward server ownership
- tighten server authority, validation, and anti-spam hardening after the mechanic settles
