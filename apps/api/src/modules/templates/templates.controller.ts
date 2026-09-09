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
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { PreviewTemplateDto } from './dto/preview-template.dto';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.templates.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.templates.findOneOrFail(id);
  }

  @Post()
  create(@Body() dto: CreateTemplateDto) {
    return this.templates.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateTemplateDto) {
    return this.templates.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.templates.remove(id);
  }

  @Post(':id/preview')
  @HttpCode(HttpStatus.OK)
  preview(@Param('id', ParseCuidPipe) id: string, @Body() dto: PreviewTemplateDto) {
    return this.templates.preview(id, dto.sample);
  }
}
