const ABSOLUTE_PATH = /(^|\s)(\/[^\s"']+|[A-Za-z]:\\[^\s"']+)/g;

function scrubString(input: string): string {
  return input.replace(ABSOLUTE_PATH, (_m, prefix) => `${prefix}<path:redacted>`);
}

export function redactValue(input: unknown): unknown {
  if (typeof input === "string") {
    return scrubString(input);
  }
  if (Array.isArray(input)) {
    return input.map((entry) => redactValue(entry));
  }
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      out[key] = redactValue(value);
    }
    return out;
  }
  return input;
}

export function normalizeSourceRef(value: string): string {
  return scrubString(value).replace(/\\/g, "/");
}
