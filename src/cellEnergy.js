function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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

function buildCellChargeRateMap({
  renderablePlayers,
  cols,
  rows,
  cellSize,
  maxRing,
  ringFalloff,
  ringFloorEnabled,
  ringFloor,
  chargePerSecond,
  getCellRect,
  createCellKey,
}) {
  const chargeRates = new Map();
  if (cols <= 0 || rows <= 0 || cellSize <= 0 || maxRing < 0 || chargePerSecond <= 0) {
    return chargeRates;
  }

  const effectiveRingFloor = ringFloorEnabled ? Math.max(0, ringFloor) : 0;

  for (const player of renderablePlayers) {
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
          : Math.max(Math.pow(ringFalloff, ringIndex), effectiveRingFloor);
        if (weight <= 0) {
          continue;
        }

        const key = createCellKey(cell);
        chargeRates.set(key, (chargeRates.get(key) || 0) + chargePerSecond * weight);
      }
    }
  }

  return chargeRates;
}

function synchronizeLinkedLockedCellGroups({ cellStates, now, createCellKey }) {
  const lockedKeys = new Set();
  for (const [key, entry] of cellStates.entries()) {
    if (entry.lockedUntil > now && clamp(entry.alpha || 0, 0, 1) >= 0.999) {
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

      const entry = cellStates.get(currentKey);
      if (!entry || entry.lockedUntil <= now || clamp(entry.alpha || 0, 0, 1) < 0.999) {
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

export function countLockedCellStates(cellStates, now) {
  let count = 0;

  for (const entry of cellStates.values()) {
    if (clamp(entry.alpha || 0, 0, 1) <= 0.001) {
      continue;
    }

    if (entry.lockedUntil > now) {
      count += 1;
    }
  }

  return count;
}

export function updateCellEnergyState({
  revealEnabled,
  cellStates,
  now,
  deltaSeconds,
  renderablePlayers,
  cols,
  rows,
  cellSize,
  maxRing,
  ringFalloff,
  ringFloorEnabled,
  ringFloor,
  chargePerSecond,
  decayMs,
  lockHoldMs,
  linkedLockFade,
  getCellRect,
  createCellKey,
}) {
  if (!revealEnabled) {
    cellStates.clear();
    return;
  }

  if (linkedLockFade) {
    synchronizeLinkedLockedCellGroups({ cellStates, now, createCellKey });
  }

  const chargeRates = buildCellChargeRateMap({
    renderablePlayers,
    cols,
    rows,
    cellSize,
    maxRing,
    ringFalloff,
    ringFloorEnabled,
    ringFloor,
    chargePerSecond,
    getCellRect,
    createCellKey,
  });
  const boundedDecayMs = Math.max(0, decayMs);
  const boundedLockHoldMs = Math.max(0, lockHoldMs);
  const decayPerSecond = boundedDecayMs <= 0 ? Number.POSITIVE_INFINITY : 1000 / boundedDecayMs;
  const keys = new Set([
    ...cellStates.keys(),
    ...chargeRates.keys(),
  ]);

  for (const key of keys) {
    const chargeRate = Math.max(0, chargeRates.get(key) || 0);
    let entry = cellStates.get(key);

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

    const isLocked = entry.lockedUntil > now;
    if (isLocked) {
      entry.alpha = 1;
      cellStates.set(key, entry);
      continue;
    }

    entry.lockedUntil = 0;
    const decayAmount = Number.isFinite(decayPerSecond) ? decayPerSecond * deltaSeconds : 1;
    const nextAlpha = clamp(entry.alpha + chargeRate * deltaSeconds - decayAmount, 0, 1);

    entry.alpha = nextAlpha;

    if (entry.alpha >= 0.999) {
      entry.alpha = 1;
      entry.lockedUntil = now + boundedLockHoldMs;
    }

    if (entry.alpha <= 0.001 && chargeRate <= 0 && entry.lockedUntil <= now) {
      cellStates.delete(key);
      continue;
    }

    cellStates.set(key, entry);
  }
}
