import { v } from "convex/values";
import { mutation, query } from "./server";
import { normalizeSourceRef } from "./redact";

export const listScheduledTasks = query({
  args: {
    weekStart: v.string(),
  },
  handler: async (ctx) => {
    const rows = await ctx.db.query("scheduled_tasks").collect();
    return rows.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      if (a.hour !== b.hour) return a.hour - b.hour;
      return a.minute - b.minute;
    });
  },
});

export const toggleScheduledTask = mutation({
  args: {
    id: v.id("scheduled_tasks"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      active: args.active,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const upsertScheduledTasks = mutation({
  args: {
    batch: v.array(
      v.object({
        title: v.string(),
        module: v.string(),
        dayOfWeek: v.number(),
        hour: v.number(),
        minute: v.number(),
        durationMinutes: v.number(),
        active: v.boolean(),
        sourceRef: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const task of args.batch) {
      await ctx.db.insert("scheduled_tasks", {
        ...task,
        sourceRef: normalizeSourceRef(task.sourceRef),
        updatedAt: Date.now(),
      });
    }
    return { inserted: args.batch.length };
  },
});
