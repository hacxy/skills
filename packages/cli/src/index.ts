#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { basename, dirname, join, resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import fs from "fs-extra";
import {
  buildSkillIndex,
  doctorSkills,
  loadSkillByName,
  loadSkillFromFile,
  searchSkills,
  type SkillMeta,
} from "@skills/core";
import {
  allPlatforms,
  detectPlatformPath,
  getPlatformConfig,
  installSkillDirectory,
  type SupportedPlatform,
} from "./platforms.js";
import { ensureOwnerAccess, getOwnerConfig, initOwnerToken } from "./auth.js";

function cwdOr(value?: string): string {
  return resolve(value || process.cwd());
}

async function resolveSkillBaseDir(rootDir: string): Promise<string> {
  const nested = join(rootDir, "skills");
  return (await fs.pathExists(nested)) ? nested : rootDir;
}

async function resolveConflictName(
  baseDir: string,
  wantedName: string,
): Promise<string> {
  let index = 1;
  let candidate = wantedName;
  while (await fs.pathExists(join(baseDir, candidate, "SKILL.md"))) {
    index += 1;
    candidate = `${wantedName}-${index}`;
  }
  return candidate;
}

async function getSkillDirectories(rootDir: string): Promise<string[]> {
  const index = await buildSkillIndex(rootDir);
  const set = new Set(index.map((item) => join(rootDir, item.directory)));
  return [...set];
}

async function resolveSkillsByNames(
  rootDir: string,
  names: string[],
): Promise<SkillMeta[]> {
  const index = await buildSkillIndex(rootDir);
  if (!names.length) {
    return index;
  }

  const wanted = new Set(names.map((item) => item.trim().toLowerCase()));
  const matched = index.filter((item) => wanted.has(item.name.trim().toLowerCase()));
  if (matched.length !== wanted.size) {
    const found = new Set(matched.map((item) => item.name.trim().toLowerCase()));
    const missing = [...wanted].filter((item) => !found.has(item));
    throw new Error(`未找到技能: ${missing.join(", ")}`);
  }
  return matched;
}

async function getInstalledPlatforms(skill: SkillMeta): Promise<SupportedPlatform[]> {
  const installed: SupportedPlatform[] = [];
  for (const platform of allPlatforms()) {
    const targetPath = join(getPlatformConfig(platform).defaultDir, basename(skill.directory));
    if (await fs.pathExists(targetPath)) {
      installed.push(platform);
    }
  }
  return installed;
}

function renderSkillLine(skill: SkillMeta): string {
  return `${chalk.cyan(skill.name)} ${chalk.gray(`(${skill.relativePath})`)}\n  ${skill.description}`;
}

function normalizePlatform(input: string): SupportedPlatform {
  const value = input as SupportedPlatform;
  if (!allPlatforms().includes(value)) {
    throw new Error(
      `不支持的平台: ${input}，可选值: ${allPlatforms().join(", ")}`,
    );
  }
  return value;
}

async function run() {
  const program = new Command();
  program
    .name("skills")
    .description("Manage and preview local skills")
    .version("0.1.0");

  program
    .command("list")
    .option("--skills-dir <dir>", "技能目录根路径", process.cwd())
    .action(async (options) => {
      const skills = await buildSkillIndex(cwdOr(options.skillsDir));
      if (!skills.length) {
        console.log(chalk.yellow("未找到任何技能。"));
        return;
      }
      for (const item of skills) {
        const installedPlatforms = await getInstalledPlatforms(item);
        const installedMark = installedPlatforms.length
          ? chalk.green(
              `[已安装:${installedPlatforms
                .map((platform) => getPlatformConfig(platform).label)
                .join(", ")}]`,
            )
          : chalk.gray("[未安装]");
        console.log(`${chalk.cyan(item.name)} ${installedMark}`);
      }
    });

  program
    .command("show")
    .argument("<name>", "技能名称或目录名")
    .option("--skills-dir <dir>", "技能目录根路径", process.cwd())
    .option("--raw", "输出原始文件", false)
    .action(async (name, options) => {
      const doc = await loadSkillByName(cwdOr(options.skillsDir), name);
      if (!doc) {
        console.error(chalk.red(`未找到技能: ${name}`));
        process.exitCode = 1;
        return;
      }
      if (options.raw) {
        console.log(doc.raw);
        return;
      }
      console.log(chalk.bold(doc.name));
      console.log(chalk.gray(doc.description));
      console.log();
      console.log(doc.content);
    });

  program
    .command("search")
    .argument("<query>", "搜索关键字")
    .option("--skills-dir <dir>", "技能目录根路径", process.cwd())
    .action(async (query, options) => {
      const index = await buildSkillIndex(cwdOr(options.skillsDir));
      const matched = searchSkills(index, query);
      if (!matched.length) {
        console.log(chalk.yellow(`未搜索到 "${query}"`));
        return;
      }
      for (const item of matched) {
        console.log(renderSkillLine(item));
      }
    });

  program
    .command("doctor")
    .option("--skills-dir <dir>", "技能目录根路径", process.cwd())
    .action(async (options) => {
      const issues = await doctorSkills(cwdOr(options.skillsDir));
      if (!issues.length) {
        console.log(chalk.green("检查完成，没有发现问题。"));
        return;
      }
      for (const issue of issues) {
        const tag =
          issue.level === "error"
            ? chalk.red("[error]")
            : chalk.yellow("[warn]");
        console.log(`${tag} ${issue.path} - ${issue.message}`);
      }
    });

  program
    .command("where")
    .argument("<platform>", "cursor|claude-code|codex")
    .action(async (platformName) => {
      const platform = normalizePlatform(platformName);
      const result = await detectPlatformPath(platform);
      console.log(`${result.label}: ${result.defaultDir}`);
      console.log(`exists=${result.exists} writable=${result.writable}`);
      console.log(`note=${result.note}`);
    });

  program
    .command("install")
    .argument("[names...]", "仅安装指定技能名称（默认安装全部）")
    .option("--platform <platform>", "目标平台 cursor|claude-code|codex")
    .option("--all-platforms", "安装到全部平台", false)
    .option("--skills-dir <dir>", "技能目录根路径", process.cwd())
    .option("--target-dir <dir>", "覆盖目标目录（用于单个平台）")
    .option("--force", "覆盖已存在目录", false)
    .option("--dry-run", "只预览不写入", false)
    .action(async (names, options) => {
      const sourceRoot = cwdOr(options.skillsDir);
      const selectedSkills = await resolveSkillsByNames(sourceRoot, names);
      const skillDirs = [...new Set(selectedSkills.map((item) => join(sourceRoot, item.directory)))];
      if (!skillDirs.length) {
        console.log(chalk.yellow("没有可安装的技能。"));
        return;
      }

      const selectedPlatforms: SupportedPlatform[] = options.allPlatforms
        ? allPlatforms()
        : [normalizePlatform(options.platform || "cursor")];

      for (const platform of selectedPlatforms) {
        const platformConfig = getPlatformConfig(platform);
        const targetRoot = options.targetDir
          ? cwdOr(options.targetDir)
          : platformConfig.defaultDir;
        console.log(chalk.bold(`\n[${platformConfig.label}] -> ${targetRoot}`));
        for (const sourceDir of skillDirs) {
          const target = await installSkillDirectory(sourceDir, targetRoot, {
            force: options.force,
            dryRun: options.dryRun,
          });
          const prefix = options.dryRun ? "[dry-run]" : "[copied]";
          console.log(`${prefix} ${sourceDir} -> ${target}`);
        }
      }
    });

  program
    .command("auth")
    .description("owner 双因子认证辅助")
    .addCommand(
      new Command("init")
        .option("--token <token>", "初始化 token，未传则自动生成")
        .action(async (options) => {
          const result = await initOwnerToken(options.token);
          console.log(chalk.green(`已写入 token hash: ${result.tokenFile}`));
          console.log(
            chalk.yellow(
              "请将以下 token 保存到安全位置，并在上传前导出 SKILLS_OWNER_TOKEN:",
            ),
          );
          console.log(result.token);
        }),
    )
    .addCommand(
      new Command("status").action(async () => {
        const owner = getOwnerConfig();
        const status = await ensureOwnerAccess();
        console.log(`owner=${owner.ownerGithub}`);
        console.log(`github=${status.githubOk} token=${status.tokenOk}`);
        console.log(`currentGithub=${status.githubUser || "unknown"}`);
        if (!status.ok) {
          console.log(chalk.red(status.reason || "未通过校验"));
          process.exitCode = 1;
        } else {
          console.log(chalk.green("双因子校验通过"));
        }
      }),
    );

  program
    .command("upload")
    .option("--source <path>", "本地 source 路径（SKILL.md 或目录）")
    .option("--name <name>", "目标 skill 名称")
    .option("--content-file <path>", "从文件读取正文并上传")
    .option("--skills-dir <dir>", "技能目录根路径", process.cwd())
    .option("--rename <name>", "冲突时指定重命名")
    .option("--on-conflict <mode>", "冲突策略: error|rename|overwrite", "error")
    .option("--force", "冲突时覆盖", false)
    .option("--dry-run", "预览模式", false)
    .action(async (options) => {
      const auth = await ensureOwnerAccess();
      if (!auth.ok) {
        console.error(chalk.red(`上传被拒绝: ${auth.reason}`));
        process.exitCode = 1;
        return;
      }
      if (!["error", "rename", "overwrite"].includes(options.onConflict)) {
        throw new Error("on-conflict 仅支持 error|rename|overwrite");
      }

      const rootDir = cwdOr(options.skillsDir);
      const baseDir = await resolveSkillBaseDir(rootDir);
      let targetName = options.name as string | undefined;
      let content = "";

      if (options.contentFile) {
        content = await readFile(cwdOr(options.contentFile), "utf8");
      } else if (options.source) {
        const sourcePath = cwdOr(options.source);
        const stat = await fs.stat(sourcePath);
        if (stat.isDirectory()) {
          const skillPath = join(sourcePath, "SKILL.md");
          content = await readFile(skillPath, "utf8");
          targetName = targetName || basename(sourcePath);
        } else {
          content = await readFile(sourcePath, "utf8");
          targetName = targetName || basename(dirname(sourcePath));
        }
      } else {
        throw new Error("请至少提供 --source 或 --content-file");
      }

      if (!targetName) {
        throw new Error("无法推断技能名称，请使用 --name 指定");
      }

      if (!content.includes("---")) {
        throw new Error("内容缺少 frontmatter");
      }

      let finalName = targetName;
      const initialTarget = join(baseDir, finalName, "SKILL.md");
      const exists = await fs.pathExists(initialTarget);
      if (exists) {
        if (options.rename) {
          finalName = options.rename;
        } else if (options.force || options.onConflict === "overwrite") {
          finalName = targetName;
        } else if (options.onConflict === "rename") {
          finalName = await resolveConflictName(baseDir, targetName);
        } else {
          throw new Error(
            `目标已存在: ${initialTarget}，请使用 --rename/--on-conflict rename 或 --force`,
          );
        }
      }

      const finalPath = join(baseDir, finalName, "SKILL.md");
      if (options.dryRun) {
        console.log(`[dry-run] upload -> ${finalPath}`);
        return;
      }

      await fs.ensureDir(join(baseDir, finalName));
      await writeFile(finalPath, content, "utf8");
      const doc = await loadSkillFromFile(rootDir, finalPath);
      console.log(chalk.green(`上传成功: ${doc.name}`));
      console.log(chalk.gray(finalPath));
    });

  await program.parseAsync(process.argv);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(chalk.red(message));
  process.exit(1);
});
