#!/usr/bin/env node

/**
 * Release script for @hacxy/skills
 *
 * Usage:
 *   ./scripts/release.js [patch|minor|m] [--yes]
 *
 * Examples:
 *   ./scripts/release.js patch          # bump patch version
 *   ./scripts/release.js minor --yes    # bump minor version, skip confirmation
 *   ./scripts/release.js                # interactive mode
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Constants
const PACKAGE_PATH = path.join(__dirname, "..", "package.json");
const VERSION_TYPES = ["patch", "minor", "major"];

// Parse arguments
const args = process.argv.slice(2);
const flags = {
	yes: args.includes("--yes") || args.includes("-y"),
};
const versionType = args.find((arg) => VERSION_TYPES.includes(arg));

// Helper: execute command and return output
function exec(cmd, options = {}) {
	try {
		const result = execSync(cmd, {
			encoding: "utf8",
			stdio: options.silent ? "pipe" : "inherit",
			...options,
		});
		return result ? result.trim() : "";
	} catch (error) {
		if (!options.silent) {
			console.error(`\x1b[31mError executing: ${cmd}\x1b[0m`);
		}
		throw error;
	}
}

// Helper: prompt user for input
async function prompt(question, defaultValue = "") {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		const suffix = defaultValue ? ` (${defaultValue})` : "";
		rl.question(`${question}${suffix}: `, (answer) => {
			rl.close();
			resolve(answer.trim() || defaultValue);
		});
	});
}

// Helper: calculate next version
function getNextVersion(currentVersion, type) {
	const [major, minor, patch] = currentVersion.split(".").map(Number);

	switch (type) {
		case "major":
			return `${major + 1}.0.0`;
		case "minor":
			return `${major}.${minor + 1}.0`;
		case "patch":
			return `${major}.${minor}.${patch + 1}`;
		default:
			throw new Error(`Invalid version type: ${type}`);
	}
}

// Check git status
function checkGitStatus() {
	console.log("\n📋 Checking git status...");

	const status = exec("git status --porcelain", { silent: true });
	if (status) {
		console.error(
			"\x1b[31m❌ Working directory is not clean. Please commit or stash your changes first.\x1b[0m",
		);
		process.exit(1);
	}

	console.log("✅ Working directory is clean");
}

// Get current version from package.json
function getCurrentVersion() {
	try {
		const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8"));
		return pkg.version;
	} catch (error) {
		console.error(
			`\x1b[31mFailed to read package.json: ${error.message}\x1b[0m`,
		);
		process.exit(1);
	}
}

// Update version in package.json
function updateVersion(newVersion) {
	try {
		const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8"));
		pkg.version = newVersion;
		fs.writeFileSync(PACKAGE_PATH, JSON.stringify(pkg, null, 2) + "\n");
	} catch (error) {
		console.error(
			`\x1b[31mFailed to update package.json: ${error.message}\x1b[0m`,
		);
		process.exit(1);
	}
}

// Commit, tag, and push
function gitOperations(newVersion) {
	const tag = `v${newVersion}`;

	console.log("\n📦 Committing changes...");
	exec("git add -A package.json");
	exec(`git commit -m "chore(release): ${tag}"`);

	console.log("\n🏷️  Creating tag...");
	exec(`git tag ${tag}`);

	console.log("\n📤 Pushing to remote...");
	exec("git push");
	exec("git push --tags");
}

// Publish to npm
async function publishToNpm() {
	if (flags.yes) {
		console.log("\n🚀 Publishing to npm...");
		exec("npm publish");
		return;
	}

	const answer = await prompt("\n🚀 Publish to npm? (Y/n)", "Y");
	if (answer.toLowerCase() === "n") {
		console.log("\n⏭️  Skipped npm publish");
		return;
	}

	console.log("\n🚀 Publishing to npm...");
	exec("npm publish");
}

// Main function
async function main() {
	console.log("🚀 Release Script for @hacxy/skills\n");

	// Check git status
	checkGitStatus();

	// Get current version
	const currentVersion = getCurrentVersion();
	console.log(`\n📌 Current version: ${currentVersion}`);

	// Determine version type
	let selectedType = versionType;

	if (!selectedType) {
		console.log("\nSelect version bump:");
		console.log("  1) patch  (bug fixes)");
		console.log("  2) minor  (new features)");
		console.log("  3) major  (breaking changes)");

		const choice = await prompt("\nEnter choice (1-3)", "1");

		switch (choice) {
			case "1":
				selectedType = "patch";
				break;
			case "2":
				selectedType = "minor";
				break;
			case "3":
				selectedType = "major";
				break;
			default:
				console.error("\x1b[31m❌ Invalid choice\x1b[0m");
				process.exit(1);
		}
	}

	// Calculate new version
	const newVersion = getNextVersion(currentVersion, selectedType);

	// Confirmation
	console.log(`\n📦 Version: ${currentVersion} → ${newVersion}`);

	if (!flags.yes) {
		const answer = await prompt("\nProceed with release? (Y/n)", "Y");
		if (answer.toLowerCase() === "n") {
			console.log("\n❌ Release cancelled");
			process.exit(0);
		}
	}

	// Update version
	updateVersion(newVersion);
	console.log("\n✅ Updated package.json");

	// Git operations
	gitOperations(newVersion);
	console.log("\n✅ Git operations completed");

	// Publish to npm
	await publishToNpm();

	console.log("\n✨ Release completed successfully!");
}

main().catch((_error) => {
	console.error("\n\x1b[31m❌ Release failed\x1b[0m");
	process.exit(1);
});
