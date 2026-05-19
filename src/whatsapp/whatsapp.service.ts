import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private configService: ConfigService) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const token = this.configService.get<string>('WHATSAPP_TOKEN');
    const phoneId = this.configService.get<string>('WHATSAPP_PHONE_ID');
    const apiUrl = this.configService.get<string>('WHATSAPP_API_URL');

    if (!token || !phoneId || !apiUrl) {
      this.logger.warn('WhatsApp config missing — OTP not sent (dev mode)');
      this.logger.debug(`[DEV] OTP for ${phone}: ${code}`);
      return;
    }

    try {
      await axios.post(
        `${apiUrl}/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: 'account_confirm_entrega_hub',
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: code }],
              },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [{ type: 'text', text: code }],
              }
            ],
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      this.logger.error('Failed to send OTP via WhatsApp', err?.message);
    }
  }

  async sendNotification(phone: string, templateName: string, parameters: string[]): Promise<void> {
    const token = this.configService.get<string>('WHATSAPP_TOKEN');
    const phoneId = this.configService.get<string>('WHATSAPP_PHONE_ID');
    const apiUrl = this.configService.get<string>('WHATSAPP_API_URL');

    if (!token || !phoneId || !apiUrl) {
      this.logger.warn('WhatsApp config missing — Notification not sent (dev mode)');
      this.logger.debug(`[DEV] Notif for ${phone} | Template: ${templateName} | Params: ${parameters.join(', ')}`);
      return;
    }

    try {
      await axios.post(
        `${apiUrl}/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: parameters.map(p => ({ type: 'text', text: p })),
              },
            ],
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      this.logger.error('Failed to send notification via WhatsApp', err?.response?.data || err?.message);
    }
  }
}
