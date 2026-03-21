import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

export type EnvType = 'prod' | 'staging' | 'dev' | 'unknown';
export type DangerLevel = 'high' | 'normal';

export interface ProjectContext {
  projectId: string;
  cwd: string;
  backend: string;
  envType: EnvType;
  dangerLevel: DangerLevel;
}

export interface CliWrapperConfig {
  id?: string;
  backend?: string;
  envType?: EnvType;
  dangerLevel?: DangerLevel;
}

export interface DetectProjectContextOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  backend?: string;
}

const ENV_KEYS = ['NODE_ENV', 'RAILS_ENV', 'RACK_ENV', 'APP_ENV'] as const;
const HIGH_DANGER_BRANCHES = new Set(['main', 'master', 'production', 'prod']);

function runGitCommand(args: string[], cwd: string): string | null {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function detectGitRoot(cwd: string): string | null {
  const gitRoot = runGitCommand(['rev-parse', '--show-toplevel'], cwd);
  return gitRoot ? path.resolve(gitRoot) : null;
}

function detectGitBranch(cwd: string): string | null {
  const branch = runGitCommand(['branch', '--show-current'], cwd);
  return branch || null;
}

function normalizeEnvType(value: string | undefined): EnvType {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return 'unknown';
  }

  if (normalized === 'production' || normalized === 'prod') {
    return 'prod';
  }

  if (normalized === 'staging' || normalized === 'stage' || normalized === 'stg') {
    return 'staging';
  }

  if (
    normalized === 'development' ||
    normalized === 'dev' ||
    normalized === 'test' ||
    normalized === 'local'
  ) {
    return 'dev';
  }

  return 'unknown';
}

function detectEnvType(env: NodeJS.ProcessEnv): EnvType {
  for (const key of ENV_KEYS) {
    const envType = normalizeEnvType(env[key]);
    if (envType !== 'unknown') {
      return envType;
    }
  }

  return 'unknown';
}

function detectDangerLevel(branch: string | null): DangerLevel {
  if (!branch) {
    return 'normal';
  }

  return HIGH_DANGER_BRANCHES.has(branch.toLowerCase()) ? 'high' : 'normal';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertEnvType(value: unknown, fieldName: string): EnvType {
  if (value === undefined) {
    return 'unknown';
  }

  if (value === 'prod' || value === 'staging' || value === 'dev' || value === 'unknown') {
    return value;
  }

  throw new Error(`Invalid ${fieldName} in .cli-wrapper.json: ${String(value)}`);
}

function assertDangerLevel(value: unknown): DangerLevel {
  if (value === 'high' || value === 'normal') {
    return value;
  }

  throw new Error(`Invalid dangerLevel in .cli-wrapper.json: ${String(value)}`);
}

function loadCliWrapperConfig(projectRoot: string): CliWrapperConfig {
  const configPath = path.join(projectRoot, '.cli-wrapper.json');
  if (!fs.existsSync(configPath)) {
    return {};
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as unknown;
  if (!isRecord(parsed)) {
    throw new Error('.cli-wrapper.json must contain a JSON object');
  }

  const config: CliWrapperConfig = {};

  if (parsed.id !== undefined) {
    if (typeof parsed.id !== 'string' || parsed.id.trim() === '') {
      throw new Error(`Invalid id in .cli-wrapper.json: ${String(parsed.id)}`);
    }
    config.id = parsed.id;
  }

  if (parsed.backend !== undefined) {
    if (typeof parsed.backend !== 'string' || parsed.backend.trim() === '') {
      throw new Error(`Invalid backend in .cli-wrapper.json: ${String(parsed.backend)}`);
    }
    config.backend = parsed.backend;
  }

  if (parsed.envType !== undefined) {
    config.envType = assertEnvType(parsed.envType, 'envType');
  }

  if (parsed.dangerLevel !== undefined) {
    config.dangerLevel = assertDangerLevel(parsed.dangerLevel);
  }

  return config;
}

export function detectProjectContext(
  options: DetectProjectContextOptions = {}
): ProjectContext {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const env = options.env ?? process.env;
  const gitRoot = detectGitRoot(cwd);
  const projectRoot = gitRoot ?? cwd;
  const branch = gitRoot ? detectGitBranch(cwd) : null;
  const config = loadCliWrapperConfig(projectRoot);

  return {
    projectId: config.id ?? path.basename(projectRoot),
    cwd,
    backend: config.backend ?? options.backend ?? 'copilot',
    envType: config.envType ?? detectEnvType(env),
    dangerLevel: config.dangerLevel ?? detectDangerLevel(branch),
  };
}
