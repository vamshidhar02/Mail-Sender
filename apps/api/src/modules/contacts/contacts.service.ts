import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ContactStatus, type Contact, type Paginated } from '@mailer/shared';
import type { Prisma } from '@prisma/client';

import { toContact } from './contact.serializer';

import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/paginated-response.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryContactsDto): Promise<Paginated<Contact>> {
    const where: Prisma.ContactWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.listId ? { memberships: { some: { listId: query.listId } } } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
        include: { memberships: { select: { listId: true } } },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return paginate(items.map(toContact), total, query.page, query.limit);
  }

  async findOneOrFail(id: string): Promise<Contact> {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: { memberships: { select: { listId: true } } },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return toContact(contact);
  }

  async create(dto: CreateContactDto): Promise<Contact> {
    const { listIds = [], attributes = {}, ...rest } = dto;

    const existing = await this.prisma.contact.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('A contact with this email already exists');

    const created = await this.prisma.contact.create({
      data: {
        ...rest,
        attributes,
        memberships: { create: listIds.map((listId) => ({ listId })) },
      },
      include: { memberships: { select: { listId: true } } },
    });

    return toContact(created);
  }

  async update(id: string, dto: UpdateContactDto): Promise<Contact> {
    await this.findOneOrFail(id);
    const { listIds, attributes, ...rest } = dto;

    const updated = await this.prisma.contact.update({
      where: { id },
      data: {
        ...rest,
        ...(attributes ? { attributes } : {}),
        // Replacing memberships wholesale keeps the API idempotent.
        ...(listIds
          ? { memberships: { deleteMany: {}, create: listIds.map((listId) => ({ listId })) } }
          : {}),
      },
      include: { memberships: { select: { listId: true } } },
    });

    return toContact(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);
    await this.prisma.contact.delete({ where: { id } });
  }

  async unsubscribe(id: string): Promise<Contact> {
    await this.findOneOrFail(id);
    const updated = await this.prisma.contact.update({
      where: { id },
      data: { status: ContactStatus.Unsubscribed },
      include: { memberships: { select: { listId: true } } },
    });

    return toContact(updated);
  }
}
