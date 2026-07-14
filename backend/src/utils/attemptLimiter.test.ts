import { describe, it, expect, vi, afterEach } from 'vitest';
import { checkLock, recordFailure, recordSuccess } from './attemptLimiter';

const OPTIONS = { maxAttempts: 3, lockoutMs: 60_000 };

afterEach(() => {
  vi.useRealTimers();
});

describe('attemptLimiter', () => {
  it('does not lock before maxAttempts is reached', () => {
    const key = `test:${Math.random()}`;

    expect(recordFailure(key, OPTIONS).locked).toBe(false);
    expect(recordFailure(key, OPTIONS).locked).toBe(false);
    expect(checkLock(key).locked).toBe(false);
  });

  it('locks on the Nth failure and reports retryAfterSeconds', () => {
    const key = `test:${Math.random()}`;

    recordFailure(key, OPTIONS);
    recordFailure(key, OPTIONS);
    const result = recordFailure(key, OPTIONS);

    expect(result.locked).toBe(true);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(checkLock(key).locked).toBe(true);
  });

  it('does not let a locked key keep accepting attempts to reset the window indefinitely', () => {
    const key = `test:${Math.random()}`;

    recordFailure(key, OPTIONS);
    recordFailure(key, OPTIONS);
    recordFailure(key, OPTIONS); // locked here
    expect(checkLock(key).locked).toBe(true);
  });

  it('recordSuccess clears the failure count for that identity only', () => {
    const key = `test:${Math.random()}`;
    const otherKey = `test:${Math.random()}`;

    recordFailure(key, OPTIONS);
    recordFailure(key, OPTIONS);
    recordFailure(otherKey, OPTIONS); // different identity, independent counter

    recordSuccess(key);

    // key was reset, so it takes a fresh maxAttempts failures to lock again
    expect(recordFailure(key, OPTIONS).locked).toBe(false);
    expect(recordFailure(key, OPTIONS).locked).toBe(false);

    // otherKey's single prior failure is untouched by key's recordSuccess
    expect(checkLock(otherKey).locked).toBe(false);
  });

  it('unlocks automatically once the lockout window elapses', () => {
    vi.useFakeTimers();
    const key = `test:${Math.random()}`;

    recordFailure(key, OPTIONS);
    recordFailure(key, OPTIONS);
    recordFailure(key, OPTIONS); // locked

    expect(checkLock(key).locked).toBe(true);

    vi.advanceTimersByTime(OPTIONS.lockoutMs + 1);

    expect(checkLock(key).locked).toBe(false);
  });
});
