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

import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseCuidPipe } from '../../common/pipes/parse-cuid.pipe';
import { ContactListsService } from './contact-lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';

@ApiTags('contact-lists')
@Controller('lists')
export class ContactListsController {
  constructor(private readonly lists: ContactListsService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.lists.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.lists.findOneOrFail(id);
  }

  @Post()
  create(@Body() dto: CreateListDto) {
    return this.lists.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateListDto) {
    return this.lists.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.lists.remove(id);
  }
}
