import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  activities: defineTable({
    ts: v.number(),
    kind: v.string(),
    status: v.string(),
    module: v.string(),
    summary: v.string(),
    sourceRef: v.string(),
    raw: v.any(),
    createdAt: v.number(),
  }).index("by_ts", ["ts"]),
  scheduled_tasks: defineTable({
    title: v.string(),
    module: v.string(),
    dayOfWeek: v.number(),
    hour: v.number(),
    minute: v.number(),
    durationMinutes: v.number(),
    active: v.boolean(),
    sourceRef: v.string(),
    updatedAt: v.number(),
  }).index("by_day", ["dayOfWeek"]),
  documents: defineTable({
    docKey: v.string(),
    title: v.string(),
    body: v.string(),
    module: v.string(),
    sourceRef: v.string(),
    tags: v.array(v.string()),
    updatedAt: v.number(),
  }).index("by_doc_key", ["docKey"]),
});
