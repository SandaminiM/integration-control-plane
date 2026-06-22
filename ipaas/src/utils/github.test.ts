import { describe, it, expect } from 'vitest';
import { parseGitHubUrl } from './github';

describe('parseGitHubUrl', () => {
  it('parses a standard HTTPS URL', () => {
    expect(parseGitHubUrl('https://github.com/wso2/my-repo')).toEqual({ org: 'wso2', repo: 'my-repo' });
  });

  it('strips .git suffix', () => {
    expect(parseGitHubUrl('https://github.com/wso2/my-repo.git')).toEqual({ org: 'wso2', repo: 'my-repo' });
  });

  it('trims surrounding whitespace', () => {
    expect(parseGitHubUrl('  https://github.com/wso2/my-repo  ')).toEqual({ org: 'wso2', repo: 'my-repo' });
  });

  it('is case-insensitive for the domain', () => {
    expect(parseGitHubUrl('HTTPS://GITHUB.COM/wso2/my-repo')).toEqual({ org: 'wso2', repo: 'my-repo' });
  });

  it('returns null for SSH URLs', () => {
    expect(parseGitHubUrl('git@github.com:wso2/my-repo.git')).toBeNull();
  });

  it('returns null for non-GitHub URLs', () => {
    expect(parseGitHubUrl('https://gitlab.com/wso2/my-repo')).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(parseGitHubUrl('')).toBeNull();
    expect(parseGitHubUrl('not-a-url')).toBeNull();
    expect(parseGitHubUrl('https://github.com/onlyone')).toBeNull();
  });
});
