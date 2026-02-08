# 0luka Signals Contract v1 (Read-Only)

Mission Control consumes signals from external sources and never mutates source files.

## Inputs

- `OLUKA_LEDGER_JSONL`: newline-delimited JSON records.
- `OLUKA_OUTBOX_DIR`: directory of JSON task files.
- `OLUKA_TELEMETRY_GLOB`: telemetry snapshot files matching `*.latest.json`.

## Guarantees

- Consumer only reads files.
- Absolute filesystem paths are redacted before persistence.
- Source provenance is recorded as ref-like strings (`ledger:*`, `outbox:*`, `telemetry:*`).
- Ingestion is incremental using persisted file offsets/mtimes (`tools/.ingest_state.json`).

## Normalized Activity Shape

```ts
{
  ts: number;
  kind: string;
  status: string;
  module: string;
  summary: string;
  sourceRef: string;
  raw: unknown;
}
```

## Transport

- POST `/ingest/activities` (Convex HTTP Action)
- Auth: `Authorization: Bearer <INGEST_TOKEN>`
- Body: `{ "batch": Activity[] }`
