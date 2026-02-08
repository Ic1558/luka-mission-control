import { v } from "convex/values";
import { mutation } from "./server";
import { normalizeSourceRef, redactValue } from "./redact";

const documentInput = v.object({
  docKey: v.string(),
  title: v.string(),
  body: v.string(),
  module: v.string(),
  sourceRef: v.string(),
  tags: v.array(v.string()),
});

export const upsertDocuments = mutation({
  args: { batch: v.array(documentInput) },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const doc of args.batch) {
      const existing = await ctx.db
        .query("documents")
        .withIndex("by_doc_key", (q) => q.eq("docKey", doc.docKey))
        .first();
      const payload = {
        title: doc.title,
        body: String(redactValue(doc.body)),
        module: doc.module,
        sourceRef: normalizeSourceRef(doc.sourceRef),
        tags: doc.tags,
        updatedAt: now,
      };
      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert("documents", {
          docKey: doc.docKey,
          ...payload,
        });
      }
    }
    return { upserted: args.batch.length };
  },
});
