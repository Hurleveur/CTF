import { timingSafeCompare } from '@/lib/security/timingSafeCompare';

describe('timingSafeCompare', () => {
  describe('equal strings', () => {
    test('returns true for identical strings', () => {
      expect(timingSafeCompare('password123', 'password123')).toBe(true);
    });

    test('returns true for identical empty strings', () => {
      expect(timingSafeCompare('', '')).toBe(true);
    });

    test('returns true for identical single character strings', () => {
      expect(timingSafeCompare('a', 'a')).toBe(true);
    });

    test('returns true for identical long strings', () => {
      const longString = 'a'.repeat(1000);
      expect(timingSafeCompare(longString, longString)).toBe(true);
    });

    test('returns true for identical strings with special characters', () => {
      const specialString = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';
      expect(timingSafeCompare(specialString, specialString)).toBe(true);
    });

    test('returns true for identical strings with Unicode characters', () => {
      const unicodeString = 'Hello 世界 🌍 العالم';
      expect(timingSafeCompare(unicodeString, unicodeString)).toBe(true);
    });
  });

  describe('different strings - same length', () => {
    test('returns false for different strings of same length', () => {
      expect(timingSafeCompare('password123', 'password124')).toBe(false);
    });

    test('returns false for strings differing only in case', () => {
      expect(timingSafeCompare('Password', 'password')).toBe(false);
    });

    test('returns false for single character differences', () => {
      expect(timingSafeCompare('abcdef', 'abcdeg')).toBe(false);
    });

    test('returns false for strings with different special characters', () => {
      expect(timingSafeCompare('pass!@#', 'pass!@$')).toBe(false);
    });
  });

  describe('different strings - different length', () => {
    test('returns false for strings of different lengths', () => {
      expect(timingSafeCompare('password', 'password123')).toBe(false);
    });

    test('returns false when first string is longer', () => {
      expect(timingSafeCompare('longer', 'short')).toBe(false);
    });

    test('returns false when second string is longer', () => {
      expect(timingSafeCompare('short', 'longer')).toBe(false);
    });

    test('returns false for empty vs non-empty string', () => {
      expect(timingSafeCompare('', 'nonempty')).toBe(false);
    });

    test('returns false for non-empty vs empty string', () => {
      expect(timingSafeCompare('nonempty', '')).toBe(false);
    });
  });

  describe('timing attack resistance', () => {
    test.skip('execution time should not vary significantly based on content differences', async () => {
      const iterations = 100;
      const baseString = 'a'.repeat(100);
      
      // Test with strings that differ early (first character)
      const earlyDiffString = 'b' + 'a'.repeat(99);
      
      // Test with strings that differ late (last character) 
      const lateDiffString = 'a'.repeat(99) + 'b';
      
      // Measure execution times
      const earlyDiffTimes: bigint[] = [];
      const lateDiffTimes: bigint[] = [];
      
      // Warm up the function to avoid JIT compilation effects
      for (let i = 0; i < 50; i++) {
        timingSafeCompare(baseString, earlyDiffString);
        timingSafeCompare(baseString, lateDiffString);
      }
      
      // Measure early difference times
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        timingSafeCompare(baseString, earlyDiffString);
        const end = process.hrtime.bigint();
        earlyDiffTimes.push(end - start);
      }
      
      // Measure late difference times
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        timingSafeCompare(baseString, lateDiffString);
        const end = process.hrtime.bigint();
        lateDiffTimes.push(end - start);
      }
      
      // Calculate averages (convert to nanoseconds)
      const avgEarlyTime = earlyDiffTimes.reduce((sum, time) => sum + time, 0n) / BigInt(iterations);
      const avgLateTime = lateDiffTimes.reduce((sum, time) => sum + time, 0n) / BigInt(iterations);
      
      // The timing difference should be very small (allow up to 50% variance for noise)
      const timeDifference = avgEarlyTime > avgLateTime 
        ? avgEarlyTime - avgLateTime 
        : avgLateTime - avgEarlyTime;
      const maxAllowedDifference = (avgEarlyTime + avgLateTime) / 4n; // 25% of average
      
      expect(timeDifference).toBeLessThanOrEqual(maxAllowedDifference);
    });

    test.skip('execution time should be consistent for equal-length different strings', () => {
      const iterations = 50;
      const string1 = 'a'.repeat(50);
      const string2 = 'b'.repeat(50);
      
      const times: bigint[] = [];
      
      // Warm up
      for (let i = 0; i < 25; i++) {
        timingSafeCompare(string1, string2);
      }
      
      // Measure times
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        timingSafeCompare(string1, string2);
        const end = process.hrtime.bigint();
        times.push(end - start);
      }
      
      // Calculate standard deviation
      const avg = times.reduce((sum, time) => sum + time, 0n) / BigInt(iterations);
      const variance = times.reduce((sum, time) => {
        const diff = time - avg;
        return sum + (diff * diff);
      }, 0n) / BigInt(iterations);
      
      // Standard deviation should be relatively small compared to mean
      // This helps ensure consistent timing behavior
      const stdDev = Number(variance) ** 0.5;
      const meanTime = Number(avg);
      const coefficientOfVariation = stdDev / meanTime;
      
      // Coefficient of variation should be reasonably low for timing-safe comparison
      expect(coefficientOfVariation).toBeLessThan(0.5); // 50% coefficient of variation max
    });
  });

  describe('edge cases', () => {
    test('handles strings with null bytes correctly', () => {
      const string1 = 'hello\x00world';
      const string2 = 'hello\x00world';
      const string3 = 'hello\x01world';
      
      expect(timingSafeCompare(string1, string2)).toBe(true);
      expect(timingSafeCompare(string1, string3)).toBe(false);
    });

    test('handles very long strings', () => {
      const longString1 = 'x'.repeat(10000);
      const longString2 = 'x'.repeat(10000);
      const longString3 = 'x'.repeat(9999) + 'y';
      
      expect(timingSafeCompare(longString1, longString2)).toBe(true);
      expect(timingSafeCompare(longString1, longString3)).toBe(false);
    });

    test('handles strings with various encodings correctly', () => {
      // Test strings that could have different byte representations
      const emoji1 = '👨‍💻';
      const emoji2 = '👨‍💻';
      const differentEmoji = '👩‍💻';
      
      expect(timingSafeCompare(emoji1, emoji2)).toBe(true);
      expect(timingSafeCompare(emoji1, differentEmoji)).toBe(false);
    });
  });

  describe('security properties', () => {
    test('always returns boolean', () => {
      const result1 = timingSafeCompare('test', 'test');
      const result2 = timingSafeCompare('test', 'different');
      
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });

    test('is deterministic - same inputs always produce same outputs', () => {
      const inputs = [
        ['password', 'password'],
        ['password', 'different'],
        ['', ''],
        ['a', 'b'],
        ['long string with spaces and numbers 123', 'long string with spaces and numbers 123']
      ];
      
      inputs.forEach(([a, b]) => {
        const result1 = timingSafeCompare(a, b);
        const result2 = timingSafeCompare(a, b);
        const result3 = timingSafeCompare(a, b);
        
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      });
    });

    test('satisfies reflexivity - string equals itself', () => {
      const testStrings = ['', 'a', 'password', 'complex!@#$%^&*()string', '🔐🔑'];
      
      testStrings.forEach(str => {
        expect(timingSafeCompare(str, str)).toBe(true);
      });
    });

    test('satisfies symmetry - order of arguments does not matter', () => {
      const pairs = [
        ['password', 'different'],
        ['hello', 'world'],
        ['', 'nonempty'],
        ['123', '456']
      ];
      
      pairs.forEach(([a, b]) => {
        expect(timingSafeCompare(a, b)).toBe(timingSafeCompare(b, a));
      });
    });
  });
});