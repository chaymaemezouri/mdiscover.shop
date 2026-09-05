import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private apiKey: string | undefined;
  private from: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get('RESEND_API_KEY');
    this.from = config.get('EMAIL_FROM', 'noreply@mdiscover.ma');
  }

  async send(options: EmailOptions): Promise<void> {
    if (!this.apiKey) {
      this.logger.log(`[EMAIL DEV] To: ${options.to} | Subject: ${options.subject}`);
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!res.ok) {
      this.logger.error(`Email failed: ${await res.text()}`);
    }
  }

  async sendOrderConfirmation(email: string, orderNumber: string, total: number) {
    await this.send({
      to: email,
      subject: `Confirmation commande ${orderNumber}`,
      html: `
        <h1>Merci pour votre commande !</h1>
        <p>Votre commande <strong>${orderNumber}</strong> a bien été enregistrée.</p>
        <p>Total: <strong>${(total / 100).toFixed(2)} MAD</strong></p>
        <p>L'équipe mDISCOVER</p>
      `,
    });
  }
}
