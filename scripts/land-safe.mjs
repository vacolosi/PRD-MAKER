// land-safe — ancestry-guarded landing (kernel command, relay-kit).
// Ported from the retired harness land.ts + its regression-tested branch guard.
//
// Usage:
//   node scripts/land-safe.mjs <slug> --repos <dir,dir,...> --title "..." (--body "..." | --body-file f.md)
//                              [--branch-prefix work/] [--allow-artifacts] [--no-pr]
//
// Per dirty repo: checkout/create branch <prefix><slug> (REFUSING any move that would
// discard commits the current HEAD does not contain), commit all changes, push, draft PR.
// Clean repos are skipped. Push/PR failures are reported, not fatal (commit stays local).
//
// GUARD (the reason this is a script, not prose): `git checkout -B <branch>` resets the
// branch pointer to the current HEAD. If HEAD does not contain the branch's existing tip
// (local or origin), that silently discards prior slices' commits — this exact failure
// destroyed a slice's work once. This script refuses instead.
//
// Exit 0 = all repos landed or clean. Exit 1 = at least one repo failed/refused. Exit 2 = usage.

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

function run(cwd, cmd, args) {
	return execFileSync(cmd, args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
const git = (cwd, args) => run(cwd, "git", args);
const gh = (cwd, args) => run(cwd, "gh", args);

function parseFlags(argv) {
	const flags = {};
	const positional = [];
	for (let i = 0; i < argv.length; i++) {
		if (argv[i].startsWith("--")) {
			const key = argv[i].slice(2);
			if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) flags[key] = argv[++i];
			else flags[key] = true;
		} else positional.push(argv[i]);
	}
	return { flags, positional };
}

const { flags, positional } = parseFlags(process.argv.slice(2));
const slug = positional[0];
const repos = typeof flags.repos === "string" ? flags.repos.split(",").map((s) => s.trim()).filter(Boolean) : [];
if (!slug || repos.length === 0 || typeof flags.title !== "string") {
	console.error('Usage: land-safe.mjs <slug> --repos <dir,...> --title "..." (--body "..." | --body-file f.md) [--branch-prefix work/] [--allow-artifacts] [--no-pr]');
	process.exit(2);
}
const branch = `${flags["branch-prefix"] ?? "work/"}${slug}`;
const title = flags.title;
let body = typeof flags.body === "string" ? flags.body : "";
if (typeof flags["body-file"] === "string") {
	try {
		body = fs.readFileSync(flags["body-file"], "utf-8");
	} catch (err) {
		console.error(`Cannot read --body-file: ${err.message}`);
		process.exit(2);
	}
}
if (!body) body = title;

const ARTIFACT_RE = /^(?:.*\/)?(dist|bin|obj|node_modules|dist-verify)\//;

function existingBranchTip(cwd) {
	try {
		git(cwd, ["fetch", "origin", `${branch}:refs/remotes/origin/${branch}`]);
	} catch {
		/* offline or branch not on origin — fine */
	}
	for (const ref of [branch, `origin/${branch}`]) {
		try {
			return git(cwd, ["rev-parse", "--verify", "--quiet", ref]);
		} catch {
			/* try next */
		}
	}
	return undefined;
}

function isAncestor(cwd, ancestor, descendant) {
	try {
		execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { cwd, stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

let failed = false;
for (const repo of repos) {
	const cwd = path.resolve(repo);
	const label = path.basename(cwd);
	try {
		if (git(cwd, ["status", "--porcelain"]).length === 0) {
			console.log(`- ${label}: no changes`);
			continue;
		}

		// Artifact guard: never land build output.
		const dirtyFiles = git(cwd, ["status", "--porcelain"]).split("\n").map((l) => l.slice(3).trim());
		const artifacts = dirtyFiles.filter((f) => ARTIFACT_RE.test(f.replace(/\\/g, "/")));
		if (artifacts.length > 0 && !flags["allow-artifacts"]) {
			console.error(`- ${label}: REFUSED — ${artifacts.length} build-artifact path(s) in the diff (e.g. ${artifacts[0]}). Clean them or pass --allow-artifacts if truly intentional.`);
			failed = true;
			continue;
		}

		// Branch-pointer guard.
		const current = git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]);
		if (current !== branch) {
			const tip = existingBranchTip(cwd);
			if (tip) {
				const head = git(cwd, ["rev-parse", "HEAD"]);
				if (head !== tip && !isAncestor(cwd, tip, head)) {
					console.error(
						`- ${label}: REFUSED — branch "${branch}" has commits at ${tip.slice(0, 7)} that HEAD (${head.slice(0, 7)}) does not contain. ` +
							`checkout -B would silently discard them (this exact failure destroyed a slice's work once). ` +
							`Check out ${branch} before building, or rebase/merge onto it, then re-run.`,
					);
					failed = true;
					continue;
				}
			}
			git(cwd, ["checkout", "-B", branch]);
		}

		git(cwd, ["add", "-A"]);
		git(cwd, ["commit", "-m", title, "-m", body]);
		const sha = git(cwd, ["rev-parse", "--short", "HEAD"]);

		if (flags["no-pr"]) {
			console.log(`- ${label}: ${branch}@${sha} (committed locally, --no-pr)`);
			continue;
		}
		try {
			git(cwd, ["push", "-u", "origin", branch]);
			const existing = gh(cwd, ["pr", "list", "--head", branch, "--state", "open", "--json", "url", "--jq", ".[0].url"]);
			const prUrl = existing || gh(cwd, ["pr", "create", "--draft", "--title", title, "--body", body]);
			console.log(`- ${label}: ${branch}@${sha} → ${prUrl}`);
		} catch (err) {
			console.log(`- ${label}: ${branch}@${sha} (committed locally; push/PR failed: ${String(err.message ?? err).split("\n")[0]})`);
		}
	} catch (err) {
		console.error(`- ${label}: FAILED — ${String(err.message ?? err).split("\n")[0]}`);
		failed = true;
	}
}
process.exit(failed ? 1 : 0);
