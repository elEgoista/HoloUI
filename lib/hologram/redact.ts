export function redactSecrets(input: string) {
  return input
    .replace(/(authorization:\s*bearer\s+)[^\s"'\\]+/gi, "$1[REDACTED]")
    .replace(/((?:api[_-]?key|token|secret|password)\s*[:=]\s*)[^\s"'\\]+/gi, "$1[REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "[REDACTED]");
}

export function redactAndTrim(input: string, maxLength = 1200) {
  const redacted = redactSecrets(input);

  if (redacted.length <= maxLength) {
    return redacted;
  }

  return `${redacted.slice(0, maxLength)}... [truncated]`;
}
