import fs from 'fs-extra';
import path from 'node:path';
import yaml from 'js-yaml';
import { type AgentConfig, type AgentDefinition, AgentConfigSchema } from '../../types/agent.js';
import { getAgentsDir, expandHome } from '../../utils/paths.js';

/**
 * Load all agent definitions from ~/.skillforge/agents/*.yaml
 */
export async function loadAgents(): Promise<AgentDefinition[]> {
  const agentsDir = getAgentsDir();

  if (!await fs.pathExists(agentsDir)) {
    return [];
  }

  const files = await fs.readdir(agentsDir);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  const agents: AgentDefinition[] = [];
  for (const file of yamlFiles) {
    const configPath = path.join(agentsDir, file);
    const agent = await loadAgent(configPath);
    if (agent) {
      agents.push(agent);
    }
  }

  return agents;
}

/**
 * Load a single agent definition from a YAML file.
 */
export async function loadAgent(configPath: string): Promise<AgentDefinition | null> {
  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    const data = yaml.load(raw) as Record<string, unknown>;
    const parsed = AgentConfigSchema.safeParse(data);
    if (!parsed.success) {
      return null;
    }
    return {
      config: parsed.data,
      configPath,
    };
  } catch {
    return null;
  }
}

/**
 * Find an agent by name.
 */
export async function findAgent(name: string): Promise<AgentDefinition | null> {
  const agents = await loadAgents();
  return agents.find(a => a.config.name === name) || null;
}

/**
 * Resolve the skills directory path for an agent in a specific project.
 * e.g. /path/to/project/.claude/skills
 */
export function resolveProjectSkillsDir(agent: AgentDefinition, projectPath: string): string {
  return path.join(expandHome(projectPath), agent.config.paths.project, agent.config.paths.skills);
}

/**
 * Resolve the global skills directory path for an agent.
 * e.g. ~/.claude/skills
 */
export function resolveGlobalSkillsDir(agent: AgentDefinition): string {
  return path.join(expandHome(agent.config.paths.global), agent.config.paths.skills);
}

/**
 * Save a new agent definition YAML file.
 */
export async function saveAgent(config: AgentConfig): Promise<void> {
  const agentsDir = getAgentsDir();
  await fs.ensureDir(agentsDir);

  const filePath = path.join(agentsDir, `${config.name}.yaml`);
  const content = yaml.dump(config, { lineWidth: 120 });
  await fs.writeFile(filePath, content, 'utf-8');
}
