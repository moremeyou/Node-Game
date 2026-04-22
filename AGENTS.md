# AGENTS.md

## Project context

This is a real teaser-site prototype for a game, not a throwaway experiment.

The project is the beginning of a proper shared-world teaser for an MMO.
Changes should be made with long-term architectural cleanliness in mind, even when working on short-term prototype stability.

## Current stack

Keep the environment simple.

- Vite
- vanilla JavaScript
- Canvas 2D
- lil-gui
- lightweight WebSocket server (`server.cjs`)

## Explicitly do not introduce

Do not introduce these unless explicitly requested:

- React
- Three.js
- heavy frameworks
- unnecessary build tooling
- architectural overreach beyond the requested task

## Current functional reality

The current prototype already has working versions of:

- fullscreen canvas
- black / gradient background
- stable grid
- node movement snapped to grid intersections
- Manhattan pathing
- active edge trails / glow as visual feedback
- hidden image reveal
- node-driven cell energy / decay / lock behavior
- optional linked fade for connected locked cells
- first-pass canonical room/world metadata from the server
- viewport rendering through a world-to-screen transform
- base grid rendering beyond the fixed image/reveal room
- node movement beyond the fixed image/reveal bounds
- world-anchored reveal image with configurable edge-distance vignette
- local-only NPC helpers for co-op tuning
- auto-matched multiplayer rooms
- max 5 players per room
- WebSocket networking
- lil-gui controls for many visual and behavioral parameters
- lil-gui property help descriptions for current tuning sections

Treat existing project files as the source of truth.

## Important design constraints

These are effectively locked unless explicitly revisited:

- node movement is intersection-based, not free sliding on lines
- node targets the nearest grid intersection
- node travels edge-by-edge along the grid
- base grid is visually separate from active edges
- active edge glow should emanate from the real line, not a fake thick secondary stroke
- base grid may visually continue beyond the image/reveal room
- node movement should not be restricted to the image/reveal area
- multiplayer rooms are auto-matched
- room cap is 5 players
- image reveal should feel mysterious and restrained
- collaboration matters
- reveal image should not be aggressively auto-fit by default

## Current preferred image defaults

Current collaborative default behavior:

- Image Fit = `native`
- Image Scale = `1`
- Image Offset X = `0`
- Image Offset Y = `0`

Reasoning:

- top-left anchored
- no forced fullscreen scaling
- better shared image reference for collaborative reveal

Do not casually change these defaults without a clear reason.

## Architecture status

The first canonical room/world pass **has happened**.

Do not describe the project as purely viewport-defined anymore.

### Current reality

The server now sends fixed room/world metadata. The client keeps separate concepts for:

- room/image/reveal world space
- movement grid space
- screen/viewport rendering space

The fixed image/reveal room is canonical. Clients render it through a world-to-screen transform.

The visual base grid can extend beyond the image/reveal bounds, and nodes can move beyond the image area. Reveal cells remain tied to the fixed image/reveal room.

The hidden image remains world-anchored, with these preferred defaults:

- Image Fit = `native`
- Image Scale = `1`
- Image Offset X = `0`
- Image Offset Y = `0`

The reveal source includes a configurable edge-distance vignette so the image softens into black at its bounds.

### Still future work

These are not complete yet:

- GUI settings are local testing controls, not production gameplay settings
- GUI sync across clients is optional/low priority testing convenience
- server does not yet fully simulate or authoritatively validate movement paths
- server protection/rate limiting needs to become strict before public use
- room metadata is currently hardcoded in `server.cjs`, not loaded from a private config file
- reveal/cell progress is still client-derived
- cooperative revealed cell state is still local/client-owned
- the older enclosed-shape logic is no longer the primary reveal model and may be removed later if testing continues to favor cell energy

### Intended direction from here

The project should continue toward a canonical shared-room model where:

- the room has fixed dimensions
- the room has a fixed grid
- image placement is fixed in room/world space
- reveal logic is keyed to world/cell coordinates
- server owns room metadata
- clients render the same room scaled into their viewport
- the browser becomes a window onto the room
- cooperative revealed cell state eventually becomes server-owned after the mechanic feels right
- strict server validation and anti-spam hardening are added after core mechanics settle

Do not make short-term changes that deepen dependency on per-client viewport-defined gameplay space unless explicitly requested.

### Known mobile browser caveat

Safari mobile landscape can render the full available width.

Chrome mobile landscape appears to reserve non-drawable left/right browser areas in a normal tab. The canvas can fill Chrome's reported viewport, but Chrome may not expose the physical side bands to page content. Treat this as a browser presentation limitation unless later research proves otherwise.

## How to work on this repo

Before proposing meaningful changes:

1. inspect the real files first
2. prioritize `main.js` and `server.cjs`
3. summarize current structure briefly
4. explain architecture impact before major changes
5. identify likely tradeoffs
6. then make changes

## File edit preferences

- prefer full replacement files over partial patch snippets when edits are non-trivial
- avoid fragile half-patches
- be careful not to regress working lil-gui bindings
- anything that materially affects visuals or feel should ideally be exposed in lil-gui
- keep naming and control wiring stable unless there is a strong reason to change them

## Debugging expectations

When debugging, be explicit about the likely class of problem:

- syntax
- runtime
- file path / environment
- networking
- image loading
- world-space inconsistency
- GUI binding

Do not hand-wave.

## Multiplayer caution

Be skeptical about changes that appear harmless locally but create divergence across clients.

Any change touching these areas should be treated carefully:

- room assignment
- room metadata
- world/grid sizing
- image placement
- reveal state
- client/server authority boundaries
- viewport scaling
- synchronization timing

## Environment / repo gotchas

Keep these in mind:

- it is easy to edit the wrong local repo/folder
- Vite only updates from the real project root
- Vite dev server must restart when new Vite config defines are added
- `server.cjs` does not auto-restart unless running in watch mode
- GitHub Desktop can point at the wrong local clone if folder structure is messy

If behavior seems wrong, check path/root/process issues early.

## Run commands

Server:
`node server.cjs`

Frontend:
`npm run dev -- --host`

For LAN testing, other machines on the same network open:
`http://YOUR-IP:5173`

The frontend is expected to connect to the websocket server on `8080` based on the page URL / configured WS logic.

## Default working style

Act like a technical collaborator, not just a code generator.

Be:

- practical
- skeptical in a useful way
- careful about multiplayer implications
- conscious of future architecture
- concise when possible, thorough when needed

Do not jump straight into code when the task is really about architecture or design consequences.
