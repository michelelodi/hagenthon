import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import { runClaude } from "../askclaude.mjs";
import { STUB, withEnv, tmpFile } from "./helpers.mjs";

test("captures stdout and exit code", async () => {
  await withEnv({ ASKCLAUDE_STUB_STDOUT: "OUT", ASKCLAUDE_STUB_EXIT: "0" }, async () => {
    const res = await runClaude({ bin: STUB, args: [], stdin: "", timeoutMs: 5000, cwd: tmpdir() });
    assert.equal(res.stdout, "OUT");
    assert.equal(res.code, 0);
    assert.equal(res.timedOut, false);
  });
});

test("passes stdin, argv, and cwd through to the process", async () => {
  const rec = tmpFile("rec.json");
  const cwd = dirname(rec);
  await withEnv({ ASKCLAUDE_STUB_STDOUT: "{}", ASKCLAUDE_STUB_RECORD: rec }, async () => {
    await runClaude({ bin: STUB, args: ["--flag", "v"], stdin: "HELLO", timeoutMs: 5000, cwd });
  });
  const saved = JSON.parse(readFileSync(rec, "utf8"));
  assert.equal(saved.stdin, "HELLO");
  assert.deepEqual(saved.argv, ["--flag", "v"]);
  assert.equal(realpathSync(saved.cwd), realpathSync(cwd));
});

test("times out and kills a slow process", async () => {
  await withEnv({ ASKCLAUDE_STUB_STDOUT: "late", ASKCLAUDE_STUB_DELAY_MS: "3000" }, async () => {
    const res = await runClaude({ bin: STUB, args: [], stdin: "", timeoutMs: 200, cwd: tmpdir() });
    assert.equal(res.timedOut, true);
  });
});

test("reports a spawn error for a missing binary", async () => {
  const res = await runClaude({ bin: "definitely-not-a-real-binary-xyz", args: [], stdin: "", timeoutMs: 2000, cwd: tmpdir() });
  assert.ok(res.spawnError);
});

test("accumulates multibyte output split across chunks without corruption", async () => {
  const big = "è".repeat(100000); // >64KB of multibyte UTF-8, forces multiple pipe chunks
  await withEnv({ ASKCLAUDE_STUB_STDOUT: big }, async () => {
    const res = await runClaude({ bin: STUB, args: [], stdin: "", timeoutMs: 15000, cwd: tmpdir() });
    assert.equal(res.stdout, big);
  });
});
