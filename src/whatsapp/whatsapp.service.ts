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
          type: 'text',
          text: { body: `Seu código de acesso Auto Prime: *${code}*. Válido por 5 minutos.` },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      this.logger.error('Failed to send OTP via WhatsApp', err?.message);
    }
  }
}
