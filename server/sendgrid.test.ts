import { describe, it, expect, beforeAll } from 'vitest';
import sgMail from '@sendgrid/mail';

describe('SendGrid Integration', () => {
  beforeAll(() => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }
    sgMail.setApiKey(apiKey);
  });

  it('should validate SendGrid API key is configured', () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^SG\./);
  });

  it('should validate SENDGRID_FROM_EMAIL is configured', () => {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    expect(fromEmail).toBeDefined();
    expect(fromEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it('should have valid SendGrid configuration', async () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    expect(apiKey).toBeTruthy();
    expect(fromEmail).toBeTruthy();
    expect(apiKey).toMatch(/^SG\./);
    expect(fromEmail).toMatch(/@/);
  });
});
