/**
 * CPaaS Message Providers
 *
 * V1-05: Provider abstraction for sending messages.
 *
 * ## Providers
 *
 * - Email: SendGrid (simulated for demo)
 * - SMS: Twilio (simulated for demo)
 *
 * In production, these would integrate with actual provider APIs.
 *
 * @module lib/cpaas/providers
 */

// =============================================================================
// TYPES
// =============================================================================

export interface EmailInput {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
}

export interface SmsInput {
  to: string;
  body: string;
  from?: string;
}

export interface SendResult {
  success: boolean;
  providerId?: string;
  providerName?: string;
  error?: string;
  retryable?: boolean;
}

export type ProviderName = 'sendgrid' | 'twilio' | 'mock';

// =============================================================================
// PROVIDER SELECTION
// =============================================================================

/**
 * Get provider for a channel
 *
 * @param channel - Channel type (EMAIL, SMS)
 * @returns Provider name
 */
export function getProviderForChannel(channel: string): ProviderName {
  switch (channel) {
    case 'EMAIL':
      return process.env.SENDGRID_API_KEY ? 'sendgrid' : 'mock';
    case 'SMS':
      return process.env.TWILIO_ACCOUNT_SID ? 'twilio' : 'mock';
    default:
      return 'mock';
  }
}

// =============================================================================
// EMAIL PROVIDER
// =============================================================================

/**
 * Send email through provider
 *
 * @param input - Email input
 * @returns Send result
 */
export async function sendEmail(input: EmailInput): Promise<SendResult> {
  const provider = getProviderForChannel('EMAIL');

  if (provider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    return sendEmailViaSendGrid(input);
  }

  // Mock provider for demo/testing
  return sendEmailViaMock(input);
}

/**
 * Send email via SendGrid
 */
async function sendEmailViaSendGrid(input: EmailInput): Promise<SendResult> {
  try {
    // In production, this would use @sendgrid/mail
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // const msg = {
    //   to: input.to,
    //   from: input.from || 'noreply@schoolday.lausd.net',
    //   subject: input.subject,
    //   text: input.body,
    // };
    // const response = await sgMail.send(msg);

    // Simulated response for now
    const providerId = `sg_${generateId()}`;

    return {
      success: true,
      providerId,
      providerName: 'sendgrid',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SendGrid error';
    const retryable =
      message.includes('rate limit') ||
      message.includes('timeout') ||
      message.includes('503');

    return {
      success: false,
      error: message,
      retryable,
      providerName: 'sendgrid',
    };
  }
}

/**
 * Send email via mock provider (for demo/testing)
 */
async function sendEmailViaMock(input: EmailInput): Promise<SendResult> {
  // Simulate processing delay
  await sleep(50);

  // Simulate occasional failures for testing
  if (input.to.includes('invalid')) {
    return {
      success: false,
      error: 'Invalid recipient email',
      retryable: false,
      providerName: 'mock',
    };
  }

  const providerId = `mock_${generateId()}`;

  return {
    success: true,
    providerId,
    providerName: 'mock',
  };
}

// =============================================================================
// SMS PROVIDER
// =============================================================================

/**
 * Send SMS through provider
 *
 * @param input - SMS input
 * @returns Send result
 */
export async function sendSms(input: SmsInput): Promise<SendResult> {
  const provider = getProviderForChannel('SMS');

  if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID) {
    return sendSmsViaTwilio(input);
  }

  // Mock provider for demo/testing
  return sendSmsViaMock(input);
}

/**
 * Send SMS via Twilio
 */
async function sendSmsViaTwilio(input: SmsInput): Promise<SendResult> {
  try {
    // In production, this would use twilio
    // const client = require('twilio')(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN
    // );
    // const message = await client.messages.create({
    //   body: input.body,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: input.to,
    // });

    // Simulated response for now
    const providerId = `twilio_${generateId()}`;

    return {
      success: true,
      providerId,
      providerName: 'twilio',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Twilio error';
    const retryable =
      message.includes('rate limit') ||
      message.includes('timeout') ||
      message.includes('503');

    return {
      success: false,
      error: message,
      retryable,
      providerName: 'twilio',
    };
  }
}

/**
 * Send SMS via mock provider (for demo/testing)
 */
async function sendSmsViaMock(input: SmsInput): Promise<SendResult> {
  // Simulate processing delay
  await sleep(50);

  // Simulate occasional failures for testing
  if (input.to.includes('invalid')) {
    return {
      success: false,
      error: 'Invalid phone number',
      retryable: false,
      providerName: 'mock',
    };
  }

  const providerId = `mock_${generateId()}`;

  return {
    success: true,
    providerId,
    providerName: 'mock',
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate a random ID
 */
function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
