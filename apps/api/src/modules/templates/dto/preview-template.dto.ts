import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class PreviewTemplateDto {
  @ApiPropertyOptional({ type: Object, description: 'Sample merge data' })
  @IsObject()
  @IsOptional()
  sample?: Record<string, unknown>;
}
