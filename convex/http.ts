import { httpRouter } from "convex/server";
import { httpAction } from "./server";

function badRequest(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

const http = httpRouter();

http.route({
  path: "/ingest/activities",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expected = process.env.INGEST_TOKEN;
    if (!expected) {
      return new Response("INGEST_TOKEN is not configured", { status: 500 });
    }

    const authHeader = request.headers.get("authorization") ?? "";
    const actual = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";
    if (actual !== expected) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    if (!body || typeof body !== "object" || !("batch" in body)) {
      return badRequest("Payload must include batch");
    }

    const batch = (body as { batch: unknown }).batch;
    if (!Array.isArray(batch)) {
      return badRequest("batch must be an array");
    }

    for (const item of batch) {
      if (!item || typeof item !== "object") {
        return badRequest("batch entries must be objects");
      }
      const candidate = item as Record<string, unknown>;
      const fields = ["ts", "kind", "status", "module", "summary", "sourceRef"];
      for (const field of fields) {
        if (!(field in candidate)) {
          return badRequest(`Missing field: ${field}`);
        }
      }
      if (typeof candidate.ts !== "number") {
        return badRequest("ts must be a number");
      }
    }

    const result = await ctx.runMutation("activities:ingestActivities" as any, {
      batch,
    });

    return new Response(JSON.stringify(result), {
      headers: { "content-type": "application/json" },
    });
  }),
});

export default http;
