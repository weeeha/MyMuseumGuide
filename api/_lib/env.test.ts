import { afterEach, describe, expect, it } from 'vitest';
import { requireEnv } from './env';

describe('requireEnv', () => {
  afterEach(() => {
    delete process.env.R1_TEST_VAR;
  });

  it('returns the value when set', () => {
    process.env.R1_TEST_VAR = 'abc';
    expect(requireEnv('R1_TEST_VAR')).toBe('abc');
  });

  it('throws a clear message when missing', () => {
    expect(() => requireEnv('R1_TEST_VAR')).toThrow(
      'Missing required environment variable: R1_TEST_VAR',
    );
  });
});
