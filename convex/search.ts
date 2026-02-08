import { v } from "convex/values";
import { query } from "./server";

export const searchAll = query({
  args: {
    term: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const term = args.term.trim().toLowerCase();
    if (!term) {
      return { activities: [], documents: [], tasks: [] };
    }

    const [activities, docs, tasks] = await Promise.all([
      ctx.db.query("activities").order("desc").collect(),
      ctx.db.query("documents").collect(),
      ctx.db.query("scheduled_tasks").collect(),
    ]);

    const matchesActivity = activities
      .filter((item) =>
        `${item.summary} ${item.kind} ${item.status} ${item.module}`
          .toLowerCase()
          .includes(term),
      )
      .slice(0, args.limit);

    const matchesDocs = docs
      .filter((doc) =>
        `${doc.title} ${doc.body} ${doc.module} ${doc.tags.join(" ")}`
          .toLowerCase()
          .includes(term),
      )
      .slice(0, args.limit)
      .map((doc) => ({
        _id: doc._id,
        title: doc.title,
        module: doc.module,
        snippet: doc.body.slice(0, 180),
      }));

    const matchesTasks = tasks
      .filter((task) => `${task.title} ${task.module}`.toLowerCase().includes(term))
      .slice(0, args.limit);

    return {
      activities: matchesActivity,
      documents: matchesDocs,
      tasks: matchesTasks,
    };
  },
});
