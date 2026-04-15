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
- Works great as-is. But the reveal experience isn't consistent across devices.
	- This is because we're just locking the image and grid to the top corner.
	- So someone on mobile might never see someone on desktop moving around out of their mobile frame.
	- It's basically a typically 'responsive' web browser experience. Need to move away from this.
- I'm strugging with the complexity of the next steps: I need to figure out the a way to guarantee people see each other in this Mini-Multiplayer-Online-"World" ;)
- Current thinking is I need to revise the server/grid view logic to treat the grid/view like a world with one persistent camera (per room).