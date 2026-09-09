import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Supports {{mergeTags}}' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  subject!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  html!: string;

  @ApiPropertyOptional({ description: 'Plain-text part; derived from html when omitted' })
  @IsString()
  @IsOptional()
  text?: string;
}
