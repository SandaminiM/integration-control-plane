import { describe, it, expect } from 'vitest';
import { capitalize, toCamelCase, toHandler, formatRepoNameToDisplayName, toProjectHandler } from './string';

describe('capitalize', () => {
  it('uppercases the first character', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world foo')).toBe('World foo');
  });

  it('leaves already-capitalized strings unchanged', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('toCamelCase', () => {
  it('converts space-separated words', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld');
    expect(toCamelCase('foo bar baz')).toBe('fooBarBaz');
  });

  it('converts hyphen-separated words', () => {
    expect(toCamelCase('hello-world')).toBe('helloWorld');
  });

  it('converts underscore-separated words', () => {
    expect(toCamelCase('hello_world')).toBe('helloWorld');
  });

  it('lowercases first word entirely', () => {
    expect(toCamelCase('HELLO world')).toBe('helloWorld');
  });

  it('handles single word', () => {
    expect(toCamelCase('hello')).toBe('hello');
  });
});

describe('toHandler', () => {
  it('lowercases and replaces non-alphanumeric runs with a hyphen', () => {
    expect(toHandler('My Project 123')).toBe('my-project-123');
    expect(toHandler('Hello  World')).toBe('hello-world');
  });

  it('strips leading and trailing hyphens', () => {
    expect(toHandler('  hello  ')).toBe('hello');
    expect(toHandler('!hello!')).toBe('hello');
  });

  it('collapses multiple separators into one hyphen', () => {
    expect(toHandler('a---b')).toBe('a-b');
  });
});

describe('formatRepoNameToDisplayName', () => {
  it('replaces hyphens with spaces and title-cases each word', () => {
    expect(formatRepoNameToDisplayName('my-project')).toBe('My Project');
    expect(formatRepoNameToDisplayName('hello-world-foo')).toBe('Hello World Foo');
  });

  it('leaves names without hyphens capitalized correctly', () => {
    expect(formatRepoNameToDisplayName('myproject')).toBe('Myproject');
  });
});

describe('toProjectHandler', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(toProjectHandler('My Project', 50)).toBe('my-project');
  });

  it('strips special characters', () => {
    expect(toProjectHandler('My Project!', 50)).toBe('my-project');
  });

  it('respects maxLength', () => {
    expect(toProjectHandler('abcde', 3)).toBe('abc');
  });

  it('strips leading and trailing hyphens after truncation', () => {
    // After truncation trailing hyphens from spaces should be removed
    expect(toProjectHandler('ab cd', 3)).toBe('ab');
  });
});
