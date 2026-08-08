import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import registerImageFallback from "./index.ts";

function createExtensionHarness() {
  let inputHandler;
  const pi = {
    on(event, handler) {
      if (event === "input") inputHandler = handler;
    },
  };

  registerImageFallback(pi);
  assert.equal(typeof inputHandler, "function");
  return inputHandler;
}

function createContext({ activeInput = ["text"], visionInput = ["text", "image"], complete } = {}) {
  const notifications = [];
  const statuses = [];
  let lookupCount = 0;
  let completionCount = 0;

  return {
    context: {
      hasUI: false,
      model: { input: activeInput },
      modelRegistry: {
        find() {
          lookupCount += 1;
          return { input: visionInput };
        },
        async complete(model, request, options) {
          completionCount += 1;
          return complete?.(model, request, options) ?? {
            content: [{ type: "text", text: "Image details" }],
            stopReason: "stop",
          };
        },
      },
      ui: {
        notify(message, type) {
          notifications.push({ message, type });
        },
        setStatus(key, value) {
          statuses.push({ key, value });
        },
      },
      signal: undefined,
    },
    notifications,
    statuses,
    get lookupCount() {
      return lookupCount;
    },
    get completionCount() {
      return completionCount;
    },
  };
}

test("transforms attached images before a text-only model receives the prompt", async () => {
  const previousModel = process.env.PI_IMAGE_VISION_MODEL;
  process.env.PI_IMAGE_VISION_MODEL = "vision-provider/vision-model";

  try {
    const handler = createExtensionHarness();
    const harness = createContext();
    const image = { type: "image", data: "image-data", mimeType: "image/png" };

    const result = await handler(
      { text: "What is shown?", images: [image], source: "interactive" },
      harness.context,
    );

    assert.equal(result.action, "transform");
    assert.deepEqual(result.images, []);
    assert.match(result.text, /What is shown\?/);
    assert.match(result.text, /<image-analysis>/);
    assert.equal(harness.lookupCount, 1);
    assert.equal(harness.completionCount, 1);
  } finally {
    if (previousModel === undefined) delete process.env.PI_IMAGE_VISION_MODEL;
    else process.env.PI_IMAGE_VISION_MODEL = previousModel;
  }
});

test("does not call the fallback for an image-capable active model", async () => {
  const handler = createExtensionHarness();
  const harness = createContext({ activeInput: ["text", "image"] });
  const image = { type: "image", data: "image-data", mimeType: "image/png" };

  const result = await handler(
    { text: "Inspect this", images: [image], source: "interactive" },
    harness.context,
  );

  assert.deepEqual(result, { action: "continue" });
  assert.equal(harness.lookupCount, 0);
  assert.equal(harness.completionCount, 0);
});

test("handles missing configuration without forwarding the image", async () => {
  const previousModel = process.env.PI_IMAGE_VISION_MODEL;
  process.env.PI_IMAGE_VISION_MODEL = "";

  try {
    const handler = createExtensionHarness();
    const harness = createContext();
    harness.context.hasUI = true;
    const result = await handler(
      {
        text: "Inspect this",
        images: [{ type: "image", data: "image-data", mimeType: "image/png" }],
        source: "interactive",
      },
      harness.context,
    );

    assert.deepEqual(result, { action: "handled" });
    assert.equal(harness.completionCount, 0);
    assert.match(harness.notifications[0].message, /PI_IMAGE_VISION_MODEL/);
  } finally {
    if (previousModel === undefined) delete process.env.PI_IMAGE_VISION_MODEL;
    else process.env.PI_IMAGE_VISION_MODEL = previousModel;
  }
});

test("transforms clipboard-pasted image paths before a text-only model receives the prompt", async () => {
  const previousModel = process.env.PI_IMAGE_VISION_MODEL;
  process.env.PI_IMAGE_VISION_MODEL = "vision-provider/vision-model";

  const dir = mkdtempSync(join(tmpdir(), "image-fallback-index-test-"));
  const imagePath = join(dir, "pi-clipboard-test.png");
  writeFileSync(imagePath, Buffer.from("fake-png-bytes"));

  try {
    const handler = createExtensionHarness();
    const harness = createContext();
    const result = await handler(
      { text: `What is this? @${imagePath}`, images: undefined, source: "interactive" },
      harness.context,
    );

    assert.equal(result.action, "transform");
    assert.deepEqual(result.images, []);
    assert.match(result.text, /What is this\?/);
    assert.doesNotMatch(result.text, /pi-clipboard-test/);
    assert.match(result.text, /<image-analysis>/);
    assert.equal(harness.completionCount, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    if (previousModel === undefined) delete process.env.PI_IMAGE_VISION_MODEL;
    else process.env.PI_IMAGE_VISION_MODEL = previousModel;
  }
});

test("passes through when the pasted path does not resolve to an image file", async () => {
  const handler = createExtensionHarness();
  const harness = createContext();

  const result = await handler(
    { text: "Read /nonexistent/missing.png for me", images: undefined, source: "interactive" },
    harness.context,
  );

  assert.deepEqual(result, { action: "continue" });
  assert.equal(harness.completionCount, 0);
});
