import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CampaignStatus,
  ContactStatus,
  MessageStatus,
  type SendCampaignResult,
} from '@mailer/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { TemplateRendererService } from '../templates/template-renderer.service';

@Injectable()
export class CampaignSenderService {
  private readonly logger = new Logger(CampaignSenderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly renderer: TemplateRendererService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Sends a campaign to every subscribed contact in its lists.
   *
   * This runs inline, in batches, which is fine for modest volumes. For large
   * lists the next step is to move the per-message send onto a job queue so the
   * request returns immediately and failures can be retried independently.
   */
  async send(campaignId: string): Promise<SendCampaignResult> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { template: true, lists: true },
    });
    if (!campaign) throw new BadRequestException('Campaign not found');
    if (campaign.status !== CampaignStatus.Draft) {
      throw new BadRequestException('Campaign is already ' + campaign.status);
    }
    if (!campaign.lists.length) {
      throw new BadRequestException('Campaign has no target lists');
    }

    const listIds = campaign.lists.map((entry) => entry.listId);
    const batchSize = this.config.get<number>('send.batchSize', 50);
    const from = campaign.fromName + ' <' + campaign.fromEmail + '>';

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.Sending, startedAt: new Date() },
    });

    let cursor: string | undefined;
    let recipients = 0;
    let sent = 0;
    let failed = 0;

    try {
      for (;;) {
        // Keyset pagination keeps memory flat regardless of list size.
        const contacts = await this.prisma.contact.findMany({
          where: {
            status: ContactStatus.Subscribed,
            memberships: { some: { listId: { in: listIds } } },
          },
          orderBy: { id: 'asc' },
          take: batchSize,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        });

        if (!contacts.length) break;

        for (const contact of contacts) {
          recipients += 1;

          const message = await this.prisma.campaignMessage.upsert({
            where: { campaignId_contactId: { campaignId, contactId: contact.id } },
            update: {},
            create: { campaignId, contactId: contact.id, email: contact.email },
          });

          // A retry of a partially sent campaign must not mail anyone twice.
          if (message.status === MessageStatus.Sent) {
            sent += 1;
            continue;
          }

          const rendered = this.renderer.render(campaign.template, {
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
            attributes: contact.attributes as Record<string, unknown>,
          });

          try {
            await this.mail.send({
              to: contact.email,
              from,
              replyTo: campaign.replyTo ?? undefined,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
            });

            await this.prisma.campaignMessage.update({
              where: { id: message.id },
              data: { status: MessageStatus.Sent, sentAt: new Date(), error: null },
            });
            sent += 1;
          } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            await this.prisma.campaignMessage.update({
              where: { id: message.id },
              data: { status: MessageStatus.Failed, error: reason },
            });
            failed += 1;
            this.logger.warn('Send to ' + contact.email + ' failed: ' + reason);
          }
        }

        cursor = contacts[contacts.length - 1]?.id;
      }

      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.Sent, completedAt: new Date() },
      });
    } catch (error) {
      // An infrastructure failure (not a per-recipient one) marks the run failed.
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.Failed, completedAt: new Date() },
      });
      throw error;
    }

    this.logger.log(
      'Campaign ' + campaignId + ': ' + sent + ' sent, ' + failed + ' failed',
    );
    return { campaignId, recipients, sent, failed };
  }

  /** Sends the campaign body to a few addresses without writing message rows. */
  async sendTest(campaignId: string, emails: string[]): Promise<{ sent: number }> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { template: true },
    });
    if (!campaign) throw new BadRequestException('Campaign not found');

    for (const email of emails) {
      const rendered = this.renderer.render(campaign.template, {
        email,
        firstName: 'Test',
        lastName: 'Recipient',
      });

      await this.mail.send({
        to: email,
        from: campaign.fromName + ' <' + campaign.fromEmail + '>',
        replyTo: campaign.replyTo ?? undefined,
        subject: '[TEST] ' + rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });
    }

    return { sent: emails.length };
  }
}
