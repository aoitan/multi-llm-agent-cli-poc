import { fillTemplate } from '../agent';

describe('fillTemplate', () => {
  test('should correctly replace a single placeholder', () => {
    const template = 'Hello, ${name}!';
    const variables = { name: 'World' };
    expect(fillTemplate(template, variables)).toBe('Hello, World!');
  });

  test('should correctly replace multiple placeholders', () => {
    const template = 'Hello, ${firstName} ${lastName}!';
    const variables = { firstName: 'John', lastName: 'Doe' };
    expect(fillTemplate(template, variables)).toBe('Hello, John Doe!');
  });

  test('should ignore placeholders that do not exist in variables', () => {
    const template = 'Hello, ${name}! Your age is ${age}.';
    const variables = { name: 'World' };
    expect(fillTemplate(template, variables)).toBe('Hello, World! Your age is ${age}.');
  });

  test('should handle empty template string', () => {
    const template = '';
    const variables = { name: 'World' };
    expect(fillTemplate(template, variables)).toBe('');
  });

  test('should handle empty variables object', () => {
    const template = 'Hello, ${name}!';
    const variables = {};
    expect(fillTemplate(template, variables)).toBe('Hello, ${name}!');
  });

  test('should correctly replace placeholders with special characters in values', () => {
    const template = 'Path: ${path}';
    const variables = { path: '/usr/local/bin/test.sh' };
    expect(fillTemplate(template, variables)).toBe('Path: /usr/local/bin/test.sh');
  });

  test('should handle template with no placeholders', () => {
    const template = 'This is a plain string.';
    const variables = { name: 'World' };
    expect(fillTemplate(template, variables)).toBe('This is a plain string.');
  });
});
