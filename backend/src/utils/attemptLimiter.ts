// Keyed-by-identity failure tracker (login identifier, user id, ...) — NOT keyed by
// endpoint/IP, so many different legitimate users hitting the same route never
// affects each other. Only failed attempts count; a success clears the record.
//
// In-memory, single-process. Fine for this app's current single-instance deploy
// (see CICD.md); if this ever runs as multiple instances behind a load balancer,
// this needs to move to a shared store (Redis/DB) so lockouts are consistent
// across instances.

interface AttemptRecord {
  failures: number;
  lockedUntil?: number;
}

export interface LimiterOptions {
  maxAttempts: number;
  lockoutMs: number;
}

export interface LockStatus {
  locked: boolean;
  retryAfterSeconds: number;
}

const store = new Map<string, AttemptRecord>();

const NOT_LOCKED: LockStatus = { locked: false, retryAfterSeconds: 0 };

export function checkLock(key: string): LockStatus {
  const record = store.get(key);
  if (!record?.lockedUntil) return NOT_LOCKED;

  const remainingMs = record.lockedUntil - Date.now();
  if (remainingMs <= 0) {
    store.delete(key);
    return NOT_LOCKED;
  }

  return { locked: true, retryAfterSeconds: Math.ceil(remainingMs / 1000) };
}

export function recordFailure(key: string, options: LimiterOptions): LockStatus {
  const record = store.get(key) ?? { failures: 0 };
  record.failures += 1;

  if (record.failures >= options.maxAttempts) {
    record.lockedUntil = Date.now() + options.lockoutMs;
    record.failures = 0;
    store.set(key, record);
    return { locked: true, retryAfterSeconds: Math.ceil(options.lockoutMs / 1000) };
  }

  store.set(key, record);
  return NOT_LOCKED;
}

export function recordSuccess(key: string): void {
  store.delete(key);
}
