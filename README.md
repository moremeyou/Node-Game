# Node-Game Prototype

Multiplayer experience based on an an old experiment visualizing distance/movement along Manhattan paths (originally to simulate ride-sharing benefits)---Now almost totally rebuilt around revealing an image within cells (previously city-street grid/blocks). 

Built with:
- Vite
- vanilla JavaScript
- Canvas 2D
- lil-gui
- a lightweight WebSocket server for multiplayer rooms

---

## Details

This is a fullscreen interactive experience built around a shared grid.

Players move a node across fixed grid intersections. As edges are activated, cells reveal portions of a hidden image. Multiple players in the same room can work together to reveal more of the image.

Current features include:
- fullscreen grid-based interaction
- works on desktop (mouse movement) and mobile (tap around the grid)
- active edge glow/trails
- hidden image reveal by cell
- auto-matched multiplayer rooms
- max 5 players per room
- lil-gui controls for tuning visuals and behavior

---

## Project structure

Typical files/folders:

- `src/main.js` — frontend app logic
- `server.cjs` — multiplayer WebSocket server
- `public/teaser-hidden.jpg` — hidden reveal image
- `package.json` — project scripts and dependencies

---

## Install

From the project root:

```bash
npm install
```

---

## Running the project

Open **two terminals** from the project root.

### Server

```bash
node server.cjs
```

Or, if you want to automatically restart the server with changes (and your Node version supports it):

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

---

## Testing on multiple machines

To test with other devices on the same network:

1. Start the server
2. Start the front end
3. Find your machine’s IP address
4. On the other machines, open:

```text
http://YOUR-IP:5173
```

Important notes:
- everyone must be on the same Wi-Fi / LAN
- Windows/macOS firewall may need to allow Node on your private network
- the server auto-matches players into shared rooms
- rooms currently cap at **5 players**
- server uses websockets
- state is ephemeral
- no accounts
- no persistence
- shared reveal is based on shared edge activity

---

## Hidden image

The reveal image lives at:

```text
public/teaser-hidden.jpg
```

If that file is missing, misnamed, or not loading correctly, the reveal may appear black or fallback incorrectly.

---

## lil-gui controls

The prototype includes controls for:
- base grid
- node visuals
- active edge visuals
- reveal behavior
- hidden image placement / fit / scale
- network status

Current reveal image behavior supports:
- `native`
- `contain`
- `cover`

Recommended collaborative default:
- `Image Fit` = `native`
- `Image Scale` = `1`
- `Image Offset X` = `0`
- `Image Offset Y` = `0`

This keeps the image top-left aligned and avoids fullscreen auto-scaling.

---

## Quick start

```bash
# terminal 1
node server.cjs

# terminal 2
npm run dev -- --host
```

Then open:

```text
http://localhost:5173
```

Or for other devices on your network:

```text
http://YOUR-IP:5173
```

---

## Status
- First canonical-room pass is in place.
	- The server now sends fixed room/world metadata.
	- Clients render the same fixed image/reveal room through a viewport transform.
	- The visual grid can extend beyond the image/reveal bounds.
	- Node movement can continue beyond the image area while reveal remains tied to the fixed image room.
	- The reveal image is world-anchored and has a configurable edge-distance vignette.
- Known mobile browser note:
	- Safari mobile landscape can render the full available width.
	- Chrome mobile landscape appears to reserve non-drawable left/right browser areas; the page fills Chrome's reported viewport, but Chrome does not expose those side bands to canvas content in a normal tab.
- Next design focus:
	- Prototype the cooperative enclosed-shape mechanic locally.
	- Once the feel is right, move held/revealed shape state toward server ownership.
	- Later, add stricter server authority/rate limiting before public use.
