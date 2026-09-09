import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TemplateRendererService } from './template-renderer.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplateRendererService],
  exports: [TemplatesService, TemplateRendererService],
})
export class TemplatesModule {}
