const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 8080;
const MAX_PLAYERS_PER_ROOM = 5;
const MAX_MESSAGE_BYTES = 16 * 1024;
const EDGE_SNAPSHOT_TTL_MS = 12000;
const PLAYER_UPDATE_MIN_INTERVAL_MS = 25;
const ROOM_PRUNE_INTERVAL_MS = 250;
const os = require('os');

const DEFAULT_ROOM_WORLD = Object.freeze({
  cols: 20,
  rows: 12,
  cellSize: 84,
  minCellScreenPx: 32,
  movementBounds: Object.freeze({
    minCol: -100,
    maxCol: 120,
    minRow: -100,
    maxRow: 112,
  }),
  image: Object.freeze({
    fitMode: 'native',
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    vignetteEnabled: true,
    vignetteMode: 'alpha',
    vignetteColor: '#000000',
    vignetteInnerOpacity: 0,
    vignetteEdgeOpacity: 1,
    vignetteSize: 100,
    vignetteCurve: 1,
  }),
});

let nextPlayerId = 1;
let nextRoomId = 1;

const rooms = new Map();

function createId(prefix, value) {
  return `${prefix}-${value.toString(36)}`;
}

function createRoomWorld() {
  return {
    ...DEFAULT_ROOM_WORLD,
    movementBounds: { ...DEFAULT_ROOM_WORLD.movementBounds },
    image: { ...DEFAULT_ROOM_WORLD.image },
  };
}

function createRoom() {
  const room = {
    id: createId('room', nextRoomId++),
    world: createRoomWorld(),
    clients: new Set(),
    players: new Map(),
    activeEdges: new Map(),
  };

  rooms.set(room.id, room);
  return room;
}

function findOrCreateRoom() {
  for (const room of rooms.values()) {
    if (room.clients.size < MAX_PLAYERS_PER_ROOM) {
      return room;
    }
  }

  return createRoom();
}

function getLanIpAddress() {
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;

    for (const entry of entries) {
      if (
        entry &&
        entry.family === 'IPv4' &&
        !entry.internal &&
        !entry.address.startsWith('169.254.')
      ) {
        return entry.address;
      }
    }
  }

  return null;
}

function getShareableWsUrl(port) {
  const lanIp = getLanIpAddress();
  if (!lanIp) {
    return `ws://localhost:${port}`;
  }

  return `ws://${lanIp}:${port}`;
}

function getRoomPlayerCount(room) {
  return room.clients.size;
}

function send(ws, payload) {
  if (ws.readyState !== ws.OPEN) {
    return;
  }

  ws.send(JSON.stringify(payload));
}

function broadcast(room, payload, exceptWs = null) {
  const encoded = JSON.stringify(payload);

  for (const client of room.clients) {
    if (client === exceptWs || client.readyState !== client.OPEN) {
      continue;
    }

    client.send(encoded);
  }
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidIntersection(value) {
  return !!value
    && Number.isInteger(value.col)
    && Number.isInteger(value.row)
    && value.col >= -10000
    && value.row >= -10000
    && value.col <= 10000
    && value.row <= 10000;
}

function isValidWorldIntersection(world, value) {
  const bounds = world.movementBounds;
  return isValidIntersection(value)
    && value.col >= bounds.minCol
    && value.col <= bounds.maxCol
    && value.row >= bounds.minRow
    && value.row <= bounds.maxRow;
}

function isValidAdjacentEdge(start, end) {
  if (!isValidIntersection(start) || !isValidIntersection(end)) {
    return false;
  }

  const distance = Math.abs(start.col - end.col) + Math.abs(start.row - end.row);
  return distance === 1;
}

function isValidAdjacentWorldEdge(world, start, end) {
  if (!isValidWorldIntersection(world, start) || !isValidWorldIntersection(world, end)) {
    return false;
  }

  return isValidAdjacentEdge(start, end);
}

function sanitizeSegment(segment, world) {
  if (!segment) {
    return null;
  }

  const startIntersection = segment.startIntersection;
  const endIntersection = segment.endIntersection;
  if (!isValidAdjacentWorldEdge(world, startIntersection, endIntersection)) {
    return null;
  }

  return {
    startIntersection: { ...startIntersection },
    endIntersection: { ...endIntersection },
    progress: clampNumber(segment.progress, 0, 1),
    axis: segment.axis === 'vertical' ? 'vertical' : 'horizontal',
  };
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }
  return Math.max(min, Math.min(max, number));
}

function sanitizePlayerState(payload, world) {
  const visible = !!payload.visible;
  const current = payload.current && isValidWorldIntersection(world, payload.current)
    ? { ...payload.current }
    : null;
  const segment = sanitizeSegment(payload.segment, world);

  return {
    visible,
    spawnedAtAgeMs: payload.spawnedAtAgeMs == null
      ? null
      : Math.max(0, Math.min(15000, Math.round(Number(payload.spawnedAtAgeMs) || 0))),
    x: isFiniteNumber(payload.x) ? Math.round(payload.x * 100) / 100 : 0,
    y: isFiniteNumber(payload.y) ? Math.round(payload.y * 100) / 100 : 0,
    current,
    segment,
  };
}

function touchRoomEdge(room, playerId, start, end, now) {
  const key = createSegmentKey(start, end);
  let edge = room.activeEdges.get(key);

  if (!edge) {
    edge = {
      key,
      start: { ...start },
      end: { ...end },
      sources: new Map(),
    };
  }

  edge.sources.set(playerId, {
    lastTouchedAt: now,
  });

  room.activeEdges.set(key, edge);
}

function createSegmentKey(a, b) {
  const left = `${a.col},${a.row}`;
  const right = `${b.col},${b.row}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

function pruneRoomEdges(room, now = Date.now()) {
  for (const [key, edge] of room.activeEdges.entries()) {
    for (const [playerId, source] of edge.sources.entries()) {
      if (now - source.lastTouchedAt > EDGE_SNAPSHOT_TTL_MS) {
        edge.sources.delete(playerId);
      }
    }

    if (edge.sources.size === 0) {
      room.activeEdges.delete(key);
    }
  }
}

function serializeRoomState(room, ws) {
  const now = Date.now();
  pruneRoomEdges(room, now);

  return {
    type: 'room_state',
    roomId: room.id,
    world: room.world,
    playerCount: getRoomPlayerCount(room),
    players: Array.from(room.players.entries()).map(([playerId, player]) => ({
      id: playerId,
      ...player,
    })),
    activeEdges: Array.from(room.activeEdges.values()).map((edge) => ({
      start: edge.start,
      end: edge.end,
      sources: Array.from(edge.sources.entries()).map(([playerId, source]) => ({
        playerId,
        ageMs: Math.max(0, now - source.lastTouchedAt),
      })),
    })),
  };
}

function sendRoomInfo(room) {
  broadcast(room, {
    type: 'room_info',
    roomId: room.id,
    world: room.world,
    playerCount: getRoomPlayerCount(room),
  });
}

function cleanupConnection(ws) {
  if (ws._cleanedUp) {
    return;
  }

  ws._cleanedUp = true;
  const room = ws.room;
  if (!room) {
    return;
  }

  room.clients.delete(ws);
  room.players.delete(ws.playerId);

  broadcast(room, {
    type: 'player_leave',
    playerId: ws.playerId,
  }, ws);

  if (room.clients.size === 0) {
    rooms.delete(room.id);
    return;
  }

  sendRoomInfo(room);
}

const server = http.createServer();
const wss = new WebSocketServer({ server, maxPayload: MAX_MESSAGE_BYTES });

wss.on('connection', (ws) => {
  ws.playerId = createId('player', nextPlayerId++);
  ws.lastPlayerStateAt = 0;
  ws.room = findOrCreateRoom();
  ws.room.clients.add(ws);
  ws.room.players.set(ws.playerId, {
    visible: false,
    spawnedAtAgeMs: null,
    x: 0,
    y: 0,
    current: null,
    segment: null,
  });

  send(ws, {
    type: 'welcome',
    playerId: ws.playerId,
    roomId: ws.room.id,
    world: ws.room.world,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    shareUrl: getShareableWsUrl(PORT),
  });

  send(ws, serializeRoomState(ws.room, ws));
  sendRoomInfo(ws.room);

  ws.on('message', (buffer, isBinary) => {
    if (isBinary) {
      return;
    }

    let message = null;
    try {
      message = JSON.parse(buffer.toString());
    } catch (error) {
      return;
    }

    if (!message || typeof message !== 'object') {
      return;
    }

    const now = Date.now();
    const room = ws.room;
    if (!room) {
      return;
    }

    switch (message.type) {
      case 'player_state': {
        if (now - ws.lastPlayerStateAt < PLAYER_UPDATE_MIN_INTERVAL_MS) {
          return;
        }

        ws.lastPlayerStateAt = now;
        const player = sanitizePlayerState(message.player || {}, room.world);
        room.players.set(ws.playerId, player);

        broadcast(room, {
          type: 'player_state',
          playerId: ws.playerId,
          player,
        }, ws);
        break;
      }

      case 'edge_touch': {
        const start = message.start;
        const end = message.end;
        if (!isValidAdjacentWorldEdge(room.world, start, end)) {
          return;
        }

        touchRoomEdge(room, ws.playerId, start, end, now);

        broadcast(room, {
          type: 'edge_touch',
          playerId: ws.playerId,
          start,
          end,
        }, ws);
        break;
      }

      default:
        break;
    }
  });

  ws.on('close', () => {
    cleanupConnection(ws);
  });

  ws.on('error', () => {
    cleanupConnection(ws);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    pruneRoomEdges(room, now);
    if (room.clients.size === 0) {
      rooms.delete(room.id);
    }
  }
}, ROOM_PRUNE_INTERVAL_MS);

server.listen(PORT, () => {
  console.log(`Grid realtime server listening on ws://localhost:${PORT}`);
  console.log(`Auto-match rooms enabled. Max players per room: ${MAX_PLAYERS_PER_ROOM}`);
});
