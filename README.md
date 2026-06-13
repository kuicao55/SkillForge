# SkillForge

AI Skill Management System — manage, compose, and link skills across AI agents.

## Installation

```bash
npm install -g skillforge
```

## Quick Start

```bash
# List all discovered skills (auto-initializes on first run)
skill list

# View detailed info about a skill
skill info my-skill

# Install a third-party skill
skill add author/skill-name

# Link a skill to a project
skill link my-skill --agent claude --project ~/Projects/my-app

# Or use interactive mode (select from menus)
skill link my-skill

# Check health
skill doctor
```

## Commands

| Command | Description |
|---------|-------------|
| `skill list` | List all discovered skills with source info |
| `skill info <name>` | Show detailed skill info (description, path, linked projects) |
| `skill add <name>` | Install a third-party skill (e.g. `skill add lovstudio/md2pdf`) |
| `skill remove <name>` | Remove a community skill |
| `skill link <skill>` | Link a skill (interactive mode) |
| `skill link <skill> -a <agent> -p <path>` | Link a skill (direct mode) |
| `skill unlink <skill>` | Unlink a skill (interactive mode) |
| `skill unlink <skill> -a <agent> -p <path>` | Unlink a skill (direct mode) |
| `skill enable <skill> -a <agent>` | Enable a skill globally for an agent |
| `skill disable <skill> -a <agent>` | Disable a globally enabled skill |
| `skill doctor` | Health check — verify links and detect issues |
| `skill agents` | List configured agents with icons |
| `skill init` | Re-initialize configuration (optional, auto-runs on first use) |

## Directory Structure

```
~/Developer/Skills/
├── Personal/          # Your own skills (source: local)
├── Community/         # Third-party skills (source: package name)
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
package: author/skill-name  # auto-set by 'skill add'
---

# Skill content
```

## Agent Configuration

Agents are defined in `~/.skillforge/agents/*.yaml`:

```yaml
name: claude
type: claude-code
icon: "\U0001F916"
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
