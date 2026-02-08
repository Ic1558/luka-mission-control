import { makeFunctionReference } from "convex/server";

export const qListActivities = makeFunctionReference<"query">(
  "activities:listActivities",
);
export const qListScheduledTasks = makeFunctionReference<"query">(
  "scheduledTasks:listScheduledTasks",
);
export const qSearchAll = makeFunctionReference<"query">("search:searchAll");

export const mIngestActivities = makeFunctionReference<"mutation">(
  "activities:ingestActivities",
);
export const mUpsertDocuments = makeFunctionReference<"mutation">(
  "documents:upsertDocuments",
);
export const mSeedDemo = makeFunctionReference<"mutation">("dataSeed:seedDemo");
export const mToggleScheduledTask = makeFunctionReference<"mutation">(
  "scheduledTasks:toggleScheduledTask",
);
