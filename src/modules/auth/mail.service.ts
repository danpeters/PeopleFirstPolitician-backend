/**
 * ============================================================
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\auth\mail.service.ts
 *
 * Purpose:
 * Sends authentication-related emails.
 *
 * Security:
 * - SMTP credentials come from environment variables.
 * - Password-reset tokens are transmitted only through the
 *   password-reset URL.
 * - Tokens are never written to application logs in production.
 * ============================================================
 */

import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger =
    new Logger(MailService.name);

  constructor(
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send a password-reset email.
   */
  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
  ): Promise<void> {
    const host =
      this.configService.get<string>('MAIL_HOST');

    const port =
      Number(
        this.configService.get<string>('MAIL_PORT') ??
          '587',
      );

    const secure =
      (
        this.configService.get<string>(
          'MAIL_SECURE',
        ) ?? 'false'
      ).toLowerCase() === 'true';

    const username =
      this.configService.get<string>('MAIL_USER');

    const password =
      this.configService.get<string>('MAIL_PASSWORD');

    const from =
      this.configService.get<string>(
        'MAIL_FROM',
      ) ?? username;

    /**
     * Development fallback.
     *
     * This allows local testing before SMTP is configured.
     * It must never be used as a production email mechanism.
     */
    if (
      process.env.NODE_ENV !== 'production' &&
      (!host || !username || !password)
    ) {
      this.logger.warn(
        `SMTP is not configured. Development password-reset URL: ${resetUrl}`,
      );

      return;
    }

    if (!host || !username || !password || !from) {
      throw new Error(
        'SMTP email configuration is incomplete',
      );
    }

    const transporter =
      nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: username,
          pass: password,
        },
      });

    await transporter.sendMail({
      from,
      to: email,
      subject:
        'PeopleFirst Politician - Password Reset',
      text: [
        'You requested a password reset for your',
        'PeopleFirst Politician account.',
        '',
        `Reset your password using this link: ${resetUrl}`,
        '',
        'This link expires in 30 minutes.',
        '',
        'If you did not request this reset, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Password Reset</h2>

          <p>
            You requested a password reset for your
            PeopleFirst Politician account.
          </p>

          <p>
            <a
              href="${resetUrl}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#2563eb;
                color:#ffffff;
                text-decoration:none;
                border-radius:6px;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            This link expires in <strong>30 minutes</strong>.
          </p>

          <p>
            If you did not request this reset, you can safely
            ignore this email.
          </p>
        </div>
      `,
    });
  }
}