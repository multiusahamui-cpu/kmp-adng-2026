import { describe, it, expect } from 'vitest';
import { isAllowedImage } from './imageSignature';

describe('isAllowedImage', () => {
  it('accepts a real JPEG signature', () => {
    expect(isAllowedImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]))).toBe(true);
  });

  it('accepts a real PNG signature', () => {
    expect(isAllowedImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
  });

  it('accepts a real GIF89a signature', () => {
    expect(isAllowedImage(Buffer.from('GIF89a', 'ascii'))).toBe(true);
  });

  it('accepts a real WEBP signature (RIFF....WEBP)', () => {
    const buf = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]), // file size field, irrelevant to the check
      Buffer.from('WEBP', 'ascii'),
    ]);
    expect(isAllowedImage(buf)).toBe(true);
  });

  it('rejects a file whose extension lies about its content (e.g. a script renamed to .png)', () => {
    const fakePng = Buffer.from('<?php system($_GET["c"]); ?>', 'ascii');
    expect(isAllowedImage(fakePng)).toBe(false);
  });

  it('rejects an empty buffer', () => {
    expect(isAllowedImage(Buffer.alloc(0))).toBe(false);
  });

  it('rejects a buffer shorter than the signature it almost matches', () => {
    expect(isAllowedImage(Buffer.from([0xff, 0xd8]))).toBe(false); // truncated JPEG marker
  });
});
