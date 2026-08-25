# PRD Maker

Turns a repo or a rough blurb into a finished PRD.

Point it at a codebase or hand it a few sentences of intent, and it works the
idea into a full PRD, then writes the result out to Notion, a Google Doc, or a
Word doc.

## What is here

`skills/prd/` is the Claude Code skill that drafts a mechanical PRD into the
Notion Mechanical PRD List using the Hedral template, then files the companion
Linear issue in the PRD Creation project. This repo is its source of truth. It
covers the Notion path only so far; Google Doc and Word output are still to come.

## How the skill stays live

`~/.claude/skills/prd` is a Windows directory junction pointing at
`skills/prd/` in this repo, so the skill loads globally in Claude Code while
every edit is versioned here. Edit the file in the repo, not through the
junction path.

To recreate the junction on another machine (Windows, no admin needed):

```
mklink /J "%USERPROFILE%\.claude\skills\prd" "<path-to-repo>\skills\prd"
```

On macOS or Linux use a symlink instead:

```
ln -s "<path-to-repo>/skills/prd" ~/.claude/skills/prd
```

## Status

Early. The prd skill works; the rest of the pipeline is not built.
