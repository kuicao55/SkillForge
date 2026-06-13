# SkillForge

AI Skill Management System — manage, compose, and link skills across AI agents.

## Installation

```bash
npm install -g skillforge
```

## Quick Start

```bash
# Initialize SkillForge
skill init

# List all discovered skills
skill list

# Link a skill to a project
skill link my-skill --agent claude --project ~/Projects/my-app

# Check health
skill doctor
```

## Commands

| Command | Description |
|---------|-------------|
| `skill init` | Initialize configuration and directory structure |
| `skill list` | List all discovered skills |
| `skill add <name>` | Install a skill from the community |
| `skill remove <name>` | Remove a community skill |
| `skill link <skill> -a <agent> -p <path>` | Link a skill to an agent project |
| `skill unlink <skill> -a <agent> -p <path>` | Unlink a skill |
| `skill enable <skill> -a <agent>` | Enable a skill globally |
| `skill disable <skill> -a <agent>` | Disable a globally enabled skill |
| `skill doctor` | Health check |
| `skill agents` | List configured agents |

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

## Development

```bash
# Clone and install dependencies
git clone <repo-url>
cd SkillForge
npm install

# Link for local development (one-time)
npm link

# Now `skill` command is available globally
skill list

# After modifying source code, rebuild to apply changes
npm run build

# Run tests
npm test

# Unlink when done developing
npm unlink -g skillforge
```

## License

MIT
