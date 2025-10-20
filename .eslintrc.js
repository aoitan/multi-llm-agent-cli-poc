module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  rules: {
    // 段階的導入のため、まずは警告レベルに
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'no-undef': 'error',
    'no-constant-condition': 'warn',
    'no-useless-catch': 'warn',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
  ],
  globals: {
    // Jest globals
    'describe': 'readonly',
    'it': 'readonly',
    'test': 'readonly',
    'expect': 'readonly',
    'beforeEach': 'readonly',
    'afterEach': 'readonly',
    'beforeAll': 'readonly',
    'afterAll': 'readonly',
    'fail': 'readonly',
  }
};