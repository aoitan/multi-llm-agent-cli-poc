import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { createTestTempDir, cleanupTestTempDir } from '../../src/testHelpers/testTempDir';
import { detectProjectContext, type ProjectContext } from './context';

function initGitRepo(repoDir: string, branchName = 'feature/test'): void {
  execFileSync('git', ['init'], { cwd: repoDir, stdio: 'pipe' });
  execFileSync('git', ['checkout', '-b', branchName], { cwd: repoDir, stdio: 'pipe' });
}

describe('detectProjectContext', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTestTempDir('cli-wrapper-context-');
  });

  afterEach(() => {
    cleanupTestTempDir(tempDir);
  });

  it('detects projectId from git root basename and defaults to normal danger', () => {
    const repoDir = path.join(tempDir, 'sample-project');
    fs.mkdirSync(repoDir);
    initGitRepo(repoDir, 'feature/context');

    const nestedDir = path.join(repoDir, 'packages', 'app');
    fs.mkdirSync(nestedDir, { recursive: true });

    const context = detectProjectContext({ cwd: nestedDir, env: {} });

    expect(context).toEqual<ProjectContext>({
      projectId: 'sample-project',
      cwd: nestedDir,
      backend: 'copilot',
      envType: 'unknown',
      dangerLevel: 'normal',
    });
  });

  it('maps NODE_ENV and RAILS_ENV values to envType', () => {
    const repoDir = path.join(tempDir, 'env-project');
    fs.mkdirSync(repoDir);
    initGitRepo(repoDir, 'feature/context');

    expect(
      detectProjectContext({
        cwd: repoDir,
        env: { NODE_ENV: 'production' },
      }).envType
    ).toBe('prod');

    expect(
      detectProjectContext({
        cwd: repoDir,
        env: { RAILS_ENV: 'staging' },
      }).envType
    ).toBe('staging');

    expect(
      detectProjectContext({
        cwd: repoDir,
        env: { NODE_ENV: 'development' },
      }).envType
    ).toBe('dev');
  });

  it('marks main and production branches as high danger', () => {
    const mainRepoDir = path.join(tempDir, 'main-project');
    fs.mkdirSync(mainRepoDir);
    initGitRepo(mainRepoDir, 'main');

    const productionRepoDir = path.join(tempDir, 'production-project');
    fs.mkdirSync(productionRepoDir);
    initGitRepo(productionRepoDir, 'production');

    expect(detectProjectContext({ cwd: mainRepoDir }).dangerLevel).toBe('high');
    expect(detectProjectContext({ cwd: productionRepoDir }).dangerLevel).toBe('high');
  });

  it('allows .cli-wrapper.json to override detected values', () => {
    const repoDir = path.join(tempDir, 'override-project');
    fs.mkdirSync(repoDir);
    initGitRepo(repoDir, 'main');
    const nestedDir = path.join(repoDir, 'nested');
    fs.mkdirSync(nestedDir);

    fs.writeFileSync(
      path.join(repoDir, '.cli-wrapper.json'),
      JSON.stringify(
        {
          id: 'custom-project',
          backend: 'custom-backend',
          envType: 'staging',
          dangerLevel: 'normal',
        },
        null,
        2
      )
    );

    const context = detectProjectContext({
      cwd: nestedDir,
      env: { NODE_ENV: 'production' },
    });

    expect(context.projectId).toBe('custom-project');
    expect(context.backend).toBe('custom-backend');
    expect(context.envType).toBe('staging');
    expect(context.dangerLevel).toBe('normal');
  });

  it('trims overridden id and backend values from .cli-wrapper.json', () => {
    const repoDir = path.join(tempDir, 'trimmed-project');
    fs.mkdirSync(repoDir);
    initGitRepo(repoDir, 'feature/context');

    fs.writeFileSync(
      path.join(repoDir, '.cli-wrapper.json'),
      JSON.stringify({
        id: '  custom-project  ',
        backend: '  copilot-proxy  ',
      })
    );

    const context = detectProjectContext({ cwd: repoDir, env: {} });

    expect(context.projectId).toBe('custom-project');
    expect(context.backend).toBe('copilot-proxy');
  });

  it('wraps invalid .cli-wrapper.json parse errors with the config path', () => {
    const repoDir = path.join(tempDir, 'broken-config-project');
    fs.mkdirSync(repoDir);
    initGitRepo(repoDir, 'feature/context');

    const configPath = path.join(repoDir, '.cli-wrapper.json');
    fs.writeFileSync(configPath, '{ invalid json');

    expect(() => detectProjectContext({ cwd: repoDir, env: {} })).toThrow(
      /Failed to parse .*\.cli-wrapper\.json:/
    );
  });
});
