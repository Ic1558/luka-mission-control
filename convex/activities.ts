import { v } from "convex/values";
import { mutation, query } from "./server";
import { normalizeSourceRef, redactValue } from "./redact";

const activityInput = v.object({
  ts: v.number(),
  kind: v.string(),
  status: v.string(),
  module: v.string(),
  summary: v.string(),
  sourceRef: v.string(),
  raw: v.any(),
});

function encodeCursor(ts: number, id: string): string {
  return `${ts}:${id}`;
}

function decodeCursor(cursor: string | null): { ts: number; id: string } | null {
  if (!cursor) return null;
  const firstSep = cursor.indexOf(":");
  if (firstSep === -1) return null;
  const ts = Number.parseInt(cursor.slice(0, firstSep), 10);
  const id = cursor.slice(firstSep + 1);
  if (!Number.isFinite(ts) || id.length === 0) return null;
  return { ts, id };
}

export const listActivities = query({
  args: {
    limit: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("activities").order("desc").collect();
    const parsedCursor = decodeCursor(args.cursor);
    const filtered = parsedCursor
      ? all.filter(
          (item) =>
            item.ts < parsedCursor.ts ||
            (item.ts === parsedCursor.ts && String(item._id) < parsedCursor.id),
        )
      : all;
    const items = filtered.slice(0, args.limit);
    const last = items.length > 0 ? items[items.length - 1] : null;
    return {
      items,
      nextCursor: last ? encodeCursor(last.ts, String(last._id)) : null,
    };
  },
});

export const ingestActivities = mutation({
  args: {
    batch: v.array(activityInput),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const item of args.batch) {
      await ctx.db.insert("activities", {
        ts: item.ts,
        kind: item.kind,
        status: item.status,
        module: item.module,
        summary: item.summary,
        sourceRef: normalizeSourceRef(item.sourceRef),
        raw: redactValue(item.raw),
        createdAt: now,
      });
    }
    return { inserted: args.batch.length };
  },
});
