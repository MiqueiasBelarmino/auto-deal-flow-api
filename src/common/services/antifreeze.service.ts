import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AntifreezeService implements OnModuleInit {
  private readonly logger = new Logger(AntifreezeService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.startKeepAlive();
  }

  private startKeepAlive() {
    // Render populates RENDER_EXTERNAL_URL automatically.
    // If not set, we can use a custom ANTIFREEZE_URL or fall back to the production URL.
    const renderUrl = process.env.RENDER_EXTERNAL_URL;
    const customUrl = this.configService.get<string>('ANTIFREEZE_URL');
    const fallbackUrl = 'https://auto-deal-flow-api.onrender.com';

    let baseUrl = renderUrl || customUrl || fallbackUrl;

    // Avoid running this in local development unless explicitly configured
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    const forceEnable = this.configService.get<string>('ENABLE_ANTIFREEZE') === 'true';

    if (nodeEnv === 'development' && !forceEnable) {
      this.logger.log('Antifreeze keep-alive is disabled in local development mode.');
      return;
    }

    // Standardize URL to endpoint
    // Trim trailing slash from baseUrl if exists
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // If baseUrl doesn't contain api path, append it
    const pingUrl = baseUrl.includes('/api/v1')
      ? `${baseUrl}/vehicles/catalog`
      : `${baseUrl}/api/v1/vehicles/catalog`;

    this.logger.log(`Antifreeze keep-alive service initialized. Target URL: ${pingUrl}`);

    // Ping every 5 minutes (300,000 ms) to comfortably beat the 15-minute Render timeout
    const intervalMs = 5 * 60 * 1000;

    // Ping immediately on boot to make sure it functions (with a tiny delay to ensure server is listening)
    setTimeout(() => {
      this.ping(pingUrl);
    }, 5000);

    setInterval(() => {
      this.ping(pingUrl);
    }, intervalMs);
  }

  private async ping(url: string) {
    try {
      this.logger.log(`[Antifreeze] Sending keep-alive ping to ${url}...`);
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'NestJS-Antifreeze-Service' },
        timeout: 15000, // 15s timeout
      });
      this.logger.log(`[Antifreeze] Ping successful! Status: ${response.status}`);
    } catch (error) {
      this.logger.error(
        `[Antifreeze] Ping failed: ${error.message}${
          error.response ? ` (Status: ${error.response.status})` : ''
        }`,
      );
    }
  }
}
