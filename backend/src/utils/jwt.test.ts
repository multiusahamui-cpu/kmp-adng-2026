import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from './jwt';

describe('jwt', () => {
  it('round-trips a payload through generateToken/verifyToken', () => {
    const token = generateToken({ id: 'user-1', role: 'member' });
    const decoded = verifyToken(token) as { id: string; role: string };

    expect(decoded.id).toBe('user-1');
    expect(decoded.role).toBe('member');
  });

  it('rejects a tampered token', () => {
    const token = generateToken({ id: 'user-1' });
    const tampered = token.slice(0, -2) + 'xx';

    expect(() => verifyToken(tampered)).toThrow();
  });
});
