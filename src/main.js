import GUI from 'lil-gui';
import './style.css';

const canvas = document.querySelector('#app');
const ctx = canvas.getContext('2d');

let guiInstance = null;

function applyGuiLayout(gui) {
  if (!gui) {
    return;
  }

  const margin = 12;
  const width = Math.max(240, Math.min(320, window.innerWidth - margin * 2));
  const el = gui.domElement;

  el.style.setProperty('--width', `${width}px`);
  el.style.width = `${width}px`;
  el.style.boxSizing = 'border-box';
  el.style.position = 'fixed';
  el.style.top = `${margin}px`;
  el.style.right = `${margin}px`;
  el.style.left = 'auto';
  el.style.maxWidth = `calc(100vw - ${margin * 2}px)`;
  el.style.maxHeight = `calc(100vh - ${margin * 2}px)`;
  el.style.overflowX = 'hidden';
  el.style.overflowY = 'auto';
  el.style.zIndex = '30';
}

const revealSourceCanvas = document.createElement('canvas');
const revealSourceCtx = revealSourceCanvas.getContext('2d');

const LOCAL_PLAYER_ID = 'local';
const DEBUG_PLAYER_PREFIX = 'debug-';

function getDefaultNetworkUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname || 'localhost';

  if (window.location.port === '5173') {
    return `${protocol}//${hostname}:8080`;
  }

  return `${protocol}//${window.location.host}`;
}

const config = {
  backgroundColor: "#000000",
  gridSize: 84,
  gridColor: "#ffffff",
  gridOpacity: 0.1,
  gridLineWidth: 1,
  spawnDelayMs: 500,
  spawnFadeMs: 500,
  followPointerDelayMs: 2740,
  moveSpeed: 648,
  routePreference: "alternating",
  turnPauseMs: 0,
  segmentEasing: 0,
  nodeColor: "#2f7dff",
  nodeBorderColor: "#cfe0ff",
  nodeBorderOpacity: 0,
  nodeBorderWidth: 0,
  nodeGlowColor: "#ffffff",
  nodeGlowOpacity: 0.7,
  nodeGlowBlur: 23,
  nodeWidth: 15,
  nodeHeight: 15,
  nodeRadius: 4,
  nodePulseAmplitude: 0.085,
  pulseSpeed: 6.4,
  nodeSpawnStartScale: 7.4,
  nodeSpawnBounce: 1.5,
  activeEdgeEnabled: true,
  activeEdgeColor: "#b8d5ff",
  activeEdgeOpacity: 0.95,
  activeEdgeGlowColor: "#6ea9ff",
  activeEdgeGlowOpacity: 0.93,
  activeEdgeLineWidth: 1,
  activeEdgeGlowWidth: 26,
  activeEdgeLineCap: "square",
  activeEdgeGlowBlur: 32,
  activeEdgeHoldMs: 90,
  activeEdgeFadeMs: 670,
  revealEnabled: true,
  revealImageSrc: "/teaser-hidden.jpg",
  revealImageFitMode: 'native',
  revealImageScale: 1,
  revealImageOffsetX: 0,
  revealImageOffsetY: 0,
  revealIncludeCurrentSegment: true,
  revealEdgeActiveThreshold: 0.01,
  revealOpacity1: 0.1,
  revealOpacity2: 0.24,
  revealOpacity3: 0.43,
  revealOpacity4: 0.54,
  revealClosedBonus: 0.24,
  revealFadeInMs: 30,
  revealHoldMs: 0,
  revealFadeOutMs: 160,
  revealImageOpacity: 1,
  revealTintColor: "#000000",
  revealTintOpacity: 0.14,
  gridOverReveal: true,
  showTarget: false,
  showIntersections: true,
  showRevealCells: false,
  showPlayerIds: false,
  networkEnabled: true,
  networkUrl: getDefaultNetworkUrl(),
  networkSendIntervalMs: 50,
  networkReconnectDelayMs: 1500,
};

const viewport = {
  width: window.innerWidth,
  height: window.innerHeight,
  dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
};

const state = {
  startTime: performance.now(),
  now: performance.now(),
  pointer: {
    active: false,
    x: viewport.width * 0.5,
    y: viewport.height * 0.5,
    targetIntersection: null,
  },
  localPlayerId: LOCAL_PLAYER_ID,
  players: new Map(),
  activeEdges: new Map(),
  revealCells: new Map(),
  alternatingAxisStartsHorizontal: true,
  nextDebugPlayerIndex: 1,
  network: {
    socket: null,
    status: 'disconnected',
    roomId: null,
    serverPlayerId: null,
    shouldReconnect: true,
    reconnectTimer: null,
    lastPlayerStateSentAt: 0,
    playerCount: 1,
  },
};

const assets = {
  revealImage: new Image(),
  revealImageLoaded: false,
  revealImageFailed: false,
  revealRequestId: 0,
};

state.players.set(LOCAL_PLAYER_ID, createPlayerState(LOCAL_PLAYER_ID, { isLocal: true }));

const networkInfo = {
  status: 'disconnected',
  roomId: '-',
  players: 1,
  shareUrl: '-',
};

const actions = {
  clearActiveEdges() {
    state.activeEdges.clear();
  },
  clearRevealCells() {
    state.revealCells.clear();
  },
  randomizeSpawn() {
    const player = getLocalPlayer();
    if (!player) {
      return;
    }

    const spawn = randomVisibleIntersection();
    placePlayerAt(player, spawn);
    player.visible = true;
    player.spawnedAt = state.now;
    resetPlayerNavigation(player);

    if (state.pointer.active) {
      refreshPointerTargetFromStoredPointer();
    }
  },
  addDebugPlayer() {
    const id = `${DEBUG_PLAYER_PREFIX}${state.nextDebugPlayerIndex}`;
    state.nextDebugPlayerIndex += 1;

    const player = ensurePlayer(id, {
      isLocal: false,
      visible: true,
      spawnedAt: state.now,
    });

    placePlayerAt(player, randomVisibleIntersection());
    resetPlayerNavigation(player);
  },
  clearDebugPlayers() {
    for (const [playerId] of state.players.entries()) {
      if (!playerId.startsWith(DEBUG_PLAYER_PREFIX)) {
        continue;
      }

      clearPlayerContributions(playerId);
      state.players.delete(playerId);
    }
  },
  reloadRevealImage() {
    loadRevealImage();
  },
  reconnectNetwork() {
    connectNetwork({ force: true });
  },
  disconnectNetwork() {
    disconnectNetwork({ manual: true });
  },
  async copyConfig() {
    const lines = ['const config = {'];

    for (const [key, value] of Object.entries(config)) {
      const formattedValue =
        typeof value === 'string' ? JSON.stringify(value) : String(value);
      lines.push(`  ${key}: ${formattedValue},`);
    }

    lines.push('};');
    const snapshot = lines.join('\n');

    try {
      await navigator.clipboard.writeText(snapshot);
      console.info('Config copied to clipboard.');
    } catch (error) {
      console.warn('Clipboard unavailable. Here is the config:', snapshot);
    }
  },
};

function createPlayerState(id, overrides = {}) {
  return {
    id,
    isLocal: false,
    visible: false,
    spawnedAt: null,
    x: 0,
    y: 0,
    current: null,
    desiredTarget: null,
    pathQueue: [],
    segment: null,
    turnHoldUntil: 0,
    lastNetworkStateAt: 0,
    ...overrides,
  };
}

function getPlayer(playerId) {
  return state.players.get(playerId) || null;
}

function ensurePlayer(playerId, overrides = {}) {
  const existing = getPlayer(playerId);

  if (existing) {
    Object.assign(existing, overrides);
    return existing;
  }

  const player = createPlayerState(playerId, overrides);
  state.players.set(playerId, player);
  return player;
}

function getLocalPlayer() {
  return getPlayer(state.localPlayerId);
}

function getRenderablePlayers() {
  return Array.from(state.players.values()).filter((player) => player.visible);
}

function resetPlayerNavigation(player) {
  player.pathQueue = [];
  player.segment = null;
  player.turnHoldUntil = 0;
  player.desiredTarget = null;
}

function clearPlayerContributions(playerId) {
  for (const [key, edge] of state.activeEdges.entries()) {
    if (!edge.sources.has(playerId)) {
      continue;
    }

    edge.sources.delete(playerId);

    if (edge.sources.size === 0) {
      state.activeEdges.delete(key);
    }
  }
}

function isDebugPlayerId(playerId) {
  return String(playerId || '').startsWith(DEBUG_PLAYER_PREFIX);
}

function isRemotePlayerId(playerId) {
  return playerId !== LOCAL_PLAYER_ID && !isDebugPlayerId(playerId);
}

function getSocketReadyStateName(socket) {
  if (!socket) return 'disconnected';
  switch (socket.readyState) {
    case WebSocket.CONNECTING:
      return 'connecting';
    case WebSocket.OPEN:
      return 'connected';
    case WebSocket.CLOSING:
      return 'closing';
    case WebSocket.CLOSED:
    default:
      return 'disconnected';
  }
}

function updateNetworkInfo() {
  networkInfo.status = state.network.status;
  networkInfo.roomId = state.network.roomId || '-';

  if (state.network.roomId) {
    networkInfo.players = Math.max(1, state.network.playerCount || 1);
    return;
  }

  let players = 0;
  for (const player of state.players.values()) {
    if (player.visible) {
      players += 1;
    }
  }
  networkInfo.players = Math.max(1, players);
}

function setNetworkStatus(status) {
  state.network.status = status;
  updateNetworkInfo();
}

function normalizeIncomingPlayerId(playerId) {
  return playerId === state.network.serverPlayerId ? LOCAL_PLAYER_ID : playerId;
}

function cloneIntersection(value) {
  if (!value || !Number.isFinite(value.col) || !Number.isFinite(value.row)) {
    return null;
  }

  return {
    col: Math.round(value.col),
    row: Math.round(value.row),
  };
}

function cloneSegment(value) {
  if (!value) {
    return null;
  }

  const startIntersection = cloneIntersection(value.startIntersection);
  const endIntersection = cloneIntersection(value.endIntersection);

  if (!startIntersection || !endIntersection) {
    return null;
  }

  return {
    startIntersection,
    endIntersection,
    progress: clamp(Number(value.progress) || 0, 0, 1),
    axis: value.axis === 'vertical' ? 'vertical' : 'horizontal',
  };
}

function serializePlayerForNetwork(player) {
  return {
    visible: !!player.visible,
    spawnedAtAgeMs: player.spawnedAt == null ? null : Math.max(0, Math.round(state.now - player.spawnedAt)),
    x: Math.round(player.x * 100) / 100,
    y: Math.round(player.y * 100) / 100,
    current: player.current ? { ...player.current } : null,
    segment: player.segment
      ? {
          startIntersection: { ...player.segment.startIntersection },
          endIntersection: { ...player.segment.endIntersection },
          progress: player.segment.progress,
          axis: player.segment.axis,
        }
      : null,
  };
}

function removeRemotePlayers() {
  for (const [playerId] of state.players.entries()) {
    if (!isRemotePlayerId(playerId)) {
      continue;
    }

    state.players.delete(playerId);
  }
}

function removeRemoteEdgeSources() {
  for (const [key, edge] of state.activeEdges.entries()) {
    for (const sourceId of edge.sources.keys()) {
      if (sourceId === LOCAL_PLAYER_ID || isDebugPlayerId(sourceId)) {
        continue;
      }

      edge.sources.delete(sourceId);
    }

    if (edge.sources.size === 0) {
      state.activeEdges.delete(key);
    }
  }
}

function resetRemoteState() {
  removeRemotePlayers();
  removeRemoteEdgeSources();
  state.network.roomId = null;
  state.network.serverPlayerId = null;
  state.network.playerCount = 1;
  updateNetworkInfo();
}

function applyIncomingPlayerState(playerId, payload) {
  const mappedId = normalizeIncomingPlayerId(playerId);

  if (mappedId === LOCAL_PLAYER_ID) {
    return;
  }

  const player = ensurePlayer(mappedId, { isLocal: false });
  player.visible = !!payload.visible;
  player.spawnedAt = payload.spawnedAtAgeMs == null
    ? state.now
    : state.now - Math.max(0, Number(payload.spawnedAtAgeMs) || 0);
  player.current = cloneIntersection(payload.current);
  player.segment = cloneSegment(payload.segment);
  player.lastNetworkStateAt = state.now;
  player.pathQueue = [];
  player.desiredTarget = null;
  player.turnHoldUntil = 0;

  if (Number.isFinite(payload.x)) {
    player.x = payload.x;
  } else if (player.current) {
    player.x = toPoint(player.current).x;
  }

  if (Number.isFinite(payload.y)) {
    player.y = payload.y;
  } else if (player.current) {
    player.y = toPoint(player.current).y;
  }
}

function applyRoomPlayersSnapshot(players) {
  const seen = new Set([LOCAL_PLAYER_ID]);

  for (const payload of players) {
    if (!payload || !payload.id) {
      continue;
    }

    const mappedId = normalizeIncomingPlayerId(payload.id);
    seen.add(mappedId);
    applyIncomingPlayerState(payload.id, payload);
  }

  for (const [playerId] of state.players.entries()) {
    if (!isRemotePlayerId(playerId)) {
      continue;
    }

    if (!seen.has(playerId)) {
      state.players.delete(playerId);
    }
  }
}

function applyRoomEdgesSnapshot(edges) {
  removeRemoteEdgeSources();

  for (const edgePayload of edges) {
    if (!edgePayload || !edgePayload.start || !edgePayload.end) {
      continue;
    }

    const start = cloneIntersection(edgePayload.start);
    const end = cloneIntersection(edgePayload.end);

    if (!start || !end) {
      continue;
    }

    const key = createSegmentKey(start, end);
    let edge = state.activeEdges.get(key);

    if (!edge) {
      edge = {
        start: { ...start },
        end: { ...end },
        sources: new Map(),
      };
    }

    for (const sourcePayload of edgePayload.sources || []) {
      const mappedId = normalizeIncomingPlayerId(sourcePayload.playerId);

      if (mappedId === LOCAL_PLAYER_ID) {
        continue;
      }

      const ageMs = Math.max(0, Number(sourcePayload.ageMs) || 0);
      edge.sources.set(mappedId, {
        lastTouchedAt: state.now - ageMs,
      });
    }

    if (edge.sources.size > 0) {
      state.activeEdges.set(key, edge);
    }
  }
}

function handleNetworkMessage(message) {
  switch (message.type) {
    case 'welcome': {
      state.network.serverPlayerId = message.playerId || null;
      state.network.roomId = message.roomId || null;
      state.network.playerCount = 1;

      if (message.shareUrl) {
        networkInfo.shareUrl = message.shareUrl;
      }

      setNetworkStatus('connected');
      updateNetworkInfo();
      sendLocalPlayerState(true);
      break;
    }

    case 'room_info': {
      if (message.roomId) {
        state.network.roomId = message.roomId;
      }
      if (Number.isFinite(message.playerCount)) {
        state.network.playerCount = message.playerCount;
      }
      updateNetworkInfo();
      break;
    }

    case 'room_state': {
      if (message.roomId) {
        state.network.roomId = message.roomId;
      }
      applyRoomPlayersSnapshot(Array.isArray(message.players) ? message.players : []);
      applyRoomEdgesSnapshot(Array.isArray(message.activeEdges) ? message.activeEdges : []);
      if (Number.isFinite(message.playerCount)) {
        state.network.playerCount = message.playerCount;
      }
      updateNetworkInfo();
      break;
    }

    case 'player_state': {
      if (message.playerId) {
        applyIncomingPlayerState(message.playerId, message.player || {});
        updateNetworkInfo();
      }
      break;
    }

    case 'player_leave': {
      const mappedId = normalizeIncomingPlayerId(message.playerId);
      if (isRemotePlayerId(mappedId)) {
        state.players.delete(mappedId);
        updateNetworkInfo();
      }
      break;
    }

    case 'edge_touch': {
      if (message.playerId && message.start && message.end) {
        const mappedId = normalizeIncomingPlayerId(message.playerId);
        if (mappedId !== LOCAL_PLAYER_ID) {
          touchActiveEdge(mappedId, message.start, message.end, state.now);
        }
      }
      break;
    }

    default:
      break;
  }
}

function scheduleReconnect() {
  if (!config.networkEnabled || !state.network.shouldReconnect) {
    return;
  }

  if (state.network.reconnectTimer) {
    return;
  }

  state.network.reconnectTimer = window.setTimeout(() => {
    state.network.reconnectTimer = null;
    connectNetwork();
  }, Math.max(250, config.networkReconnectDelayMs));
}

function disconnectNetwork({ manual = false } = {}) {
  state.network.shouldReconnect = !manual;

  if (state.network.reconnectTimer) {
    window.clearTimeout(state.network.reconnectTimer);
    state.network.reconnectTimer = null;
  }

  const socket = state.network.socket;
  state.network.socket = null;

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close(1000, manual ? 'manual-disconnect' : 'reconnect');
  }

  setNetworkStatus('disconnected');
  resetRemoteState();
}

function connectNetwork({ force = false } = {}) {
  if (!config.networkEnabled) {
    disconnectNetwork({ manual: true });
    return;
  }

  if (force) {
    disconnectNetwork({ manual: false });
  }

  const existing = state.network.socket;
  if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
    setNetworkStatus(getSocketReadyStateName(existing));
    return;
  }

  const url = String(config.networkUrl || '').trim();
  if (!url) {
    setNetworkStatus('no-url');
    return;
  }

  state.network.shouldReconnect = true;
  setNetworkStatus('connecting');

  const socket = new WebSocket(url);
  state.network.socket = socket;

  socket.addEventListener('open', () => {
    if (state.network.socket !== socket) {
      return;
    }

    state.network.lastPlayerStateSentAt = 0;
    setNetworkStatus('connected');
    sendLocalPlayerState(true);
  });

  socket.addEventListener('message', (event) => {
    let message = null;

    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.warn('Invalid network message:', error);
      return;
    }

    handleNetworkMessage(message);
  });

  socket.addEventListener('close', () => {
    if (state.network.socket === socket) {
      state.network.socket = null;
    }

    setNetworkStatus('disconnected');
    resetRemoteState();
    scheduleReconnect();
  });

  socket.addEventListener('error', () => {
    setNetworkStatus('error');
  });
}

function sendNetworkMessage(message) {
  const socket = state.network.socket;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  socket.send(JSON.stringify(message));
  return true;
}

function sendLocalPlayerState(force = false) {
  if (!config.networkEnabled) {
    return;
  }

  const socket = state.network.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  if (!force && state.now - state.network.lastPlayerStateSentAt < config.networkSendIntervalMs) {
    return;
  }

  const player = getLocalPlayer();
  if (!player) {
    return;
  }

  state.network.lastPlayerStateSentAt = state.now;

  sendNetworkMessage({
    type: 'player_state',
    player: serializePlayerForNetwork(player),
  });
}

function sendEdgeTouch(start, end) {
  if (!config.networkEnabled) {
    return;
  }

  sendNetworkMessage({
    type: 'edge_touch',
    start: { ...start },
    end: { ...end },
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t, overshoot = 1.70158) {
  const c1 = overshoot;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '').trim();
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const value = Number.parseInt(expanded, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function colorWithAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getGridOffset() {
  return config.gridLineWidth % 2 === 1 ? 0.5 : 0;
}

function maxGridCol() {
  return Math.ceil(viewport.width / config.gridSize);
}

function maxGridRow() {
  return Math.ceil(viewport.height / config.gridSize);
}

function cellCountX() {
  return Math.ceil(viewport.width / config.gridSize);
}

function cellCountY() {
  return Math.ceil(viewport.height / config.gridSize);
}

function toPoint(intersection) {
  const offset = getGridOffset();
  return {
    x: intersection.col * config.gridSize + offset,
    y: intersection.row * config.gridSize + offset,
  };
}

function nearestIntersection(x, y) {
  const offset = getGridOffset();
  const col = clamp(Math.round((x - offset) / config.gridSize), 0, maxGridCol());
  const row = clamp(Math.round((y - offset) / config.gridSize), 0, maxGridRow());
  return { col, row };
}

function randomVisibleIntersection() {
  const offset = getGridOffset();
  const maxSpawnHalfSize = Math.max(config.nodeWidth, config.nodeHeight)
    * Math.max(1, config.nodeSpawnStartScale)
    * 0.5;
  const visualPadding = maxSpawnHalfSize + config.nodeGlowBlur + config.nodeBorderWidth + 12;

  let minCol = Math.ceil((visualPadding - offset) / config.gridSize);
  let maxCol = Math.floor((viewport.width - visualPadding - offset) / config.gridSize);
  let minRow = Math.ceil((visualPadding - offset) / config.gridSize);
  let maxRow = Math.floor((viewport.height - visualPadding - offset) / config.gridSize);

  minCol = clamp(minCol, 0, maxGridCol());
  maxCol = clamp(maxCol, 0, maxGridCol());
  minRow = clamp(minRow, 0, maxGridRow());
  maxRow = clamp(maxRow, 0, maxGridRow());

  if (maxCol < minCol || maxRow < minRow) {
    return {
      col: Math.round(maxGridCol() * 0.5),
      row: Math.round(maxGridRow() * 0.5),
    };
  }

  return {
    col: minCol + Math.floor(Math.random() * (maxCol - minCol + 1)),
    row: minRow + Math.floor(Math.random() * (maxRow - minRow + 1)),
  };
}

function sameIntersection(a, b) {
  return !!a && !!b && a.col === b.col && a.row === b.row;
}

function createSegmentKey(a, b) {
  const left = `${a.col},${a.row}`;
  const right = `${b.col},${b.row}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

function createCellKey(cell) {
  return `${cell.col},${cell.row}`;
}

function getCellRect(cell) {
  const x = cell.col * config.gridSize;
  const y = cell.row * config.gridSize;

  return {
    x,
    y,
    width: Math.max(0, Math.min(config.gridSize, viewport.width - x)),
    height: Math.max(0, Math.min(config.gridSize, viewport.height - y)),
  };
}

function touchActiveEdge(sourceId, start, end, touchedAt = state.now) {
  if (!config.activeEdgeEnabled) {
    return;
  }

  const key = createSegmentKey(start, end);
  let edge = state.activeEdges.get(key);

  if (!edge) {
    edge = {
      start: { ...start },
      end: { ...end },
      sources: new Map(),
    };
  }

  edge.sources.set(sourceId, {
    lastTouchedAt: touchedAt,
  });

  state.activeEdges.set(key, edge);
}

function getActiveEdgeSourceAlphaMultiplier(source) {
  const hold = Math.max(0, config.activeEdgeHoldMs);
  const fade = Math.max(1, config.activeEdgeFadeMs);
  const age = state.now - source.lastTouchedAt;
  const fadeProgress = age <= hold ? 0 : clamp((age - hold) / fade, 0, 1);
  return 1 - fadeProgress;
}

function getActiveEdgeAlphaMultiplier(edge) {
  let maxAlpha = 0;

  for (const source of edge.sources.values()) {
    maxAlpha = Math.max(maxAlpha, getActiveEdgeSourceAlphaMultiplier(source));
  }

  return maxAlpha;
}

function clearExpiredActiveEdges() {
  for (const [key, edge] of state.activeEdges.entries()) {
    for (const [sourceId, source] of edge.sources.entries()) {
      if (getActiveEdgeSourceAlphaMultiplier(source) <= 0) {
        edge.sources.delete(sourceId);
      }
    }

    if (edge.sources.size === 0) {
      state.activeEdges.delete(key);
    }
  }
}

function buildAxisPath(from, to, axis) {
  const points = [];
  let col = from.col;
  let row = from.row;

  if (axis === 'horizontal') {
    while (col !== to.col) {
      col += Math.sign(to.col - col);
      points.push({ col, row });
    }
  } else {
    while (row !== to.row) {
      row += Math.sign(to.row - row);
      points.push({ col, row });
    }
  }

  return points;
}

function buildPath(from, to) {
  if (!from || !to || sameIntersection(from, to)) {
    return [];
  }

  let firstAxis = 'horizontal';

  if (config.routePreference === 'vertical-first') {
    firstAxis = 'vertical';
  } else if (config.routePreference === 'alternating') {
    firstAxis = state.alternatingAxisStartsHorizontal ? 'horizontal' : 'vertical';
    state.alternatingAxisStartsHorizontal = !state.alternatingAxisStartsHorizontal;
  }

  const secondAxis = firstAxis === 'horizontal' ? 'vertical' : 'horizontal';
  const firstLeg = buildAxisPath(from, to, firstAxis);
  const pivot = firstLeg.length > 0 ? firstLeg[firstLeg.length - 1] : from;
  const secondLeg = buildAxisPath(pivot, to, secondAxis);

  return [...firstLeg, ...secondLeg];
}

function placePlayerAt(player, intersection) {
  const point = toPoint(intersection);
  player.current = { ...intersection };
  player.x = point.x;
  player.y = point.y;
}

function playerCanFollowPointer(player) {
  if (!player || !player.visible || player.spawnedAt == null) {
    return false;
  }

  return state.now - player.spawnedAt >= config.followPointerDelayMs;
}

function refreshPointerTargetFromStoredPointer() {
  if (!state.pointer.active) {
    return;
  }

  const nextTarget = nearestIntersection(state.pointer.x, state.pointer.y);
  state.pointer.targetIntersection = nextTarget;

  const localPlayer = getLocalPlayer();
  if (playerCanFollowPointer(localPlayer)) {
    localPlayer.desiredTarget = { ...nextTarget };
  }
}

function startNextSegment(player) {
  const nextIntersection = player.pathQueue.shift();

  if (!nextIntersection) {
    player.segment = null;
    return;
  }

  const startIntersection = { ...player.current };

  player.segment = {
    startIntersection,
    endIntersection: { ...nextIntersection },
    progress: 0,
    axis: startIntersection.col !== nextIntersection.col ? 'horizontal' : 'vertical',
  };
}

function refreshPathIfNeeded(player) {
  if (!player.visible || player.segment) {
    return;
  }

  if (!player.desiredTarget || sameIntersection(player.current, player.desiredTarget)) {
    player.pathQueue = [];
    return;
  }

  player.pathQueue = buildPath(player.current, player.desiredTarget);
  startNextSegment(player);
}

function updateLocalPlayer(deltaSeconds) {
  const player = getLocalPlayer();
  if (!player) {
    return;
  }

  if (!player.visible) {
    const elapsed = state.now - state.startTime;

    if (elapsed >= config.spawnDelayMs) {
      player.visible = true;
      player.spawnedAt = state.now;
      player.desiredTarget = null;
      placePlayerAt(player, randomVisibleIntersection());

      if (state.pointer.active) {
        refreshPointerTargetFromStoredPointer();
      }
    }

    return;
  }

  if (!player.desiredTarget && state.pointer.active && playerCanFollowPointer(player)) {
    refreshPointerTargetFromStoredPointer();
  }

  if (state.now < player.turnHoldUntil) {
    return;
  }

  refreshPathIfNeeded(player);

  const segment = player.segment;
  if (!segment) {
    return;
  }

  const startPoint = toPoint(segment.startIntersection);
  const endPoint = toPoint(segment.endIntersection);
  const length = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);
  const distanceThisFrame = config.moveSpeed * deltaSeconds;
  const progressDelta = length === 0 ? 1 : distanceThisFrame / length;

  segment.progress = Math.min(1, segment.progress + progressDelta);

  const easedProgress = lerp(
    segment.progress,
    easeInOutCubic(segment.progress),
    config.segmentEasing,
  );

  player.x = lerp(startPoint.x, endPoint.x, easedProgress);
  player.y = lerp(startPoint.y, endPoint.y, easedProgress);

  if (segment.progress >= 1) {
    const snappedEndPoint = toPoint(segment.endIntersection);
    player.x = snappedEndPoint.x;
    player.y = snappedEndPoint.y;
    player.current = { ...segment.endIntersection };

    touchActiveEdge(player.id, segment.startIntersection, segment.endIntersection);
    sendEdgeTouch(segment.startIntersection, segment.endIntersection);

    player.segment = null;

    const nextIntersection = player.pathQueue[0];
    if (nextIntersection) {
      const nextAxis =
        player.current.col !== nextIntersection.col ? 'horizontal' : 'vertical';

      if (nextAxis !== segment.axis && config.turnPauseMs > 0) {
        player.turnHoldUntil = state.now + config.turnPauseMs;
        return;
      }
    }

    refreshPathIfNeeded(player);
  }
}

function buildActiveEdgeStrengthMap() {
  const strengths = new Map();

  for (const [key, edge] of state.activeEdges.entries()) {
    const alphaMultiplier = getActiveEdgeAlphaMultiplier(edge);
    if (alphaMultiplier <= 0) {
      continue;
    }

    strengths.set(key, Math.max(strengths.get(key) || 0, alphaMultiplier));
  }

  if (config.revealIncludeCurrentSegment) {
    for (const player of getRenderablePlayers()) {
      if (!player.segment) {
        continue;
      }

      const key = createSegmentKey(
        player.segment.startIntersection,
        player.segment.endIntersection,
      );
      const progressStrength = clamp(player.segment.progress, 0, 1);

      if (progressStrength > 0) {
        strengths.set(key, Math.max(strengths.get(key) || 0, progressStrength));
      }
    }
  }

  return strengths;
}

function getCellBorderSegmentKeys(cell) {
  const topLeft = { col: cell.col, row: cell.row };
  const topRight = { col: cell.col + 1, row: cell.row };
  const bottomLeft = { col: cell.col, row: cell.row + 1 };
  const bottomRight = { col: cell.col + 1, row: cell.row + 1 };

  return {
    top: createSegmentKey(topLeft, topRight),
    right: createSegmentKey(topRight, bottomRight),
    bottom: createSegmentKey(bottomLeft, bottomRight),
    left: createSegmentKey(topLeft, bottomLeft),
  };
}

function getRevealOpacityForEffectiveEdgeCount(effectiveEdgeCount, fullyClosed) {
  const count = clamp(effectiveEdgeCount, 0, 4);

  const points = [
    { count: 0, opacity: 0 },
    { count: 1, opacity: config.revealOpacity1 },
    { count: 2, opacity: config.revealOpacity2 },
    { count: 3, opacity: config.revealOpacity3 },
    { count: 4, opacity: config.revealOpacity4 },
  ];

  let opacity = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (count >= start.count && count <= end.count) {
      const segmentT = end.count === start.count
        ? 1
        : (count - start.count) / (end.count - start.count);
      opacity = lerp(start.opacity, end.opacity, segmentT);
      break;
    }
  }

  if (count >= 4) {
    opacity = config.revealOpacity4;
  }

  if (fullyClosed) {
    opacity += config.revealClosedBonus;
  }

  return clamp(opacity, 0, 1);
}

function updateRevealCells(deltaSeconds) {
  if (!config.revealEnabled) {
    state.revealCells.clear();
    return;
  }

  const edgeStrengths = buildActiveEdgeStrengthMap();
  const deltaMs = deltaSeconds * 1000;
  const activeThreshold = clamp(config.revealEdgeActiveThreshold, 0, 1);
  const seenKeys = new Set();

  for (let col = 0; col < cellCountX(); col += 1) {
    for (let row = 0; row < cellCountY(); row += 1) {
      const cell = { col, row };
      const key = createCellKey(cell);
      const borderKeys = getCellBorderSegmentKeys(cell);
      const borderStrengths = {
        top: edgeStrengths.get(borderKeys.top) || 0,
        right: edgeStrengths.get(borderKeys.right) || 0,
        bottom: edgeStrengths.get(borderKeys.bottom) || 0,
        left: edgeStrengths.get(borderKeys.left) || 0,
      };
      const values = Object.values(borderStrengths);
      const effectiveEdgeCount = values.reduce((sum, value) => sum + value, 0);
      const activeEdgeCount = values.reduce(
        (sum, value) => sum + (value >= activeThreshold ? 1 : 0),
        0,
      );
      const fullyClosed = activeEdgeCount === 4;
      let targetAlpha = getRevealOpacityForEffectiveEdgeCount(effectiveEdgeCount, fullyClosed);
      let entry = state.revealCells.get(key);

      if (targetAlpha > 0) {
        seenKeys.add(key);
      }

      if (!entry && targetAlpha <= 0) {
        continue;
      }

      if (!entry) {
        entry = {
          cell: { ...cell },
          alpha: 0,
          targetAlpha: 0,
          effectiveEdgeCount: 0,
          activeEdgeCount: 0,
          fullyClosed: false,
          borderStrengths,
          activatedAt: state.now,
          lastActiveAt: targetAlpha > 0 ? state.now : 0,
        };
      }

      if (targetAlpha > 0) {
        entry.lastActiveAt = state.now;
      } else if (state.now - entry.lastActiveAt < config.revealHoldMs) {
        targetAlpha = entry.alpha;
      }

      const responseMs = targetAlpha >= entry.alpha
        ? Math.max(0, config.revealFadeInMs)
        : Math.max(1, config.revealFadeOutMs);
      const step = responseMs <= 0 ? 1 : clamp(deltaMs / responseMs, 0, 1);
      const nextAlpha = lerp(entry.alpha, targetAlpha, step);

      entry.alpha = nextAlpha;
      entry.targetAlpha = targetAlpha;
      entry.effectiveEdgeCount = effectiveEdgeCount;
      entry.activeEdgeCount = activeEdgeCount;
      entry.fullyClosed = fullyClosed;
      entry.borderStrengths = borderStrengths;
      state.revealCells.set(key, entry);
    }
  }

  for (const [key, entry] of state.revealCells.entries()) {
    if (seenKeys.has(key)) {
      continue;
    }

    if (entry.alpha <= 0.001 && entry.targetAlpha <= 0.001) {
      state.revealCells.delete(key);
    }
  }
}

function getRevealCellAlpha(entry) {
  return clamp(entry.alpha || 0, 0, 1);
}

function loadRevealImage() {
  const src = String(config.revealImageSrc || '').trim();
  assets.revealRequestId += 1;
  const requestId = assets.revealRequestId;

  assets.revealImageLoaded = false;
  assets.revealImageFailed = false;

  if (!src) {
    assets.revealImageFailed = true;
    rebuildRevealSource();
    return;
  }

  assets.revealImage.onload = () => {
    if (requestId !== assets.revealRequestId) {
      return;
    }

    assets.revealImageLoaded = true;
    assets.revealImageFailed = false;
    rebuildRevealSource();
  };

  assets.revealImage.onerror = () => {
    if (requestId !== assets.revealRequestId) {
      return;
    }

    assets.revealImageLoaded = false;
    assets.revealImageFailed = true;
    rebuildRevealSource();
  };

  assets.revealImage.src = src;
}

function rebuildRevealSource() {
  revealSourceCanvas.width = Math.max(1, Math.round(viewport.width));
  revealSourceCanvas.height = Math.max(1, Math.round(viewport.height));

  revealSourceCtx.clearRect(0, 0, revealSourceCanvas.width, revealSourceCanvas.height);

  if (assets.revealImageLoaded && assets.revealImage.naturalWidth > 0 && assets.revealImage.naturalHeight > 0) {
  drawRevealImageIntoCanvas(
    revealSourceCtx,
    assets.revealImage,
    revealSourceCanvas.width,
    revealSourceCanvas.height,
  );
    return;
  }

  drawFallbackRevealSource();
}

function drawRevealImageIntoCanvas(targetCtx, image, width, height) {
  const fitMode = config.revealImageFitMode || 'native';

  let scale = Math.max(0.01, config.revealImageScale || 1);
  let drawWidth = image.naturalWidth * scale;
  let drawHeight = image.naturalHeight * scale;
  let drawX = config.revealImageOffsetX || 0;
  let drawY = config.revealImageOffsetY || 0;

  if (fitMode === 'contain') {
    const containScale = Math.min(
      width / image.naturalWidth,
      height / image.naturalHeight
    );
    drawWidth = image.naturalWidth * containScale * scale;
    drawHeight = image.naturalHeight * containScale * scale;
  } else if (fitMode === 'cover') {
    const coverScale = Math.max(
      width / image.naturalWidth,
      height / image.naturalHeight
    );
    drawWidth = image.naturalWidth * coverScale * scale;
    drawHeight = image.naturalHeight * coverScale * scale;
  }

  targetCtx.clearRect(0, 0, width, height);
  targetCtx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawFallbackRevealSource() {
  const width = revealSourceCanvas.width;
  const height = revealSourceCanvas.height;

  const baseGradient = revealSourceCtx.createLinearGradient(0, 0, width, height);
  baseGradient.addColorStop(0, '#07111f');
  baseGradient.addColorStop(0.48, '#10192c');
  baseGradient.addColorStop(1, '#03060d');
  revealSourceCtx.fillStyle = baseGradient;
  revealSourceCtx.fillRect(0, 0, width, height);

  const radialA = revealSourceCtx.createRadialGradient(
    width * 0.72,
    height * 0.34,
    0,
    width * 0.72,
    height * 0.34,
    Math.max(width, height) * 0.5,
  );
  radialA.addColorStop(0, 'rgba(98, 168, 255, 0.62)');
  radialA.addColorStop(0.28, 'rgba(47, 96, 181, 0.28)');
  radialA.addColorStop(1, 'rgba(0, 0, 0, 0)');
  revealSourceCtx.fillStyle = radialA;
  revealSourceCtx.fillRect(0, 0, width, height);

  const radialB = revealSourceCtx.createRadialGradient(
    width * 0.24,
    height * 0.66,
    0,
    width * 0.24,
    height * 0.66,
    Math.max(width, height) * 0.42,
  );
  radialB.addColorStop(0, 'rgba(184, 213, 255, 0.24)');
  radialB.addColorStop(0.3, 'rgba(91, 128, 204, 0.18)');
  radialB.addColorStop(1, 'rgba(0, 0, 0, 0)');
  revealSourceCtx.fillStyle = radialB;
  revealSourceCtx.fillRect(0, 0, width, height);

  revealSourceCtx.save();
  revealSourceCtx.strokeStyle = 'rgba(210, 228, 255, 0.08)';
  revealSourceCtx.lineWidth = 1;

  const bandSpacing = Math.max(80, Math.round(config.gridSize * 1.4));
  for (let x = -height; x < width + height; x += bandSpacing) {
    revealSourceCtx.beginPath();
    revealSourceCtx.moveTo(x, 0);
    revealSourceCtx.lineTo(x + height * 0.6, height);
    revealSourceCtx.stroke();
  }

  revealSourceCtx.restore();

  revealSourceCtx.save();
  revealSourceCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  revealSourceCtx.fillRect(width * 0.08, height * 0.16, width * 0.18, height * 0.58);
  revealSourceCtx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  revealSourceCtx.fillRect(width * 0.62, height * 0.08, width * 0.12, height * 0.72);
  revealSourceCtx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  revealSourceCtx.fillRect(width * 0.78, height * 0.22, width * 0.08, height * 0.44);
  revealSourceCtx.restore();

  const vignette = revealSourceCtx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    Math.min(width, height) * 0.2,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.58)');
  revealSourceCtx.fillStyle = vignette;
  revealSourceCtx.fillRect(0, 0, width, height);
}

function drawBaseGrid() {
  const offset = getGridOffset();

  ctx.strokeStyle = colorWithAlpha(config.gridColor, config.gridOpacity);
  ctx.lineWidth = config.gridLineWidth;

  ctx.beginPath();

  for (let x = 0; x <= viewport.width + config.gridSize; x += config.gridSize) {
    ctx.moveTo(x + offset, 0);
    ctx.lineTo(x + offset, viewport.height);
  }

  for (let y = 0; y <= viewport.height + config.gridSize; y += config.gridSize) {
    ctx.moveTo(0, y + offset);
    ctx.lineTo(viewport.width, y + offset);
  }

  ctx.stroke();
}

function drawRevealCells() {
  if (!config.revealEnabled) {
    return;
  }

  for (const entry of state.revealCells.values()) {
    const alpha = getRevealCellAlpha(entry);

    if (alpha <= 0) {
      continue;
    }

    const rect = getCellRect(entry.cell);
    if (rect.width <= 0 || rect.height <= 0) {
      continue;
    }

    ctx.save();
    ctx.globalAlpha = alpha * config.revealImageOpacity;
    ctx.drawImage(
      revealSourceCanvas,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    );
    ctx.restore();

    if (config.revealTintOpacity > 0) {
      ctx.save();
      ctx.fillStyle = colorWithAlpha(config.revealTintColor, alpha * config.revealTintOpacity);
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.restore();
    }
  }
}

function drawRevealCellDebug() {
  if (!config.showRevealCells) {
    return;
  }

  ctx.save();

  for (const entry of state.revealCells.values()) {
    const rect = getCellRect(entry.cell);
    const alpha = getRevealCellAlpha(entry);

    if (alpha <= 0) {
      continue;
    }

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.16 + alpha * 0.4})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, Math.max(0, rect.width - 1), Math.max(0, rect.height - 1));

    ctx.fillStyle = `rgba(255, 255, 255, ${0.18 + alpha * 0.42})`;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(entry.activeEdgeCount), rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
  }

  ctx.restore();
}

function drawSingleActiveEdgeLine(startX, startY, endX, endY, alphaMultiplier = 1) {
  ctx.save();
  ctx.lineCap = config.activeEdgeLineCap;
  ctx.lineJoin = config.activeEdgeLineCap;

  const lineAlpha = config.activeEdgeOpacity * alphaMultiplier;
  const glowAlpha = config.activeEdgeGlowOpacity * alphaMultiplier;
  const glowSpread = Math.max(0, config.activeEdgeGlowWidth);
  const glowEmitterWidth = Math.max(1.25, config.activeEdgeLineWidth + glowSpread * 0.28);
  const glowStrokeAlpha = Math.min(1, glowAlpha * 0.16);

  if (glowAlpha > 0 && (config.activeEdgeGlowBlur > 0 || glowSpread > 0)) {
    ctx.shadowBlur = config.activeEdgeGlowBlur + glowSpread;
    ctx.shadowColor = colorWithAlpha(config.activeEdgeGlowColor, glowAlpha);
    ctx.strokeStyle = colorWithAlpha(config.activeEdgeGlowColor, glowStrokeAlpha);
    ctx.lineWidth = glowEmitterWidth;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0, 0, 0, 0)';
  ctx.strokeStyle = colorWithAlpha(config.activeEdgeColor, lineAlpha);
  ctx.lineWidth = Math.max(0.5, config.activeEdgeLineWidth);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.restore();
}

function drawActiveEdges() {
  if (!config.activeEdgeEnabled) {
    return;
  }

  for (const edge of state.activeEdges.values()) {
    const alphaMultiplier = getActiveEdgeAlphaMultiplier(edge);

    if (alphaMultiplier <= 0) {
      continue;
    }

    const startPoint = toPoint(edge.start);
    const endPoint = toPoint(edge.end);

    drawSingleActiveEdgeLine(
      startPoint.x,
      startPoint.y,
      endPoint.x,
      endPoint.y,
      alphaMultiplier,
    );
  }
}

function drawActiveSegments() {
  if (!config.activeEdgeEnabled) {
    return;
  }

  for (const player of getRenderablePlayers()) {
    if (!player.segment) {
      continue;
    }

    const startPoint = toPoint(player.segment.startIntersection);

    drawSingleActiveEdgeLine(
      startPoint.x,
      startPoint.y,
      player.x,
      player.y,
      1,
    );
  }
}

function roundedRectPath(x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width * 0.5, height * 0.5);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function drawPlayerLabel(player, x, y, alpha) {
  if (!config.showPlayerIds) {
    return;
  }

  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(player.id, x, y - 10);
  ctx.restore();
}

function drawNode(player) {
  if (!player.visible) {
    return;
  }

  const spawnElapsed = player.spawnedAt == null
    ? config.spawnFadeMs
    : state.now - player.spawnedAt;

  const spawnT = config.spawnFadeMs <= 0
    ? 1
    : clamp(spawnElapsed / config.spawnFadeMs, 0, 1);

  const spawnAlpha = clamp(spawnT * 2.4, 0, 1);
  const spawnScale = lerp(
    Math.max(1, config.nodeSpawnStartScale),
    1,
    easeOutBack(spawnT, config.nodeSpawnBounce),
  );

  const timeSeconds = state.now * 0.001;
  const pulse = 1 + Math.sin(timeSeconds * config.pulseSpeed) * config.nodePulseAmplitude;
  const width = config.nodeWidth * pulse * spawnScale;
  const height = config.nodeHeight * pulse * spawnScale;
  const x = player.x - width * 0.5;
  const y = player.y - height * 0.5;

  ctx.save();
  ctx.shadowBlur = config.nodeGlowBlur;
  ctx.shadowColor = colorWithAlpha(config.nodeGlowColor, config.nodeGlowOpacity * spawnAlpha);
  ctx.fillStyle = colorWithAlpha(config.nodeColor, spawnAlpha);
  roundedRectPath(x, y, width, height, config.nodeRadius);
  ctx.fill();

  if (config.nodeBorderWidth > 0 && config.nodeBorderOpacity > 0) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = colorWithAlpha(config.nodeBorderColor, config.nodeBorderOpacity * spawnAlpha);
    ctx.lineWidth = config.nodeBorderWidth;
    roundedRectPath(x, y, width, height, config.nodeRadius);
    ctx.stroke();
  }

  ctx.restore();

  drawPlayerLabel(player, player.x, y, spawnAlpha);
}

function drawNodes() {
  for (const player of getRenderablePlayers()) {
    drawNode(player);
  }
}

function drawDebugTarget() {
  if (!config.showTarget || !state.pointer.targetIntersection) {
    return;
  }

  const point = toPoint(state.pointer.targetIntersection);

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawDebugIntersections() {
  if (!config.showIntersections) {
    return;
  }

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';

  for (let col = 0; col <= maxGridCol(); col += 1) {
    for (let row = 0; row <= maxGridRow(); row += 1) {
      const point = toPoint({ col, row });
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.75, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  if (!config.gridOverReveal) {
    drawBaseGrid();
  }

  drawRevealCells();

  if (config.gridOverReveal) {
    drawBaseGrid();
  }

  drawActiveEdges();
  drawActiveSegments();
  drawRevealCellDebug();
  drawDebugIntersections();
  drawDebugTarget();
  drawNodes();
}

function resize() {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  viewport.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  canvas.width = Math.round(viewport.width * viewport.dpr);
  canvas.height = Math.round(viewport.height * viewport.dpr);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  rebuildRevealSource();

  for (const player of state.players.values()) {
    if (player.visible && player.current) {
      const clamped = {
        col: clamp(player.current.col, 0, maxGridCol()),
        row: clamp(player.current.row, 0, maxGridRow()),
      };

      placePlayerAt(player, clamped);
      player.pathQueue = [];
      player.segment = null;
      player.turnHoldUntil = 0;
    }
  }

  if (state.pointer.active) {
    refreshPointerTargetFromStoredPointer();
  }

  const localPlayer = getLocalPlayer();
  if (localPlayer && !playerCanFollowPointer(localPlayer)) {
    localPlayer.desiredTarget = null;
  }

  sendLocalPlayerState(true);
}

function updatePointerTarget(clientX, clientY) {
  state.pointer.active = true;
  state.pointer.x = clientX;
  state.pointer.y = clientY;
  refreshPointerTargetFromStoredPointer();
}

canvas.addEventListener('pointermove', (event) => {
  updatePointerTarget(event.clientX, event.clientY);
});

canvas.addEventListener('pointerdown', (event) => {
  updatePointerTarget(event.clientX, event.clientY);
});

window.addEventListener('resize', () => {
  resize();
  applyGuiLayout(guiInstance);
});

function animate(now) {
  const deltaSeconds = Math.min(0.05, (now - state.now) * 0.001);
  state.now = now;

  if (state.pointer.active) {
    refreshPointerTargetFromStoredPointer();
  }

  updateLocalPlayer(deltaSeconds);
  sendLocalPlayerState();
  clearExpiredActiveEdges();
  updateRevealCells(deltaSeconds);
  render();

  requestAnimationFrame(animate);
}

function setupGui() {
  const gui = new GUI({ title: 'Grid Controls' });
  guiInstance = gui;

  const sceneFolder = gui.addFolder('Scene');
  sceneFolder.addColor(config, 'backgroundColor').name('Background');

  const gridFolder = gui.addFolder('Base Grid');
  gridFolder.add(config, 'gridSize', 40, 200, 1).name('Size');
  gridFolder.addColor(config, 'gridColor').name('Color');
  gridFolder.add(config, 'gridOpacity', 0, 1, 0.01).name('Opacity');
  gridFolder.add(config, 'gridLineWidth', 1, 4, 1).name('Line Width');
  gridFolder.add(config, 'gridOverReveal').name('Over Reveal');

  const motionFolder = gui.addFolder('Motion');
  motionFolder.add(config, 'spawnDelayMs', 0, 3000, 10).name('Spawn Delay');
  motionFolder.add(config, 'spawnFadeMs', 0, 2000, 10).name('Spawn Fade');
  motionFolder.add(config, 'followPointerDelayMs', 0, 3000, 10).name('Follow Delay');
  motionFolder.add(config, 'moveSpeed', 60, 1200, 1).name('Speed');
  motionFolder.add(config, 'routePreference', ['horizontal-first', 'vertical-first', 'alternating']).name('Routing');
  motionFolder.add(config, 'turnPauseMs', 0, 500, 5).name('Turn Pause');
  motionFolder.add(config, 'segmentEasing', 0, 1, 0.01).name('Smoothing');

  const nodeFolder = gui.addFolder('Node');
  nodeFolder.addColor(config, 'nodeColor').name('Fill');
  nodeFolder.addColor(config, 'nodeBorderColor').name('Border');
  nodeFolder.add(config, 'nodeBorderOpacity', 0, 1, 0.01).name('Border Alpha');
  nodeFolder.add(config, 'nodeBorderWidth', 0, 4, 0.5).name('Border Width');
  nodeFolder.addColor(config, 'nodeGlowColor').name('Glow');
  nodeFolder.add(config, 'nodeGlowOpacity', 0, 1, 0.01).name('Glow Alpha');
  nodeFolder.add(config, 'nodeGlowBlur', 0, 60, 1).name('Glow Blur');
  nodeFolder.add(config, 'nodeWidth', 6, 64, 1).name('Width');
  nodeFolder.add(config, 'nodeHeight', 6, 48, 1).name('Height');
  nodeFolder.add(config, 'nodeRadius', 0, 24, 1).name('Corner Radius');
  nodeFolder.add(config, 'nodePulseAmplitude', 0, 0.3, 0.005).name('Pulse Amount');
  nodeFolder.add(config, 'pulseSpeed', 0, 12, 0.05).name('Pulse Speed');
  nodeFolder.add(config, 'nodeSpawnStartScale', 1, 16, 0.1).name('Spawn Start Scale');
  nodeFolder.add(config, 'nodeSpawnBounce', 0, 3, 0.05).name('Spawn Bounce');

  const activeEdgeFolder = gui.addFolder('Active Edges');
  activeEdgeFolder.add(config, 'activeEdgeEnabled').name('Enabled');
  activeEdgeFolder.addColor(config, 'activeEdgeColor').name('Line');
  activeEdgeFolder.add(config, 'activeEdgeOpacity', 0, 1, 0.01).name('Line Alpha');
  activeEdgeFolder.addColor(config, 'activeEdgeGlowColor').name('Glow');
  activeEdgeFolder.add(config, 'activeEdgeGlowOpacity', 0, 1, 0.01).name('Glow Alpha');
  activeEdgeFolder.add(config, 'activeEdgeLineWidth', 1, 12, 0.1).name('Line Width');
  activeEdgeFolder.add(config, 'activeEdgeGlowWidth', 0, 28, 0.5).name('Glow Spread');
  activeEdgeFolder.add(config, 'activeEdgeLineCap', ['round', 'butt', 'square']).name('Cap Style');
  activeEdgeFolder.add(config, 'activeEdgeGlowBlur', 0, 60, 1).name('Glow Blur');
  activeEdgeFolder.add(config, 'activeEdgeHoldMs', 0, 4000, 10).name('Hold Time');
  activeEdgeFolder.add(config, 'activeEdgeFadeMs', 50, 6000, 10).name('Fade Time');

  const revealFolder = gui.addFolder('Reveal');
  revealFolder.add(config, 'revealEnabled').name('Enabled');
  revealFolder.add(config, 'revealImageSrc').name('Image Src').onFinishChange(() => {
    loadRevealImage();
  });
  revealFolder.add(config, 'revealImageFitMode', ['native', 'contain', 'cover'])
  .name('Image Fit')
  .onChange(() => {
    rebuildRevealSource();
  });

revealFolder.add(config, 'revealImageScale', 0.1, 4, 0.01)
  .name('Image Scale')
  .onChange(() => {
    rebuildRevealSource();
  });

revealFolder.add(config, 'revealImageOffsetX', -4000, 4000, 1)
  .name('Image Offset X')
  .onChange(() => {
    rebuildRevealSource();
  });

revealFolder.add(config, 'revealImageOffsetY', -4000, 4000, 1)
  .name('Image Offset Y')
  .onChange(() => {
    rebuildRevealSource();
  });

  revealFolder.add(config, 'revealIncludeCurrentSegment').name('Live Segment');
  revealFolder.add(config, 'revealEdgeActiveThreshold', 0, 1, 0.01).name('Active Threshold');
  revealFolder.add(config, 'revealOpacity1', 0, 1, 0.01).name('1 Edge Alpha');
  revealFolder.add(config, 'revealOpacity2', 0, 1, 0.01).name('2 Edge Alpha');
  revealFolder.add(config, 'revealOpacity3', 0, 1, 0.01).name('3 Edge Alpha');
  revealFolder.add(config, 'revealOpacity4', 0, 1, 0.01).name('4 Edge Alpha');
  revealFolder.add(config, 'revealClosedBonus', 0, 0.25, 0.01).name('Closed Bonus');
  revealFolder.add(config, 'revealFadeInMs', 0, 1200, 10).name('Fade In');
  revealFolder.add(config, 'revealHoldMs', 0, 4000, 10).name('Hold Time');
  revealFolder.add(config, 'revealFadeOutMs', 0, 4000, 10).name('Fade Out');
  revealFolder.add(config, 'revealImageOpacity', 0, 1, 0.01).name('Image Alpha');
  revealFolder.addColor(config, 'revealTintColor').name('Tint');
  revealFolder.add(config, 'revealTintOpacity', 0, 1, 0.01).name('Tint Alpha');

  const debugFolder = gui.addFolder('Debug');
  debugFolder.add(config, 'showTarget').name('Target');
  debugFolder.add(config, 'showIntersections').name('Intersections');
  debugFolder.add(config, 'showRevealCells').name('Reveal Cells');
  debugFolder.add(config, 'showPlayerIds').name('Player IDs');

  const networkFolder = gui.addFolder('Network');
  networkFolder.add(config, 'networkEnabled').name('Enabled').onChange((value) => {
    if (value) {
      connectNetwork({ force: true });
    } else {
      disconnectNetwork({ manual: true });
    }
  });
  networkFolder.add(config, 'networkUrl').name('WS URL').onFinishChange(() => {
    if (config.networkEnabled) {
      connectNetwork({ force: true });
    }
  });
  networkFolder.add(config, 'networkSendIntervalMs', 20, 250, 5).name('Send Interval');
  networkFolder.add(config, 'networkReconnectDelayMs', 250, 5000, 50).name('Reconnect Delay');
  networkFolder.add(networkInfo, 'status').name('Status').listen();
  networkFolder.add(networkInfo, 'roomId').name('Room').listen();
  networkFolder.add(networkInfo, 'players').name('Players').listen();
  networkFolder.add(networkInfo, 'shareUrl').name('Share WS').listen();

  const utilitiesFolder = gui.addFolder('Utilities');
  utilitiesFolder.add(actions, 'clearActiveEdges').name('Clear Active Edges');
  utilitiesFolder.add(actions, 'clearRevealCells').name('Clear Reveal Cells');
  utilitiesFolder.add(actions, 'randomizeSpawn').name('Random Spawn');
  utilitiesFolder.add(actions, 'reconnectNetwork').name('Reconnect Network');
  utilitiesFolder.add(actions, 'disconnectNetwork').name('Disconnect Network');
  utilitiesFolder.add(actions, 'addDebugPlayer').name('Add Debug Player');
  utilitiesFolder.add(actions, 'clearDebugPlayers').name('Clear Debug Players');
  utilitiesFolder.add(actions, 'reloadRevealImage').name('Reload Reveal Image');
  utilitiesFolder.add(actions, 'copyConfig').name('Copy Config');

  gui.close();
  applyGuiLayout(gui);
} 

resize();
setupGui();
loadRevealImage();

if (config.networkEnabled) {
  connectNetwork();
}

window.addEventListener('beforeunload', () => {
  disconnectNetwork({ manual: true });
});

requestAnimationFrame((now) => {
  state.startTime = now;
  state.now = now;
  requestAnimationFrame(animate);
});
