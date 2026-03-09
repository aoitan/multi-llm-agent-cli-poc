import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const createdTempDirs = new Set<string>();
const tmpRoot = path.resolve(os.tmpdir());

function isWithinTmpRoot(targetPath: string): boolean {
  const relative = path.relative(tmpRoot, targetPath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function validatePrefix(prefix: string): void {
  if (!prefix) {
    throw new Error('Temp dir prefix must not be empty');
  }

  if (prefix !== path.basename(prefix)) {
    throw new Error(`Temp dir prefix must not contain path segments: ${prefix}`);
  }
}

export function createTestTempDir(prefix: string): string {
  validatePrefix(prefix);
  const tempDir = path.resolve(fs.mkdtempSync(path.join(tmpRoot, prefix)));
  if (!isWithinTmpRoot(tempDir)) {
    throw new Error(`Created temp dir is outside tmp root: ${tempDir}`);
  }

  createdTempDirs.add(tempDir);
  return tempDir;
}

export function cleanupTestTempDir(tempDir: string): void {
  if (!tempDir) {
    return;
  }

  const resolvedPath = path.resolve(tempDir);
  if (!isWithinTmpRoot(resolvedPath)) {
    throw new Error(`Refusing to cleanup outside tmp root: ${resolvedPath}`);
  }

  if (!createdTempDirs.has(resolvedPath)) {
    throw new Error(`Refusing to cleanup unmanaged temp dir: ${resolvedPath}`);
  }

  fs.rmSync(resolvedPath, { recursive: true, force: true });

  createdTempDirs.delete(resolvedPath);
}
