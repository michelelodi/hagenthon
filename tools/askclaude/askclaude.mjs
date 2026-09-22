// tools/askclaude/askclaude.mjs
// Thin, idea-agnostic wrapper around the `claude` CLI (print mode).
// Dual-use: `import { askClaude }` from JS/TS, OR pipe a JSON request to this file as a CLI.
// Zero dependencies — Node built-ins only. See README.md for the full contract.

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import os from "node:os";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const DEFAULT_TIMEOUT_MS = 60000;

export const IMAGE_MEDIA_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const JSON_NUDGE =
  "Respond with ONLY a single valid JSON value. No prose, no explanation, no markdown code fences.";
const REPAIR_NUDGE =
  "Your previous answer could not be parsed as JSON. Reply again with ONLY the JSON value — no fences, no commentary.";

// Map a request to claude's flags (prompt is sent via stdin, so it is not here).
export function buildArgs(request) {
  const hasImages = Array.isArray(request.images) && request.images.length > 0;
  const wantJson = request.json !== false; // default true
  const hasSchema = request.schema != null;

  const args = [
    "-p",
    "--tools", "",
    "--no-session-persistence",
    "--permission-mode", "default",
  ];

  if (hasImages) {
    args.push("--input-format", "stream-json", "--output-format", "stream-json", "--verbose");
  } else {
    args.push("--output-format", "json");
  }

  if (hasSchema) {
    args.push("--json-schema", JSON.stringify(request.schema));
  }
  if (request.system != null) {
    args.push("--system-prompt", String(request.system));
  }
  if (wantJson && !hasSchema) {
    args.push("--append-system-prompt", JSON_NUDGE);
  }
  if (request.model != null) {
    args.push("--model", String(request.model));
  }
  if (Array.isArray(request.extraArgs)) {
    args.push(...request.extraArgs.map(String));
  }
  return args;
}

// Turn one request image into a content-block source. Reads files eagerly so a bad
// path/extension fails as a `usage` error before any subprocess is started.
export function encodeImage(image) {
  if (image && typeof image.base64 === "string") {
    if (typeof image.mediaType !== "string" || image.mediaType.length === 0) {
      throw new Error("image.base64 requires an explicit image.mediaType");
    }
    return { media_type: image.mediaType, data: image.base64 };
  }
  if (image && typeof image.path === "string") {
    const ext = extname(image.path).toLowerCase();
    const media_type = IMAGE_MEDIA_TYPES[ext];
    if (!media_type) {
      throw new Error(`unsupported image extension '${ext}' for ${image.path}`);
    }
    return { media_type, data: readFileSync(image.path).toString("base64") };
  }
  throw new Error("each image needs either a 'path' or 'base64'+'mediaType'");
}

// Text transport: the raw prompt. Image transport: one stream-json user message line.
export function buildStdinPayload(prompt, encodedImages) {
  if (!encodedImages || encodedImages.length === 0) {
    return prompt;
  }
  const content = [
    { type: "text", text: prompt },
    ...encodedImages.map((img) => ({
      type: "image",
      source: { type: "base64", media_type: img.media_type, data: img.data },
    })),
  ];
  return JSON.stringify({ type: "user", message: { role: "user", content } }) + "\n";
}

// Extract the terminal "result" record from claude output. json mode: the whole
// stdout is the record. stream-json mode: the last {type:"result"} JSONL event.
export function extractResultRecord(stdout, mode) {
  const trimmed = (stdout || "").trim();
  if (trimmed.length === 0) {
    throw new Error("empty output from claude");
  }
  if (mode === "stream-json") {
    let record = null;
    for (const line of trimmed.split(/\r?\n/)) {
      if (!line.trim()) continue;
      let evt;
      try { evt = JSON.parse(line); } catch { continue; }
      if (evt && evt.type === "result") record = evt;
    }
    if (!record) throw new Error("no 'result' event in stream-json output");
    return record;
  }
  return JSON.parse(trimmed); // json mode
}

// Tolerant JSON extraction for the no-schema path: strip fences, try a direct parse,
// else return the first balanced {..} / [..] (string-aware, so braces in strings do not fool it).
export function extractJson(text) {
  if (text && typeof text === "object") return text;
  let s = String(text).trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1].trim();
  try { return JSON.parse(s); } catch {}
  const candidate = firstBalanced(s);
  if (candidate !== null) return JSON.parse(candidate); // may throw → caller handles
  throw new Error("no JSON value found in text");
}

function firstBalanced(s) {
  const closerOf = { "{": "}", "[": "]" };
  for (let i = 0; i < s.length; i++) {
    const open = s[i];
    if (open !== "{" && open !== "[") continue;
    const close = closerOf[open];
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < s.length; j++) {
      const ch = s[j];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) return s.slice(i, j + 1);
      }
    }
  }
  return null;
}

// Spawn claude (or a .mjs stub via node), feed stdin, capture output, enforce timeout.
// Never throws: resolves { code, stdout, stderr, timedOut } or { spawnError }.
export function runClaude({ bin, args, stdin, timeoutMs, cwd }) {
  return new Promise((resolve) => {
    const isJs = /\.[mc]?js$/i.test(bin);
    const program = isJs ? process.execPath : bin;
    const argv = isJs ? [bin, ...args] : args;

    let child;
    try {
      child = spawn(program, argv, { cwd, stdio: ["pipe", "pipe", "pipe"], shell: false });
    } catch (spawnError) {
      resolve({ spawnError });
      return;
    }

    let stdout = "", stderr = "", timedOut = false, settled = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(payload);
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.on("error", (spawnError) => finish({ spawnError }));
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("close", (code) => finish({ code, stdout, stderr, timedOut }));

    child.stdin.on("error", () => {}); // swallow EPIPE if claude exits before reading stdin
    child.stdin.end(stdin);
  });
}

export async function askClaude(request) {
  const invalid = validateRequest(request);
  if (invalid) return errEnvelope("usage", invalid);

  const wantJson = request.json !== false;
  const hasSchema = request.schema != null;
  const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRepairs = wantJson && !hasSchema ? (request.retries ?? 1) : 0;
  const bin = process.env.ASKCLAUDE_CLAUDE_BIN || "claude";
  const cwd = request.cwd || os.tmpdir();

  let encodedImages, baseArgs;
  try {
    encodedImages = Array.isArray(request.images) ? request.images.map(encodeImage) : [];
    baseArgs = buildArgs(request);
  } catch (err) {
    return errEnvelope("usage", err.message);
  }

  const mode = encodedImages.length > 0 ? "stream-json" : "json";
  const started = Date.now();

  for (let attempt = 0; ; attempt++) {
    const attemptPrompt = attempt === 0 ? request.prompt : `${request.prompt}\n\n${REPAIR_NUDGE}`;
    const payload = buildStdinPayload(attemptPrompt, encodedImages);
    const res = await runClaude({ bin, args: baseArgs, stdin: payload, timeoutMs, cwd });

    if (res.spawnError) {
      return errEnvelope("spawn", `could not start '${bin}': ${res.spawnError.message}`, String(res.spawnError.stack || ""));
    }
    if (res.timedOut) {
      return errEnvelope("timeout", `claude did not finish within ${timeoutMs}ms`, res.stderr);
    }

    let record;
    try {
      record = extractResultRecord(res.stdout, mode);
    } catch {
      const message = res.code !== 0 ? `claude exited with code ${res.code}` : "unparseable claude output";
      return errEnvelope("cli", message, res.stderr || res.stdout);
    }
    if (res.code !== 0) {
      return errEnvelope("cli", `claude exited with code ${res.code}`, res.stderr || res.stdout);
    }
    if (record.is_error || (record.subtype && record.subtype !== "success")) {
      return errEnvelope("cli", String(record.result || record.subtype || "claude reported an error"), res.stderr || res.stdout);
    }

    const text = typeof record.result === "string" ? record.result : JSON.stringify(record.result);
    const meta = {
      mode,
      schemaEnforced: hasSchema,
      retriedRepair: attempt > 0,
      model: record.model ?? request.model ?? null,
      durationMs: Date.now() - started,
      sessionId: record.session_id ?? null,
      costUsd: record.total_cost_usd ?? null,
    };

    if (!wantJson) {
      return { ok: true, data: undefined, text, meta };
    }

    let data;
    try {
      data = typeof record.result === "object" && record.result !== null ? record.result : extractJson(text);
    } catch {
      if (attempt < maxRepairs) continue;
      return errEnvelope("parse", "model output was not valid JSON after repair", text);
    }
    return { ok: true, data, text, meta };
  }
}

function validateRequest(request) {
  if (request == null || typeof request !== "object") return "request must be a JSON object";
  if (typeof request.prompt !== "string" || request.prompt.length === 0) {
    return "`prompt` is required and must be a non-empty string";
  }
  return null;
}

function errEnvelope(type, message, raw) {
  const error = { type, message };
  if (raw !== undefined) error.raw = raw;
  return { ok: false, error };
}

export function exitCodeForEnvelope(envelope) {
  if (envelope.ok) return 0;
  switch (envelope.error.type) {
    case "usage": return 1;
    case "spawn":
    case "timeout":
    case "cli": return 2;
    case "parse": return 3;
    default: return 2;
  }
}

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => { data += c; });
    process.stdin.on("end", () => resolve(data));
  });
}

async function main() {
  const raw = await readStdin();
  let request;
  try {
    request = JSON.parse(raw);
  } catch {
    const env = errEnvelope("usage", "stdin was not valid JSON");
    process.stderr.write("askclaude: [usage] stdin was not valid JSON\n");
    process.stdout.write(JSON.stringify(env) + "\n", () => process.exit(1));
    return;
  }
  const env = await askClaude(request);
  if (!env.ok) process.stderr.write(`askclaude: [${env.error.type}] ${env.error.message}\n`);
  process.stdout.write(JSON.stringify(env) + "\n", () => process.exit(exitCodeForEnvelope(env)));
}

const invokedAsCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsCli) {
  main();
}
