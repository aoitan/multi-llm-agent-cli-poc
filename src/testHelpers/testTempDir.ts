import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const createdTempDirs = new Set<string>();

export function createTestTempDir(prefix: string): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  createdTempDirs.add(path.resolve(tempDir));
  return tempDir;
}

export function cleanupTestTempDir(tempDir: string): void {
  if (!tempDir) {
    return;
  }

  const resolvedPath = path.resolve(tempDir);
  if (!createdTempDirs.has(resolvedPath)) {
    throw new Error(`Refusing to cleanup unmanaged temp dir: ${resolvedPath}`);
  }

  if (fs.existsSync(resolvedPath)) {
    fs.rmSync(resolvedPath, { recursive: true, force: true });
  }

  createdTempDirs.delete(resolvedPath);
}
