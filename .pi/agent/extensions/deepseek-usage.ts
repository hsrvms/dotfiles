import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";

const DEEPSEEK_PROVIDER = "deepseek";
const BALANCE_URL = "https://api.deepseek.com/user/balance";

interface BalanceInfo {
  currency: string;
  total_balance: string;
  granted_balance: string;
  topped_up_balance: string;
}

interface BalanceResponse {
  is_available: boolean;
  balance_infos: BalanceInfo[];
}

/** Resolve the DeepSeek API key from pi's provider auth (env var or auth.json). */
async function resolveApiKey(
  ctx: { modelRegistry: { getProviderAuth(id: string): Promise<{ auth: { apiKey?: string } } | undefined> } },
): Promise<string | undefined> {
  const result = await ctx.modelRegistry.getProviderAuth(DEEPSEEK_PROVIDER);
  return result?.auth.apiKey;
}

function formatBalance(balance: BalanceResponse): string {
  const lines = [`DeepSeek balance — available: ${balance.is_available ? "yes" : "no"}`];
  for (const info of balance.balance_infos) {
    lines.push(
      `  ${info.currency}: total ${info.total_balance} (granted ${info.granted_balance}, topped-up ${info.topped_up_balance})`,
    );
  }
  return lines.join("\n");
}

async function fetchBalance(apiKey: string, signal?: AbortSignal): Promise<BalanceResponse> {
  const res = await fetch(BALANCE_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepSeek balance request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as BalanceResponse;
}

const balanceToolParams = Type.Object({});

export default function (pi: ExtensionAPI) {
  // Slash command: /deepseek-balance
  pi.registerCommand("deepseek-balance", {
    description: "Show your DeepSeek account balance (uses the configured DeepSeek API key)",
    handler: async (_args, ctx) => {
      const apiKey = await resolveApiKey(ctx);
      if (!apiKey) {
        ctx.ui.notify("DeepSeek not configured. Set DEEPSEEK_API_KEY or run /login -> DeepSeek.", "warning");
        return;
      }
      try {
        const balance = await fetchBalance(apiKey, ctx.signal);
        ctx.ui.setWidget("deepseek-balance", formatBalance(balance).split("\n"));
        ctx.ui.notify("DeepSeek balance updated (see widget).", "info");
      } catch (err) {
        ctx.ui.notify(err instanceof Error ? err.message : String(err), "error");
      }
    },
  });

  // LLM-callable tool: deepseek_balance
  pi.registerTool({
    name: "deepseek_balance",
    label: "DeepSeek Balance",
    description:
      "Query the user's DeepSeek API account balance (total, granted, and topped-up per currency) using the configured DeepSeek API key.",
    parameters: balanceToolParams,
    async execute(toolCallId, _params: Static<typeof balanceToolParams>, signal, _onUpdate, ctx) {
      const apiKey = await resolveApiKey(ctx);
      if (!apiKey) {
        return {
          content: [
            {
              type: "text",
              text: "DeepSeek is not configured. Set the DEEPSEEK_API_KEY environment variable or run /login and select DeepSeek.",
            },
          ],
          details: {},
          isError: true,
        };
      }
      try {
        const balance = await fetchBalance(apiKey, signal);
        return {
          content: [{ type: "text", text: JSON.stringify(balance, null, 2) }],
          details: { balance },
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
          details: {},
          isError: true,
        };
      }
    },
  });
}