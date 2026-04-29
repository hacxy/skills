import { access, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { constants } from "node:fs";
import fs from "fs-extra";

export type SupportedPlatform = "cursor" | "claude-code" | "codex";

export interface PlatformConfig {
  id: SupportedPlatform;
  label: string;
  defaultDir: string;
}

export interface PlatformDetectionResult extends PlatformConfig {
  exists: boolean;
  writable: boolean;
  note: string;
}

export interface InstallOptions {
  force?: boolean;
  dryRun?: boolean;
}

const platformConfigs: Record<SupportedPlatform, PlatformConfig> = {
  cursor: {
    id: "cursor",
    label: "Cursor",
    defaultDir: process.env.SKILLS_CURSOR_DIR || join(homedir(), ".cursor", "skills")
  },
  "claude-code": {
    id: "claude-code",
    label: "Claude Code",
    defaultDir: process.env.SKILLS_CLAUDE_CODE_DIR || join(homedir(), ".claude", "skills")
  },
  codex: {
    id: "codex",
    label: "Codex",
    defaultDir: process.env.SKILLS_CODEX_DIR || join(homedir(), ".codex", "skills")
  }
};

export function getPlatformConfig(platform: SupportedPlatform): PlatformConfig {
  return platformConfigs[platform];
}

export function allPlatforms(): SupportedPlatform[] {
  return Object.keys(platformConfigs) as SupportedPlatform[];
}

export async function detectPlatformPath(platform: SupportedPlatform) {
  const config = getPlatformConfig(platform);
  const exists = await fs.pathExists(config.defaultDir);
  if (exists) {
    try {
      await access(config.defaultDir, constants.W_OK);
      return { ...config, exists: true, writable: true, note: "目录存在且可写" } satisfies PlatformDetectionResult;
    } catch {
      return {
        ...config,
        exists: true,
        writable: false,
        note: "目录存在但不可写，请检查权限"
      } satisfies PlatformDetectionResult;
    }
  }

  return {
    ...config,
    exists: false,
    writable: true,
    note: "目录不存在，安装时会自动创建"
  } satisfies PlatformDetectionResult;
}

export async function installSkillDirectory(
  sourceDir: string,
  targetRoot: string,
  options: InstallOptions = {}
): Promise<string> {
  const skillName = basename(sourceDir);
  const targetPath = join(targetRoot, skillName);
  if (!options.dryRun) {
    await mkdir(targetRoot, { recursive: true });
    await fs.copy(sourceDir, targetPath, {
      overwrite: options.force ?? false,
      errorOnExist: !(options.force ?? false)
    });
  }
  return targetPath;
}
