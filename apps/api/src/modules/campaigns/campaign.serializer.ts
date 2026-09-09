import type { Campaign as SharedCampaign, CampaignStatus } from '@mailer/shared';

/** What the Prisma queries in this module actually select. */
type CampaignRow = {
  id: string;
  name: string;
  status: string;
  templateId: string;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  template?: { name: string } | null;
  lists?: Array<{ listId: string }>;
};

/**
 * Flattens Prisma's join rows into the flat shape @mailer/shared promises, so
 * clients never have to know about the CampaignList join table.
 */
export function toCampaign(row: CampaignRow): SharedCampaign {
  return {
    id: row.id,
    name: row.name,
    templateId: row.templateId,
    listIds: (row.lists ?? []).map((entry) => entry.listId),
    templateName: row.template?.name,
    status: row.status as CampaignStatus,
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    replyTo: row.replyTo,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
