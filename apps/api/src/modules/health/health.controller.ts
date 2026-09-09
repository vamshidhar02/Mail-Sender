import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  @Get()
  async check() {
    const [database, smtp] = await Promise.all([this.pingDatabase(), this.mail.verify()]);
    const status = database && smtp ? 'ok' : 'degraded';

    return {
      status,
      uptime: process.uptime(),
      checks: {
        database: database ? 'up' : 'down',
        smtp: smtp ? 'up' : 'down',
      },
    };
  }

  @Get('live')
  live() {
    return { status: 'ok', uptime: process.uptime() };
  }

  private async pingDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
