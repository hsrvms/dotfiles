/**
 * Web Search & Fetch Extension for pi
 *
 * Registers two tools:
 *   - web_search: Search the web via Tavily API
 *   - web_fetch:  Fetch a URL and extract readable text content
 *
 * Requires: TAVILY_API_KEY in ~/.pi/agent/.env or as an environment variable.
 *   Get one at https://tavily.com — free tier: 1,000 searches/month.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
  truncateHead,
} from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// ─── Tavily Types ────────────────────────────────────────────────────────────

interface TavilySearchResponse {
  query: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readEnvFile(): Record<string, string> {
  const envPath = join(homedir(), ".pi", "agent", ".env");
  const vars: Record<string, string> = {};
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
    }
  } catch {
    // .env file not found or unreadable; fall through
  }
  return vars;
}

function getApiKey(): string {
  const key = process.env.TAVILY_API_KEY ?? readEnvFile()["TAVILY_API_KEY"];
  if (!key) {
    throw new Error(
      "TAVILY_API_KEY not set. Add it to ~/.pi/agent/.env or export TAVILY_API_KEY=..."
    );
  }
  return key;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPageText(url: string, signal?: AbortSignal): Promise<{ text: string; title: string; status: number }> {
  const response = await fetch(url, {
    signal,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PiCodingAgent/1.0)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });

  const status = response.status;
  if (!response.ok) {
    throw new Error(`HTTP ${status}: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  // For non-HTML responses, return raw text
  if (!contentType.includes("html")) {
    const text = await response.text();
    return { text, title: url, status };
  }

  // Try cheerio for better extraction, fall back to simple stripping
  const html = await response.text();
  let text: string;
  let title = url;

  try {
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);

    // Remove noise
    $("script, style, nav, header, footer, aside, iframe, noscript, svg").remove();

    // Extract title
    title = $("title").first().text().trim() || url;

    // Try to find main content
    const mainContent =
      $("main").first().text() ||
      $("article").first().text() ||
      $('[role="main"]').first().text() ||
      $("body").text();

    text = mainContent
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    // Fallback: strip HTML tags
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) title = titleMatch[1].trim();
    text = stripHtml(html);
  }

  return { text, title, status };
}

// ─── Extension ───────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {

  // ── web_search ───────────────────────────────────────────────────────────

  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using Tavily. Returns titles, URLs, and content snippets. " +
      "Use for looking up documentation, APIs, libraries, error messages, or any web content. " +
      "Use web_fetch to read full page content from a specific URL.",
    promptSnippet: "Search the web for documentation, APIs, error messages, or any information",
    promptGuidelines: [
      "Use web_search when you need current information, documentation, or facts not in your training data.",
      "Use web_search to look up error messages, API references, or library documentation before guessing.",
    ],
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      max_results: Type.Optional(
        Type.Integer({
          minimum: 1,
          maximum: 20,
          description: "Number of results (default: 5)",
        })
      ),
      search_depth: Type.Optional(
        StringEnum(["basic", "advanced"] as const, {
          description: "Search depth: 'basic' (fast) or 'advanced' (thorough, uses more credits)",
        })
      ),
      include_answer: Type.Optional(
        Type.Boolean({
          description: "Include a generated short answer summarizing results (default: false)",
        })
      ),
    }),

    async execute(_toolCallId, params, signal, onUpdate) {
      const apiKey = getApiKey();
      const maxResults = params.max_results ?? 5;
      const searchDepth = params.search_depth ?? "basic";
      const includeAnswer = params.include_answer ?? false;

      onUpdate?.({
        content: [{ type: "text", text: `Searching: "${params.query}"...` }],
        details: {},
      });

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: params.query,
          max_results: maxResults,
          search_depth: searchDepth,
          include_answer: includeAnswer,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Tavily API error (${response.status}): ${body}`);
      }

      const data = (await response.json()) as TavilySearchResponse;
      const results = data.results ?? [];

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: `No results found for: "${params.query}"` }],
          details: { query: params.query, resultCount: 0 },
        };
      }

      const formatted = results
        .map((r, i) => {
          const snippet = r.content.length > 300
            ? r.content.slice(0, 300) + "..."
            : r.content;
          return `${i + 1}. **${r.title}** (score: ${r.score.toFixed(2)})\n   ${r.url}\n   ${snippet}`;
        })
        .join("\n\n");

      let output = `Found ${results.length} results for "${params.query}":\n\n${formatted}`;

      return {
        content: [{ type: "text", text: output }],
        details: {
          query: params.query,
          resultCount: results.length,
          results: results.map((r) => ({ title: r.title, url: r.url, score: r.score })),
        },
      };
    },

    renderCall(args, theme, _context) {
      let text = theme.fg("toolTitle", theme.bold("web_search "));
      text += theme.fg("accent", `"${args.query}"`);
      if (args.search_depth && args.search_depth !== "basic") {
        text += theme.fg("dim", ` [${args.search_depth}]`);
      }
      return new Text(text, 0, 0);
    },

    renderResult(result, { expanded, isPartial }, theme, _context) {
      if (isPartial) {
        return new Text(theme.fg("warning", "Searching..."), 0, 0);
      }

      const details = result.details as { resultCount?: number; query?: string } | undefined;
      if (!details || details.resultCount === 0) {
        return new Text(theme.fg("dim", "No results found"), 0, 0);
      }

      let text = theme.fg("success", `${details.resultCount} results`);
      text += theme.fg("dim", ` for "${details.query}"`);

      if (expanded) {
        const content = result.content[0];
        if (content?.type === "text") {
          const lines = content.text.split("\n").slice(0, 30);
          for (const line of lines) {
            text += `\n${theme.fg("dim", line)}`;
          }
        }
      }

      return new Text(text, 0, 0);
    },
  });

  // ── web_fetch ────────────────────────────────────────────────────────────

  pi.registerTool({
    name: "web_fetch",
    label: "Web Fetch",
    description:
      "Fetch a URL and extract its text content. " +
      "Use after web_search to read full articles, documentation pages, or any web page. " +
      `Output is truncated to ${DEFAULT_MAX_LINES} lines or ${formatSize(DEFAULT_MAX_BYTES)}. ` +
      "For pages that render content via JavaScript (SPAs), the result may be incomplete.",
    promptSnippet: "Fetch and read the content of any web page by URL",
    promptGuidelines: [
      "Use web_fetch to read full page content after finding a relevant URL via web_search.",
      "Use web_fetch to read documentation, blog posts, Stack Overflow answers, or any web page.",
    ],
    parameters: Type.Object({
      url: Type.String({ description: "URL to fetch" }),
    }),

    async execute(_toolCallId, params, signal, onUpdate) {
      const { url } = params;

      onUpdate?.({
        content: [{ type: "text", text: `Fetching: ${url}` }],
        details: {},
      });

      const { text, title, status } = await fetchPageText(url, signal);

      if (!text.trim()) {
        return {
          content: [
            {
              type: "text",
              text: `Page loaded (${status}) but no readable text content found. The page may require JavaScript rendering.`,
            },
          ],
          details: { url, title, status, charCount: 0 },
        };
      }

      // Truncate output
      const truncation = truncateHead(text, {
        maxLines: DEFAULT_MAX_LINES,
        maxBytes: DEFAULT_MAX_BYTES,
      });

      let output = `# ${title}\nSource: ${url}\n\n${truncation.content}`;

      if (truncation.truncated) {
        const omitted = truncation.totalBytes - truncation.outputBytes;
        output += `\n\n[Content truncated: ${formatSize(truncation.outputBytes)} of ${formatSize(truncation.totalBytes)} shown. ${formatSize(omitted)} omitted.]`;
      }

      return {
        content: [{ type: "text", text: output }],
        details: {
          url,
          title,
          status,
          charCount: text.length,
          truncated: truncation.truncated,
        },
      };
    },

    renderCall(args, theme, _context) {
      let text = theme.fg("toolTitle", theme.bold("web_fetch "));
      text += theme.fg("accent", args.url);
      return new Text(text, 0, 0);
    },

    renderResult(result, { expanded, isPartial }, theme, _context) {
      if (isPartial) {
        return new Text(theme.fg("warning", "Fetching..."), 0, 0);
      }

      const details = result.details as {
        title?: string;
        status?: number;
        charCount?: number;
        truncated?: boolean;
      } | undefined;

      if (!details) {
        return new Text(theme.fg("error", "Failed to fetch page"), 0, 0);
      }

      let text = theme.fg("success", `✓ ${details.title ?? "Page loaded"}`);
      text += theme.fg("dim", ` (${formatSize(details.charCount ?? 0)})`);

      if (details.truncated) {
        text += theme.fg("warning", " (truncated)");
      }

      if (expanded) {
        const content = result.content[0];
        if (content?.type === "text") {
          const lines = content.text.split("\n").slice(0, 20);
          for (const line of lines) {
            text += `\n${theme.fg("dim", line)}`;
          }
          if (content.text.split("\n").length > 20) {
            text += `\n${theme.fg("muted", "... (expanded view limited to 20 lines)")}`;
          }
        }
      }

      return new Text(text, 0, 0);
    },
  });
}
