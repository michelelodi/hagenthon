import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { encodeImage, buildStdinPayload } from "../askclaude.mjs";
import { tmpFile } from "./helpers.mjs";

test("encodeImage from base64 requires an explicit mediaType", () => {
  assert.throws(() => encodeImage({ base64: "AAAA" }), /mediaType/);
  assert.deepEqual(encodeImage({ base64: "AAAA", mediaType: "image/png" }), { media_type: "image/png", data: "AAAA" });
});

test("encodeImage from path deduces mediaType and base64-encodes bytes", () => {
  const p = tmpFile("x.png");
  writeFileSync(p, Buffer.from([1, 2, 3]));
  assert.deepEqual(encodeImage({ path: p }), { media_type: "image/png", data: Buffer.from([1, 2, 3]).toString("base64") });
});

test("encodeImage rejects an unknown extension", () => {
  assert.throws(() => encodeImage({ path: "a.bmp" }), /unsupported image extension/);
});

test("encodeImage rejects an image with neither path nor base64", () => {
  assert.throws(() => encodeImage({}), /path.*base64|base64.*path/);
});

test("buildStdinPayload: no images returns the raw prompt", () => {
  assert.equal(buildStdinPayload("hello", []), "hello");
});

test("buildStdinPayload: images become one stream-json user line (text block first)", () => {
  const line = buildStdinPayload("look", [{ media_type: "image/png", data: "ZZ" }]);
  assert.ok(line.endsWith("\n"));
  const obj = JSON.parse(line);
  assert.equal(obj.type, "user");
  assert.equal(obj.message.role, "user");
  assert.deepEqual(obj.message.content[0], { type: "text", text: "look" });
  assert.deepEqual(obj.message.content[1], { type: "image", source: { type: "base64", media_type: "image/png", data: "ZZ" } });
});
