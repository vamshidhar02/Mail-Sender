import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  EDITABLE_CAMPAIGN_STATUSES,
  MessageStatus,
  type Campaign,
  type CampaignStats,
  type Paginated,
} from '@mailer/shared';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/paginated-response.dto';
import { toCampaign } from './campaign.serializer';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';

/** Relations every read needs so the serializer can flatten them. */
const INCLUDE = {
  template: { select: { name: true } },
  lists: { select: { listId: true } },
} satisfies Prisma.CampaignInclude;

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCampaignsDto): Promise<Paginated<Campaign>> {
    const where: Prisma.CampaignWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
        include: INCLUDE,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return paginate(items.map(toCampaign), total, query.page, query.limit);
  }

  async findOneOrFail(id: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id }, include: INCLUDE });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return toCampaign(campaign);
  }

  async create(dto: CreateCampaignDto): Promise<Campaign> {
    const { listIds, templateId, ...rest } = dto;
    await this.assertReferencesExist(templateId, listIds);

    const campaign = await this.prisma.campaign.create({
      data: {
        ...rest,
        templateId,
        lists: { create: listIds.map((listId) => ({ listId })) },
      },
      include: INCLUDE,
    });

    return toCampaign(campaign);
  }

  async update(id: string, dto: UpdateCampaignDto): Promise<Campaign> {
    const current = await this.findOneOrFail(id);
    this.assertEditable(current);

    const { listIds, templateId, ...rest } = dto;
    if (templateId || listIds) await this.assertReferencesExist(templateId, listIds);

    const campaign = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...rest,
        ...(templateId ? { templateId } : {}),
        // Replacing the join rows wholesale keeps the update idempotent.
        ...(listIds
          ? { lists: { deleteMany: {}, create: listIds.map((listId) => ({ listId })) } }
          : {}),
      },
      include: INCLUDE,
    });

    return toCampaign(campaign);
  }

  async remove(id: string): Promise<void> {
    const campaign = await this.findOneOrFail(id);
    this.assertEditable(campaign);
    await this.prisma.campaign.delete({ where: { id } });
  }

  /** Counted from the message rows rather than stored, to avoid drift. */
  async stats(id: string): Promise<CampaignStats> {
    await this.findOneOrFail(id);

    const grouped = await this.prisma.campaignMessage.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { _all: true },
    });

    const count = (status: MessageStatus) =>
      grouped.find((row) => row.status === status)?._count._all ?? 0;

    return {
      recipients: grouped.reduce((sum, row) => sum + row._count._all, 0),
      sent: count(MessageStatus.Sent),
      failed: count(MessageStatus.Failed),
      pending: count(MessageStatus.Pending),
    };
  }

  private async assertReferencesExist(templateId?: string, listIds?: string[]): Promise<void> {
    if (templateId) {
      const template = await this.prisma.template.count({ where: { id: templateId } });
      if (!template) throw new BadRequestException('Template does not exist');
    }
    if (listIds?.length) {
      const found = await this.prisma.contactList.count({ where: { id: { in: listIds } } });
      if (found !== listIds.length) throw new BadRequestException('One or more lists do not exist');
    }
  }

  private assertEditable(campaign: Campaign): void {
    if (!EDITABLE_CAMPAIGN_STATUSES.includes(campaign.status)) {
      throw new BadRequestException('Campaign cannot be modified while it is ' + campaign.status);
    }
  }
}
