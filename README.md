# SkillForge

AI Skill Management System — manage, compose, and link skills across AI agents.

## Installation

```bash
npm install -g skillforge
```

## Quick Start

```bash
# Initialize SkillForge
skillforge init

# List all discovered skills
skillforge list

# Link a skill to a project
skillforge link my-skill --agent claude --project ~/Projects/my-app

# Check health
skillforge doctor
```

## Commands

| Command | Description |
|---------|-------------|
| `skillforge init` | Initialize configuration and directory structure |
| `skillforge list` | List all discovered skills |
| `skillforge add <name>` | Install a skill from the community |
| `skillforge remove <name>` | Remove a community skill |
| `skillforge link <skill> -a <agent> -p <path>` | Link a skill to an agent project |
| `skillforge unlink <skill> -a <agent> -p <path>` | Unlink a skill |
| `skillforge enable <skill> -a <agent>` | Enable a skill globally |
| `skillforge disable <skill> -a <agent>` | Disable a globally enabled skill |
| `skillforge doctor` | Health check |
| `skillforge agents` | List configured agents |

## Directory Structure

```
~/Developer/Skills/
├── Personal/          # Your own skills
├── Community/         # Third-party skills
└── Experimental/      # Experimental skills

~/.skillforge/
├── agents/            # Agent YAML definitions
└── registry.json      # Skill registry
```

## Skill Format

Skills use `SKILL.md` with YAML frontmatter:

```markdown
---
name: my-skill
description: A useful skill
version: 1.0.0
author: your-name
tags: [utility, automation]
---

# Skill content
```

## Agent Configuration

Agents are defined in `~/.skillforge/agents/*.yaml`:

```yaml
name: claude
type: claude-code
paths:
  project: .claude
  global: ~/.claude
  skills: skills
load_order:
  - project
  - global
```

## License

MIT
