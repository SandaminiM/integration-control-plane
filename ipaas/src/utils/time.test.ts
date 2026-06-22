import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAge, formatDistanceToNow } from './time';

describe('getAge', () => {
  it('returns empty string when to is before from', () => {
    expect(getAge(1000, 500)).toBe('');
  });

  it('returns "just now" for sub-minute diff', () => {
    expect(getAge(0, 30_000)).toBe('just now');
  });

  it('returns minutes', () => {
    expect(getAge(0, 5 * 60_000)).toBe('5 minutes');
    expect(getAge(0, 60_000)).toBe('1 minute');
  });

  it('returns hours', () => {
    expect(getAge(0, 3 * 3_600_000)).toBe('3 hours');
    expect(getAge(0, 3_600_000)).toBe('1 hour');
  });

  it('returns days', () => {
    expect(getAge(0, 3 * 86_400_000)).toBe('3 days');
    expect(getAge(0, 86_400_000)).toBe('1 day');
  });

  it('returns singular month', () => {
    // 60 days / 30.44 = 1.97 → 1 month
    expect(getAge(0, 60 * 86_400_000)).toBe('1 month');
  });

  it('returns plural months', () => {
    // 61 days / 30.44 = 2.003 → 2 months
    expect(getAge(0, 61 * 86_400_000)).toBe('2 months');
  });

  it('returns years', () => {
    expect(getAge(0, 400 * 86_400_000)).toBe('1 year');
    expect(getAge(0, 800 * 86_400_000)).toBe('2 years');
  });
});

describe('formatDistanceToNow', () => {
  const NOW = new Date('2026-06-22T12:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for less than a minute ago', () => {
    const date = new Date(NOW - 30_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('Just now');
  });

  it('returns minutes ago', () => {
    const date = new Date(NOW - 45 * 60_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('45 min ago');
  });

  it('returns singular hour ago', () => {
    const date = new Date(NOW - 3_600_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('1 hour ago');
  });

  it('returns plural hours ago', () => {
    const date = new Date(NOW - 5 * 3_600_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('5 hours ago');
  });

  it('returns singular day ago', () => {
    const date = new Date(NOW - 86_400_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('1 day ago');
  });

  it('returns plural days ago', () => {
    const date = new Date(NOW - 3 * 86_400_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('3 days ago');
  });
});
