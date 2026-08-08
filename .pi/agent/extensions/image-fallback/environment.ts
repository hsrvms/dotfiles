import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ENV_FILE = join(homedir(), ".pi", "agent", ".env");

export function parseEnvironmentFile(content: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    values[match[1]] = unquote(match[2].trim());
  }

  return values;
}

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

export function getImageFallbackEnvironment(processEnvironment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  let fileEnvironment: Record<string, string> = {};
  try {
    fileEnvironment = parseEnvironmentFile(readFileSync(ENV_FILE, "utf8"));
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw new Error(`Could not read ${ENV_FILE}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { ...fileEnvironment, ...processEnvironment };
}
