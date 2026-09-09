import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ContactStatus, type ContactList, type Paginated } from '@mailer/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/dto/paginated-response.dto';
import { toContactList } from './contact.serializer';
import { CreateListDto } from './dto/create-list.dto';

@Injectable()
export class ContactListsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto): Promise<Paginated<ContactList>> {
    // Annotated, not inferred: without the type, `mode` widens to `string`
    // and no longer matches Prisma's QueryMode enum.
    const where: Prisma.ContactListWhereInput = query.search
      ? { name: { contains: query.search, mode: 'insensitive' } }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactList.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
        include: { _count: { select: { memberships: true } } },
      }),
      this.prisma.contactList.count({ where }),
    ]);

    return paginate(items.map(toContactList), total, query.page, query.limit);
  }

  async findOneOrFail(id: string): Promise<ContactList> {
    const list = await this.prisma.contactList.findUnique({
      where: { id },
      include: { _count: { select: { memberships: true } } },
    });
    if (!list) throw new NotFoundException('List not found');
    return toContactList(list);
  }

  async create(dto: CreateListDto): Promise<ContactList> {
    const list = await this.prisma.contactList.create({
      data: dto,
      include: { _count: { select: { memberships: true } } },
    });
    return toContactList(list);
  }

  async update(id: string, dto: Partial<CreateListDto>): Promise<ContactList> {
    await this.findOneOrFail(id);
    const list = await this.prisma.contactList.update({
      where: { id },
      data: dto,
      include: { _count: { select: { memberships: true } } },
    });
    return toContactList(list);
  }

  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);
    await this.prisma.contactList.delete({ where: { id } });
  }

  /** Subscribed contacts across every list a campaign targets, deduplicated. */
  countRecipients(listIds: string[]): Promise<number> {
    return this.prisma.contact.count({
      where: {
        status: ContactStatus.Subscribed,
        memberships: { some: { listId: { in: listIds } } },
      },
    });
  }
}
