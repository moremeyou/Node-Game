function formatSnapshotValue(value, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  const childIndent = '  '.repeat(indentLevel + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    const lines = ['['];
    for (const entry of value) {
      lines.push(`${childIndent}${formatSnapshotValue(entry, indentLevel + 1)},`);
    }
    lines.push(`${indent}]`);
    return lines.join('\n');
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return '{}';
    }

    const lines = ['{'];
    for (const [key, entry] of entries) {
      lines.push(`${childIndent}${key}: ${formatSnapshotValue(entry, indentLevel + 1)},`);
    }
    lines.push(`${indent}}`);
    return lines.join('\n');
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (value == null) {
    return 'null';
  }

  return JSON.stringify(value);
}

export function buildNamedSnapshot(name, value) {
  return `const ${name} = ${formatSnapshotValue(value)};`;
}

export function parseNamedSnapshot(text, expectedName = null) {
  const rawText = String(text || '').trim();
  if (!rawText) {
    return null;
  }

  let objectSource = rawText;
  const objectMatch = rawText.match(/const\s+([A-Za-z_$][\w$]*)\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);

  if (objectMatch) {
    const [, assignedName, assignedObjectSource] = objectMatch;
    if (expectedName && assignedName !== expectedName) {
      return null;
    }
    objectSource = assignedObjectSource;
  }

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
