import test from "node:test";
import assert from "node:assert/strict";
import { parseTelemetryGlob, redactPaths, toActivity } from "../tools/ingest_lib.mjs";

test("redactPaths removes absolute path fragments", () => {
  const input = {
    msg: "read /Users/demo/0luka/file.txt and C:\\temp\\foo",
  };
  const output = redactPaths(input);
  assert.equal(output.msg.includes("<path:redacted>"), true);
  assert.equal(output.msg.includes("/Users/demo"), false);
});

test("parseTelemetryGlob returns directory and suffix", () => {
  const parsed = parseTelemetryGlob("fixtures/telemetry/*.latest.json");
  assert.equal(parsed.dir, "fixtures/telemetry");
  assert.equal(parsed.suffix, ".latest.json");
});

test("toActivity normalizes fallback fields", () => {
  const event = toActivity(
    { message: "hello", agent: "kernel" },
    { kind: "ledger", status: "info", module: "core", sourceRef: "ledger:test" },
  );
  assert.equal(event.kind, "ledger");
  assert.equal(event.status, "info");
  assert.equal(event.module, "kernel");
  assert.equal(event.summary, "hello");
  assert.equal(event.sourceRef, "ledger:test");
});
