import { Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated } from '@mailer/shared';
import type { Prisma, Template } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/dto/paginated-response.dto';
import { TemplateRendererService, type RenderedMail } from './template-renderer.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renderer: TemplateRendererService,
  ) {}

  async findAll(query: PaginationDto): Promise<Paginated<Template>> {
    const where: Prisma.TemplateWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { subject: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.template.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { updatedAt: query.sortOrder },
      }),
      this.prisma.template.count({ where }),
    ]);

    return paginate(items, total, query.page, query.limit);
  }

  async findOneOrFail(id: string): Promise<Template> {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  create(dto: CreateTemplateDto): Promise<Template> {
    return this.prisma.template.create({
      data: {
        ...dto,
        // Cached so the client can list merge tags without re-parsing the body.
        variables: this.renderer.extractVariables(dto.subject, dto.html),
      },
    });
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<Template> {
    const current = await this.findOneOrFail(id);
    const subject = dto.subject ?? current.subject;
    const html = dto.html ?? current.html;

    return this.prisma.template.update({
      where: { id },
      data: { ...dto, variables: this.renderer.extractVariables(subject, html) },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);
    await this.prisma.template.delete({ where: { id } });
  }

  /** Renders against sample data so a client can show a preview. */
  async preview(id: string, sample: Record<string, unknown> = {}): Promise<RenderedMail> {
    const template = await this.findOneOrFail(id);
    return this.renderer.render(template, {
      email: 'preview@example.com',
      firstName: 'Alex',
      lastName: 'Doe',
      ...sample,
    });
  }
}
