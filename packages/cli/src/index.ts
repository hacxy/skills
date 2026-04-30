#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { basename, dirname, join, resolve } from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import fs from "fs-extra";
import { doctorSkills, parseSkillContent, searchSkills } from "./core.js";
import {
  allPlatforms,
  detectPlatformPath,
  getPlatformConfig,
  installSkillDirectory,
  type SupportedPlatform,
} from "./platforms.js";
import { ensureOwnerAccess } from "./auth.js";
import {
  fetchRegistryIndex,
  fetchSkillContent,
  getGithubToken,
  pushSkillToRegistry,
} from "./registry.js";

const _require = createRequire(import.meta.url);
const { version } = _require("../package.json") as { version: string };

function cwdOr(value?: string): string {
  return resolve(value || process.cwd());
}

async function getInstalledPlatforms(skillName: string): Promise<SupportedPlatform[]> {
  const installed: SupportedPlatform[] = [];
  for (const platform of allPlatforms()) {
    const targetPath = join(getPlatformConfig(platform).defaultDir, skillName);
    if (await fs.pathExists(targetPath)) {
      installed.push(platform);
    }
  }
  return installed;
}

function shortDesc(description: string, max = 100): string {
  const oneline = description.replace(/\s*\n\s*/g, " ").trim();
  return oneline.length > max ? `${oneline.slice(0, max)}…` : oneline;
}

function normalizePlatform(input: string): SupportedPlatform {
  const value = input as SupportedPlatform;
  if (!allPlatforms().includes(value)) {
    throw new Error(`不支持的平台: ${input}，可选值: ${allPlatforms().join(", ")}`);
  }
  return value;
}

async function installRegistrySkill(
  skillName: string,
  targetRoot: string,
  options: { force?: boolean; dryRun?: boolean },
): Promise<string> {
  const content = await fetchSkillContent(skillName);
  if (options.dryRun) {
    return join(targetRoot, skillName);
  }
  const tmpBase = await mkdtemp(join(tmpdir(), `skill-${skillName}-`));
  try {
    const skillDir = join(tmpBase, skillName);
    await fs.ensureDir(skillDir);
    await writeFile(join(skillDir, "SKILL.md"), content, "utf8");
    return await installSkillDirectory(skillDir, targetRoot, options);
  } finally {
    await rm(tmpBase, { recursive: true, force: true });
  }
}

async function run() {
  const program = new Command();
  program
    .name("skills")
    .description("Browse and install skills from the registry")
    .version(version);

  program
    .command("list")
    .description("列出 registry 中的所有技能")
    .action(async () => {
      const skills = await fetchRegistryIndex();
      if (!skills.length) {
        console.log(chalk.yellow("Registry 中暂无技能。"));
        return;
      }
      for (const item of skills) {
        const installedPlatforms = await getInstalledPlatforms(item.name);
        const installedMark = installedPlatforms.length
          ? chalk.green(`[已安装: ${installedPlatforms.map((p) => getPlatformConfig(p).label).join(", ")}]`)
          : chalk.gray("[未安装]");
        console.log(`${chalk.cyan(item.name)} ${installedMark}`);
        console.log(`  ${chalk.gray(shortDesc(item.description))}`);
      }
    });

  program
    .command("search")
    .argument("<query>", "搜索关键字")
    .description("搜索 registry 中的技能")
    .action(async (query: string) => {
      const index = await fetchRegistryIndex();
      const matched = searchSkills(index, query);
      if (!matched.length) {
        console.log(chalk.yellow(`未找到 "${query}"`));
        return;
      }
      for (const item of matched) {
        console.log(`${chalk.cyan(item.name)}\n  ${chalk.gray(shortDesc(item.description))}`);
      }
    });

  program
    .command("show")
    .argument("<name>", "技能名称")
    .description("查看技能详情")
    .option("--raw", "输出原始 Markdown", false)
    .action(async (name: string, options) => {
      const content = await fetchSkillContent(name);
      if (options.raw) {
        console.log(content);
        return;
      }
      const doc = parseSkillContent(content, name);
      console.log(chalk.bold(doc.name));
      console.log(chalk.gray(doc.description));
      console.log();
      console.log(doc.content);
    });

  program
    .command("install")
    .argument("[names...]", "技能名称（留空则安装全部）")
    .description("从 registry 下载并安装技能")
    .option("--platform <platform>", "目标平台 cursor|claude-code|codex|trae", "claude-code")
    .option("--all-platforms", "安装到所有平台", false)
    .option("--dir <path>", "安装到指定目录（覆盖平台默认路径）")
    .option("--force", "覆盖已存在的技能", false)
    .option("--dry-run", "预览，不实际写入", false)
    .action(async (names: string[], options) => {
      const index = await fetchRegistryIndex();
      let targets = index;

      if (names.length) {
        const wanted = new Set(names.map((n) => n.trim().toLowerCase()));
        targets = index.filter((item) => wanted.has(item.name.trim().toLowerCase()));
        if (targets.length !== wanted.size) {
          const found = new Set(targets.map((item) => item.name.trim().toLowerCase()));
          const missing = [...wanted].filter((n) => !found.has(n));
          throw new Error(`未找到技能: ${missing.join(", ")}`);
        }
      }

      if (!targets.length) {
        console.log(chalk.yellow("Registry 中暂无技能。"));
        return;
      }

      if (options.dir) {
        const targetRoot = resolve(options.dir as string);
        console.log(chalk.bold(`\n[custom] -> ${targetRoot}`));
        const failures: string[] = [];
        for (const item of targets) {
          try {
            const target = await installRegistrySkill(item.name, targetRoot, {
              force: options.force,
              dryRun: options.dryRun,
            });
            const prefix = options.dryRun ? chalk.gray("[dry-run]") : chalk.green("[installed]");
            console.log(`${prefix} ${item.name} -> ${target}`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.log(`${chalk.red("[failed]")} ${item.name}: ${msg}`);
            failures.push(item.name);
          }
        }
        if (failures.length) {
          console.log(chalk.red(`\n${failures.length} 个技能安装失败: ${failures.join(", ")}`));
        }
        return;
      }

      const platforms: SupportedPlatform[] = options.allPlatforms
        ? allPlatforms()
        : [normalizePlatform(options.platform)];

      for (const platform of platforms) {
        const config = getPlatformConfig(platform);
        console.log(chalk.bold(`\n[${config.label}] -> ${config.defaultDir}`));
        const failures: string[] = [];
        for (const item of targets) {
          try {
            const target = await installRegistrySkill(item.name, config.defaultDir, {
              force: options.force,
              dryRun: options.dryRun,
            });
            const prefix = options.dryRun ? chalk.gray("[dry-run]") : chalk.green("[installed]");
            console.log(`${prefix} ${item.name} -> ${target}`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.log(`${chalk.red("[failed]")} ${item.name}: ${msg}`);
            failures.push(item.name);
          }
        }
        if (failures.length) {
          console.log(chalk.red(`\n${failures.length} 个技能安装失败: ${failures.join(", ")}`));
        }
      }
    });

  program
    .command("where")
    .argument("<platform>", "cursor|claude-code|codex|trae")
    .description("显示平台的技能安装路径")
    .action(async (platformName: string) => {
      const platform = normalizePlatform(platformName);
      const result = await detectPlatformPath(platform);
      console.log(`${result.label}: ${result.defaultDir}`);
      console.log(`exists=${result.exists} writable=${result.writable}`);
      console.log(`note=${result.note}`);
    });

  program
    .command("auth")
    .description("查看上传权限状态")
    .addCommand(
      new Command("status").action(async () => {
        const status = await ensureOwnerAccess();
        console.log(`token=${status.tokenOk}`);
        if (!status.ok) {
          console.log(chalk.red(status.reason || "未通过校验"));
          process.exitCode = 1;
        } else {
          console.log(chalk.green("校验通过，可以上传"));
        }
      }),
    );

  program
    .command("upload")
    .description("上传技能到 registry（仅所有者）")
    .option("--source <path>", "技能目录或 SKILL.md 文件路径")
    .option("--content-file <path>", "从文件读取内容上传")
    .option("--name <name>", "技能名称（无法推断时使用）")
    .option("--force", "冲突时覆盖", false)
    .option("--dry-run", "预览，不实际写入", false)
    .action(async (options) => {
      const auth = await ensureOwnerAccess();
      if (!auth.ok) {
        console.error(chalk.red(`上传被拒绝: ${auth.reason}`));
        process.exitCode = 1;
        return;
      }

      let targetName = options.name as string | undefined;
      let content = "";

      if (options.contentFile) {
        content = await readFile(cwdOr(options.contentFile), "utf8");
      } else if (options.source) {
        const sourcePath = cwdOr(options.source);
        const stat = await fs.stat(sourcePath);
        if (stat.isDirectory()) {
          content = await readFile(join(sourcePath, "SKILL.md"), "utf8");
          targetName = targetName || basename(sourcePath);
        } else {
          content = await readFile(sourcePath, "utf8");
          targetName = targetName || basename(dirname(sourcePath));
        }
      } else {
        throw new Error("请提供 --source 或 --content-file");
      }

      if (!targetName) throw new Error("无法推断技能名称，请使用 --name 指定");
      if (!content.includes("---")) throw new Error("内容缺少 frontmatter");

      if (options.dryRun) {
        console.log(`[dry-run] upload -> skills/${targetName}/SKILL.md`);
        return;
      }

      const token = await getGithubToken();
      if (!token) {
        console.error(chalk.red("未获取到 GitHub token，请设置 GITHUB_TOKEN 或执行 gh auth login"));
        process.exitCode = 1;
        return;
      }

      process.stdout.write(chalk.gray(`正在推送 ${targetName} 到 registry...`));
      await pushSkillToRegistry(targetName, content, token);
      console.log(chalk.green(" 完成"));
    });

  program
    .command("doctor")
    .description("校验本地技能文件（所有者用）")
    .option("--skills-dir <dir>", "技能目录根路径", process.cwd())
    .action(async (options) => {
      const issues = await doctorSkills(cwdOr(options.skillsDir));
      if (!issues.length) {
        console.log(chalk.green("检查完成，没有发现问题。"));
        return;
      }
      for (const issue of issues) {
        const tag = issue.level === "error" ? chalk.red("[error]") : chalk.yellow("[warn]");
        console.log(`${tag} ${issue.path} - ${issue.message}`);
      }
    });

  await program.parseAsync(process.argv);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(chalk.red(message));
  process.exit(1);
});
