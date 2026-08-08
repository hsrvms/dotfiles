import test from "node:test";
import assert from "node:assert/strict";

import { getImageFallbackEnvironment, parseEnvironmentFile } from "./environment.ts";

test("parses simple and exported environment assignments without executing shell syntax", () => {
  assert.deepEqual(
    parseEnvironmentFile(`
      # comment
      PI_IMAGE_VISION_MODEL=openrouter/openai/gpt-5.6-luna-pro
      export PI_IMAGE_VISION_TIMEOUT_MS="30000"
      NOT_EXECUTED=$(touch /tmp/should-not-exist)
    `),
    {
      PI_IMAGE_VISION_MODEL: "openrouter/openai/gpt-5.6-luna-pro",
      PI_IMAGE_VISION_TIMEOUT_MS: "30000",
      NOT_EXECUTED: "$(touch /tmp/should-not-exist)",
    },
  );
});

test("explicit process environment overrides values from the env file parser", () => {
  const environment = getImageFallbackEnvironment({
    PI_IMAGE_VISION_MODEL: "explicit/provider/model",
  });

  assert.equal(environment.PI_IMAGE_VISION_MODEL, "explicit/provider/model");
});
