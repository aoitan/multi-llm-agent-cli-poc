# Testing Utilities

## Temporary Directory Helper

テストで一時ディレクトリを使う場合は `src/testHelpers/testTempDir.ts` を利用してください。

```ts
// 例: src/__tests__/xxx.test.ts から利用する場合
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
- import パスはテストファイルの配置に応じて調整が必要です（上記例は `src/__tests__` 配下を前提）。
