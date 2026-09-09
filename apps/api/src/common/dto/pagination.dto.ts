import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PAGINATION } from '@mailer/shared';

export class PaginationDto {
  @ApiPropertyOptional({ default: PAGINATION.defaultPage })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = PAGINATION.defaultPage;

  @ApiPropertyOptional({ default: PAGINATION.defaultLimit, maximum: PAGINATION.maxLimit })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.maxLimit)
  @IsOptional()
  limit: number = PAGINATION.defaultLimit;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'desc';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
