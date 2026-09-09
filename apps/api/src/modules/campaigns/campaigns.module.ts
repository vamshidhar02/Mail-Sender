import { Module } from '@nestjs/common';

import { ContactsModule } from '../contacts/contacts.module';
import { TemplatesModule } from '../templates/templates.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignSenderService } from './campaign-sender.service';

@Module({
  imports: [ContactsModule, TemplatesModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignSenderService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
