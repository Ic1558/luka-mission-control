import path from "node:path";

const ABSOLUTE_PATH = /(^|\s)(\/[^\s"']+|[A-Za-z]:\\[^\s"']+)/g;

export function redactPaths(input) {
  if (typeof input === "string") {
    return input.replace(ABSOLUTE_PATH, (_match, prefix) => `${prefix}<path:redacted>`);
  }
  if (Array.isArray(input)) {
    return input.map((entry) => redactPaths(entry));
  }
  if (input && typeof input === "object") {
    const output = {};
    for (const [key, value] of Object.entries(input)) {
      output[key] = redactPaths(value);
    }
    return output;
  }
  return input;
}

export function toSourceRef(kind, sourcePath, root = "") {
  const normalized = sourcePath.replace(/\\/g, "/");
  const relative = root
    ? path.posix.relative(root.replace(/\\/g, "/"), normalized)
    : path.posix.basename(normalized);
  return `${kind}:${redactPaths(relative)}`;
}

export function parseTelemetryGlob(globPattern) {
  const starIndex = globPattern.indexOf("*");
  if (starIndex === -1) {
    return {
      dir: path.dirname(globPattern),
      suffix: path.basename(globPattern),
    };
  }
  return {
    dir: globPattern.slice(0, starIndex).replace(/\/$/, ""),
    suffix: globPattern.slice(starIndex + 1),
  };
}

export function toActivity(record, fallback) {
  const ts = Number.parseInt(String(record.ts ?? record.timestamp ?? Date.now()), 10);
  const kind = String(record.kind ?? record.event ?? fallback.kind);
  const status = String(record.status ?? fallback.status);
  const module = String(record.module ?? record.agent ?? fallback.module);
  const summary = String(record.summary ?? record.message ?? `${kind} event`);
  return {
    ts: Number.isFinite(ts) ? ts : Date.now(),
    kind,
    status,
    module,
    summary,
    sourceRef: fallback.sourceRef,
    raw: redactPaths(record),
  };
}
