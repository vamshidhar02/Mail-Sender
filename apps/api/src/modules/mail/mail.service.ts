import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface OutboundMail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendResult {
  messageId: string;
  accepted: boolean;
}

/**
 * Two transports, chosen by MAIL_TRANSPORT:
 *
 * - 'file'  writes each message as a real .eml file under MAIL_OUTPUT_DIR.
 *           Needs no mail server at all, which keeps local development free of
 *           external services. Open the .eml in any mail client to inspect it.
 * - 'smtp'  hands the message to a real SMTP server.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly mode: string;
  private readonly outputDir: string;

  constructor(private readonly config: ConfigService) {
    this.mode = this.config.get<string>('mail.transport', 'file');
    this.outputDir = resolve(this.config.get<string>('mail.outputDir', './storage/mail'));

    this.transporter =
      this.mode === 'smtp' ? this.createSmtpTransport() : this.createFileTransport();
  }

  async onModuleInit(): Promise<void> {
    if (this.mode === 'file') {
      await mkdir(this.outputDir, { recursive: true });
      this.logger.log('Mail transport: file -> ' + this.outputDir);
    } else {
      this.logger.log('Mail transport: smtp -> ' + this.config.get<string>('mail.smtp.host'));
    }
  }

  /** Applies the configured default From when the caller has not set one. */
  async send(mail: OutboundMail): Promise<SendResult> {
    const info = await this.transporter.sendMail({
      ...mail,
      from: mail.from ?? this.defaultFrom(),
    });

    if (this.mode === 'file') {
      await this.persist(mail.to, info.message as Buffer);
    }

    return {
      messageId: info.messageId,
      // The stream transport reports no recipients, but nothing was rejected.
      accepted: this.mode === 'file' ? true : info.accepted.length > 0,
    };
  }

  async verify(): Promise<boolean> {
    if (this.mode === 'file') {
      try {
        await mkdir(this.outputDir, { recursive: true });
        return true;
      } catch (error) {
        this.logger.warn('Mail output directory is not writable: ' + String(error));
        return false;
      }
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.warn('SMTP verify failed: ' + String(error));
      return false;
    }
  }

  private createSmtpTransport(): Transporter {
    const user = this.config.get<string>('mail.smtp.user');
    const pass = this.config.get<string>('mail.smtp.password');

    return nodemailer.createTransport({
      host: this.config.getOrThrow<string>('mail.smtp.host'),
      port: this.config.getOrThrow<number>('mail.smtp.port'),
      secure: this.config.get<boolean>('mail.smtp.secure', false),
      auth: user ? { user, pass } : undefined,
      // Pool connections so a bulk send does not open a socket per message.
      pool: true,
      maxConnections: 5,
      maxMessages: 200,
    });
  }

  private createFileTransport(): Transporter {
    return nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'unix',
    });
  }

  private async persist(to: string, message: Buffer): Promise<void> {
    // Timestamp first so the directory sorts chronologically.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTo = to.replace(/[^a-zA-Z0-9._@-]/g, '_');
    const file = join(this.outputDir, stamp + '__' + safeTo + '.eml');

    await writeFile(file, message);
    this.logger.log('Wrote ' + file);
  }

  private defaultFrom(): string {
    const name = this.config.get<string>('mail.fromName', 'Mail Sender');
    const address = this.config.getOrThrow<string>('mail.fromAddress');
    return name + ' <' + address + '>';
  }
}
