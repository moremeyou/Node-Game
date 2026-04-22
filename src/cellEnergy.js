function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function pointToRectAxisDistance(x, y, rect) {
  return {
    x: x < rect.x
      ? rect.x - x
      : x > rect.x + rect.width
        ? x - (rect.x + rect.width)
        : 0,
    y: y < rect.y
      ? rect.y - y
      : y > rect.y + rect.height
        ? y - (rect.y + rect.height)
        : 0,
  };
}

function buildCellChargeRateMap({
  renderablePlayers,
  cols,
  rows,
  cellSize,
  maxRing,
  ringFalloff,
  cornerChargeFactor,
  chargePerSecond,
  getCellRect,
  createCellKey,
}) {
  const chargeRates = new Map();
  if (cols <= 0 || rows <= 0 || cellSize <= 0 || maxRing < 0 || chargePerSecond <= 0) {
    return chargeRates;
  }

  const roundness = clamp(cornerChargeFactor, 0, 1);

  for (const player of renderablePlayers) {
    const centerCol = Math.floor(player.x / cellSize);
    const centerRow = Math.floor(player.y / cellSize);
    const searchRadius = Math.max(0, Math.ceil(maxRing + 1));
    const minCol = clamp(centerCol - searchRadius, 0, cols - 1);
    const maxCol = clamp(centerCol + searchRadius, 0, cols - 1);
    const minRow = clamp(centerRow - searchRadius, 0, rows - 1);
    const maxRow = clamp(centerRow + searchRadius, 0, rows - 1);

    for (let col = minCol; col <= maxCol; col += 1) {
      for (let row = minRow; row <= maxRow; row += 1) {
        const cell = { col, row };
        const rect = getCellRect(cell);
        const axisDistance = pointToRectAxisDistance(player.x, player.y, rect);
        const xDistanceCells = axisDistance.x / cellSize;
        const yDistanceCells = axisDistance.y / cellSize;
        const squareDistanceCells = Math.max(xDistanceCells, yDistanceCells);
        const roundDistanceCells = Math.hypot(xDistanceCells, yDistanceCells);
        const distanceCells = lerp(squareDistanceCells, roundDistanceCells, roundness);

        if (distanceCells > maxRing + 0.001) {
          continue;
        }

        const weight = distanceCells <= 0.001
          ? 1
          : Math.pow(ringFalloff, distanceCells);
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
  cornerChargeFactor,
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
    cornerChargeFactor,
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
    const targetAlpha = chargeRate <= 0
      ? 0
      : !Number.isFinite(decayPerSecond) || decayPerSecond <= 0
        ? 1
        : clamp(chargeRate / decayPerSecond, 0, 1);
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
    let nextAlpha = entry.alpha;

    if (targetAlpha > entry.alpha) {
      nextAlpha = Math.min(targetAlpha, entry.alpha + chargeRate * deltaSeconds);
    } else if (targetAlpha < entry.alpha) {
      const decayAmount = Number.isFinite(decayPerSecond) ? decayPerSecond * deltaSeconds : entry.alpha;
      nextAlpha = Math.max(targetAlpha, entry.alpha - decayAmount);
    }

    nextAlpha = clamp(nextAlpha, 0, 1);

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
