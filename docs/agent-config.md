# Agent Configuration Reference

## File Location

Agent definitions live in `~/.skillforge/agents/*.yaml`.

## Schema

```yaml
name: string          # Agent identifier (required)
type: string          # Agent type (required)
paths:
  project: string     # Project-level config dir (e.g. ".claude")
  global: string      # Global config dir (e.g. "~/.claude")
  skills: string      # Skills subdirectory name (e.g. "skills")
load_order:           # Priority order for skill loading
  - project           # Project-level skills loaded first
  - global            # Then global skills
```

## Built-in Agents

### Claude Code (`claude.yaml`)

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

### Cursor (`cursor.yaml`)

```yaml
name: cursor
type: cursor
paths:
  project: .cursor
  global: ~/.cursor
  skills: skills
load_order:
  - project
  - global
```

## Adding a New Agent

Create a new YAML file in `~/.skillforge/agents/`:

```bash
# Example: adding Codex agent
cat > ~/.skillforge/agents/codex.yaml << EOF
name: codex
type: codex
paths:
  project: .codex
  global: ~/.codex
  skills: skills
load_order:
  - project
  - global
EOF
```

No code changes needed — SkillForge auto-discovers all YAML files in the agents directory.
