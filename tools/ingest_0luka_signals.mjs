#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parseTelemetryGlob, toActivity, toSourceRef } from "./ingest_lib.mjs";

const STATE_FILE = process.env.INGEST_STATE_FILE ?? "tools/.ingest_state.json";

function readEnv(name, fallback = "") {
  return process.env[name] ?? fallback;
}

async function readJson(file, fallback) {
  try {
    const content = await fs.readFile(file, "utf8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readLedger(ledgerPath, state) {
  const content = await fs.readFile(ledgerPath, "utf8");
  const offset = state.ledgerOffset ?? 0;
  const tail = content.slice(offset);
  const lines = tail
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const activities = lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .map((entry) =>
      toActivity(entry, {
        kind: "ledger",
        status: "info",
        module: "core",
        sourceRef: toSourceRef("ledger", ledgerPath),
      }),
    );
  return {
    activities,
    nextOffset: content.length,
  };
}

async function readOutbox(outboxDir, state) {
  const entries = await fs.readdir(outboxDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const seen = state.outboxMtime ?? {};
  const activities = [];

  for (const name of files) {
    const filePath = path.join(outboxDir, name);
    const stat = await fs.stat(filePath);
    if (seen[name] && seen[name] >= stat.mtimeMs) {
      continue;
    }
    const raw = await readJson(filePath, { summary: `Outbox file ${name}` });
    activities.push(
      toActivity(raw, {
        kind: "outbox",
        status: "queued",
        module: "tasks",
        sourceRef: toSourceRef("outbox", filePath, outboxDir),
      }),
    );
    seen[name] = stat.mtimeMs;
  }

  return {
    activities,
    nextSeen: seen,
  };
}

async function readTelemetry(globPattern, state) {
  const { dir, suffix } = parseTelemetryGlob(globPattern);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => entry.name);
  const seen = state.telemetryMtime ?? {};
  const activities = [];

  for (const name of files) {
    const filePath = path.join(dir, name);
    const stat = await fs.stat(filePath);
    if (seen[name] && seen[name] >= stat.mtimeMs) {
      continue;
    }
    const raw = await readJson(filePath, { summary: `Telemetry file ${name}` });
    activities.push(
      toActivity(raw, {
        kind: "telemetry",
        status: "info",
        module: "observability",
        sourceRef: toSourceRef("telemetry", filePath, dir),
      }),
    );
    seen[name] = stat.mtimeMs;
  }

  return {
    activities,
    nextSeen: seen,
  };
}

async function postBatch(activities) {
  const baseUrl = readEnv("MISSION_CONTROL_INGEST_URL");
  const token = readEnv("MISSION_CONTROL_INGEST_TOKEN");
  if (!baseUrl || !token) {
    throw new Error("MISSION_CONTROL_INGEST_URL and MISSION_CONTROL_INGEST_TOKEN are required");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/ingest/activities`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ batch: activities }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ingest failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function main() {
  const ledger = readEnv("OLUKA_LEDGER_JSONL", "fixtures/global_beacon.jsonl");
  const outbox = readEnv("OLUKA_OUTBOX_DIR", "fixtures/outbox/tasks");
  const telemetry = readEnv("OLUKA_TELEMETRY_GLOB", "fixtures/telemetry/*.latest.json");
  const dryRun = process.argv.includes("--dry-run");

  const state = await readJson(STATE_FILE, {});
  const [ledgerResult, outboxResult, telemetryResult] = await Promise.all([
    readLedger(ledger, state),
    readOutbox(outbox, state),
    readTelemetry(telemetry, state),
  ]);

  const batch = [...ledgerResult.activities, ...outboxResult.activities, ...telemetryResult.activities]
    .sort((a, b) => a.ts - b.ts);

  if (batch.length === 0) {
    console.log("No new events to ingest.");
    return;
  }

  if (dryRun) {
    console.log(`Prepared ${batch.length} activity events (dry run).`);
    return;
  }

  const result = await postBatch(batch);
  await writeJson(STATE_FILE, {
    ledgerOffset: ledgerResult.nextOffset,
    outboxMtime: outboxResult.nextSeen,
    telemetryMtime: telemetryResult.nextSeen,
  });
  console.log(`Ingested ${batch.length} events.`, result);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
