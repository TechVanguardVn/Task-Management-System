export function parseHighlightTaskId(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!/^[1-9]\d*$/.test(trimmed)) {
    return null;
  }

  const num = Number(trimmed);

  if (!Number.isSafeInteger(num) || num <= 0) {
    return null;
  }

  return num;
}

