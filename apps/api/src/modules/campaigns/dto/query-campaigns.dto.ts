import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CampaignStatus } from '@mailer/shared';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryCampaignsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;
}
