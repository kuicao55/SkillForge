# Skill Format Specification

## SKILL.md

Each skill is a directory containing a `SKILL.md` file with YAML frontmatter.

### Structure

```
skill-name/
├── SKILL.md           # Required — metadata + documentation
├── scripts/           # Optional — executable scripts
├── prompts/           # Optional — prompt templates
└── tools/             # Optional — tool definitions
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique skill identifier |
| `description` | string | No | One-line description |
| `version` | string | No | Semantic version |
| `author` | string | No | Author name |
| `source` | string | No | `personal`, `community`, or `experimental` (auto-inferred from path) |
| `tags` | string[] | No | Categorization tags |

### Example

```markdown
---
name: git-assistant
description: Automated git workflow assistant
version: 1.0.0
author: kui
tags: [git, workflow, automation]
---

# Git Assistant

Helps with git operations...
```

## Source Directories

| Directory | Purpose |
|-----------|---------|
| `~/Developer/Skills/Personal/` | Your own skills (git-tracked) |
| `~/Developer/Skills/Community/` | Third-party skills |
| `~/Developer/Skills/Experimental/` | Work-in-progress skills |
