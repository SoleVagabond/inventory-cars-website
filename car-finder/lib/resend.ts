const RESEND_API_URL = 'https://api.resend.com/emails';

type ResendSendOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

class ResendClient {
  constructor(private readonly apiKey: string, private readonly defaultFrom: string) {}

  async send(options: ResendSendOptions) {
    const payload = {
      from: options.from ?? this.defaultFrom,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Resend API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return response.json();
  }
}

let client: ResendClient | null = null;

export function getResendClient() {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set.');
    }
    if (!fromEmail) {
      throw new Error('RESEND_FROM_EMAIL is not set.');
    }

    client = new ResendClient(apiKey, fromEmail);
  }

  return client;
}

export type { ResendSendOptions };
