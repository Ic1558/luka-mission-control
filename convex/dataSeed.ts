import { mutation } from "./server";

export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    await ctx.db.insert("activities", {
      ts: now - 90_000,
      kind: "heartbeat",
      status: "ok",
      module: "scheduler",
      summary: "Daily summary worker completed",
      sourceRef: "ledger:global_beacon.jsonl",
      raw: { traceId: "trace_demo_1", note: "All checks green" },
      createdAt: now,
    });

    await ctx.db.insert("activities", {
      ts: now - 45_000,
      kind: "task",
      status: "warn",
      module: "bridge",
      summary: "Outbox task retried after timeout",
      sourceRef: "outbox:tasks/demo-task.json",
      raw: { traceId: "trace_demo_2", retries: 1 },
      createdAt: now,
    });

    await ctx.db.insert("documents", {
      docKey: "demo-runbook",
      title: "Mission Control Runbook",
      body: "Use this document for first-response triage and escalation.",
      module: "operations",
      sourceRef: "docs:runbook.md",
      tags: ["runbook", "ops"],
      updatedAt: now,
    });

    await ctx.db.insert("scheduled_tasks", {
      title: "Daily summary",
      module: "scheduler",
      dayOfWeek: 1,
      hour: 9,
      minute: 0,
      durationMinutes: 20,
      active: true,
      sourceRef: "schedule:daily-summary",
      updatedAt: now,
    });

    await ctx.db.insert("scheduled_tasks", {
      title: "Telemetry compaction",
      module: "observability",
      dayOfWeek: 3,
      hour: 14,
      minute: 30,
      durationMinutes: 40,
      active: false,
      sourceRef: "schedule:telemetry-compaction",
      updatedAt: now,
    });

    return { seededAt: now };
  },
});
