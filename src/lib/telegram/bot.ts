export interface TelegramSendMessageOptions {
  chat_id: number | string;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_to_message_id?: number;
}

export class TelegramBotClient {
  private token: string;
  private baseUrl: string;

  constructor(token?: string) {
    this.token = token || process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
  }

  isConfigured(): boolean {
    return Boolean(this.token && this.token.includes(':') && !this.token.includes('dummy'));
  }

  async getMe() {
    if (!this.isConfigured()) {
      return { ok: false, description: 'TELEGRAM_BOT_TOKEN belum dikonfigurasi' };
    }
    const res = await fetch(`${this.baseUrl}/getMe`);
    return await res.json();
  }

  async setWebhook(url: string, secretToken?: string) {
    if (!this.isConfigured()) {
      return { ok: false, description: 'TELEGRAM_BOT_TOKEN belum dikonfigurasi' };
    }
    const payload: Record<string, unknown> = { url };
    if (secretToken) {
      payload.secret_token = secretToken;
    }
    const res = await fetch(`${this.baseUrl}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  async deleteWebhook() {
    if (!this.isConfigured()) return { ok: false };
    const res = await fetch(`${this.baseUrl}/deleteWebhook`);
    return await res.json();
  }

  async sendMessage(options: TelegramSendMessageOptions) {
    if (!this.isConfigured()) {
      console.warn('[TelegramBot] Simulating message send (token not set):', options.text);
      return { ok: true, simulated: true };
    }
    try {
      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      return await res.json();
    } catch (err) {
      console.error('[TelegramBot] Error sending message:', err);
      return { ok: false, error: String(err) };
    }
  }

  async getFile(fileId: string) {
    if (!this.isConfigured()) return null;
    const res = await fetch(`${this.baseUrl}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (!data.ok) return null;
    return `https://api.telegram.org/file/bot${this.token}/${data.result.file_path}`;
  }

  async downloadFileAsBuffer(fileUrl: string): Promise<Buffer | null> {
    try {
      const res = await fetch(fileUrl);
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      console.error('[TelegramBot] Error downloading file:', err);
      return null;
    }
  }
}

export const telegramBot = new TelegramBotClient();
