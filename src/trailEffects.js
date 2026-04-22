function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createSegmentKey(a, b) {
  const left = `${a.col},${a.row}`;
  const right = `${b.col},${b.row}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

function getTrailSourceStrengthMultiplier(source, now, holdMs, fadeMs) {
  const hold = Math.max(0, holdMs);
  const fade = Math.max(1, fadeMs);
  const age = now - source.lastTouchedAt;
  const fadeProgress = age <= hold ? 0 : clamp((age - hold) / fade, 0, 1);
  return 1 - fadeProgress;
}

function getTrailSourceAlphaMultiplier(source, now, holdMs, fadeMs) {
  return getTrailSourceStrengthMultiplier(source, now, holdMs, fadeMs);
}

export function touchTrailEdge(activeEdges, sourceId, start, end, touchedAt) {
  const key = createSegmentKey(start, end);
  let edge = activeEdges.get(key);

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

  activeEdges.set(key, edge);
}

export function getTrailEdgeAlphaMultiplier(edge, now, holdMs, fadeMs) {
  let maxAlpha = 0;

  for (const source of edge.sources.values()) {
    maxAlpha = Math.max(maxAlpha, getTrailSourceAlphaMultiplier(source, now, holdMs, fadeMs));
  }

  return maxAlpha;
}

export function clearExpiredTrailEdges(activeEdges, now, holdMs, fadeMs) {
  for (const [key, edge] of activeEdges.entries()) {
    for (const [sourceId, source] of edge.sources.entries()) {
      if (getTrailSourceAlphaMultiplier(source, now, holdMs, fadeMs) <= 0) {
        edge.sources.delete(sourceId);
      }
    }

    if (edge.sources.size === 0) {
      activeEdges.delete(key);
    }
  }
}
