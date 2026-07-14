import { describe, it, expect } from 'vitest';
import { generateNumericOtp, generateResetToken } from './otp';

describe('generateNumericOtp', () => {
  it('generates a 6-digit numeric string', () => {
    const otp = generateNumericOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('generates different codes across calls (not a fixed constant)', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateNumericOtp()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('generateResetToken', () => {
  it('generates a 64-char hex string (32 random bytes)', () => {
    const token = generateResetToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates different tokens across calls', () => {
    expect(generateResetToken()).not.toBe(generateResetToken());
  });
});
