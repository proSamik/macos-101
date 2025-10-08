const USEPLUNK_BASE_URL = 'https://api.useplunk.com/v1';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  subscribed?: boolean;
  name?: string;
  from?: string;
  reply?: string;
  headers?: Record<string, string>;
  attachments?: Record<string, unknown>;
}

interface SendEmailResponse {
  success: boolean;
  emails: Array<{
    email: string;
    contact: string;
  }>;
  timestamp: string;
}

interface TrackEventParams {
  event: string;
  email: string;
  subscribed?: boolean;
  data?: Record<string, unknown>;
}

interface TrackEventResponse {
  success: boolean;
  contact: string;
  event: string;
  timestamp: string;
}

class UsePlunkClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.USEPLUNK_API_KEY || '';
    this.baseUrl = USEPLUNK_BASE_URL;
    
    if (!this.apiKey) {
      throw new Error('UsePlunk API key is required. Set USEPLUNK_API_KEY environment variable.');
    }
  }

  private async makeRequest<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`UsePlunk API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async sendTransactionalEmail(params: SendEmailParams): Promise<SendEmailResponse> {
    return this.makeRequest<SendEmailResponse>('/send', params);
  }

  async trackEvent(params: TrackEventParams): Promise<TrackEventResponse> {
    return this.makeRequest<TrackEventResponse>('/track', params);
  }
}

export const usePlunk = new UsePlunkClient();

export { UsePlunkClient };
export type { SendEmailParams, SendEmailResponse, TrackEventParams, TrackEventResponse };