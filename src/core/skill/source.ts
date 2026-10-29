/**
 * Pure helpers for parsing `skill add` arguments.
 */

export type ParsedSource =
  | { kind: 'url'; value: string }
  | { kind: 'registry'; value: string };

const PROTOCOL_RE = /^(?:https?|ssh|git|git\+https?|git\+ssh):\/\//i;

/**
 * Is this argument a Git repository URL rather than a registry name?
 *
 * Accepts http(s)/ssh/git protocols, scp-style `git@host:owner/repo.git`,
 * and `owner/repo.git` shorthand.
 */
export function isGitUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (PROTOCOL_RE.test(trimmed)) return true;
  if (/^git@[^:\s]+:\S+$/.test(trimmed)) return true;
  if (/^[\w.-]+\/[\w.-]+\.git$/.test(trimmed)) return true;
  return false;
}

/**
 * Classify a `skill add` source argument as a Git URL or a registry name
 * (e.g. `owner/name`).
 */
export function parseSource(value: string): ParsedSource {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Source cannot be empty');
  }
  return isGitUrl(trimmed)
    ? { kind: 'url', value: trimmed }
    : { kind: 'registry', value: trimmed };
}

/**
 * Value written to the SKILL.md `package` field.
 *
 * GitHub URLs are normalized to the canonical `owner/repo` form (which is what
 * `skill info` shows as Source); other sources keep their original value.
 */
export function toPackageName(source: ParsedSource): string {
  if (source.kind === 'registry') return source.value;

  const match =
    source.value.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+?)(?:\.git)?\/?$/i) ||
    source.value.match(/^ssh:\/\/git@github\.com\/([^/\s]+)\/([^/\s#?]+?)(?:\.git)?\/?$/i) ||
    source.value.match(/^git:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+?)(?:\.git)?\/?$/i) ||
    source.value.match(/^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i) ||
    source.value.match(/^([\w.-]+)\/([\w.-]+?)\.git$/);

  return match ? `${match[1]}/${match[2]}` : source.value;
}

/**
 * Normalize repeated/comma-separated `--skill` values into a deduplicated list.
 * `--skill a,b --skill c` becomes `['a', 'b', 'c']`.
 */
export function parseSkillOptions(values: readonly string[] = []): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const raw of values) {
    for (const part of raw.split(',')) {
      const name = part.trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      result.push(name);
    }
  }

  return result;
}
