import type { Api, ImageContent, Model } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

import { getImageFallbackEnvironment } from "./environment.ts";
import {
  analyzeImages,
  buildTransformedPrompt,
  findImagePathMentions,
  getAnalysisTimeoutMs,
  getConfiguredVisionModelReference,
  needsImageFallback,
  parseVisionModelReference,
  resolveImageMentions,
  validateVisionModel,
} from "./core.ts";

const STATUS_KEY = "image-fallback";

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function reportError(ctx: ExtensionContext, message: string): void {
  const text = `Image fallback: ${message}`;
  if (ctx.hasUI) {
    ctx.ui.notify(text, "error");
    return;
  }
  console.error(text);
}

function combineSignals(parent: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return parent ? AbortSignal.any([parent, timeout]) : timeout;
}

function stripResolvedMentions(text: string, resolved: readonly string[]): string {
  let stripped = text;
  for (const mention of resolved) {
    stripped = stripped.split(mention).join("");
  }
  return stripped;
}

export default function (pi: ExtensionAPI) {
  pi.on("input", async (event, ctx) => {
    // Images arrive two ways: as image content (print mode, extensions) or as file
    // paths in the prompt text (TUI clipboard paste, e.g. /tmp/pi-clipboard-*.png).
    const imagesFromEvent: ImageContent[] = event.images ?? [];
    const { images: imagesFromMentions, resolved } = resolveImageMentions(findImagePathMentions(event.text));
    const images = [...imagesFromEvent, ...imagesFromMentions];

    if (!needsImageFallback(ctx.model?.input, images)) {
      return { action: "continue" };
    }

    let visionModel: Model<Api>;
    let reference: string;
    let environment: NodeJS.ProcessEnv;
    try {
      environment = getImageFallbackEnvironment(process.env);
      reference = getConfiguredVisionModelReference(environment);
      const { provider, modelId } = parseVisionModelReference(reference);
      visionModel = validateVisionModel(ctx.modelRegistry.find(provider, modelId), reference);
    } catch (error) {
      reportError(ctx, describeError(error));
      return { action: "handled" };
    }

    let timeoutMs: number;
    try {
      timeoutMs = getAnalysisTimeoutMs(environment);
    } catch (error) {
      reportError(ctx, describeError(error));
      return { action: "handled" };
    }

    const signal = combineSignals(ctx.signal, timeoutMs);
    ctx.ui.setStatus(STATUS_KEY, `Analyzing ${images.length} image${images.length === 1 ? "" : "s"}…`);

    try {
      const analysis = await analyzeImages(
        event.text,
        images,
        async (message, completionSignal) => {
          const response = await ctx.modelRegistry.complete(
            visionModel,
            { messages: [message] },
            { signal: completionSignal },
          );
          return response;
        },
        signal,
      );

      return {
        action: "transform",
        text: buildTransformedPrompt(stripResolvedMentions(event.text, resolved), analysis),
        images: [],
      };
    } catch (error) {
      reportError(ctx, describeError(error));
      return { action: "handled" };
    } finally {
      ctx.ui.setStatus(STATUS_KEY, undefined);
    }
  });
}
