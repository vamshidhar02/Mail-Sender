import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContactStatus } from '@mailer/shared';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryContactsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ContactStatus })
  @IsEnum(ContactStatus)
  @IsOptional()
  status?: ContactStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  listId?: string;
}
