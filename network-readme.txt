Grid teaser multiplayer local test

1) Replace src/main.js with main-network.js
2) Copy server.cjs into your project root
3) Install the websocket server package:
   npm install ws
4) Start the websocket server in one terminal:
   node server.cjs
5) Start the Vite client in another terminal:
   npm run dev
6) Open the Vite URL in two browser windows/tabs
7) Keep the same grid/reveal config in both tabs for the cleanest test

Default local websocket URL expected by the client:
ws://localhost:8080

Notes:
- Rooms auto-match, max 5 players per room.
- This first pass is ephemeral only: no accounts, no persistence.
- Best results right now assume similar viewport size/config across connected clients.
