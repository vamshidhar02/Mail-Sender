import { Test } from '@nestjs/testing';

import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

/**
 * Smoke test: builds the whole module graph with the database stubbed out.
 * Catches missing providers, circular imports and bad injection tokens without
 * needing Postgres or an SMTP server.
 */
describe('AppModule', () => {
  it('resolves every provider', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    expect(app).toBeDefined();
    await app.close();
  });
});
