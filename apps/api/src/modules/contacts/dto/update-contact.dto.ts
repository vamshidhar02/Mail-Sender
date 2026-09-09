import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ContactStatus } from '@mailer/shared';
import { CreateContactDto } from './create-contact.dto';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiPropertyOptional({ enum: ContactStatus })
  @IsEnum(ContactStatus)
  @IsOptional()
  status?: ContactStatus;
}
