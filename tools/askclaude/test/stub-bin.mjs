#!/usr/bin/env node
// Offline fake `claude` for tests. Behaviour is controlled entirely by ASKCLAUDE_STUB_* env vars.
import { writeFileSync, readFileSync } from "node:fs";
import process from "node:process";

const env = process.env;
let stdin = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => { stdin += c; });
process.stdin.on("end", () => {
  if (env.ASKCLAUDE_STUB_RECORD) {
    writeFileSync(env.ASKCLAUDE_STUB_RECORD, JSON.stringify({
      argv: process.argv.slice(2),
      stdin,
      cwd: process.cwd(),
    }));
  }

  // Sequenced responses: attempt N reads ASKCLAUDE_STUB_STDOUT_<N>, else ASKCLAUDE_STUB_STDOUT.
  let n = 0;
  if (env.ASKCLAUDE_STUB_SEQ_FILE) {
    try { n = Number(readFileSync(env.ASKCLAUDE_STUB_SEQ_FILE, "utf8")) || 0; } catch {}
    writeFileSync(env.ASKCLAUDE_STUB_SEQ_FILE, String(n + 1));
  }

  const stdout = env[`ASKCLAUDE_STUB_STDOUT_${n}`] ?? env.ASKCLAUDE_STUB_STDOUT ?? "";
  const stderr = env.ASKCLAUDE_STUB_STDERR ?? "";
  const exit = env.ASKCLAUDE_STUB_EXIT ? Number(env.ASKCLAUDE_STUB_EXIT) : 0;
  const delay = env.ASKCLAUDE_STUB_DELAY_MS ? Number(env.ASKCLAUDE_STUB_DELAY_MS) : 0;

  const emit = () => {
    const done = () => process.exit(exit);
    if (stderr) process.stderr.write(stderr);
    if (stdout) process.stdout.write(stdout, done);
    else done();
  };
  if (delay > 0) setTimeout(emit, delay);
  else emit();
});
