# SkillForge

AI Skill Management System — manage, compose, and link skills across AI agents.

## Installation

```bash
npm install -g skillforge
```

## Quick Start

```bash
# Browse skills interactively
skill list

# View skill details and actions
skill info my-skill

# Install a third-party skill
skill add author/skill-name

# Link a skill to a project (interactive)
skill link my-skill

# Get help
skill help
```

## Commands

| Command | Description |
|---------|-------------|
| `skill list` | Browse skills interactively (↑↓ select, ↵ info, esc exit) |
| `skill info <name>` | View skill details with link/unlink actions |
| `skill add <name>` | Install a third-party skill (e.g. `skill add lovstudio/md2pdf`) |
| `skill remove <name>` | Remove a community skill (auto-unlinks all projects first) |
| `skill link <skill>` | Link a skill to a project (interactive directory browser) |
| `skill link <skill> -d <dest> -p <path>` | Link a skill (claude\|others\|all) |
| `skill unlink <skill>` | Unlink a skill (interactive) |
| `skill unlink <skill> -d <dest> -p <path>` | Unlink a skill (claude\|others\|all) |
| `skill enable <skill> -d <dest>` | Enable a skill globally (claude\|others\|all) |
| `skill disable <skill> -d <dest>` | Disable a globally enabled skill |
| `skill doctor` | Health check — verify links and auto-fix issues |
| `skill clean` | Clean broken links, orphan entries, and cache |
| `skill config show` | Show current configuration |
| `skill config set-root <path>` | Set projects root directory (default: ~/Developer) |
| `skill config reset-root` | Reset projects root to default |
| `skill init` | Re-initialize configuration (optional, auto-runs on first use) |
| `skill help` | Show all available commands |

## Link Destinations

When linking a skill, you choose a destination:

| Destination | Symlink created in | Effect |
|-------------|-------------------|--------|
| **claude** | `.claude/skills/` | Only Claude Code reads this |
| **others** | `.agents/skills/` | Cursor, Codex, CodeWhale, etc. |
| **all** | Both directories | Maximum compatibility |

## Interactive Controls

All interactive prompts support:
- **↑↓** — Navigate
- **↵** — Select / Confirm
- **ESC** — Go back (or exit if at top level)
- **Ctrl+C** — Exit immediately

## Directory Structure

```
~/Developer/Skills/
├── Personal/          # Your own skills
├── Community/         # Third-party skills (installed via 'skill add')
└── Experimental/      # Experimental skills

~/.skillforge/
├── config.json        # User configuration
├── registry.json      # Skill registry (links + metadata)
└── cache/             # Temporary download cache (auto-cleaned)
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
