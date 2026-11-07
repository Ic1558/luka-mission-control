> **LEGACY — superseded by [LukaOS](https://github.com/Ic1558/lukaos), the active local-first runtime.**
> Historical references and migration status are tracked in LukaOS [docs/native-company-database.md](https://github.com/Ic1558/lukaos/blob/main/docs/native-company-database.md). Legacy consumers are retired incrementally; check migration status before relying on this repository.

# luka-mission-control

Mission Control dashboard built with Next.js App Router + Convex.

## Features

- Activity Feed from read-only 0luka-style signals
- Weekly Calendar view of scheduled tasks
- Global Search across activities, documents, and scheduled tasks

## Environment Variables

Create `.env.local`:

```bash
# Convex app URL for Next.js client
NEXT_PUBLIC_CONVEX_URL="https://<your-deployment>.convex.cloud"

# Convex ingest token expected by convex/http.ts
INGEST_TOKEN="replace-with-strong-token"

# Ingest worker target + auth
MISSION_CONTROL_INGEST_URL="https://<your-deployment>.convex.site"
MISSION_CONTROL_INGEST_TOKEN="replace-with-strong-token"

# Optional ingestion sources (defaults point to fixtures/)
OLUKA_LEDGER_JSONL="/path/to/global_beacon.jsonl"
OLUKA_OUTBOX_DIR="/path/to/interface/outbox/tasks"
OLUKA_TELEMETRY_GLOB="/path/to/observability/telemetry/*.latest.json"
```

## Run

Terminal 1:

```bash
npm install
npx convex dev
```

Terminal 2:

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

## Seed Demo Data

Inside the dashboard, click `Seed Demo Data`.

Or from CLI:

```bash
npx convex run dataSeed:seedDemo '{}'
```

## Ingest Worker

Dry run against fixtures:

```bash
node tools/ingest_0luka_signals.mjs --dry-run
```

Real ingest run:

```bash
MISSION_CONTROL_INGEST_URL="https://<deployment>.convex.site" \
MISSION_CONTROL_INGEST_TOKEN="<token>" \
OLUKA_LEDGER_JSONL="fixtures/global_beacon.jsonl" \
OLUKA_OUTBOX_DIR="fixtures/outbox/tasks" \
OLUKA_TELEMETRY_GLOB="fixtures/telemetry/*.latest.json" \
node tools/ingest_0luka_signals.mjs
```

## Verification

```bash
npm test
npm run build
```

## Path Portability

All stored payloads are path-scrubbed (`<path:redacted>`) before insertion. Source links are stored as ref-style strings like `ledger:global_beacon.jsonl`.
