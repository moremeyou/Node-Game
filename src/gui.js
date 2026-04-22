import GUI from 'lil-gui';

const GUI_HELP_ENABLED = false;

const GUI_HELP_TEXT = {
  backgroundGradientEnabled: 'Turns the background gradient on or off behind the scene.',
  backgroundGradientTopColor: 'Top color of the scene background gradient.',
  backgroundGradientBottomColor: 'Bottom color of the scene background gradient.',
  backgroundGradientTopAlpha: 'Opacity of the gradient at the top of the screen.',
  backgroundGradientBottomAlpha: 'Opacity of the gradient at the bottom of the screen.',
  flatBackgroundColor: 'Flat background color used when the gradient is disabled.',
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
  trailEnabled: 'Shows or hides the local trail rendering. Trails are visual only now and no longer drive cell charge.',
  trailColor: 'Core line color of the local trail rendering.',
  trailOpacity: 'Opacity of the trail line.',
  trailGlowColor: 'Glow color for trail visuals.',
  trailGlowOpacity: 'Opacity of the trail glow.',
  trailLineWidth: 'Thickness of the trail line.',
  trailGlowWidth: 'Additional spread used to widen the trail glow.',
  trailLineCap: 'Line cap style used for trail rendering.',
  trailGlowBlur: 'Blur radius of the trail glow.',
  trailHoldMs: 'How long a touched edge stays fully bright before its visual fade starts.',
  trailFadeMs: 'How long trail visuals take to fade out after hold time ends.',
  npcHelperCount: 'How many local helper players to use for testing. With buff-only mode off they spawn as NPC nodes; with it on they only count toward local co-op buffs.',
  buffOnlyHelpersEnabled: 'Uses the NPC Helpers count only for local co-op buff scaling without spawning extra helper nodes. Useful when you want the multiplayer look/feel tuning without other nodes moving around.',
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
  cellChargePerSecond: 'How strongly the spotlight pushes cells upward toward visibility each second near the node center.',
  cellChargeRingFalloff: 'How quickly the spotlight fades with distance from the node. Lower values tighten the beam; higher values spread it farther.',
  cellCornerChargeFactor: 'Blends the spotlight shape from squarer cell-space distance toward rounder Euclidean distance. Higher values feel more like a flashlight.',
  cellChargeMaxRing: 'Maximum spotlight reach in cell units before charge drops to zero.',
  cellDecayMs: 'How quickly cell opacity relaxes back down when the spotlight weakens or moves away.',
  cellLockHoldMs: 'How long a cell stays pinned at 100 after it fully charges.',
  cellLinkedLockFade: 'When on, side-connected locked cells share one release time and start fading together.',
  coopBuffEffect: 'Global multiplier for all per-player co-op bonuses. 1 keeps them unchanged, 0 disables them.',
  cellChargeBuffPerPlayer: 'Extra per-player brightness multiplier applied on top of the base spotlight charge.',
  cellRingFalloffBonusPerPlayer: 'Extra per-player increase to spotlight falloff, making the beam spread wider and stay softer at the edge.',
  cellRoundnessBonusPerPlayer: 'Extra per-player increase to spotlight roundness, making the beam less square and more flashlight-like.',
  cellRingCountBonusPerPlayer: 'Extra per-player spotlight radius. This is discrete, so smaller scaled bonuses may not add a full extra cell yet.',
  cellDecayBonusMsPerPlayer: 'Extra per-player time before cells fully drain, making patches linger longer.',
  cellLockHoldBonusMsPerPlayer: 'Extra per-player hold time after a cell reaches 100.',
  showTarget: 'Shows the current target intersection for the local player.',
  showGridIntersections: 'Shows the world-space grid intersections used for movement and node snapping.',
  showHeldCells: 'Shows each room cell as a 0-100 image-opacity value from the current cell-energy system.',
  showEnergyOverlay: 'Shows live co-op and cell-energy buff values in the lower-left overlay.',
  showPlayerIds: 'Draws each visible player id above its node.',
  showViewportDebug: 'Shows canvas and viewport metrics for layout debugging.',
  allowDesktopNodeLock: 'Desktop-only testing aid. When enabled, clicking the local node locks it in place, and the next canvas click unlocks it.',
  desktopJumpLockMode: 'Desktop-only spotlight test mode. The local node stays locked by default, and each canvas click clears cell energy and jumps the node directly to the clicked intersection.',
};

function setControllerEnabled(controller, enabled) {
  if (!controller || !controller.domElement) {
    return;
  }

  controller.domElement.style.opacity = enabled ? '1' : '0.4';
  controller.domElement.style.pointerEvents = enabled ? 'auto' : 'none';
}

export function createGuiManager({
  config,
  baselineConfig,
  actions,
  networkInfo,
  getViewportSize,
  clamp,
  callbacks,
}) {
  const GUI_HELP_WATCHDOG_MS = 1400;
  let guiInstance = null;
  let guiHelpOverlay = null;
  let guiHelpActiveTarget = null;
  let guiHelpPinned = false;
  let guiHelpWatchdogTimer = 0;
  let listenersBound = false;
  const guiControllers = {
    revealVignetteColor: null,
  };

  function guiHelpEnabled() {
    return !!(
      GUI_HELP_ENABLED
      && window.matchMedia
      && window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
  }

  function clearGuiHelpWatchdog() {
    if (!guiHelpWatchdogTimer) {
      return;
    }

    window.clearTimeout(guiHelpWatchdogTimer);
    guiHelpWatchdogTimer = 0;
  }

  function targetStillNeedsGuiHelp(target) {
    if (!target || !target.isConnected) {
      return false;
    }

    const activeElement = document.activeElement;
    return target.matches(':hover') || !!(activeElement && target.contains(activeElement));
  }

  function scheduleGuiHelpWatchdog() {
    clearGuiHelpWatchdog();

    if (!guiHelpEnabled() || !guiHelpActiveTarget) {
      return;
    }

    guiHelpWatchdogTimer = window.setTimeout(() => {
      guiHelpWatchdogTimer = 0;

      if (!guiHelpActiveTarget || !guiHelpOverlay || guiHelpOverlay.style.display === 'none') {
        return;
      }

      if (targetStillNeedsGuiHelp(guiHelpActiveTarget)) {
        scheduleGuiHelpWatchdog();
        return;
      }

      hideGuiHelp({ force: true });
    }, GUI_HELP_WATCHDOG_MS);
  }

  function ensureGuiHelpOverlay() {
    if (!guiInstance || !guiHelpEnabled()) {
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
    if (!guiHelpEnabled() || !text || !target) {
      return;
    }

    ensureGuiHelpOverlay();
    if (!guiHelpOverlay) {
      return;
    }

    guiHelpOverlay.textContent = text;
    guiHelpActiveTarget = target;
    guiHelpPinned = pinned;
    guiHelpOverlay.style.display = 'block';
    positionGuiHelpOverlay();
    scheduleGuiHelpWatchdog();
  }

  function hideGuiHelp({ force = false } = {}) {
    clearGuiHelpWatchdog();

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
    if (!guiHelpEnabled()) {
      return;
    }

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
    if (!target || target.dataset.guiHelpBound === '1') {
      return controller;
    }

    const label = controller.domElement.querySelector('.name');
    if (label) {
      label.title = text;
    }

    if (!guiHelpEnabled()) {
      return controller;
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

  function controllerUsesBaseline(controller) {
    return !!(
      baselineConfig
      && controller
      && controller.object === config
      && typeof controller.property === 'string'
      && Object.prototype.hasOwnProperty.call(baselineConfig, controller.property)
    );
  }

  function updateControllerChangedState(controller) {
    if (!controller || !controller.domElement) {
      return;
    }

    const row = controller.domElement;
    if (!controllerUsesBaseline(controller)) {
      row.style.background = '';
      row.style.boxShadow = '';
      row.style.borderRadius = '';
      row.style.transition = '';
      return;
    }

    const changed = !Object.is(config[controller.property], baselineConfig[controller.property]);
    row.style.borderRadius = '4px';
    row.style.transition = 'background-color 120ms ease, box-shadow 120ms ease';
    row.style.background = changed ? 'rgba(110, 169, 255, 0.14)' : '';
    row.style.boxShadow = changed ? 'inset 0 0 0 1px rgba(110, 169, 255, 0.26)' : '';
  }

  function bindControllerChangedState(controller) {
    if (!controller || !controller.domElement || !controllerUsesBaseline(controller)) {
      return controller;
    }

    const row = controller.domElement;
    if (row.dataset.changedStateBound === '1') {
      updateControllerChangedState(controller);
      return controller;
    }

    const refreshChangedState = () => {
      window.requestAnimationFrame(() => {
        updateControllerChangedState(controller);
      });
    };

    row.addEventListener('input', refreshChangedState);
    row.addEventListener('change', refreshChangedState);
    row.addEventListener('click', refreshChangedState);
    row.dataset.changedStateBound = '1';
    updateControllerChangedState(controller);
    return controller;
  }

  function bindControllerUiState() {
    if (!guiInstance || typeof guiInstance.controllersRecursive !== 'function') {
      return;
    }

    for (const controller of guiInstance.controllersRecursive()) {
      bindControllerChangedState(controller);
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

  function bindGlobalListeners() {
    if (listenersBound || !guiHelpEnabled()) {
      return;
    }

    document.addEventListener('pointerdown', handleGlobalGuiHelpPointerDown, true);
    window.addEventListener('resize', positionGuiHelpOverlay);
    window.addEventListener('scroll', positionGuiHelpOverlay, true);
    listenersBound = true;
  }

  function updateRevealVignetteState() {
    const usesColor = config.revealVignetteMode === 'color';
    setControllerEnabled(guiControllers.revealVignetteColor, usesColor);
  }

  function refreshDisplay() {
    if (!guiInstance || typeof guiInstance.controllersRecursive !== 'function') {
      return;
    }

    for (const controller of guiInstance.controllersRecursive()) {
      controller.updateDisplay();
      updateControllerChangedState(controller);
    }
  }

  function applyLayout() {
    if (!guiInstance) {
      return;
    }

    const margin = 12;
    const viewportSize = getViewportSize();
    const width = Math.max(240, Math.min(320, viewportSize.width - margin * 2));
    const el = guiInstance.domElement;

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

  function setup() {
    if (guiInstance) {
      return guiInstance;
    }

    const gui = new GUI({ title: 'Nodegame Controls' });
    guiInstance = gui;
    bindGlobalListeners();
    if (guiHelpEnabled()) {
      ensureGuiHelpOverlay();
    }

    const roomWorldFolder = gui.addFolder('Room World');
    roomWorldFolder.add(config, 'gridSize', 40, 200, 1)
      .name('World Cell Size')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig({ geometryChanged: true });
      });
    roomWorldFolder.add(config, 'minCellScreenPx', 18, 120, 1)
      .name('Min Cell On Screen')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig();
      });
    roomWorldFolder.close();

    const backgroundFolder = gui.addFolder('Background');
    backgroundFolder.add(config, 'backgroundGradientEnabled').name('Enabled');
    backgroundFolder.addColor(config, 'backgroundGradientTopColor').name('Top Color');
    backgroundFolder.addColor(config, 'backgroundGradientBottomColor').name('Bottom Color');
    backgroundFolder.add(config, 'backgroundGradientTopAlpha', 0, 1, 0.01).name('Top Alpha');
    backgroundFolder.add(config, 'backgroundGradientBottomAlpha', 0, 1, 0.01).name('Bottom Alpha');
    backgroundFolder.addColor(config, 'flatBackgroundColor').name('Flat Color');
    backgroundFolder.close();

    const gridAestheticFolder = gui.addFolder('Grid Aesthetic');
    gridAestheticFolder.addColor(config, 'gridColor').name('Grid Color');
    gridAestheticFolder.add(config, 'gridOpacity', 0, 1, 0.01).name('Grid Opacity');
    gridAestheticFolder.add(config, 'gridLineWidth', 1, 4, 1).name('Line Width');
    gridAestheticFolder.add(config, 'gridOverReveal').name('Over Reveal');
    attachGuiHelp(
      gridAestheticFolder.add(config, 'showGridIntersections').name('Intersections'),
      GUI_HELP_TEXT.showGridIntersections,
    );
    gridAestheticFolder.close();

    const revealFolder = gui.addFolder('Reveal Image');
    revealFolder.add(config, 'revealEnabled').name('Enabled');
    revealFolder.add(config, 'revealImageSrc').name('Image Src').onFinishChange(() => {
      callbacks.loadRevealImage();
    });
    revealFolder.add(config, 'revealImageFitMode', ['native', 'contain', 'cover'])
      .name('Image Fit')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig();
      });
    revealFolder.add(config, 'revealImageScale', 0.1, 4, 0.01)
      .name('Image Scale')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig();
      });
    revealFolder.add(config, 'revealImageOffsetX', -4000, 4000, 1)
      .name('Image Offset X')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig();
      });
    revealFolder.add(config, 'revealImageOffsetY', -4000, 4000, 1)
      .name('Image Offset Y')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig();
      });
    revealFolder.add(config, 'revealVignetteEnabled')
      .name('Vignette')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig();
      });
    revealFolder.add(config, 'revealVignetteMode', ['alpha', 'color'])
      .name('Vignette Mode')
      .onChange(() => {
        updateRevealVignetteState();
        callbacks.syncRoomWorldFromConfig();
      });
    guiControllers.revealVignetteColor = revealFolder.addColor(config, 'revealVignetteColor')
      .name('Vignette Color')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig();
      });
    revealFolder.add(config, 'revealVignetteInnerOpacity', 0, 1, 0.01)
      .name('Vignette Inner')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig();
      });
    revealFolder.add(config, 'revealVignetteEdgeOpacity', 0, 1, 0.01)
      .name('Vignette Edge')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig();
      });
    revealFolder.add(config, 'revealVignetteSize', 0, 1000, 1)
      .name('Vignette Size')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig();
      });
    revealFolder.add(config, 'revealVignetteCurve', 0.1, 6, 0.1)
      .name('Vignette Curve')
      .onChange(() => {
        callbacks.syncRoomWorldFromConfig();
      });
    revealFolder.add(config, 'revealImageOpacity', 0, 1, 0.01).name('Image Alpha');
    revealFolder.addColor(config, 'revealTintColor').name('Tint');
    revealFolder.add(config, 'revealTintOpacity', 0, 1, 0.01).name('Tint Alpha');
    revealFolder.add(actions, 'reloadRevealImage').name('Reload Reveal Image');
    revealFolder.close();

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

    const nodeBehaviorFolder = gui.addFolder('Node Behavior');
    nodeBehaviorFolder.add(config, 'spawnDelayMs', 0, 3000, 10).name('Spawn Delay');
    nodeBehaviorFolder.add(config, 'spawnFadeMs', 0, 2000, 10).name('Spawn Fade');
    nodeBehaviorFolder.add(config, 'followPointerDelayMs', 0, 3000, 10).name('Follow Delay');
    nodeBehaviorFolder.add(config, 'moveSpeed', 60, 1200, 1).name('Speed');
    nodeBehaviorFolder.add(config, 'routePreference', ['horizontal-first', 'vertical-first', 'alternating']).name('Routing');
    nodeBehaviorFolder.add(config, 'turnPauseMs', 0, 500, 5).name('Turn Pause');
    nodeBehaviorFolder.add(config, 'segmentEasing', 0, 1, 0.01).name('Smoothing');
    nodeBehaviorFolder.close();

    const trailFolder = gui.addFolder('Trail Visuals');
    trailFolder.add(config, 'trailEnabled').name('Enabled');
    trailFolder.addColor(config, 'trailColor').name('Line');
    trailFolder.add(config, 'trailOpacity', 0, 1, 0.01).name('Line Alpha');
    trailFolder.addColor(config, 'trailGlowColor').name('Glow');
    trailFolder.add(config, 'trailGlowOpacity', 0, 1, 0.01).name('Glow Alpha');
    trailFolder.add(config, 'trailLineWidth', 1, 12, 0.1).name('Line Width');
    trailFolder.add(config, 'trailGlowWidth', 0, 28, 0.5).name('Glow Spread');
    trailFolder.add(config, 'trailLineCap', ['round', 'butt', 'square']).name('Cap Style');
    trailFolder.add(config, 'trailGlowBlur', 0, 60, 1).name('Glow Blur');
    trailFolder.add(config, 'trailHoldMs', 0, 4000, 10).name('Hold Time');
    trailFolder.add(config, 'trailFadeMs', 50, 6000, 10).name('Fade Time');
    trailFolder.add(actions, 'clearActiveEdges').name('Clear Trails');
    trailFolder.close();

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
      cellEnergyFolder.add(config, 'cellChargeRingFalloff', 0, 1, 0.05).name('Falloff'),
      GUI_HELP_TEXT.cellChargeRingFalloff,
    );
    attachGuiHelp(
      cellEnergyFolder.add(config, 'cellCornerChargeFactor', 0, 1, 0.05).name('Roundness'),
      GUI_HELP_TEXT.cellCornerChargeFactor,
    );
    attachGuiHelp(
      cellEnergyFolder.add(config, 'cellChargeMaxRing', 0, 6, 0.25).name('Radius'),
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
    cellEnergyFolder.add(actions, 'clearCellStates').name('Clear Cell Energy');
    cellEnergyFolder.open();

    const buffsFolder = gui.addFolder('Co-op Buffs');
    attachGuiHelp(
      buffsFolder.add(config, 'coopBuffEffect', 0, 3, 0.05).name('Co-op Buff Effect'),
      GUI_HELP_TEXT.coopBuffEffect,
    );
    attachGuiHelp(
      buffsFolder.add(config, 'cellChargeBuffPerPlayer', 0, 2, 0.05).name('Charge Bonus / Player'),
      GUI_HELP_TEXT.cellChargeBuffPerPlayer,
    );
    attachGuiHelp(
      buffsFolder.add(config, 'cellRingFalloffBonusPerPlayer', 0, 0.5, 0.05).name('Falloff Bonus / Player'),
      GUI_HELP_TEXT.cellRingFalloffBonusPerPlayer,
    );
    attachGuiHelp(
      buffsFolder.add(config, 'cellRoundnessBonusPerPlayer', 0, 0.5, 0.05).name('Roundness Bonus / Player'),
      GUI_HELP_TEXT.cellRoundnessBonusPerPlayer,
    );
    attachGuiHelp(
      buffsFolder.add(config, 'cellRingCountBonusPerPlayer', 0, 4, 0.25).name('Radius Bonus / Player'),
      GUI_HELP_TEXT.cellRingCountBonusPerPlayer,
    );
    attachGuiHelp(
      buffsFolder.add(config, 'cellDecayBonusMsPerPlayer', 0, 4000, 50).name('Decay Bonus / Player'),
      GUI_HELP_TEXT.cellDecayBonusMsPerPlayer,
    );
    attachGuiHelp(
      buffsFolder.add(config, 'cellLockHoldBonusMsPerPlayer', 0, 4000, 50).name('Lock Hold Bonus / Player'),
      GUI_HELP_TEXT.cellLockHoldBonusMsPerPlayer,
    );
    buffsFolder.open();

    updateRevealVignetteState();

    const networkFolder = gui.addFolder('Networking');
    networkFolder.add(config, 'networkUrl').name('WS URL').onFinishChange(() => {
      callbacks.connectNetwork({ force: true });
    });
    networkFolder.add(config, 'networkSendIntervalMs', 20, 250, 5).name('Send Interval');
    networkFolder.add(config, 'networkReconnectDelayMs', 250, 5000, 50).name('Reconnect Delay');
    networkFolder.add(networkInfo, 'status').name('Status').listen();
    networkFolder.add(networkInfo, 'roomId').name('Room').listen();
    networkFolder.add(networkInfo, 'players').name('Players').listen();
    networkFolder.add(networkInfo, 'shareUrl').name('Browser URL').listen();
    networkFolder.add(actions, 'resetServer').name('Reset Server');
    networkFolder.close();

    const debugFolder = gui.addFolder('Debug');
    attachGuiHelp(debugFolder.add(config, 'showTarget').name('Target'), GUI_HELP_TEXT.showTarget);
    attachGuiHelp(
      debugFolder.add(config, 'showHeldCells').name('Cell Opacity'),
      GUI_HELP_TEXT.showHeldCells,
    );
    attachGuiHelp(
      debugFolder.add(config, 'showEnergyOverlay').name('Energy Overlay'),
      GUI_HELP_TEXT.showEnergyOverlay,
    );
    attachGuiHelp(
      debugFolder.add(config, 'showPlayerIds').name('Player IDs'),
      GUI_HELP_TEXT.showPlayerIds,
    );
    attachGuiHelp(
      debugFolder.add(config, 'showViewportDebug').name('Viewport Metrics'),
      GUI_HELP_TEXT.showViewportDebug,
    );
    attachGuiHelp(
      debugFolder.add(config, 'allowDesktopNodeLock').name('Desktop Node Lock'),
      GUI_HELP_TEXT.allowDesktopNodeLock,
    );
    attachGuiHelp(
      debugFolder.add(config, 'desktopJumpLockMode').name('Locked Jump Mode'),
      GUI_HELP_TEXT.desktopJumpLockMode,
    );
    debugFolder.open();

    const devToolsFolder = gui.addFolder('Dev Tools');
    attachGuiHelp(
      devToolsFolder.add(config, 'npcHelperCount', 0, 5, 1).name('NPC Helpers'),
      GUI_HELP_TEXT.npcHelperCount,
    );
    attachGuiHelp(
      devToolsFolder.add(config, 'buffOnlyHelpersEnabled').name('Buff-Only Helpers'),
      GUI_HELP_TEXT.buffOnlyHelpersEnabled,
    );
    devToolsFolder.add(actions, 'resetDefaultConfig').name('Reset Config');
    devToolsFolder.add(actions, 'copyChangedConfig').name('Copy Changed Config');
    devToolsFolder.add(actions, 'copyConfig').name('Copy Full Config');
    devToolsFolder.add(actions, 'pasteConfig').name('Paste Full Config');
    devToolsFolder.open();

    bindControllerUiState();
    refreshDisplay();
    applyLayout();
    return gui;
  }

  return {
    setup,
    applyLayout,
    refreshDisplay,
    updateRevealVignetteState,
  };
}
