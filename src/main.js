import { countLockedCellStates as countLockedCellEntries, updateCellEnergyState } from './cellEnergy.js';
import { buildNamedSnapshot, parseNamedSnapshot } from './configSnapshots.js';
import { createGuiManager } from './gui.js';
import { createNetworkController } from './networking.js';
import './style.css';
import { clearExpiredTrailEdges, getTrailEdgeAlphaMultiplier, touchTrailEdge } from './trailEffects.js';
import packageInfo from '../package.json';

const canvas = document.querySelector('#app');
const ctx = canvas.getContext('2d');

function formatAmsterdamBuildTimestamp(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return `${parts.hour}:${parts.minute}:${parts.second}-${parts.day}/${parts.month}`;
}

const buildTimestamp = typeof __BUILD_TIMESTAMP__ !== 'undefined' && __BUILD_TIMESTAMP__
  ? __BUILD_TIMESTAMP__
  : formatAmsterdamBuildTimestamp();

const buildInfoLabel = `nodegame v${packageInfo.version} (${buildTimestamp})`;

document.title = 'nodegame';

const buildInfoBadge = document.createElement('div');
buildInfoBadge.className = 'build-info-badge';
buildInfoBadge.textContent = buildInfoLabel;
document.body.appendChild(buildInfoBadge);

function parseCssPixelValue(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function getSafeAreaInsets() {
  const styles = getComputedStyle(document.documentElement);
  return {
    left: parseCssPixelValue(styles.getPropertyValue('--safe-left')),
    right: parseCssPixelValue(styles.getPropertyValue('--safe-right')),
    top: parseCssPixelValue(styles.getPropertyValue('--safe-top')),
    bottom: parseCssPixelValue(styles.getPropertyValue('--safe-bottom')),
  };
}

function getViewportSize() {
  const visualViewport = window.visualViewport;
  const safeArea = getSafeAreaInsets();
  const widthCandidates = [
    visualViewport && visualViewport.width,
    window.innerWidth,
    document.documentElement && document.documentElement.clientWidth,
    document.body && document.body.clientWidth,
  ].filter((value) => Number.isFinite(value) && value > 0);
  const baseWidth = Math.max(...widthCandidates);
  const height = visualViewport && Number.isFinite(visualViewport.height)
    ? visualViewport.height
    : window.innerHeight;

  return {
    width: Math.max(1, Math.round(baseWidth + safeArea.left + safeArea.right)),
    height: Math.max(1, Math.round(height + safeArea.top + safeArea.bottom)),
    safeArea,
  };
}


const revealSourceCanvas = document.createElement('canvas');
const revealSourceCtx = revealSourceCanvas.getContext('2d');

const LOCAL_PLAYER_ID = 'local';
const NPC_PLAYER_PREFIX = 'npc-';
const NPC_PATCH_LOOP_COUNT = 2;
const NPC_PATCH_MIN_SEPARATION = 4;

function getDefaultNetworkUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname || 'localhost';

  if (window.location.port === '5173') {
    return `${protocol}//${hostname}:8080`;
  }

  return `${protocol}//${window.location.host}`;
}

const config = {
  flatBackgroundColor: "#000000",
  backgroundGradientEnabled: true,
  backgroundGradientTopColor: "#000000",
  backgroundGradientBottomColor: "#0b1728",
  backgroundGradientTopAlpha: 1,
  backgroundGradientBottomAlpha: 1,
  gridSize: 84,
  minCellScreenPx: 32,
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
  trailEnabled: false,
  trailColor: "#b8d5ff",
  trailOpacity: 0.95,
  trailGlowColor: "#6ea9ff",
  trailGlowOpacity: 0.93,
  trailLineWidth: 1,
  trailGlowWidth: 26,
  trailLineCap: "square",
  trailGlowBlur: 32,
  trailHoldMs: 50,
  trailFadeMs: 670,
  npcHelperCount: 1,
  revealEnabled: true,
  revealImageSrc: "/teaser-hidden.jpg",
  revealImageFitMode: 'native',
  revealImageScale: 1,
  revealImageOffsetX: 0,
  revealImageOffsetY: 0,
  revealVignetteEnabled: true,
  revealVignetteMode: 'alpha',
  revealVignetteColor: "#000000",
  revealVignetteInnerOpacity: 0,
  revealVignetteEdgeOpacity: 1,
  revealVignetteSize: 100,
  revealVignetteCurve: 1,
  revealImageOpacity: 1,
  revealTintColor: "#000000",
  revealTintOpacity: 0,
  cellChargePerSecond: 1.1,
  cellChargeRingFalloff: 0.5,
  cellRingFloorEnabled: true,
  cellRingFloor: 0,
  cellChargeMaxRing: 2,
  cellEnergyEffect: 1,
  coopBuffEffect: 1,
  cellChargeBuffPerPlayer: 0,
  cellRingFalloffBonusPerPlayer: 0,
  cellRingFloorBonusPerPlayer: 0,
  cellRingCountBonusPerPlayer: 0,
  cellDecayMs: 1800,
  cellDecayBonusMsPerPlayer: 400,
  cellLockHoldMs: 1600,
  cellLockHoldBonusMsPerPlayer: 800,
  cellLinkedLockFade: true,
  gridOverReveal: true,
  showTarget: false,
  showGridIntersections: true,
  showHeldCells: false,
  showEnergyOverlay: false,
  showPlayerIds: false,
  showViewportDebug: false,
  networkUrl: getDefaultNetworkUrl(),
  networkSendIntervalMs: 50,
  networkReconnectDelayMs: 1500,
};

function createDefaultRoomWorld() {
  return {
    cols: 20,
    rows: 12,
    cellSize: config.gridSize,
    minCellScreenPx: config.minCellScreenPx,
    movementBounds: {
      minCol: -100,
      maxCol: 120,
      minRow: -100,
      maxRow: 112,
    },
    image: {
      fitMode: config.revealImageFitMode,
      scale: config.revealImageScale,
      offsetX: config.revealImageOffsetX,
      offsetY: config.revealImageOffsetY,
      vignetteEnabled: config.revealVignetteEnabled,
      vignetteMode: config.revealVignetteMode,
      vignetteColor: config.revealVignetteColor,
      vignetteInnerOpacity: config.revealVignetteInnerOpacity,
      vignetteEdgeOpacity: config.revealVignetteEdgeOpacity,
      vignetteSize: config.revealVignetteSize,
      vignetteCurve: config.revealVignetteCurve,
    },
  };
}

function clampInteger(value, min, max, fallback) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return clamp(number, min, max);
}

function clampFiniteNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return clamp(number, min, max);
}

function sanitizeRoomWorld(value = {}) {
  const fallback = createDefaultRoomWorld();
  const image = value.image && typeof value.image === 'object'
    ? value.image
    : {};
  const rawMovementBounds = value.movementBounds && typeof value.movementBounds === 'object'
    ? value.movementBounds
    : {};
  const cols = clampInteger(value.cols, 1, 200, fallback.cols);
  const rows = clampInteger(value.rows, 1, 200, fallback.rows);
  const movementBounds = {
    minCol: clampInteger(rawMovementBounds.minCol, -10000, cols, fallback.movementBounds.minCol),
    maxCol: clampInteger(rawMovementBounds.maxCol, cols, 10000, fallback.movementBounds.maxCol),
    minRow: clampInteger(rawMovementBounds.minRow, -10000, rows, fallback.movementBounds.minRow),
    maxRow: clampInteger(rawMovementBounds.maxRow, rows, 10000, fallback.movementBounds.maxRow),
  };

  return {
    cols,
    rows,
    cellSize: clampFiniteNumber(value.cellSize, 20, 400, fallback.cellSize),
    minCellScreenPx: clampFiniteNumber(value.minCellScreenPx, 12, 160, fallback.minCellScreenPx),
    movementBounds,
    image: {
      fitMode: ['native', 'contain', 'cover'].includes(image.fitMode)
        ? image.fitMode
        : fallback.image.fitMode,
      scale: clampFiniteNumber(image.scale, 0.01, 10, fallback.image.scale),
      offsetX: Number.isFinite(Number(image.offsetX)) ? Number(image.offsetX) : fallback.image.offsetX,
      offsetY: Number.isFinite(Number(image.offsetY)) ? Number(image.offsetY) : fallback.image.offsetY,
      vignetteEnabled: image.vignetteEnabled == null
        ? fallback.image.vignetteEnabled
        : !!image.vignetteEnabled,
      vignetteMode: ['alpha', 'color'].includes(image.vignetteMode)
        ? image.vignetteMode
        : fallback.image.vignetteMode,
      vignetteColor: typeof image.vignetteColor === 'string'
        ? image.vignetteColor
        : fallback.image.vignetteColor,
      vignetteInnerOpacity: clampFiniteNumber(
        image.vignetteInnerOpacity,
        0,
        1,
        fallback.image.vignetteInnerOpacity,
      ),
      vignetteEdgeOpacity: clampFiniteNumber(
        image.vignetteEdgeOpacity,
        0,
        1,
        fallback.image.vignetteEdgeOpacity,
      ),
      vignetteSize: clampFiniteNumber(image.vignetteSize, 0, 2000, fallback.image.vignetteSize),
      vignetteCurve: clampFiniteNumber(image.vignetteCurve, 0.1, 6, fallback.image.vignetteCurve),
    },
  };
}

const viewport = {
  ...getViewportSize(),
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
  activeEdges: new Map(), // Local visual-only trail feedback.
  cellStates: new Map(), // Local client-owned cell-energy reveal state.
  room: {
    world: createDefaultRoomWorld(),
  },
  view: {
    scale: 1,
    fitScale: 1,
    minScale: 1,
    offsetX: 0,
    offsetY: 0,
    worldWidth: 1,
    worldHeight: 1,
  },
  alternatingAxisStartsHorizontal: true,
  npc: {
    patchCell: null,
    lastPatchCell: null,
    patchVersion: 0,
  },
  network: {
    status: 'disconnected',
    roomId: null,
    serverPlayerId: null,
    playerCount: 1,
    shareUrl: '-',
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

function buildConfigSnapshot() {
  return buildNamedSnapshot('config', config);
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fall through to legacy copy behavior.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch (error) {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
}

async function readTextFromClipboard() {
  if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        return text;
      }
    } catch (error) {
      // Fall through to manual paste prompt.
    }
  }

  const manualText = window.prompt('Paste a copied config snapshot here:', '');
  return typeof manualText === 'string' ? manualText : null;
}

function parseConfigSnapshot(text) {
  return parseNamedSnapshot(text, 'config');
}

function applyConfigSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return 0;
  }

  const previousConfig = { ...config };
  let appliedCount = 0;

  for (const [key, incomingValue] of Object.entries(snapshot)) {
    if (!Object.prototype.hasOwnProperty.call(config, key)) {
      continue;
    }

    const currentValue = config[key];
    let nextValue = currentValue;

    if (typeof currentValue === 'number') {
      const numericValue = Number(incomingValue);
      if (!Number.isFinite(numericValue)) {
        continue;
      }
      nextValue = numericValue;
    } else if (typeof currentValue === 'boolean') {
      nextValue = typeof incomingValue === 'boolean'
        ? incomingValue
        : String(incomingValue).trim().toLowerCase() === 'true';
    } else if (typeof currentValue === 'string') {
      nextValue = String(incomingValue);
    } else {
      continue;
    }

    if (Object.is(currentValue, nextValue)) {
      continue;
    }

    config[key] = nextValue;
    appliedCount += 1;
  }

  if (appliedCount <= 0) {
    guiManager.updateRevealVignetteState();
    guiManager.refreshDisplay();
    return 0;
  }

  guiManager.updateRevealVignetteState();

  const geometryChanged = previousConfig.gridSize !== config.gridSize
    || previousConfig.minCellScreenPx !== config.minCellScreenPx;
  const roomWorldChanged = geometryChanged
    || previousConfig.revealImageFitMode !== config.revealImageFitMode
    || previousConfig.revealImageScale !== config.revealImageScale
    || previousConfig.revealImageOffsetX !== config.revealImageOffsetX
    || previousConfig.revealImageOffsetY !== config.revealImageOffsetY
    || previousConfig.revealVignetteEnabled !== config.revealVignetteEnabled
    || previousConfig.revealVignetteMode !== config.revealVignetteMode
    || previousConfig.revealVignetteColor !== config.revealVignetteColor
    || previousConfig.revealVignetteInnerOpacity !== config.revealVignetteInnerOpacity
    || previousConfig.revealVignetteEdgeOpacity !== config.revealVignetteEdgeOpacity
    || previousConfig.revealVignetteSize !== config.revealVignetteSize
    || previousConfig.revealVignetteCurve !== config.revealVignetteCurve;
  const revealImageChanged = previousConfig.revealImageSrc !== config.revealImageSrc;
  const networkChanged = previousConfig.networkUrl !== config.networkUrl;

  if (roomWorldChanged) {
    syncRoomWorldFromConfig({ geometryChanged });
  } else if (state.pointer.active) {
    refreshPointerTargetFromStoredPointer();
  }

  if (revealImageChanged) {
    loadRevealImage();
  }

  if (networkChanged) {
    connectNetwork({ force: true });
  }

  guiManager.refreshDisplay();
  return appliedCount;
}

const actions = {
  clearActiveEdges() {
    state.activeEdges.clear();
  },
  clearCellStates() {
    state.cellStates.clear();
  },
  reloadRevealImage() {
    loadRevealImage();
  },
  resetServer() {
    const resetAccepted = resetServerState();
    if (!resetAccepted) {
      window.alert('Reset Server needs an active websocket connection.');
    }
  },
  async copyConfig() {
    const snapshot = buildConfigSnapshot();
    const copied = await copyTextToClipboard(snapshot);

    if (copied) {
      console.info('Config copied to clipboard.');
      return;
    }

    window.prompt('Copy config snapshot:', snapshot);
  },
  async pasteConfig() {
    const snapshotText = await readTextFromClipboard();
    if (snapshotText == null) {
      return;
    }

    const parsedSnapshot = parseConfigSnapshot(snapshotText);
    if (!parsedSnapshot) {
      window.alert('Could not parse config snapshot from clipboard.');
      return;
    }

    const appliedCount = applyConfigSnapshot(parsedSnapshot);
    if (appliedCount > 0) {
      console.info(`Applied ${appliedCount} config values from snapshot.`);
      return;
    }

    console.info('No config values changed from pasted snapshot.');
  },
};

const guiManager = createGuiManager({
  config,
  actions,
  networkInfo,
  getViewportSize,
  clamp,
  callbacks: {
    syncRoomWorldFromConfig,
    loadRevealImage,
    connectNetwork,
  },
});

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

function isNpcPlayerId(playerId) {
  return String(playerId || '').startsWith(NPC_PLAYER_PREFIX);
}

function isRemotePlayerId(playerId) {
  return playerId !== LOCAL_PLAYER_ID && !isNpcPlayerId(playerId);
}

function getNpcIndexFromPlayerId(playerId) {
  const suffix = String(playerId || '').slice(NPC_PLAYER_PREFIX.length);
  const index = Number.parseInt(suffix, 10);
  return Number.isFinite(index) ? index : 0;
}

function getNpcPlayers() {
  return Array.from(state.players.values())
    .filter((player) => isNpcPlayerId(player.id))
    .sort((a, b) => getNpcIndexFromPlayerId(a.id) - getNpcIndexFromPlayerId(b.id));
}

function countVisibleNpcPlayers() {
  let count = 0;

  for (const player of state.players.values()) {
    if (player.visible && isNpcPlayerId(player.id)) {
      count += 1;
    }
  }

  return count;
}

function updateNetworkInfo() {
  networkInfo.status = state.network.status;
  networkInfo.roomId = state.network.roomId || '-';
  networkInfo.shareUrl = state.network.shareUrl || '-';

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

function getEffectiveRoomPlayerCount() {
  const helperCount = countVisibleNpcPlayers();

  if (state.network.roomId) {
    return Math.max(1, Math.round(state.network.playerCount || 1) + helperCount);
  }

  let visiblePlayers = 0;
  for (const player of state.players.values()) {
    if (player.visible) {
      visiblePlayers += 1;
    }
  }

  return Math.max(1, visiblePlayers);
}

function getEffectiveCoopExtraPlayers() {
  return Math.max(0, getEffectiveRoomPlayerCount() - 1);
}

function getCoopBuffEffectScale() {
  return Math.max(0, Number(config.coopBuffEffect) || 0);
}

function getCellEnergyEffectScale() {
  return Math.max(0, Number(config.cellEnergyEffect) || 0);
}

function getEffectiveBaseCellChargePerSecond() {
  return Math.max(0, Number(config.cellChargePerSecond) || 0) * getCellEnergyEffectScale();
}

function getEffectiveCellChargeMultiplier() {
  const perExtraPlayerBuff = Math.max(0, Number(config.cellChargeBuffPerPlayer) || 0);
  return 1 + perExtraPlayerBuff * getCoopBuffEffectScale() * getEffectiveCoopExtraPlayers();
}

function getEffectiveCellChargeRingFalloff() {
  const baseFalloff = clamp(
    (Number(config.cellChargeRingFalloff) || 0) * getCellEnergyEffectScale(),
    0,
    1,
  );
  const perExtraPlayerBonus = Math.max(0, Number(config.cellRingFalloffBonusPerPlayer) || 0);
  const buffedFalloff = baseFalloff
    + perExtraPlayerBonus * getCoopBuffEffectScale() * getEffectiveCoopExtraPlayers();
  return clamp(buffedFalloff, 0, 1);
}

function getEffectiveCellRingFloor() {
  const baseFloor = clamp((Number(config.cellRingFloor) || 0) * getCellEnergyEffectScale(), 0, 1);
  const perExtraPlayerBonus = Math.max(0, Number(config.cellRingFloorBonusPerPlayer) || 0);
  const buffedFloor = baseFloor
    + perExtraPlayerBonus * getCoopBuffEffectScale() * getEffectiveCoopExtraPlayers();
  return clamp(buffedFloor, 0, 1);
}

function getEffectiveCellChargeMaxRing() {
  const baseRingCount = Math.max(
    0,
    Math.floor((Number(config.cellChargeMaxRing) || 0) * getCellEnergyEffectScale() + 1e-6),
  );
  const perExtraPlayerBonus = Math.max(0, Number(config.cellRingCountBonusPerPlayer) || 0);
  const buffedRingCount = baseRingCount
    + perExtraPlayerBonus * getCoopBuffEffectScale() * getEffectiveCoopExtraPlayers();
  return Math.max(0, Math.floor(buffedRingCount + 1e-6));
}

function getEffectiveCellDecayMs() {
  const baseDecayMs = Math.max(1, (Number(config.cellDecayMs) || 1) * getCellEnergyEffectScale());
  const perExtraPlayerBonus = Math.max(0, Number(config.cellDecayBonusMsPerPlayer) || 0);
  return Math.max(
    1,
    baseDecayMs + perExtraPlayerBonus * getCoopBuffEffectScale() * getEffectiveCoopExtraPlayers(),
  );
}

function getEffectiveCellLockHoldMs() {
  const baseHoldMs = Math.max(0, (Number(config.cellLockHoldMs) || 0) * getCellEnergyEffectScale());
  const perExtraPlayerBonus = Math.max(0, Number(config.cellLockHoldBonusMsPerPlayer) || 0);
  return Math.max(
    0,
    baseHoldMs + perExtraPlayerBonus * getCoopBuffEffectScale() * getEffectiveCoopExtraPlayers(),
  );
}

function getEffectiveNodePulseSpeed() {
  const playerCount = Math.max(1, getEffectiveRoomPlayerCount());
  return Math.max(0, Number(config.pulseSpeed) || 0) * (playerCount / 2);
}

function getEffectiveNodeGlowOpacity() {
  const playerCount = Math.max(1, getEffectiveRoomPlayerCount());
  return clamp((Number(config.nodeGlowOpacity) || 0) * (playerCount / 3), 0, 1);
}

function getEffectiveNodeGlowBlur() {
  const playerCount = Math.max(1, getEffectiveRoomPlayerCount());
  return Math.max(0, (Number(config.nodeGlowBlur) || 0) * (playerCount / 3));
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

function resetRemoteState() {
  removeRemotePlayers();
  updateNetworkInfo();
}

function syncConfigFromRoomWorld(world) {
  config.gridSize = world.cellSize;
  config.minCellScreenPx = world.minCellScreenPx;
  config.revealImageFitMode = world.image.fitMode;
  config.revealImageScale = world.image.scale;
  config.revealImageOffsetX = world.image.offsetX;
  config.revealImageOffsetY = world.image.offsetY;
  config.revealVignetteEnabled = world.image.vignetteEnabled;
  config.revealVignetteMode = world.image.vignetteMode;
  config.revealVignetteColor = world.image.vignetteColor;
  config.revealVignetteInnerOpacity = world.image.vignetteInnerOpacity;
  config.revealVignetteEdgeOpacity = world.image.vignetteEdgeOpacity;
  config.revealVignetteSize = world.image.vignetteSize;
  config.revealVignetteCurve = world.image.vignetteCurve;
  guiManager.updateRevealVignetteState();
}

function clampPlayersToRoomWorld() {
  for (const player of state.players.values()) {
    if (!player.current) {
      continue;
    }

    const clamped = {
      col: clamp(player.current.col, minGridCol(), maxGridCol()),
      row: clamp(player.current.row, minGridRow(), maxGridRow()),
    };

    if (!sameIntersection(player.current, clamped)) {
      placePlayerAt(player, clamped);
      resetPlayerNavigation(player);
    }
  }
}

function applyRoomWorld(payload) {
  if (!payload || typeof payload !== 'object') {
    return;
  }

  state.room.world = sanitizeRoomWorld(payload);
  syncConfigFromRoomWorld(state.room.world);
  updateViewTransform();
  rebuildRevealSource();
  clampPlayersToRoomWorld();

  if (state.pointer.active) {
    refreshPointerTargetFromStoredPointer();
  }
}

function syncRoomWorldFromConfig({ geometryChanged = false } = {}) {
  state.room.world = sanitizeRoomWorld({
    ...state.room.world,
    cellSize: config.gridSize,
    minCellScreenPx: config.minCellScreenPx,
    image: {
      fitMode: config.revealImageFitMode,
      scale: config.revealImageScale,
      offsetX: config.revealImageOffsetX,
      offsetY: config.revealImageOffsetY,
      vignetteEnabled: config.revealVignetteEnabled,
      vignetteMode: config.revealVignetteMode,
      vignetteColor: config.revealVignetteColor,
      vignetteInnerOpacity: config.revealVignetteInnerOpacity,
      vignetteEdgeOpacity: config.revealVignetteEdgeOpacity,
      vignetteSize: config.revealVignetteSize,
      vignetteCurve: config.revealVignetteCurve,
    },
  });

  updateViewTransform();
  rebuildRevealSource();

  if (geometryChanged) {
    for (const player of state.players.values()) {
      if (player.visible && player.current) {
        placePlayerAt(player, player.current);
        resetPlayerNavigation(player);
      }
    }
  }

  if (state.pointer.active) {
    refreshPointerTargetFromStoredPointer();
  }
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

function handleNetworkMessage(message) {
  switch (message.type) {
    case 'welcome': {
      applyRoomWorld(message.world);
      sendLocalPlayerState(true);
      break;
    }

    case 'room_info':
      break;

    case 'room_state': {
      applyRoomWorld(message.world);
      applyRoomPlayersSnapshot(Array.isArray(message.players) ? message.players : []);
      break;
    }

    case 'player_state': {
      if (message.playerId) {
        applyIncomingPlayerState(message.playerId, message.player || {});
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

    default:
      break;
  }
}

function applyNetworkSnapshot(snapshot) {
  state.network.status = snapshot.status;
  state.network.roomId = snapshot.roomId;
  state.network.serverPlayerId = snapshot.serverPlayerId;
  state.network.playerCount = snapshot.playerCount;
  state.network.shareUrl = snapshot.shareUrl;
  updateNetworkInfo();
}

const networkController = createNetworkController({
  getUrl: () => config.networkUrl,
  getNow: () => state.now,
  getReconnectDelayMs: () => config.networkReconnectDelayMs,
  getSendIntervalMs: () => config.networkSendIntervalMs,
  onSnapshot: applyNetworkSnapshot,
  onMessage: handleNetworkMessage,
  onRemoteStateReset: resetRemoteState,
  onServerReset: () => {
    window.location.reload();
  },
});

function connectNetwork({ force = false } = {}) {
  networkController.connect({ force });
}

function disconnectNetwork({ manual = false } = {}) {
  networkController.disconnect({ manual });
}

function resetServerState() {
  return networkController.requestServerReset();
}

function sendLocalPlayerState(force = false) {
  const player = getLocalPlayer();
  if (!player) {
    return;
  }

  networkController.sendPlayerState(serializePlayerForNetwork(player), { force });
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

function drawBackground() {
  const topColor = colorWithAlpha(config.backgroundGradientTopColor, config.backgroundGradientTopAlpha);
  const bottomColor = colorWithAlpha(config.backgroundGradientBottomColor, config.backgroundGradientBottomAlpha);

  if (!config.backgroundGradientEnabled) {
    ctx.fillStyle = config.flatBackgroundColor;
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    return;
  }

  const gradient = ctx.createLinearGradient(0, viewport.height, 0, 0);
  gradient.addColorStop(0, bottomColor);
  gradient.addColorStop(1, topColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
}

function getRoomWorld() {
  return state.room.world;
}

function getWorldCellSize() {
  return Math.max(1, getRoomWorld().cellSize || config.gridSize);
}

function getWorldWidth() {
  return getRoomWorld().cols * getWorldCellSize();
}

function getWorldHeight() {
  return getRoomWorld().rows * getWorldCellSize();
}

function updateViewTransform() {
  const worldWidth = Math.max(1, getWorldWidth());
  const worldHeight = Math.max(1, getWorldHeight());
  const fitScale = Math.min(
    viewport.width / worldWidth,
    viewport.height / worldHeight,
  );
  const minScale = Math.max(0.01, getRoomWorld().minCellScreenPx / getWorldCellSize());
  const scale = Math.max(fitScale, minScale);

  state.view.worldWidth = worldWidth;
  state.view.worldHeight = worldHeight;
  state.view.fitScale = fitScale;
  state.view.minScale = minScale;
  state.view.scale = scale;
  state.view.offsetX = (viewport.width - worldWidth * scale) * 0.5;
  state.view.offsetY = (viewport.height - worldHeight * scale) * 0.5;
}

function worldToScreenPoint(point) {
  return {
    x: state.view.offsetX + point.x * state.view.scale,
    y: state.view.offsetY + point.y * state.view.scale,
  };
}

function screenToWorldPoint(point) {
  return {
    x: (point.x - state.view.offsetX) / state.view.scale,
    y: (point.y - state.view.offsetY) / state.view.scale,
  };
}

function worldRectToScreenRect(rect) {
  return {
    x: state.view.offsetX + rect.x * state.view.scale,
    y: state.view.offsetY + rect.y * state.view.scale,
    width: rect.width * state.view.scale,
    height: rect.height * state.view.scale,
  };
}

function getGridOffset() {
  return 0;
}

function getMovementBounds() {
  return getRoomWorld().movementBounds;
}

function minGridCol() {
  return getMovementBounds().minCol;
}

function maxGridCol() {
  return getMovementBounds().maxCol;
}

function minGridRow() {
  return getMovementBounds().minRow;
}

function maxGridRow() {
  return getMovementBounds().maxRow;
}

function cellCountX() {
  return getRoomWorld().cols;
}

function cellCountY() {
  return getRoomWorld().rows;
}

function toPoint(intersection) {
  const offset = getGridOffset();
  const cellSize = getWorldCellSize();
  return {
    x: intersection.col * cellSize + offset,
    y: intersection.row * cellSize + offset,
  };
}

function nearestIntersection(x, y) {
  const offset = getGridOffset();
  const cellSize = getWorldCellSize();
  const col = clamp(Math.round((x - offset) / cellSize), minGridCol(), maxGridCol());
  const row = clamp(Math.round((y - offset) / cellSize), minGridRow(), maxGridRow());
  return { col, row };
}

function randomVisibleIntersection() {
  const offset = getGridOffset();
  const cellSize = getWorldCellSize();
  const imageMaxCol = getRoomWorld().cols;
  const imageMaxRow = getRoomWorld().rows;
  const maxSpawnHalfSize = Math.max(config.nodeWidth, config.nodeHeight)
    * Math.max(1, config.nodeSpawnStartScale)
    * 0.5;
  const visualPadding = maxSpawnHalfSize + config.nodeGlowBlur + config.nodeBorderWidth + 12;

  let minCol = Math.ceil((visualPadding - offset) / cellSize);
  let maxCol = Math.floor((getWorldWidth() - visualPadding - offset) / cellSize);
  let minRow = Math.ceil((visualPadding - offset) / cellSize);
  let maxRow = Math.floor((getWorldHeight() - visualPadding - offset) / cellSize);

  minCol = clamp(minCol, 0, imageMaxCol);
  maxCol = clamp(maxCol, 0, imageMaxCol);
  minRow = clamp(minRow, 0, imageMaxRow);
  maxRow = clamp(maxRow, 0, imageMaxRow);

  if (maxCol < minCol || maxRow < minRow) {
    return {
      col: Math.round(imageMaxCol * 0.5),
      row: Math.round(imageMaxRow * 0.5),
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

function createCellKey(cell) {
  return `${cell.col},${cell.row}`;
}

function getCellRect(cell) {
  const cellSize = getWorldCellSize();
  const x = cell.col * cellSize;
  const y = cell.row * cellSize;

  return {
    x,
    y,
    width: cellSize,
    height: cellSize,
  };
}

function touchActiveEdge(sourceId, start, end, touchedAt = state.now) {
  touchTrailEdge(state.activeEdges, sourceId, start, end, touchedAt);
}

function getActiveEdgeAlphaMultiplier(edge) {
  return getTrailEdgeAlphaMultiplier(
    edge,
    state.now,
    config.trailHoldMs,
    config.trailFadeMs,
  );
}

function clearExpiredActiveEdges() {
  clearExpiredTrailEdges(
    state.activeEdges,
    state.now,
    config.trailHoldMs,
    config.trailFadeMs,
  );
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

function buildNpcPatchCorners(patchCell) {
  return [
    { col: patchCell.col, row: patchCell.row },
    { col: patchCell.col + 2, row: patchCell.row },
    { col: patchCell.col + 2, row: patchCell.row + 2 },
    { col: patchCell.col, row: patchCell.row + 2 },
  ];
}

function buildNpcPatchWaypoints(patchCell, phaseOffset, loops = NPC_PATCH_LOOP_COUNT) {
  const corners = buildNpcPatchCorners(patchCell);
  const startIndex = ((phaseOffset % corners.length) + corners.length) % corners.length;
  const waypoints = [{ ...corners[startIndex] }];

  for (let loopIndex = 0; loopIndex < loops; loopIndex += 1) {
    for (let stepIndex = 1; stepIndex <= corners.length; stepIndex += 1) {
      waypoints.push({ ...corners[(startIndex + stepIndex) % corners.length] });
    }
  }

  return waypoints;
}

function chooseNpcPatchCell(previousCell = null) {
  const maxPatchCol = Math.max(0, cellCountX() - 2);
  const maxPatchRow = Math.max(0, cellCountY() - 2);
  const fallback = {
    col: Math.max(0, Math.floor(maxPatchCol * 0.5)),
    row: Math.max(0, Math.floor(maxPatchRow * 0.5)),
  };

  if (maxPatchCol <= 0 || maxPatchRow <= 0) {
    return fallback;
  }

  let bestCandidate = null;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const candidate = {
      col: Math.floor(Math.random() * (maxPatchCol + 1)),
      row: Math.floor(Math.random() * (maxPatchRow + 1)),
    };

    if (!previousCell) {
      return candidate;
    }

    const separation = Math.abs(candidate.col - previousCell.col) + Math.abs(candidate.row - previousCell.row);
    if (separation >= NPC_PATCH_MIN_SEPARATION) {
      return candidate;
    }

    if (!bestCandidate || separation > bestCandidate.separation) {
      bestCandidate = {
        separation,
        cell: candidate,
      };
    }
  }

  return bestCandidate ? bestCandidate.cell : fallback;
}

function setNpcPatchCell(patchCell) {
  state.npc.lastPatchCell = state.npc.patchCell ? { ...state.npc.patchCell } : state.npc.lastPatchCell;
  state.npc.patchCell = patchCell ? { ...patchCell } : null;
  state.npc.patchVersion += 1;
}

function syncNpcPlayers() {
  const desiredCount = Math.max(0, Math.round(config.npcHelperCount));
  const seenIds = new Set();

  for (let index = 1; index <= desiredCount; index += 1) {
    const id = `${NPC_PLAYER_PREFIX}${index}`;
    seenIds.add(id);

    let player = getPlayer(id);
    if (!player) {
      player = ensurePlayer(id, {
        isLocal: false,
        visible: true,
        spawnedAt: state.now,
        npcRole: index === 1 ? 'lead' : 'follower',
        npcPatchVersion: -1,
        npcWaypoints: [],
        npcWaypointIndex: 0,
        npcInitialized: false,
      });
    } else {
      player.npcRole = index === 1 ? 'lead' : 'follower';
      player.visible = true;
      if (player.spawnedAt == null) {
        player.spawnedAt = state.now;
      }
    }

    if (!player.current) {
      placePlayerAt(player, randomVisibleIntersection());
      player.spawnedAt = state.now;
      player.visible = true;
    }
  }

  for (const [playerId, player] of state.players.entries()) {
    if (!isNpcPlayerId(playerId) || seenIds.has(playerId)) {
      continue;
    }

    clearPlayerContributions(playerId);
    state.players.delete(playerId);
  }

  if (desiredCount <= 0 && state.npc.patchCell) {
    setNpcPatchCell(null);
  }
}

function applyNpcPatchPlan(player) {
  if (!state.npc.patchCell) {
    return;
  }

  const phaseOffset = Math.max(0, getNpcIndexFromPlayerId(player.id) - 1);
  const waypoints = buildNpcPatchWaypoints(state.npc.patchCell, phaseOffset);
  player.npcPatchVersion = state.npc.patchVersion;
  player.npcWaypoints = waypoints;
  player.npcWaypointIndex = 0;
  resetPlayerNavigation(player);

  if (!player.npcInitialized && waypoints.length > 0) {
    placePlayerAt(player, waypoints[0]);
    player.npcInitialized = true;
  }
}

function advanceNpcWaypointPlan(player) {
  if (!Array.isArray(player.npcWaypoints)) {
    return;
  }

  while (
    player.npcWaypointIndex < player.npcWaypoints.length
    && player.current
    && sameIntersection(player.current, player.npcWaypoints[player.npcWaypointIndex])
    && !player.segment
    && player.pathQueue.length === 0
  ) {
    player.npcWaypointIndex += 1;
  }

  if (player.npcWaypointIndex >= player.npcWaypoints.length) {
    player.desiredTarget = null;
    return;
  }

  const nextWaypoint = player.npcWaypoints[player.npcWaypointIndex];
  if (!player.segment && player.pathQueue.length === 0) {
    player.desiredTarget = { ...nextWaypoint };
  }
}

function npcPlanComplete(player) {
  return (
    Array.isArray(player.npcWaypoints)
    && player.npcPatchVersion === state.npc.patchVersion
    && player.npcWaypointIndex >= player.npcWaypoints.length
    && !player.segment
    && player.pathQueue.length === 0
  );
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

  const pointerWorld = screenToWorldPoint({
    x: state.pointer.x,
    y: state.pointer.y,
  });
  const nextTarget = nearestIntersection(pointerWorld.x, pointerWorld.y);
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

function updateDrivenPlayer(player, deltaSeconds) {
  if (!player || !player.visible) {
    return;
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

  updateDrivenPlayer(player, deltaSeconds);
}

function updateNpcPlayers(deltaSeconds) {
  syncNpcPlayers();

  const npcPlayers = getNpcPlayers();
  if (npcPlayers.length === 0) {
    return;
  }

  const lead = npcPlayers[0];
  if (!state.npc.patchCell) {
    setNpcPatchCell(chooseNpcPatchCell(state.npc.lastPatchCell));
  }

  for (const player of npcPlayers) {
    if (player.npcPatchVersion !== state.npc.patchVersion) {
      applyNpcPatchPlan(player);
    }

    advanceNpcWaypointPlan(player);
    updateDrivenPlayer(player, deltaSeconds);
  }

  if (npcPlanComplete(lead)) {
    setNpcPatchCell(chooseNpcPatchCell(state.npc.patchCell || state.npc.lastPatchCell));
  }
}

function getCellStateVisualAlpha(cell) {
  const entry = state.cellStates.get(createCellKey(cell));
  return entry ? clamp(entry.alpha || 0, 0, 1) : 0;
}

function getCellImageOpacity(cell) {
  return getCellStateVisualAlpha(cell);
}

function countLockedCellStates() {
  return countLockedCellEntries(state.cellStates, state.now);
}

function updateCellStates(deltaSeconds) {
  updateCellEnergyState({
    revealEnabled: config.revealEnabled,
    cellStates: state.cellStates,
    now: state.now,
    deltaSeconds,
    renderablePlayers: getRenderablePlayers(),
    cols: cellCountX(),
    rows: cellCountY(),
    cellSize: getWorldCellSize(),
    maxRing: getEffectiveCellChargeMaxRing(),
    ringFalloff: getEffectiveCellChargeRingFalloff(),
    ringFloorEnabled: config.cellRingFloorEnabled,
    ringFloor: getEffectiveCellRingFloor(),
    chargePerSecond: getEffectiveBaseCellChargePerSecond() * getEffectiveCellChargeMultiplier(),
    decayMs: getEffectiveCellDecayMs(),
    lockHoldMs: getEffectiveCellLockHoldMs(),
    linkedLockFade: config.cellLinkedLockFade,
    getCellRect,
    createCellKey,
  });
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
  revealSourceCanvas.width = Math.max(1, Math.round(getWorldWidth()));
  revealSourceCanvas.height = Math.max(1, Math.round(getWorldHeight()));

  revealSourceCtx.clearRect(0, 0, revealSourceCanvas.width, revealSourceCanvas.height);

  if (assets.revealImageLoaded && assets.revealImage.naturalWidth > 0 && assets.revealImage.naturalHeight > 0) {
    drawRevealImageIntoCanvas(
      revealSourceCtx,
      assets.revealImage,
      revealSourceCanvas.width,
      revealSourceCanvas.height,
    );
    applyRevealEdgeVignette(revealSourceCtx, revealSourceCanvas.width, revealSourceCanvas.height);
    return;
  }

  drawFallbackRevealSource();
  applyRevealEdgeVignette(revealSourceCtx, revealSourceCanvas.width, revealSourceCanvas.height);
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

function applyRevealEdgeVignette(targetCtx, width, height) {
  const world = getRoomWorld();
  const imageConfig = world.image || {};
  if (!imageConfig.vignetteEnabled) {
    return;
  }

  const size = Math.max(0, imageConfig.vignetteSize || 0);
  const edgeOpacity = clamp(Number(imageConfig.vignetteEdgeOpacity) || 0, 0, 1);
  const innerOpacity = clamp(Number(imageConfig.vignetteInnerOpacity) || 0, 0, 1);
  if (edgeOpacity <= 0 && innerOpacity <= 0) {
    return;
  }

  const curve = Math.max(0.1, Number(imageConfig.vignetteCurve) || 1);
  const vignetteMode = imageConfig.vignetteMode === 'color' ? 'color' : 'alpha';
  const { r, g, b } = hexToRgb(imageConfig.vignetteColor || '#000000');
  const imageData = targetCtx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let y = 0; y < height; y += 1) {
    const verticalDistance = Math.min(y, height - 1 - y);

    for (let x = 0; x < width; x += 1) {
      const horizontalDistance = Math.min(x, width - 1 - x);
      const edgeDistance = Math.min(horizontalDistance, verticalDistance);
      const distanceT = size <= 0 ? 0 : clamp(edgeDistance / size, 0, 1);
      const fadeT = Math.pow(distanceT, curve);
      const overlayAlpha = lerp(edgeOpacity, innerOpacity, fadeT);

      if (overlayAlpha <= 0) {
        continue;
      }

      const index = (y * width + x) * 4;
      if (vignetteMode === 'alpha') {
        const alphaMultiplier = 1 - overlayAlpha;
        data[index + 3] = Math.round(data[index + 3] * alphaMultiplier);
      } else {
        data[index] = Math.round(lerp(data[index], r, overlayAlpha));
        data[index + 1] = Math.round(lerp(data[index + 1], g, overlayAlpha));
        data[index + 2] = Math.round(lerp(data[index + 2], b, overlayAlpha));
      }
    }
  }

  targetCtx.putImageData(imageData, 0, 0);
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

  const bandSpacing = Math.max(80, Math.round(getWorldCellSize() * 1.4));
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
  const cellSize = getWorldCellSize();
  const screenCellSize = cellSize * state.view.scale;
  if (screenCellSize <= 0) {
    return;
  }

  const firstVerticalX = ((state.view.offsetX % screenCellSize) + screenCellSize) % screenCellSize;
  const firstHorizontalY = ((state.view.offsetY % screenCellSize) + screenCellSize) % screenCellSize;

  ctx.strokeStyle = colorWithAlpha(config.gridColor, config.gridOpacity);
  ctx.lineWidth = Math.max(0.5, config.gridLineWidth * state.view.scale);

  ctx.beginPath();

  for (let x = firstVerticalX; x <= viewport.width + screenCellSize; x += screenCellSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewport.height);
  }

  for (let y = firstHorizontalY; y <= viewport.height + screenCellSize; y += screenCellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(viewport.width, y);
  }

  ctx.stroke();
}

function drawRevealCells() {
  if (!config.revealEnabled) {
    return;
  }

  for (const entry of state.cellStates.values()) {
    const alpha = clamp(entry.alpha || 0, 0, 1);

    if (alpha <= 0) {
      continue;
    }

    const rect = getCellRect(entry.cell);
    if (rect.width <= 0 || rect.height <= 0) {
      continue;
    }

    const screenRect = worldRectToScreenRect(rect);

    ctx.save();
    ctx.globalAlpha = alpha * config.revealImageOpacity;
    ctx.drawImage(
      revealSourceCanvas,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      screenRect.x,
      screenRect.y,
      screenRect.width,
      screenRect.height,
    );
    ctx.restore();

    if (config.revealTintOpacity > 0) {
      ctx.save();
      ctx.fillStyle = colorWithAlpha(config.revealTintColor, alpha * config.revealTintOpacity);
      ctx.fillRect(screenRect.x, screenRect.y, screenRect.width, screenRect.height);
      ctx.restore();
    }
  }
}

function drawHeldCellDebug() {
  if (!config.showHeldCells) {
    return;
  }

  ctx.save();
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let col = 0; col < cellCountX(); col += 1) {
    for (let row = 0; row < cellCountY(); row += 1) {
      const cell = { col, row };
      const rect = getCellRect(cell);
      const screenRect = worldRectToScreenRect(rect);
      const imageOpacity = clamp(getCellImageOpacity(cell), 0, 1);
      const opacityPercent = Math.round(imageOpacity * 100);
      const textAlpha = 0.18 + imageOpacity * 0.72;

      ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
      ctx.fillText(
        String(opacityPercent),
        screenRect.x + screenRect.width * 0.5,
        screenRect.y + screenRect.height * 0.5,
      );
    }
  }

  ctx.restore();
}

function drawSingleActiveEdgeLine(startX, startY, endX, endY, alphaMultiplier = 1) {
  ctx.save();
  ctx.lineCap = config.trailLineCap;
  ctx.lineJoin = config.trailLineCap;

  const visualScale = state.view.scale;
  const lineAlpha = config.trailOpacity * alphaMultiplier;
  const glowAlpha = config.trailGlowOpacity * alphaMultiplier;
  const glowSpread = Math.max(0, config.trailGlowWidth * visualScale);
  const activeLineWidth = Math.max(0.5, config.trailLineWidth * visualScale);
  const glowEmitterWidth = Math.max(1.25, activeLineWidth + glowSpread * 0.28);
  const glowStrokeAlpha = Math.min(1, glowAlpha * 0.16);

  if (glowAlpha > 0 && (config.trailGlowBlur > 0 || glowSpread > 0)) {
    ctx.shadowBlur = config.trailGlowBlur * visualScale + glowSpread;
    ctx.shadowColor = colorWithAlpha(config.trailGlowColor, glowAlpha);
    ctx.strokeStyle = colorWithAlpha(config.trailGlowColor, glowStrokeAlpha);
    ctx.lineWidth = glowEmitterWidth;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0, 0, 0, 0)';
  ctx.strokeStyle = colorWithAlpha(config.trailColor, lineAlpha);
  ctx.lineWidth = activeLineWidth;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.restore();
}

function drawActiveEdges() {
  if (!config.trailEnabled) {
    return;
  }

  for (const edge of state.activeEdges.values()) {
    const alphaMultiplier = getActiveEdgeAlphaMultiplier(edge);

    if (alphaMultiplier <= 0) {
      continue;
    }

    const startPoint = worldToScreenPoint(toPoint(edge.start));
    const endPoint = worldToScreenPoint(toPoint(edge.end));

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
  if (!config.trailEnabled) {
    return;
  }

  for (const player of getRenderablePlayers()) {
    if (!player.segment) {
      continue;
    }

    const startPoint = worldToScreenPoint(toPoint(player.segment.startIntersection));
    const endPoint = worldToScreenPoint({ x: player.x, y: player.y });

    drawSingleActiveEdgeLine(
      startPoint.x,
      startPoint.y,
      endPoint.x,
      endPoint.y,
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
  ctx.font = `${Math.max(9, 11 * state.view.scale)}px monospace`;
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
  const pulse = 1 + Math.sin(timeSeconds * getEffectiveNodePulseSpeed()) * config.nodePulseAmplitude;
  const visualScale = state.view.scale;
  const width = config.nodeWidth * pulse * spawnScale * visualScale;
  const height = config.nodeHeight * pulse * spawnScale * visualScale;
  const screenPoint = worldToScreenPoint({ x: player.x, y: player.y });
  const x = screenPoint.x - width * 0.5;
  const y = screenPoint.y - height * 0.5;
  const effectiveGlowBlur = getEffectiveNodeGlowBlur();
  const effectiveGlowOpacity = getEffectiveNodeGlowOpacity();

  ctx.save();
  ctx.shadowBlur = effectiveGlowBlur * visualScale;
  ctx.shadowColor = colorWithAlpha(config.nodeGlowColor, effectiveGlowOpacity * spawnAlpha);
  ctx.fillStyle = colorWithAlpha(config.nodeColor, spawnAlpha);
  roundedRectPath(x, y, width, height, config.nodeRadius * visualScale);
  ctx.fill();

  if (config.nodeBorderWidth > 0 && config.nodeBorderOpacity > 0) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = colorWithAlpha(config.nodeBorderColor, config.nodeBorderOpacity * spawnAlpha);
    ctx.lineWidth = config.nodeBorderWidth * visualScale;
    roundedRectPath(x, y, width, height, config.nodeRadius * visualScale);
    ctx.stroke();
  }

  ctx.restore();

  drawPlayerLabel(player, screenPoint.x, y, spawnAlpha);
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

  const point = worldToScreenPoint(toPoint(state.pointer.targetIntersection));

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = Math.max(0.5, state.view.scale);
  ctx.beginPath();
  ctx.arc(point.x, point.y, 8 * state.view.scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawDebugIntersections() {
  if (!config.showGridIntersections) {
    return;
  }

  const cellSize = getWorldCellSize();
  const topLeft = screenToWorldPoint({ x: 0, y: 0 });
  const bottomRight = screenToWorldPoint({ x: viewport.width, y: viewport.height });
  const firstCol = Math.max(minGridCol(), Math.floor(topLeft.x / cellSize) - 1);
  const lastCol = Math.min(maxGridCol(), Math.ceil(bottomRight.x / cellSize) + 1);
  const firstRow = Math.max(minGridRow(), Math.floor(topLeft.y / cellSize) - 1);
  const lastRow = Math.min(maxGridRow(), Math.ceil(bottomRight.y / cellSize) + 1);

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';

  for (let col = firstCol; col <= lastCol; col += 1) {
    for (let row = firstRow; row <= lastRow; row += 1) {
      const point = worldToScreenPoint(toPoint({ col, row }));
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(1, 1.75 * state.view.scale), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function formatMetric(value) {
  return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : '-';
}

function drawViewportDebug() {
  if (!config.showViewportDebug) {
    return;
  }

  const visualViewport = window.visualViewport;
  const canvasRect = canvas.getBoundingClientRect();
  const docEl = document.documentElement;
  const body = document.body;
  const safeArea = getSafeAreaInsets();
  const lines = [
    `vv ${formatMetric(visualViewport && visualViewport.width)} x ${formatMetric(visualViewport && visualViewport.height)} s ${formatMetric(visualViewport && visualViewport.scale)}`,
    `vv offset ${formatMetric(visualViewport && visualViewport.offsetLeft)}, ${formatMetric(visualViewport && visualViewport.offsetTop)}`,
    `inner ${formatMetric(window.innerWidth)} x ${formatMetric(window.innerHeight)} dpr ${formatMetric(window.devicePixelRatio)}`,
    `doc ${formatMetric(docEl && docEl.clientWidth)} x ${formatMetric(docEl && docEl.clientHeight)}`,
    `body ${formatMetric(body && body.clientWidth)} x ${formatMetric(body && body.clientHeight)}`,
    `screen ${formatMetric(window.screen && window.screen.width)} x ${formatMetric(window.screen && window.screen.height)}`,
    `canvas css ${formatMetric(canvasRect.width)} x ${formatMetric(canvasRect.height)}`,
    `canvas xy ${formatMetric(canvasRect.left)}, ${formatMetric(canvasRect.top)}`,
    `canvas px ${canvas.width} x ${canvas.height}`,
    `state ${viewport.width} x ${viewport.height}`,
    `safe ${formatMetric(safeArea.left)}, ${formatMetric(safeArea.right)}, ${formatMetric(safeArea.top)}, ${formatMetric(safeArea.bottom)}`,
    `view scale ${formatMetric(state.view.scale)} off ${formatMetric(state.view.offsetX)}, ${formatMetric(state.view.offsetY)}`,
    `orientation ${window.matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait'}`,
  ];

  const padding = 8;
  const lineHeight = 13;
  const x = Math.max(8, -canvasRect.left + 8);
  const y = 8;
  const width = 230;
  const height = padding * 2 + lines.length * lineHeight;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  for (let index = 0; index < lines.length; index += 1) {
    ctx.fillText(lines[index], x + padding, y + padding + index * lineHeight);
  }

  ctx.restore();
}

function drawTrailBuffOverlay() {
  if (!config.showEnergyOverlay) {
    return;
  }

  const playerCount = getEffectiveRoomPlayerCount();
  const helperCount = countVisibleNpcPlayers();
  const cellEnergyScale = getCellEnergyEffectScale();
  const coopBuffScale = getCoopBuffEffectScale();
  const effectiveChargePerSecond = getEffectiveBaseCellChargePerSecond();
  const chargeMultiplier = getEffectiveCellChargeMultiplier();
  const effectiveRingFalloff = getEffectiveCellChargeRingFalloff();
  const effectiveRingFloor = config.cellRingFloorEnabled ? getEffectiveCellRingFloor() : 0;
  const effectiveMaxRing = getEffectiveCellChargeMaxRing();
  const effectiveDecayMs = getEffectiveCellDecayMs();
  const effectiveLockHoldMs = getEffectiveCellLockHoldMs();
  const lockedCells = countLockedCellStates();
  const sourceLabel = state.network.roomId ? 'room' : 'local';
  const lines = [
    'coop buffs',
    `players ${playerCount} (${sourceLabel})`,
    `local helpers ${helperCount}`,
    `energy scale ${formatMetric(cellEnergyScale)}x`,
    `buff scale ${formatMetric(coopBuffScale)}x`,
    `charge base ${formatMetric(config.cellChargePerSecond)}/s`,
    `charge bonus/player ${formatMetric(config.cellChargeBuffPerPlayer)}x`,
    `charge live ${formatMetric(effectiveChargePerSecond * chargeMultiplier)}/s`,
    `falloff base ${formatMetric(config.cellChargeRingFalloff)}`,
    `falloff bonus/player ${formatMetric(config.cellRingFalloffBonusPerPlayer)}`,
    `falloff live ${formatMetric(effectiveRingFalloff)}`,
    `floor ${config.cellRingFloorEnabled ? 'on' : 'off'}`,
    `floor base ${formatMetric(config.cellRingFloor)}`,
    `floor bonus/player ${formatMetric(config.cellRingFloorBonusPerPlayer)}`,
    `floor live ${formatMetric(effectiveRingFloor)}`,
    `rings base ${formatMetric(config.cellChargeMaxRing)}`,
    `rings bonus/player ${formatMetric(config.cellRingCountBonusPerPlayer)}`,
    `rings live ${formatMetric(effectiveMaxRing)}`,
    `linked fade ${config.cellLinkedLockFade ? 'on' : 'off'}`,
    `decay base ${formatMetric(config.cellDecayMs)}ms`,
    `decay bonus/player ${formatMetric(config.cellDecayBonusMsPerPlayer)}ms`,
    `decay live ${formatMetric(effectiveDecayMs)}ms`,
    `lock base ${formatMetric(config.cellLockHoldMs)}ms`,
    `lock bonus/player ${formatMetric(config.cellLockHoldBonusMsPerPlayer)}ms`,
    `lock live ${formatMetric(effectiveLockHoldMs)}ms`,
    `locked cells ${formatMetric(lockedCells)}`,
  ];

  const padding = 8;
  const lineHeight = 13;
  const width = 230;
  const height = padding * 2 + lines.length * lineHeight;
  const x = 8;
  const y = Math.max(8, viewport.height - height - 8);

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  for (let index = 0; index < lines.length; index += 1) {
    ctx.fillText(lines[index], x + padding, y + padding + index * lineHeight);
  }

  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  drawBackground();

  if (!config.gridOverReveal) {
    drawBaseGrid();
  }

  drawRevealCells();

  if (config.gridOverReveal) {
    drawBaseGrid();
  }

  drawActiveEdges();
  drawActiveSegments();
  drawHeldCellDebug();
  drawDebugIntersections();
  drawDebugTarget();
  drawNodes();
  drawTrailBuffOverlay();
  drawViewportDebug();
}

function resize() {
  const viewportSize = getViewportSize();
  viewport.width = viewportSize.width;
  viewport.height = viewportSize.height;
  viewport.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  canvas.width = Math.round(viewport.width * viewport.dpr);
  canvas.height = Math.round(viewport.height * viewport.dpr);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  canvas.style.left = `${-viewportSize.safeArea.left}px`;
  canvas.style.top = `${-viewportSize.safeArea.top}px`;

  ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  updateViewTransform();

  if (state.pointer.active) {
    refreshPointerTargetFromStoredPointer();
  }

  const localPlayer = getLocalPlayer();
  if (localPlayer && !playerCanFollowPointer(localPlayer)) {
    localPlayer.desiredTarget = null;
  }
}

function updatePointerTarget(clientX, clientY) {
  const canvasRect = canvas.getBoundingClientRect();
  state.pointer.active = true;
  state.pointer.x = clientX - canvasRect.left;
  state.pointer.y = clientY - canvasRect.top;
  refreshPointerTargetFromStoredPointer();
}

canvas.addEventListener('pointermove', (event) => {
  updatePointerTarget(event.clientX, event.clientY);
});

canvas.addEventListener('pointerdown', (event) => {
  updatePointerTarget(event.clientX, event.clientY);
});

function handleViewportChange() {
  resize();
  guiManager.applyLayout();
}

let resizeFrame = 0;
let resizeSettleTimer = 0;

function scheduleViewportResize() {
  if (resizeFrame) {
    window.cancelAnimationFrame(resizeFrame);
  }

  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = 0;
    handleViewportChange();
  });

  if (resizeSettleTimer) {
    window.clearTimeout(resizeSettleTimer);
  }

  resizeSettleTimer = window.setTimeout(() => {
    resizeSettleTimer = 0;
    handleViewportChange();
  }, 250);
}

window.addEventListener('resize', scheduleViewportResize);
window.addEventListener('orientationchange', scheduleViewportResize);

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', scheduleViewportResize);
  window.visualViewport.addEventListener('scroll', scheduleViewportResize);
}

function animate(now) {
  const deltaSeconds = Math.min(0.05, (now - state.now) * 0.001);
  state.now = now;

  if (state.pointer.active) {
    refreshPointerTargetFromStoredPointer();
  }

  updateLocalPlayer(deltaSeconds);
  updateNpcPlayers(deltaSeconds);
  sendLocalPlayerState();
  clearExpiredActiveEdges();
  updateCellStates(deltaSeconds);
  render();

  requestAnimationFrame(animate);
}

resize();
guiManager.setup();
loadRevealImage();
connectNetwork();

window.addEventListener('beforeunload', () => {
  disconnectNetwork({ manual: true });
});

requestAnimationFrame((now) => {
  state.startTime = now;
  state.now = now;
  requestAnimationFrame(animate);
});
