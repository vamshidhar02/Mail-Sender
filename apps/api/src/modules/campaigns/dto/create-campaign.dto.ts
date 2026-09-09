import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsString()
  templateId!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  listIds!: string[];

  @ApiProperty()
  @IsString()
  fromName!: string;

  @ApiProperty()
  @IsEmail()
  fromEmail!: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  replyTo?: string;
}
