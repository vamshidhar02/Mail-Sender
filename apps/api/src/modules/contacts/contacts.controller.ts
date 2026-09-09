import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ParseCuidPipe } from '../../common/pipes/parse-cuid.pipe';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  findAll(@Query() query: QueryContactsDto) {
    return this.contacts.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.contacts.findOneOrFail(id);
  }

  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contacts.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateContactDto) {
    return this.contacts.update(id, dto);
  }

  @Post(':id/unsubscribe')
  @HttpCode(HttpStatus.OK)
  unsubscribe(@Param('id', ParseCuidPipe) id: string) {
    return this.contacts.unsubscribe(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.contacts.remove(id);
  }
}
