# Image fallback

Automatically extracts information from pasted or attached images before a text-only pi model processes the prompt.

## Configuration

Set `PI_IMAGE_VISION_MODEL` to an image-capable model using `provider/model` syntax. The model id may contain additional slashes:

```sh
export PI_IMAGE_VISION_MODEL=openrouter/openai/gpt-5.6-luna
```

For a persistent pi configuration, put the variable in `~/.pi/agent/.env` or export it from your shell startup configuration. The `.env` file is intentionally ignored by git because it can contain credentials.

Optional timeout configuration:

```sh
export PI_IMAGE_VISION_TIMEOUT_MS=120000
```

The default timeout is 120 seconds.

Reload pi after installing or changing the extension:

```text
/reload
```

## Behavior

- If the active model supports image input, the original prompt and images pass through unchanged.
- If the active model is text-only, all attached images and the original prompt are sent to the configured vision model. This covers both ways pi delivers images:
  - image attachments (`event.images`, used by print-mode `@file` arguments and extensions), and
  - file paths in the prompt text (how the TUI delivers Ctrl+V clipboard pastes, e.g. `/tmp/pi-clipboard-*.png`).
- The vision response is inserted into an `<image-analysis>` section and the original image attachments and resolved path mentions are removed before the main model receives the prompt.
- Analysis is treated as observed data rather than instructions to reduce prompt-injection risk from image contents.
- Missing, invalid, unavailable, text-only, timed-out, failed, or cancelled vision analysis stops the turn instead of forwarding an unsupported image.
- Path mentions that do not resolve to an existing image file are left untouched in the prompt.

The main model receives the vision model's textual extraction, not the original pixels. Use a vision-capable main model when pixel-level reasoning is required.
