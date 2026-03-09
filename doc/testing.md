# Testing Utilities

## Temporary Directory Helper

テストで一時ディレクトリを使う場合は `src/testHelpers/testTempDir.ts` を利用してください。

```ts
import { cleanupTestTempDir, createTestTempDir } from '../testHelpers/testTempDir';

let tempDir: string;

beforeEach(() => {
  tempDir = createTestTempDir('example-test-');
});

afterEach(() => {
  cleanupTestTempDir(tempDir);
});
```

## Notes

- `cleanupTestTempDir` は `createTestTempDir` で作成したディレクトリのみ削除します。
- 一時ディレクトリの後片付けは自動ではありません。`afterEach` などで明示的に呼んでください。
