import GUI from 'lil-gui';
import './style.css';
import packageInfo from '../package.json';

const canvas = document.querySelector('#app');
const ctx = canvas.getContext('2d');

const buildTimestamp = typeof __BUILD_TIMESTAMP__ !== 'undefined'
  ? __BUILD_TIMESTAMP__
  : 'dev';

document.title = `nodegame v${packageInfo.version} (${buildTimestamp})`;

let guiInstance = null;
let guiHelpOverlay = null;
let guiHelpActiveTarget = null;
let guiHelpPinned = false;
const guiControllers = {
  revealVignetteColor: null,
};
const GUI_HELP_TEXT = {
  backgroundGradientEnabled: 'Turns the background gradient on or off behind the scene.',
  backgroundGradientTopColor: 'Top color of the scene background gradient.',
  backgroundGradientBottomColor: 'Bottom color of the scene background gradient.',
  backgroundGradientTopAlpha: 'Opacity of the gradient at the top of the screen.',
  backgroundGradientBottomAlpha: 'Opacity of the gradient at the bottom of the screen.',
  backgroundColor: 'Fallback flat background color used when the gradient is disabled or too subtle to notice.',
  gridSize: 'World-space size of one grid cell. This affects room geometry, movement spacing, and image cell size.',
  minCellScreenPx: 'Minimum on-screen pixel size a world cell should try to maintain when fitting the room to the viewport.',
  gridColor: 'Color of the base grid lines drawn across the world.',
  gridOpacity: 'Opacity of the base grid lines.',
  gridLineWidth: 'Thickness of the base grid lines.',
  gridOverReveal: 'Draws the base grid over the image reveal instead of underneath it.',
  spawnDelayMs: 'Delay before newly visible nodes begin showing up.',
  spawnFadeMs: 'How long node spawn-in takes visually.',
  followPointerDelayMs: 'How long after spawning the local node waits before it starts following the pointer.',
  moveSpeed: 'Movement speed of nodes along the grid in world units per second.',
  routePreference: 'How Manhattan routes choose their first axis when moving toward a target.',
  turnPauseMs: 'Small pause inserted between grid-edge turns.',
  segmentEasing: 'How much motion eases along each segment instead of moving perfectly linearly.',
  nodeColor: 'Fill color of each visible node.',
  nodeBorderColor: 'Outline color of each node.',
  nodeBorderOpacity: 'Opacity of the node outline.',
  nodeBorderWidth: 'Thickness of the node outline.',
  nodeGlowColor: 'Glow color emitted by each node.',
  nodeGlowOpacity: 'Opacity of the node glow. The current slider value is treated as the 3-player baseline and scales with co-op count.',
  nodeGlowBlur: 'Blur radius of the node glow. The current slider value is treated as the 3-player baseline and scales with co-op count.',
  nodeWidth: 'Width of each node in screen-scaled pixels.',
  nodeHeight: 'Height of each node in screen-scaled pixels.',
  nodeRadius: 'Corner radius of the node shape.',
  nodePulseAmplitude: 'How much the idle node pulse changes node size over time.',
  pulseSpeed: 'Speed of the idle node pulse. The current slider value is treated as the 2-player baseline and scales with co-op count.',
  nodeSpawnStartScale: 'Initial scale multiplier when a node spawns in.',
  nodeSpawnBounce: 'How springy the spawn scale animation feels.',
  activeEdgeEnabled: 'Shows or hides the active-edge trail rendering. Trails are visual only now and no longer drive cell charge.',
  activeEdgeColor: 'Core line color of the active-edge trail rendering.',
  activeEdgeOpacity: 'Opacity of the active-edge line.',
  activeEdgeGlowColor: 'Glow color for active-edge trails.',
  activeEdgeGlowOpacity: 'Opacity of the active-edge glow.',
  activeEdgeLineWidth: 'Thickness of the active-edge line.',
  activeEdgeGlowWidth: 'Additional spread used to widen the active-edge glow.',
  activeEdgeLineCap: 'Line cap style used for active-edge rendering.',
  activeEdgeGlowBlur: 'Blur radius of the active-edge glow.',
  activeEdgeHoldMs: 'How long a touched edge stays fully bright before its visual fade starts.',
  activeEdgeFadeMs: 'How long active-edge trails take to visually fade out after hold time ends.',
  npcCount: 'Local-only helper nodes for testing co-op behavior. NPCs count toward local co-op buffs.',
  revealEnabled: 'Turns image reveal rendering on or off entirely.',
  revealImageSrc: 'Image path used as the hidden reveal source.',
  revealImageFitMode: 'How the reveal image is placed inside the room world before scale and offsets are applied.',
  revealImageScale: 'Extra scale multiplier applied to the reveal image inside room space.',
  revealImageOffsetX: 'Horizontal world-space offset for the reveal image.',
  revealImageOffsetY: 'Vertical world-space offset for the reveal image.',
  revealVignetteEnabled: 'Turns the edge vignette around the reveal image on or off.',
  revealVignetteMode: 'Whether the vignette fades the image by alpha or blends it toward a color.',
  revealVignetteColor: 'Color used when the vignette is in color mode.',
  revealVignetteInnerOpacity: 'Vignette strength toward the center of the image bounds.',
  revealVignetteEdgeOpacity: 'Vignette strength at the outer image edges.',
  revealVignetteSize: 'How far the vignette extends inward from the image edges.',
  revealVignetteCurve: 'Response curve for how quickly the vignette ramps from edge to center.',
  revealImageOpacity: 'Overall opacity of the revealed image cells.',
  revealTintColor: 'Tint color laid over revealed image cells.',
  revealTintOpacity: 'Opacity of the reveal tint overlay.',
  cellEnergyEffect: 'Global multiplier for the base Cell Energy settings. 1 keeps them unchanged, 0.5 weakens them, 2 strengthens them.',
  cellChargePerSecond: 'Base image opacity added per second to the strongest cells nearest each node.',
  cellChargeRingFalloff: 'How much weaker each outer ring is than the previous ring. Higher keeps energy spreading farther.',
  cellRingFloorEnabled: 'When on, outer rings never drop below the configured minimum ring strength.',
  cellRingFloor: 'Minimum multiplier for outer-ring charge once ring falloff has reduced it.',
  cellChargeMaxRing: 'How many side-connected rings around a node receive any charge at all.',
  cellDecayMs: 'How long an uncharged, unlocked cell takes to drain from full to empty.',
  cellLockHoldMs: 'How long a cell stays pinned at 100 after it fully charges.',
  cellLinkedLockFade: 'When on, side-connected locked cells share one release time and start fading together.',
  coopBuffEffect: 'Global multiplier for all per-player co-op bonuses. 1 keeps them unchanged, 0 disables them.',
  cellChargeBuffPerPlayer: 'Extra per-player charge multiplier applied on top of the base charge rate.',
  cellRingFalloffBonusPerPlayer: 'Extra per-player increase to outer-ring strength, making charge spread feel wider.',
  cellRingFloorBonusPerPlayer: 'Extra per-player increase to the minimum outer-ring strength when ring floor is enabled.',
  cellRingCountBonusPerPlayer: 'Extra per-player ring reach. This is discrete, so smaller scaled bonuses may not add a new ring yet.',
  cellDecayBonusMsPerPlayer: 'Extra per-player time before cells fully drain, making patches linger longer.',
  cellLockHoldBonusMsPerPlayer: 'Extra per-player hold time after a cell reaches 100.',
  showTarget: 'Shows the current target intersection for the local player.',
  showIntersections: 'Shows the world-space grid intersections used for movement and node snapping.',
  showRevealCells: 'Legacy reveal debug from the previous edge-driven model.',
  showHeldCells: 'Shows each room cell as a 0-100 image-opacity value from the current cell-energy system.',
  showTrailBuffOverlay: 'Shows live co-op and cell-energy buff values in the lower-left overlay.',
  showPlayerIds: 'Draws each visible player id above its node.',
  showViewportDebug: 'Shows canvas and viewport metrics for layout debugging.',
};

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

function applyGuiLayout(gui) {
  if (!gui) {
    return;
  }

  const margin = 12;
  const viewportSize = getViewportSize();
  const width = Math.max(240, Math.min(320, viewportSize.width - margin * 2));
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
  positionGuiHelpOverlay();
}

function ensureGuiHelpOverlay(gui) {
  if (!gui) {
    return null;
  }

  if (guiHelpOverlay && guiHelpOverlay.isConnected) {
    return guiHelpOverlay;
  }

  guiHelpOverlay = document.createElement('div');
  guiHelpOverlay.style.position = 'fixed';
  guiHelpOverlay.style.zIndex = '40';
  guiHelpOverlay.style.display = 'none';
  guiHelpOverlay.style.maxWidth = '280px';
  guiHelpOverlay.style.padding = '10px 12px';
  guiHelpOverlay.style.font = '11px/1.35 monospace';
  guiHelpOverlay.style.whiteSpace = 'normal';
  guiHelpOverlay.style.background = 'rgba(0, 0, 0, 0.82)';
  guiHelpOverlay.style.border = '1px solid rgba(255, 255, 255, 0.16)';
  guiHelpOverlay.style.borderRadius = '6px';
  guiHelpOverlay.style.color = 'rgba(255, 255, 255, 0.88)';
  guiHelpOverlay.style.pointerEvents = 'none';
  guiHelpOverlay.style.boxSizing = 'border-box';
  guiHelpOverlay.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.26)';
  document.body.appendChild(guiHelpOverlay);
  return guiHelpOverlay;
}

function positionGuiHelpOverlay() {
  if (
    !guiHelpOverlay
    || !guiHelpActiveTarget
    || guiHelpOverlay.style.display === 'none'
  ) {
    return;
  }

  const targetRect = guiHelpActiveTarget.getBoundingClientRect();
  const guiRect = guiInstance && guiInstance.domElement
    ? guiInstance.domElement.getBoundingClientRect()
    : targetRect;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const margin = 12;
  const preferredWidth = 280;
  const maxAvailableLeft = Math.max(200, Math.min(preferredWidth, guiRect.left - margin * 2));
  const fallbackWidth = Math.max(220, Math.min(preferredWidth, viewportWidth - margin * 2));
  let width = maxAvailableLeft;
  let left = guiRect.left - width - margin;

  if (left < margin) {
    width = fallbackWidth;
    left = Math.min(viewportWidth - width - margin, guiRect.right + margin);
  }

  guiHelpOverlay.style.width = `${Math.max(200, width)}px`;
  guiHelpOverlay.style.left = `${Math.max(margin, left)}px`;

  const overlayHeight = guiHelpOverlay.offsetHeight || 0;
  const targetMidY = targetRect.top + targetRect.height * 0.5;
  const top = clamp(
    targetMidY - overlayHeight * 0.5,
    margin,
    Math.max(margin, viewportHeight - overlayHeight - margin),
  );
  guiHelpOverlay.style.top = `${top}px`;
}

function showGuiHelp(text, target, { pinned = false } = {}) {
  if (!text || !target) {
    return;
  }

  ensureGuiHelpOverlay(guiInstance);
  if (!guiHelpOverlay) {
    return;
  }

  guiHelpOverlay.textContent = text;
  guiHelpActiveTarget = target;
  guiHelpPinned = pinned;
  guiHelpOverlay.style.display = 'block';
  positionGuiHelpOverlay();
}

function hideGuiHelp({ force = false } = {}) {
  if (!guiHelpOverlay) {
    return;
  }

  if (guiHelpPinned && !force) {
    return;
  }

  guiHelpOverlay.style.display = 'none';
  guiHelpActiveTarget = null;
  guiHelpPinned = false;
}

function handleGlobalGuiHelpPointerDown(event) {
  if (!guiHelpPinned) {
    return;
  }

  if (guiInstance && guiInstance.domElement && guiInstance.domElement.contains(event.target)) {
    return;
  }

  hideGuiHelp({ force: true });
}

function attachGuiHelp(controller, text) {
  if (!controller || !controller.domElement || !text) {
    return controller;
  }

  const target = controller.domElement;
  if (!target) {
    return controller;
  }

  if (target.dataset.guiHelpBound === '1') {
    return controller;
  }

  const label = controller.domElement.querySelector('.name');
  if (label) {
    label.title = text;
  }

  const showHelp = () => showGuiHelp(text, target);
  const hideHelp = () => hideGuiHelp();
  const pinHelp = () => showGuiHelp(text, target, { pinned: true });
  target.addEventListener('pointerenter', showHelp);
  target.addEventListener('pointerleave', hideHelp);
  target.addEventListener('focusin', showHelp);
  target.addEventListener('focusout', hideHelp);
  target.addEventListener('pointerdown', pinHelp);
  target.dataset.guiHelpBound = '1';
  return controller;
}

function bindGuiHelpFromMap(gui) {
  if (!gui || typeof gui.controllersRecursive !== 'function') {
    return;
  }

  for (const controller of gui.controllersRecursive()) {
    const key = controller && typeof controller.property === 'string'
      ? controller.property
      : null;
    const text = key ? GUI_HELP_TEXT[key] : null;
    if (!text) {
      continue;
    }

    attachGuiHelp(controller, text);
  }
}

document.addEventListener('pointerdown', handleGlobalGuiHelpPointerDown, true);
window.addEventListener('resize', positionGuiHelpOverlay);
window.addEventListener('scroll', positionGuiHelpOverlay, true);

function setControllerEnabled(controller, enabled) {
  if (!controller || !controller.domElement) {
    return;
  }

  controller.domElement.style.opacity = enabled ? '1' : '0.4';
  controller.domElement.style.pointerEvents = enabled ? 'auto' : 'none';
}

function updateRevealVignetteGuiState() {
  const usesColor = config.revealVignetteMode === 'color';
  setControllerEnabled(guiControllers.revealVignetteColor, usesColor);
}

const revealSourceCanvas = document.createElement('canvas');
const revealSourceCtx = revealSourceCanvas.getContext('2d');

const LOCAL_PLAYER_ID = 'local';
const DEBUG_PLAYER_PREFIX = 'debug-';
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
  backgroundColor: "#000000",
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
  activeEdgeEnabled: false,
  activeEdgeColor: "#b8d5ff",
  activeEdgeOpacity: 0.95,
  activeEdgeGlowColor: "#6ea9ff",
  activeEdgeGlowOpacity: 0.93,
  activeEdgeLineWidth: 1,
  activeEdgeGlowWidth: 26,
  activeEdgeLineCap: "square",
  activeEdgeGlowBlur: 32,
  activeEdgeHoldMs: 50,
  activeEdgeFadeMs: 670,
  trailLengthBuff: 0,
  npcCount: 1,
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
  revealIncludeCurrentSegment: true,
  revealEdgeActiveThreshold: 0.01,
  revealOpacity1: 0.1,
  revealOpacity2: 0.24,
  revealOpacity3: 0.43,
  revealOpacity4: 0.54,
  revealClosedBonus: 0.24,
  revealFadeInMs: 0,
  revealHoldMs: 0,
  revealFadeOutMs: 160,
  revealImageOpacity: 1,
  revealTintColor: "#000000",
  revealTintOpacity: 0,
  enclosureEnabled: true,
  enclosureIncludeCurrentSegment: false,
  enclosureEdgeActiveThreshold: 0.55,
  enclosureEdgeHoldMs: 900,
  enclosureEdgeFadeMs: 900,
  enclosureMinCells: 4,
  enclosureMaxCells: 12,
  roomPatchMaxCellsPerPlayer: 12,
  enclosureMinContributors: 1,
  heldCellOpacity: 0.72,
  heldCellContributorOpacityBonus: 0.14,
  heldCellFadeInMs: 0,
  heldCellHoldMs: 1600,
  heldCellContributorHoldBonusMs: 1200,
  heldCellFadeOutMs: 1200,
  heldEdgeFadeEnabled: true,
  heldEdgeFadeMinAlpha: 0.22,
  heldCellImageOpacity: 1,
  heldCellTintColor: "#7eb6ff",
  heldCellTintOpacity: 0,
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
  showIntersections: true,
  showRevealCells: false,
  showHeldCells: false,
  showTrailBuffOverlay: false,
  showPlayerIds: false,
  showViewportDebug: false,
  networkEnabled: true,
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
  activeEdges: new Map(),
  cellStates: new Map(),
  revealCells: new Map(),
  heldCells: new Map(),
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
  nextDebugPlayerIndex: 1,
  npc: {
    patchCell: null,
    lastPatchCell: null,
    patchVersion: 0,
  },
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

function buildConfigSnapshot() {
  const lines = ['const config = {'];

  for (const [key, value] of Object.entries(config)) {
    const formattedValue =
      typeof value === 'string' ? JSON.stringify(value) : String(value);
    lines.push(`  ${key}: ${formattedValue},`);
  }

  lines.push('};');
  return lines.join('\n');
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
  const rawText = String(text || '').trim();
  if (!rawText) {
    return null;
  }

  const objectMatch = rawText.match(/const\s+config\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  const objectSource = objectMatch ? objectMatch[1] : rawText;

  try {
    const parsed = Function('"use strict"; return (' + objectSource + ');')();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
}

function refreshGuiDisplay() {
  if (!guiInstance || typeof guiInstance.controllersRecursive !== 'function') {
    return;
  }

  for (const controller of guiInstance.controllersRecursive()) {
    controller.updateDisplay();
  }
}

function applyConfigSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return 0;
  }

  const previousConfig = { ...config };
  let appliedCount = 0;

  for (const key of Object.keys(config)) {
    if (!Object.prototype.hasOwnProperty.call(snapshot, key)) {
      continue;
    }

    const currentValue = config[key];
    const incomingValue = snapshot[key];
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
    updateRevealVignetteGuiState();
    refreshGuiDisplay();
    return 0;
  }

  updateRevealVignetteGuiState();

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
  const networkChanged = previousConfig.networkEnabled !== config.networkEnabled
    || previousConfig.networkUrl !== config.networkUrl;

  if (roomWorldChanged) {
    syncRoomWorldFromConfig({ geometryChanged });
  } else if (state.pointer.active) {
    refreshPointerTargetFromStoredPointer();
  }

  if (revealImageChanged) {
    loadRevealImage();
  }

  if (networkChanged) {
    if (config.networkEnabled) {
      connectNetwork({ force: true });
    } else {
      disconnectNetwork({ manual: true });
    }
  }

  refreshGuiDisplay();
  return appliedCount;
}

const actions = {
  clearActiveEdges() {
    state.activeEdges.clear();
  },
  clearRevealCells() {
    state.cellStates.clear();
    state.revealCells.clear();
  },
  clearHeldCells() {
    state.heldCells.clear();
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

function isNpcPlayerId(playerId) {
  return String(playerId || '').startsWith(NPC_PLAYER_PREFIX);
}

function isSyntheticLocalPlayerId(playerId) {
  return isDebugPlayerId(playerId) || isNpcPlayerId(playerId);
}

function isRemotePlayerId(playerId) {
  return playerId !== LOCAL_PLAYER_ID && !isSyntheticLocalPlayerId(playerId);
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

function countVisibleSyntheticLocalPlayers() {
  let count = 0;

  for (const player of state.players.values()) {
    if (!player.visible || !isSyntheticLocalPlayerId(player.id)) {
      continue;
    }

    count += 1;
  }

  return count;
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

function getEffectiveRoomPlayerCount() {
  const syntheticCount = countVisibleSyntheticLocalPlayers();

  if (state.network.roomId) {
    return Math.max(1, Math.round(state.network.playerCount || 1) + syntheticCount);
  }

  let visiblePlayers = 0;
  for (const player of state.players.values()) {
    if (player.visible) {
      visiblePlayers += 1;
    }
  }

  return Math.max(1, visiblePlayers);
}

function getTrailLengthMultiplier() {
  const playerCount = getEffectiveRoomPlayerCount();
  const perExtraPlayerBuff = Math.max(0, Number(config.trailLengthBuff) || 0);
  return 1 + perExtraPlayerBuff * Math.max(0, playerCount - 1);
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

function getEffectivePatchMaxCells() {
  const baseMaxCells = Math.max(1, Math.round(config.enclosureMaxCells));
  const playerCount = getEffectiveRoomPlayerCount();
  const perExtraPlayerBonus = Math.max(0, Math.round(config.roomPatchMaxCellsPerPlayer || 0));
  return Math.max(1, baseMaxCells + perExtraPlayerBonus * Math.max(0, playerCount - 1));
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
  updateRevealVignetteGuiState();
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

      applyRoomWorld(message.world);

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
      applyRoomWorld(message.world);
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

function drawBackground() {
  const topColor = colorWithAlpha(config.backgroundGradientTopColor, config.backgroundGradientTopAlpha);
  const bottomColor = colorWithAlpha(config.backgroundGradientBottomColor, config.backgroundGradientBottomAlpha);

  if (!config.backgroundGradientEnabled) {
    ctx.fillStyle = config.backgroundColor;
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

function createSegmentKey(a, b) {
  const left = `${a.col},${a.row}`;
  const right = `${b.col},${b.row}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
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

function getEdgeSourceStrengthMultiplier(source, holdMs, fadeMs) {
  const hold = Math.max(0, holdMs);
  const fade = Math.max(1, fadeMs);
  const age = state.now - source.lastTouchedAt;
  const fadeProgress = age <= hold ? 0 : clamp((age - hold) / fade, 0, 1);
  return 1 - fadeProgress;
}

function getActiveEdgeSourceAlphaMultiplier(source) {
  return getEdgeSourceStrengthMultiplier(
    source,
    config.activeEdgeHoldMs * getTrailLengthMultiplier(),
    config.activeEdgeFadeMs,
  );
}

function getEnclosureEdgeSourceStrengthMultiplier(source) {
  return getEdgeSourceStrengthMultiplier(
    source,
    config.enclosureEdgeHoldMs,
    config.enclosureEdgeFadeMs,
  );
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
      const visualStrength = getActiveEdgeSourceAlphaMultiplier(source);
      const enclosureStrength = getEnclosureEdgeSourceStrengthMultiplier(source);
      if (visualStrength <= 0 && enclosureStrength <= 0) {
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
  const desiredCount = Math.max(0, Math.round(config.npcCount));
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

function updateDrivenPlayer(player, deltaSeconds, { sendNetworkEdges = false } = {}) {
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
    if (sendNetworkEdges) {
      sendEdgeTouch(segment.startIntersection, segment.endIntersection);
    }

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

  updateDrivenPlayer(player, deltaSeconds, { sendNetworkEdges: true });
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
    updateDrivenPlayer(player, deltaSeconds, { sendNetworkEdges: false });
  }

  if (npcPlanComplete(lead)) {
    setNpcPatchCell(chooseNpcPatchCell(state.npc.patchCell || state.npc.lastPatchCell));
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

function buildEdgeActivitySnapshot({ includeCurrentSegment = false } = {}) {
  const snapshot = new Map();

  function touchSnapshotEntry(key, strength, sourceIds) {
    if (strength <= 0) {
      return;
    }

    let entry = snapshot.get(key);
    if (!entry) {
      entry = {
        strength: 0,
        sourceIds: new Set(),
      };
      snapshot.set(key, entry);
    }

    entry.strength = Math.max(entry.strength, strength);

    for (const sourceId of sourceIds) {
      entry.sourceIds.add(sourceId);
    }
  }

  for (const [key, edge] of state.activeEdges.entries()) {
    let strength = 0;
    for (const source of edge.sources.values()) {
      strength = Math.max(strength, getEnclosureEdgeSourceStrengthMultiplier(source));
    }
    if (strength <= 0) {
      continue;
    }

    touchSnapshotEntry(key, strength, edge.sources.keys());
  }

  if (!includeCurrentSegment) {
    return snapshot;
  }

  for (const player of getRenderablePlayers()) {
    if (!player.segment) {
      continue;
    }

    const key = createSegmentKey(
      player.segment.startIntersection,
      player.segment.endIntersection,
    );
    const strength = clamp(player.segment.progress, 0, 1);

    touchSnapshotEntry(key, strength, [player.id]);
  }

  return snapshot;
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

function getBarrierSegmentKeyBetweenCells(aCol, aRow, bCol, bRow, cols, rows) {
  const deltaCol = bCol - aCol;
  const deltaRow = bRow - aRow;

  if (Math.abs(deltaCol) + Math.abs(deltaRow) !== 1) {
    return null;
  }

  if (deltaCol !== 0) {
    const borderCol = Math.max(aCol, bCol);
    const row = aRow;

    if (row < 0 || row >= rows || borderCol < 0 || borderCol > cols) {
      return null;
    }

    return createSegmentKey(
      { col: borderCol, row },
      { col: borderCol, row: row + 1 },
    );
  }

  const borderRow = Math.max(aRow, bRow);
  const col = aCol;

  if (col < 0 || col >= cols || borderRow < 0 || borderRow > rows) {
    return null;
  }

  return createSegmentKey(
    { col, row: borderRow },
    { col: col + 1, row: borderRow },
  );
}

function buildEnclosedRegions() {
  const cols = cellCountX();
  const rows = cellCountY();
  if (cols <= 0 || rows <= 0) {
    return [];
  }

  const edgeSnapshot = buildEdgeActivitySnapshot({
    includeCurrentSegment: config.enclosureIncludeCurrentSegment,
  });
  const barrierThreshold = clamp(config.enclosureEdgeActiveThreshold, 0, 1);
  const barrierEntries = new Map();

  for (const [key, entry] of edgeSnapshot.entries()) {
    if (entry.strength >= barrierThreshold) {
      barrierEntries.set(key, entry);
    }
  }

  const expandedCols = cols + 2;
  const expandedRows = rows + 2;
  const outsideReachable = new Uint8Array(expandedCols * expandedRows);
  const regionVisited = new Uint8Array(cols * rows);
  const directions = [
    { col: 1, row: 0 },
    { col: -1, row: 0 },
    { col: 0, row: 1 },
    { col: 0, row: -1 },
  ];

  function expandedIndex(expandedCol, expandedRow) {
    return expandedRow * expandedCols + expandedCol;
  }

  function roomIndex(col, row) {
    return row * cols + col;
  }

  const outsideQueue = [{ col: 0, row: 0 }];
  outsideReachable[expandedIndex(0, 0)] = 1;

  while (outsideQueue.length > 0) {
    const cell = outsideQueue.shift();
    const logicalCol = cell.col - 1;
    const logicalRow = cell.row - 1;

    for (const direction of directions) {
      const nextExpandedCol = cell.col + direction.col;
      const nextExpandedRow = cell.row + direction.row;

      if (
        nextExpandedCol < 0
        || nextExpandedCol >= expandedCols
        || nextExpandedRow < 0
        || nextExpandedRow >= expandedRows
      ) {
        continue;
      }

      const nextIndex = expandedIndex(nextExpandedCol, nextExpandedRow);
      if (outsideReachable[nextIndex]) {
        continue;
      }

      const nextLogicalCol = nextExpandedCol - 1;
      const nextLogicalRow = nextExpandedRow - 1;
      const barrierKey = getBarrierSegmentKeyBetweenCells(
        logicalCol,
        logicalRow,
        nextLogicalCol,
        nextLogicalRow,
        cols,
        rows,
      );

      if (barrierKey && barrierEntries.has(barrierKey)) {
        continue;
      }

      outsideReachable[nextIndex] = 1;
      outsideQueue.push({
        col: nextExpandedCol,
        row: nextExpandedRow,
      });
    }
  }

  const regions = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const roomCellIndex = roomIndex(col, row);
      const expandedCellIndex = expandedIndex(col + 1, row + 1);

      if (regionVisited[roomCellIndex] || outsideReachable[expandedCellIndex]) {
        continue;
      }

      const regionQueue = [{ col, row }];
      const regionCells = [];
      const regionCellKeys = new Set();
      regionVisited[roomCellIndex] = 1;

      while (regionQueue.length > 0) {
        const current = regionQueue.shift();
        const currentKey = createCellKey(current);
        regionCells.push(current);
        regionCellKeys.add(currentKey);

        for (const direction of directions) {
          const nextCol = current.col + direction.col;
          const nextRow = current.row + direction.row;

          if (nextCol < 0 || nextCol >= cols || nextRow < 0 || nextRow >= rows) {
            continue;
          }

          const barrierKey = getBarrierSegmentKeyBetweenCells(
            current.col,
            current.row,
            nextCol,
            nextRow,
            cols,
            rows,
          );

          if (barrierKey && barrierEntries.has(barrierKey)) {
            continue;
          }

          const nextRoomIndex = roomIndex(nextCol, nextRow);
          if (regionVisited[nextRoomIndex]) {
            continue;
          }

          regionVisited[nextRoomIndex] = 1;
          regionQueue.push({ col: nextCol, row: nextRow });
        }
      }

      const boundaryEdgeKeys = new Set();
      const contributorIds = new Set();

      for (const cell of regionCells) {
        for (const direction of directions) {
          const nextCol = cell.col + direction.col;
          const nextRow = cell.row + direction.row;
          const barrierKey = getBarrierSegmentKeyBetweenCells(
            cell.col,
            cell.row,
            nextCol,
            nextRow,
            cols,
            rows,
          );

          if (!barrierKey || !barrierEntries.has(barrierKey)) {
            continue;
          }

          if (
            nextCol >= 0
            && nextCol < cols
            && nextRow >= 0
            && nextRow < rows
            && regionCellKeys.has(createCellKey({ col: nextCol, row: nextRow }))
          ) {
            continue;
          }

          boundaryEdgeKeys.add(barrierKey);

          for (const contributorId of barrierEntries.get(barrierKey).sourceIds) {
            contributorIds.add(contributorId);
          }
        }
      }

      if (boundaryEdgeKeys.size === 0) {
        continue;
      }

      regions.push({
        cells: regionCells,
        areaCellCount: regionCells.length,
        boundaryEdgeCount: boundaryEdgeKeys.size,
        contributorCount: contributorIds.size,
      });
    }
  }

  return regions;
}

function getHeldCellTargetAlpha(contributorCount) {
  const contributorBonus = Math.max(0, contributorCount - 1)
    * Math.max(0, config.heldCellContributorOpacityBonus);
  return clamp(config.heldCellOpacity + contributorBonus, 0, 1);
}

function getHeldCellVisualAlpha(cell) {
  const entry = state.heldCells.get(createCellKey(cell));
  return entry ? clamp(entry.alpha || 0, 0, 1) : 0;
}

function getRevealCellVisualAlpha(cell) {
  const entry = state.revealCells.get(createCellKey(cell));
  return entry ? clamp(entry.alpha || 0, 0, 1) : 0;
}

function getCellStateVisualAlpha(cell) {
  const entry = state.cellStates.get(createCellKey(cell));
  return entry ? clamp(entry.alpha || 0, 0, 1) : 0;
}

function getCellImageOpacity(cell) {
  return getCellStateVisualAlpha(cell);
}

function countLockedCellStates() {
  let count = 0;

  for (const entry of state.cellStates.values()) {
    if (clamp(entry.alpha || 0, 0, 1) <= 0.001) {
      continue;
    }

    if (entry.lockedUntil > state.now) {
      count += 1;
    }
  }

  return count;
}

function getHeldCellsAdjacentToEdge(edge) {
  const cols = cellCountX();
  const rows = cellCountY();
  const start = edge.start;
  const end = edge.end;

  if (start.row === end.row) {
    const row = start.row;
    const minCol = Math.min(start.col, end.col);
    const topCellRow = row - 1;
    const bottomCellRow = row;

    if (
      minCol < 0
      || minCol >= cols
      || topCellRow < 0
      || bottomCellRow >= rows
    ) {
      return null;
    }

    return [
      { col: minCol, row: topCellRow },
      { col: minCol, row: bottomCellRow },
    ];
  }

  if (start.col === end.col) {
    const col = start.col;
    const minRow = Math.min(start.row, end.row);
    const leftCellCol = col - 1;
    const rightCellCol = col;

    if (
      minRow < 0
      || minRow >= rows
      || leftCellCol < 0
      || rightCellCol >= cols
    ) {
      return null;
    }

    return [
      { col: leftCellCol, row: minRow },
      { col: rightCellCol, row: minRow },
    ];
  }

  return null;
}

function getHeldEdgeFadeMultiplier(edge) {
  if (!config.heldEdgeFadeEnabled || !config.revealEnabled) {
    return 1;
  }

  const adjacentCells = getHeldCellsAdjacentToEdge(edge);
  if (!adjacentCells) {
    return 1;
  }

  const [a, b] = adjacentCells;
  if (getCellImageOpacity(a) <= 0.001 || getCellImageOpacity(b) <= 0.001) {
    return 1;
  }

  return clamp(config.heldEdgeFadeMinAlpha, 0, 1);
}

function pointToRectDistance(x, y, rect) {
  const dx = x < rect.x
    ? rect.x - x
    : x > rect.x + rect.width
      ? x - (rect.x + rect.width)
      : 0;
  const dy = y < rect.y
    ? rect.y - y
    : y > rect.y + rect.height
      ? y - (rect.y + rect.height)
      : 0;
  return Math.hypot(dx, dy);
}

function buildCellChargeRateMap() {
  const chargeRates = new Map();
  const cols = cellCountX();
  const rows = cellCountY();
  if (cols <= 0 || rows <= 0) {
    return chargeRates;
  }

  const cellSize = getWorldCellSize();
  const maxRing = getEffectiveCellChargeMaxRing();
  const ringFalloff = getEffectiveCellChargeRingFalloff();
  const ringFloor = config.cellRingFloorEnabled ? getEffectiveCellRingFloor() : 0;
  const baseChargeRate = getEffectiveBaseCellChargePerSecond() * getEffectiveCellChargeMultiplier();

  for (const player of getRenderablePlayers()) {
    const minCol = clamp(Math.floor(player.x / cellSize) - maxRing - 1, 0, cols - 1);
    const maxCol = clamp(Math.floor(player.x / cellSize) + maxRing + 1, 0, cols - 1);
    const minRow = clamp(Math.floor(player.y / cellSize) - maxRing - 1, 0, rows - 1);
    const maxRow = clamp(Math.floor(player.y / cellSize) + maxRing + 1, 0, rows - 1);

    for (let col = minCol; col <= maxCol; col += 1) {
      for (let row = minRow; row <= maxRow; row += 1) {
        const cell = { col, row };
        const rect = getCellRect(cell);
        const distanceCells = pointToRectDistance(player.x, player.y, rect) / cellSize;
        const ringIndex = distanceCells <= 0.001 ? 0 : Math.ceil(distanceCells - 0.001);

        if (ringIndex > maxRing) {
          continue;
        }

        const weight = ringIndex === 0
          ? 1
          : Math.max(Math.pow(ringFalloff, ringIndex), ringFloor);
        if (weight <= 0) {
          continue;
        }

        const key = createCellKey(cell);
        chargeRates.set(key, (chargeRates.get(key) || 0) + baseChargeRate * weight);
      }
    }
  }

  return chargeRates;
}

function synchronizeLinkedLockedCellGroups() {
  if (!config.cellLinkedLockFade) {
    return;
  }

  const lockedKeys = new Set();
  for (const [key, entry] of state.cellStates.entries()) {
    if (entry.lockedUntil > state.now && clamp(entry.alpha || 0, 0, 1) >= 0.999) {
      lockedKeys.add(key);
    }
  }

  if (lockedKeys.size <= 1) {
    return;
  }

  const visited = new Set();
  const directions = [
    { col: 1, row: 0 },
    { col: -1, row: 0 },
    { col: 0, row: 1 },
    { col: 0, row: -1 },
  ];

  for (const key of lockedKeys) {
    if (visited.has(key)) {
      continue;
    }

    const queue = [key];
    const groupEntries = [];
    let maxLockedUntil = 0;

    while (queue.length > 0) {
      const currentKey = queue.shift();
      if (visited.has(currentKey)) {
        continue;
      }
      visited.add(currentKey);

      const entry = state.cellStates.get(currentKey);
      if (!entry || entry.lockedUntil <= state.now || clamp(entry.alpha || 0, 0, 1) < 0.999) {
        continue;
      }

      groupEntries.push(entry);
      maxLockedUntil = Math.max(maxLockedUntil, entry.lockedUntil);

      for (const direction of directions) {
        const neighborKey = createCellKey({
          col: entry.cell.col + direction.col,
          row: entry.cell.row + direction.row,
        });
        if (lockedKeys.has(neighborKey) && !visited.has(neighborKey)) {
          queue.push(neighborKey);
        }
      }
    }

    if (groupEntries.length <= 1) {
      continue;
    }

    for (const entry of groupEntries) {
      entry.lockedUntil = maxLockedUntil;
    }
  }
}

function updateCellStates(deltaSeconds) {
  state.revealCells.clear();
  state.heldCells.clear();

  if (!config.revealEnabled) {
    state.cellStates.clear();
    return;
  }

  synchronizeLinkedLockedCellGroups();

  const chargeRates = buildCellChargeRateMap();
  const decayMs = getEffectiveCellDecayMs();
  const lockHoldMs = getEffectiveCellLockHoldMs();
  const decayPerSecond = decayMs <= 0 ? Number.POSITIVE_INFINITY : 1000 / decayMs;
  const keys = new Set([
    ...state.cellStates.keys(),
    ...chargeRates.keys(),
  ]);

  for (const key of keys) {
    const chargeRate = Math.max(0, chargeRates.get(key) || 0);
    let entry = state.cellStates.get(key);

    if (!entry) {
      const [colText, rowText] = key.split(',');
      entry = {
        cell: {
          col: Number.parseInt(colText, 10),
          row: Number.parseInt(rowText, 10),
        },
        alpha: 0,
        lockedUntil: 0,
      };
    }

    const isLocked = entry.lockedUntil > state.now;
    if (isLocked) {
      entry.alpha = 1;
      state.cellStates.set(key, entry);
      continue;
    }

    entry.lockedUntil = 0;
    const decayAmount = Number.isFinite(decayPerSecond) ? decayPerSecond * deltaSeconds : 1;
    const nextAlpha = clamp(entry.alpha + chargeRate * deltaSeconds - decayAmount, 0, 1);

    entry.alpha = nextAlpha;

    if (entry.alpha >= 0.999) {
      entry.alpha = 1;
      entry.lockedUntil = state.now + lockHoldMs;
    }

    if (entry.alpha <= 0.001 && chargeRate <= 0 && entry.lockedUntil <= state.now) {
      state.cellStates.delete(key);
      continue;
    }

    state.cellStates.set(key, entry);
  }
}

function updateHeldCells(deltaSeconds) {
  if (!config.enclosureEnabled) {
    state.heldCells.clear();
    return;
  }

  const activeCells = new Map();
  const minCells = Math.max(1, Math.round(config.enclosureMinCells));
  const maxCells = Math.max(minCells, getEffectivePatchMaxCells());
  const minContributors = Math.max(1, Math.round(config.enclosureMinContributors));

  for (const region of buildEnclosedRegions()) {
    if (region.areaCellCount < minCells || region.areaCellCount > maxCells) {
      continue;
    }

    if (region.contributorCount < minContributors) {
      continue;
    }

    const targetAlpha = getHeldCellTargetAlpha(region.contributorCount);
    const holdMs = Math.max(
      0,
      config.heldCellHoldMs
        + Math.max(0, region.contributorCount - 1) * config.heldCellContributorHoldBonusMs,
    );

    for (const cell of region.cells) {
      const key = createCellKey(cell);
      activeCells.set(key, {
        cell: { ...cell },
        targetAlpha,
        holdMs,
        contributorCount: region.contributorCount,
        areaCellCount: region.areaCellCount,
        boundaryEdgeCount: region.boundaryEdgeCount,
      });
    }
  }

  const deltaMs = deltaSeconds * 1000;
  const seenKeys = new Set();

  for (const [key, activeCell] of activeCells.entries()) {
    seenKeys.add(key);
    let entry = state.heldCells.get(key);

    if (!entry) {
      entry = {
        cell: { ...activeCell.cell },
        alpha: 0,
        targetAlpha: 0,
        holdMs: activeCell.holdMs,
        lastActiveAt: state.now,
        contributorCount: activeCell.contributorCount,
        areaCellCount: activeCell.areaCellCount,
        boundaryEdgeCount: activeCell.boundaryEdgeCount,
        isActive: true,
      };
    }

    const responseMs = activeCell.targetAlpha >= entry.alpha
      ? Math.max(0, config.heldCellFadeInMs)
      : Math.max(1, config.heldCellFadeOutMs);
    const step = responseMs <= 0 ? 1 : clamp(deltaMs / responseMs, 0, 1);

    entry.alpha = lerp(entry.alpha, activeCell.targetAlpha, step);
    entry.targetAlpha = activeCell.targetAlpha;
    entry.holdMs = activeCell.holdMs;
    entry.lastActiveAt = state.now;
    entry.contributorCount = activeCell.contributorCount;
    entry.areaCellCount = activeCell.areaCellCount;
    entry.boundaryEdgeCount = activeCell.boundaryEdgeCount;
    entry.isActive = true;
    state.heldCells.set(key, entry);
  }

  for (const [key, entry] of state.heldCells.entries()) {
    if (seenKeys.has(key)) {
      continue;
    }

    let targetAlpha = 0;
    if (state.now - entry.lastActiveAt < entry.holdMs) {
      targetAlpha = entry.alpha;
    }

    const responseMs = targetAlpha >= entry.alpha
      ? Math.max(0, config.heldCellFadeInMs)
      : Math.max(1, config.heldCellFadeOutMs);
    const step = responseMs <= 0 ? 1 : clamp(deltaMs / responseMs, 0, 1);

    entry.alpha = lerp(entry.alpha, targetAlpha, step);
    entry.targetAlpha = targetAlpha;
    entry.isActive = false;

    if (entry.alpha <= 0.001 && entry.targetAlpha <= 0.001) {
      state.heldCells.delete(key);
    }
  }
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

function drawHeldCells() {
  // Cell reveal now renders from a single cell-energy layer in drawRevealCells().
}

function drawRevealCellDebug() {
  if (!config.showRevealCells) {
    return;
  }

  ctx.save();

  for (const entry of state.revealCells.values()) {
    const rect = getCellRect(entry.cell);
    const screenRect = worldRectToScreenRect(rect);
    const alpha = getRevealCellAlpha(entry);

    if (alpha <= 0) {
      continue;
    }

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.16 + alpha * 0.4})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      screenRect.x + 0.5,
      screenRect.y + 0.5,
      Math.max(0, screenRect.width - 1),
      Math.max(0, screenRect.height - 1),
    );

    ctx.fillStyle = `rgba(255, 255, 255, ${0.18 + alpha * 0.42})`;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      String(entry.activeEdgeCount),
      screenRect.x + screenRect.width * 0.5,
      screenRect.y + screenRect.height * 0.5,
    );
  }

  ctx.restore();
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
  ctx.lineCap = config.activeEdgeLineCap;
  ctx.lineJoin = config.activeEdgeLineCap;

  const visualScale = state.view.scale;
  const lineAlpha = config.activeEdgeOpacity * alphaMultiplier;
  const glowAlpha = config.activeEdgeGlowOpacity * alphaMultiplier;
  const glowSpread = Math.max(0, config.activeEdgeGlowWidth * visualScale);
  const activeLineWidth = Math.max(0.5, config.activeEdgeLineWidth * visualScale);
  const glowEmitterWidth = Math.max(1.25, activeLineWidth + glowSpread * 0.28);
  const glowStrokeAlpha = Math.min(1, glowAlpha * 0.16);

  if (glowAlpha > 0 && (config.activeEdgeGlowBlur > 0 || glowSpread > 0)) {
    ctx.shadowBlur = config.activeEdgeGlowBlur * visualScale + glowSpread;
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
  ctx.lineWidth = activeLineWidth;
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
    const alphaMultiplier = getActiveEdgeAlphaMultiplier(edge) * getHeldEdgeFadeMultiplier(edge);

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
  if (!config.activeEdgeEnabled) {
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
  if (!config.showIntersections) {
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
  if (!config.showTrailBuffOverlay) {
    return;
  }

  const playerCount = getEffectiveRoomPlayerCount();
  const npcCount = countVisibleNpcPlayers();
  const syntheticCount = countVisibleSyntheticLocalPlayers();
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
    `local synth ${syntheticCount}`,
    `local npcs ${npcCount}`,
    `energy scale ${formatMetric(cellEnergyScale)}x`,
    `buff scale ${formatMetric(coopBuffScale)}x`,
    `charge base ${formatMetric(config.cellChargePerSecond)}/s`,
    `charge +/player ${formatMetric(config.cellChargeBuffPerPlayer)}x`,
    `charge live ${formatMetric(effectiveChargePerSecond * chargeMultiplier)}/s`,
    `falloff base ${formatMetric(config.cellChargeRingFalloff)}`,
    `falloff +/player ${formatMetric(config.cellRingFalloffBonusPerPlayer)}`,
    `falloff live ${formatMetric(effectiveRingFalloff)}`,
    `floor ${config.cellRingFloorEnabled ? 'on' : 'off'}`,
    `floor base ${formatMetric(config.cellRingFloor)}`,
    `floor +/player ${formatMetric(config.cellRingFloorBonusPerPlayer)}`,
    `floor live ${formatMetric(effectiveRingFloor)}`,
    `rings base ${formatMetric(config.cellChargeMaxRing)}`,
    `rings +/player ${formatMetric(config.cellRingCountBonusPerPlayer)}`,
    `rings live ${formatMetric(effectiveMaxRing)}`,
    `linked fade ${config.cellLinkedLockFade ? 'on' : 'off'}`,
    `decay base ${formatMetric(config.cellDecayMs)}ms`,
    `decay +/player ${formatMetric(config.cellDecayBonusMsPerPlayer)}ms`,
    `decay live ${formatMetric(effectiveDecayMs)}ms`,
    `lock base ${formatMetric(config.cellLockHoldMs)}ms`,
    `lock +/player ${formatMetric(config.cellLockHoldBonusMsPerPlayer)}ms`,
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
  drawHeldCells();

  if (config.gridOverReveal) {
    drawBaseGrid();
  }

  drawActiveEdges();
  drawActiveSegments();
  drawRevealCellDebug();
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
  rebuildRevealSource();

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
  applyGuiLayout(guiInstance);
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

function setupGui() {
  const gui = new GUI({ title: 'Grid Controls' });
  guiInstance = gui;
  ensureGuiHelpOverlay(gui);

  const backgroundFolder = gui.addFolder('Background');
  backgroundFolder.add(config, 'backgroundGradientEnabled').name('Enabled');
  backgroundFolder.addColor(config, 'backgroundGradientTopColor').name('Top Color');
  backgroundFolder.addColor(config, 'backgroundGradientBottomColor').name('Bottom Color');
  backgroundFolder.add(config, 'backgroundGradientTopAlpha', 0, 1, 0.01).name('Top Alpha');
  backgroundFolder.add(config, 'backgroundGradientBottomAlpha', 0, 1, 0.01).name('Bottom Alpha');
  backgroundFolder.close();

  const sceneFolder = gui.addFolder('Scene');
  sceneFolder.addColor(config, 'backgroundColor').name('Fallback');
  sceneFolder.close();

  const gridFolder = gui.addFolder('Base Grid');
  gridFolder.add(config, 'gridSize', 40, 200, 1)
    .name('World Cell')
    .onChange(() => {
      syncRoomWorldFromConfig({ geometryChanged: true });
    });
  gridFolder.add(config, 'minCellScreenPx', 18, 120, 1)
    .name('Min Screen Cell')
    .onChange(() => {
      syncRoomWorldFromConfig();
    });
  gridFolder.addColor(config, 'gridColor').name('Color');
  gridFolder.add(config, 'gridOpacity', 0, 1, 0.01).name('Opacity');
  gridFolder.add(config, 'gridLineWidth', 1, 4, 1).name('Line Width');
  gridFolder.add(config, 'gridOverReveal').name('Over Reveal');
  gridFolder.close();

  const motionFolder = gui.addFolder('Motion');
  motionFolder.add(config, 'spawnDelayMs', 0, 3000, 10).name('Spawn Delay');
  motionFolder.add(config, 'spawnFadeMs', 0, 2000, 10).name('Spawn Fade');
  motionFolder.add(config, 'followPointerDelayMs', 0, 3000, 10).name('Follow Delay');
  motionFolder.add(config, 'moveSpeed', 60, 1200, 1).name('Speed');
  motionFolder.add(config, 'routePreference', ['horizontal-first', 'vertical-first', 'alternating']).name('Routing');
  motionFolder.add(config, 'turnPauseMs', 0, 500, 5).name('Turn Pause');
  motionFolder.add(config, 'segmentEasing', 0, 1, 0.01).name('Smoothing');
  motionFolder.close();

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
  nodeFolder.close();

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
  activeEdgeFolder.close();

  const buffsFolder = gui.addFolder('Buffs');
  attachGuiHelp(
    buffsFolder.add(config, 'coopBuffEffect', 0, 3, 0.05).name('Co-op Buff Effect'),
    GUI_HELP_TEXT.coopBuffEffect,
  );
  attachGuiHelp(
    buffsFolder.add(config, 'cellChargeBuffPerPlayer', 0, 2, 0.05).name('Charge +/Player'),
    GUI_HELP_TEXT.cellChargeBuffPerPlayer,
  );
  attachGuiHelp(
    buffsFolder.add(config, 'cellRingFalloffBonusPerPlayer', 0, 0.5, 0.05).name('Falloff +/Player'),
    GUI_HELP_TEXT.cellRingFalloffBonusPerPlayer,
  );
  attachGuiHelp(
    buffsFolder.add(config, 'cellRingFloorBonusPerPlayer', 0, 0.5, 0.05).name('Floor +/Player'),
    GUI_HELP_TEXT.cellRingFloorBonusPerPlayer,
  );
  attachGuiHelp(
    buffsFolder.add(config, 'cellRingCountBonusPerPlayer', 0, 4, 0.25).name('Rings +/Player'),
    GUI_HELP_TEXT.cellRingCountBonusPerPlayer,
  );
  attachGuiHelp(
    buffsFolder.add(config, 'cellDecayBonusMsPerPlayer', 0, 4000, 50).name('Decay +/Player'),
    GUI_HELP_TEXT.cellDecayBonusMsPerPlayer,
  );
  attachGuiHelp(
    buffsFolder.add(config, 'cellLockHoldBonusMsPerPlayer', 0, 4000, 50).name('Hold +/Player'),
    GUI_HELP_TEXT.cellLockHoldBonusMsPerPlayer,
  );
  buffsFolder.open();

  const npcFolder = gui.addFolder('NPCs');
  attachGuiHelp(
    npcFolder.add(config, 'npcCount', 0, 5, 1).name('NPC Count'),
    GUI_HELP_TEXT.npcCount,
  );
  npcFolder.open();

  const revealFolder = gui.addFolder('Reveal');
  revealFolder.add(config, 'revealEnabled').name('Enabled');
  revealFolder.add(config, 'revealImageSrc').name('Image Src').onFinishChange(() => {
    loadRevealImage();
  });
  revealFolder.add(config, 'revealImageFitMode', ['native', 'contain', 'cover'])
  .name('Image Fit')
  .onChange(() => {
    syncRoomWorldFromConfig();
  });

revealFolder.add(config, 'revealImageScale', 0.1, 4, 0.01)
  .name('Image Scale')
  .onChange(() => {
    syncRoomWorldFromConfig();
  });

revealFolder.add(config, 'revealImageOffsetX', -4000, 4000, 1)
  .name('Image Offset X')
  .onChange(() => {
    syncRoomWorldFromConfig();
  });

  revealFolder.add(config, 'revealImageOffsetY', -4000, 4000, 1)
  .name('Image Offset Y')
  .onChange(() => {
    syncRoomWorldFromConfig();
  });

  revealFolder.add(config, 'revealVignetteEnabled')
    .name('Vignette')
    .onChange(() => {
      syncRoomWorldFromConfig();
    });
  revealFolder.add(config, 'revealVignetteMode', ['alpha', 'color'])
    .name('Vignette Mode')
    .onChange(() => {
      updateRevealVignetteGuiState();
      syncRoomWorldFromConfig();
    });
  guiControllers.revealVignetteColor = revealFolder.addColor(config, 'revealVignetteColor')
    .name('Vignette Color')
    .onChange(() => {
      syncRoomWorldFromConfig();
    });
  revealFolder.add(config, 'revealVignetteInnerOpacity', 0, 1, 0.01)
    .name('Vignette Inner')
    .onChange(() => {
      syncRoomWorldFromConfig();
    });
  revealFolder.add(config, 'revealVignetteEdgeOpacity', 0, 1, 0.01)
    .name('Vignette Edge')
    .onChange(() => {
      syncRoomWorldFromConfig();
    });
  revealFolder.add(config, 'revealVignetteSize', 0, 1000, 1)
    .name('Vignette Size')
    .onChange(() => {
      syncRoomWorldFromConfig();
    });
  revealFolder.add(config, 'revealVignetteCurve', 0.1, 6, 0.1)
    .name('Vignette Curve')
    .onChange(() => {
      syncRoomWorldFromConfig();
    });

  revealFolder.add(config, 'revealImageOpacity', 0, 1, 0.01).name('Image Alpha');
  revealFolder.addColor(config, 'revealTintColor').name('Tint');
  revealFolder.add(config, 'revealTintOpacity', 0, 1, 0.01).name('Tint Alpha');
  revealFolder.close();

  const cellEnergyFolder = gui.addFolder('Cell Energy');
  attachGuiHelp(
    cellEnergyFolder.add(config, 'cellEnergyEffect', 0, 3, 0.05).name('Cell Energy Effect'),
    GUI_HELP_TEXT.cellEnergyEffect,
  );
  attachGuiHelp(
    cellEnergyFolder.add(config, 'cellChargePerSecond', 0, 4, 0.05).name('Core Charge /s'),
    GUI_HELP_TEXT.cellChargePerSecond,
  );
  attachGuiHelp(
    cellEnergyFolder.add(config, 'cellChargeRingFalloff', 0, 1, 0.05).name('Ring Falloff'),
    GUI_HELP_TEXT.cellChargeRingFalloff,
  );
  attachGuiHelp(
    cellEnergyFolder.add(config, 'cellRingFloorEnabled').name('Ring Floor Enabled'),
    GUI_HELP_TEXT.cellRingFloorEnabled,
  );
  attachGuiHelp(
    cellEnergyFolder.add(config, 'cellRingFloor', 0, 1, 0.05).name('Ring Floor'),
    GUI_HELP_TEXT.cellRingFloor,
  );
  attachGuiHelp(
    cellEnergyFolder.add(config, 'cellChargeMaxRing', 0, 6, 1).name('Ring Count'),
    GUI_HELP_TEXT.cellChargeMaxRing,
  );
  attachGuiHelp(
    cellEnergyFolder.add(config, 'cellDecayMs', 100, 8000, 50).name('Decay Time'),
    GUI_HELP_TEXT.cellDecayMs,
  );
  attachGuiHelp(
    cellEnergyFolder.add(config, 'cellLockHoldMs', 0, 8000, 50).name('Lock Hold'),
    GUI_HELP_TEXT.cellLockHoldMs,
  );
  attachGuiHelp(
    cellEnergyFolder.add(config, 'cellLinkedLockFade').name('Linked Lock Fade'),
    GUI_HELP_TEXT.cellLinkedLockFade,
  );
  cellEnergyFolder.open();

  const debugFolder = gui.addFolder('Debug');
  attachGuiHelp(debugFolder.add(config, 'showTarget').name('Target'), GUI_HELP_TEXT.showTarget);
  attachGuiHelp(
    debugFolder.add(config, 'showIntersections').name('Intersections'),
    GUI_HELP_TEXT.showIntersections,
  );
  attachGuiHelp(
    debugFolder.add(config, 'showRevealCells').name('Reveal Cells'),
    GUI_HELP_TEXT.showRevealCells,
  );
  attachGuiHelp(
    debugFolder.add(config, 'showHeldCells').name('Cell Opacity'),
    GUI_HELP_TEXT.showHeldCells,
  );
  attachGuiHelp(
    debugFolder.add(config, 'showTrailBuffOverlay').name('Co-op Overlay'),
    GUI_HELP_TEXT.showTrailBuffOverlay,
  );
  attachGuiHelp(
    debugFolder.add(config, 'showPlayerIds').name('Player IDs'),
    GUI_HELP_TEXT.showPlayerIds,
  );
  attachGuiHelp(
    debugFolder.add(config, 'showViewportDebug').name('Viewport Metrics'),
    GUI_HELP_TEXT.showViewportDebug,
  );
  debugFolder.open();

  updateRevealVignetteGuiState();

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
  networkFolder.close();

  const utilitiesFolder = gui.addFolder('Utilities');
  utilitiesFolder.add(actions, 'clearActiveEdges').name('Clear Active Edges');
  utilitiesFolder.add(actions, 'clearRevealCells').name('Clear Cell States');
  utilitiesFolder.add(actions, 'clearHeldCells').name('Clear Legacy Cells');
  utilitiesFolder.add(actions, 'randomizeSpawn').name('Random Spawn');
  utilitiesFolder.add(actions, 'reconnectNetwork').name('Reconnect Network');
  utilitiesFolder.add(actions, 'disconnectNetwork').name('Disconnect Network');
  utilitiesFolder.add(actions, 'addDebugPlayer').name('Add Debug Player');
  utilitiesFolder.add(actions, 'clearDebugPlayers').name('Clear Debug Players');
  utilitiesFolder.add(actions, 'reloadRevealImage').name('Reload Reveal Image');
  utilitiesFolder.add(actions, 'copyConfig').name('Copy Config');
  utilitiesFolder.add(actions, 'pasteConfig').name('Paste Config');
  utilitiesFolder.close();

  bindGuiHelpFromMap(gui);
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
