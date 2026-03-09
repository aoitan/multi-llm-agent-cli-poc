import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { cleanupTestTempDir, createTestTempDir } from '../testHelpers/testTempDir';

describe('testTempDir helper', () => {
  it('creates and cleans up a managed temp directory', () => {
    const tempDir = createTestTempDir('helper-test-');
    const tempFilePath = path.join(tempDir, 'temp.txt');
    fs.writeFileSync(tempFilePath, 'ok');

    expect(fs.existsSync(tempDir)).toBe(true);
    cleanupTestTempDir(tempDir);
    expect(fs.existsSync(tempDir)).toBe(false);
  });

  it('throws when cleaning up an unmanaged path', () => {
    const unmanagedPath = fs.mkdtempSync(path.join(os.tmpdir(), 'unmanaged-test-'));

    expect(() => cleanupTestTempDir(unmanagedPath)).toThrow(
      `Refusing to cleanup unmanaged temp dir: ${path.resolve(unmanagedPath)}`
    );
    fs.rmSync(unmanagedPath, { recursive: true, force: true });
  });

  it('rejects prefixes with path segments', () => {
    expect(() => createTestTempDir('../bad-prefix-')).toThrow(
      'Temp dir prefix must not contain path segments: ../bad-prefix-'
    );
    expect(() => createTestTempDir('nested/bad-prefix-')).toThrow(
      'Temp dir prefix must not contain path segments: nested/bad-prefix-'
    );
  });
});
