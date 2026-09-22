import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";

export const STUB = fileURLToPath(new URL("./stub-bin.mjs", import.meta.url));
export const CLI = fileURLToPath(new URL("../askclaude.mjs", import.meta.url));

export function tmpFile(name) {
  return join(mkdtempSync(join(tmpdir(), "askclaude-")), name);
}

// Temporarily set env vars for the duration of fn, then restore. Tests in a file run
// sequentially, so this is safe.
export async function withEnv(env, fn) {
  const saved = {};
  for (const k of Object.keys(env)) { saved[k] = process.env[k]; process.env[k] = env[k]; }
  try { return await fn(); }
  finally {
    for (const k of Object.keys(env)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

// Build a canned `--output-format json` result record.
export function jsonResult(fields) {
  return JSON.stringify({
    type: "result", subtype: "success", is_error: false,
    session_id: "sess", total_cost_usd: 0.01, duration_ms: 5, ...fields,
  });
}

// Spawn `node <scriptArgs...>` and collect output. Used for the stub and the CLI.
export function spawnNode(scriptArgs, { env, stdin } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, scriptArgs, { env: { ...process.env, ...env } });
    let out = "", err = "";
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    child.on("close", (code) => resolve({ code, out, err }));
    child.stdin.end(stdin ?? "");
  });
}
