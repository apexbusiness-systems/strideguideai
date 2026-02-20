import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateInput, sanitizers } from '@/utils/ValidationSchemas';

describe('validateInput', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().min(18),
  });

  const validator = validateInput(schema);

  it('should return data when validation succeeds', () => {
    const data = { name: 'John Doe', age: 25 };
    expect(validator(data)).toEqual(data);
  });

  it('should throw formatted error when validation fails', () => {
    const data = { name: '', age: 15 };
    try {
      validator(data);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const message = (error as Error).message;
      expect(message).toContain('Validation failed:');

      const issuesStr = message.replace('Validation failed: ', '');
      const issues = JSON.parse(issuesStr);
      expect(issues).toHaveLength(2);
      expect(issues).toContainEqual({ field: 'name', message: 'String must contain at least 1 character(s)' });
      expect(issues).toContainEqual({ field: 'age', message: 'Number must be greater than or equal to 18' });
    }
  });

  it('should handle nested path issues', () => {
    const nestedSchema = z.object({
      user: z.object({
        email: z.string().email(),
      }),
    });
    const nestedValidator = validateInput(nestedSchema);
    const data = { user: { email: 'invalid-email' } };

    try {
      nestedValidator(data);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      const message = (error as Error).message;
      const issues = JSON.parse(message.replace('Validation failed: ', ''));
      expect(issues[0].field).toBe('user.email');
    }
  });

  it('should re-throw non-Zod errors', () => {
    const errorSchema = {
      parse: () => {
        throw new Error('Some other error');
      },
      // Adding safeParse and other methods to satisfy ZodSchema type if necessary,
      // but cast to any is easier for a mock
    } as any;

    const errorValidator = validateInput(errorSchema);
    expect(() => errorValidator({})).toThrow('Some other error');
  });
});

describe('sanitizers', () => {
  describe('sanitizeText', () => {
    it('should remove scripts and HTML tags', () => {
      const input = '<script>alert("xss")</script><p>Hello</p><img src="x" onerror="alert(1)">';
      const output = sanitizers.sanitizeText(input);
      expect(output).toBe('Hello');
    });

    it('should remove javascript: and onEvent attributes', () => {
      const input = 'Click <a href="javascript:alert(1)">here</a><div onclick="evil()"></div>';
      const output = sanitizers.sanitizeText(input);
      // Note: <a href="...">here</a> -> <a>here</a> is removed by the tag stripper but "here" remains
      // Wait, let's check: .replace(/<[^>]*>/g, '') removes all tags.
      expect(output).toBe('Click here');
    });
  });

  describe('encodeForUrl', () => {
    it('should correctly encode strings', () => {
      expect(sanitizers.encodeForUrl('hello world')).toBe('hello%20world');
      expect(sanitizers.encodeForUrl('a&b=c')).toBe('a%26b%3Dc');
    });
  });

  describe('sanitizePhoneNumber', () => {
    it('should remove invalid characters', () => {
      expect(sanitizers.sanitizePhoneNumber('+1 (555) 123-4567 ext. 8')).toBe('+1 (555) 123-4567  8');
    });

    it('should keep valid phone characters', () => {
      const input = '+1 (555) 123-4567';
      expect(sanitizers.sanitizePhoneNumber(input)).toBe(input);
    });
  });

  describe('sanitizeForLogging', () => {
    it('should mask emails', () => {
      const input = 'Contact us at support@example.com for help.';
      expect(sanitizers.sanitizeForLogging(input)).toBe('Contact us at [EMAIL] for help.');
    });

    it('should mask phone numbers', () => {
      const input = 'Call 555-123-4567 today.';
      expect(sanitizers.sanitizeForLogging(input)).toBe('Call [PHONE] today.');
    });

    it('should mask card numbers', () => {
      const input = 'My card is 1234-5678-9012-3456.';
      expect(sanitizers.sanitizeForLogging(input)).toBe('My card is [CARD].');
    });

    it('should return non-string data as is', () => {
      const data = { key: 'value' };
      expect(sanitizers.sanitizeForLogging(data)).toBe(data);
    });
  });
});
