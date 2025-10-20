# タスク: 型安全性の改善

## 概要
any型の使用を削減し、厳密な型定義を導入してコンパイル時エラー検出を強化します。

## 背景 / きっかけ
- `src/utils/promptLoader.ts:L50-L57`でany型の不適切な使用
- `src/utils/workflowLoader.ts:L53`での型チェック不足
- 実行時エラーの原因となる型安全性の欠如

## 実装内容
- [ ] any型の置き換え（具体的な型定義）
- [ ] 厳密な型ガードの実装
- [ ] ジェネリクスを活用した型安全な関数定義
- [ ] TSConfigの厳密性向上（strict: true, noImplicitAny: true）
- [ ] 型定義ファイルの整備

## 受け入れ条件
- [ ] any型の使用が必要最小限に削減される
- [ ] コンパイル時に型エラーが検出される
- [ ] 型ガードが適切に実装される
- [ ] IDEでの型補完が正常に機能する
- [ ] 型関連のテストが追加される

## 優先度
Medium - 開発効率向上

## 作業工数見積もり
3-4 時間

## 関連ファイル
- `src/utils/promptLoader.ts`
- `src/utils/workflowLoader.ts`
- `src/utils/configLoader.ts`
- `tsconfig.json`
- `src/types/` (新規: 型定義ファイル)

## 改善対象
```typescript
// Before
let parsedContent: any;

// After  
interface ConfigSchema {
  workflows: Record<string, WorkflowDefinition>;
}
let parsedContent: ConfigSchema;
```

## 関連タスク
- task_10_2_1 (エージェントモジュール責任分離)
- task_11_1_3 (異常系テスト拡充)