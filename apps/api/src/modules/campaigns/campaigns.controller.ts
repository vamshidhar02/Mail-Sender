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
import { CampaignsService } from './campaigns.service';
import { CampaignSenderService } from './campaign-sender.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';
import { SendTestDto } from './dto/send-test.dto';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaigns: CampaignsService,
    private readonly sender: CampaignSenderService,
  ) {}

  @Get()
  findAll(@Query() query: QueryCampaignsDto) {
    return this.campaigns.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.campaigns.findOneOrFail(id);
  }

  @Get(':id/stats')
  stats(@Param('id', ParseCuidPipe) id: string) {
    return this.campaigns.stats(id);
  }

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaigns.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaigns.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.campaigns.remove(id);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  send(@Param('id', ParseCuidPipe) id: string) {
    return this.sender.send(id);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  sendTest(@Param('id', ParseCuidPipe) id: string, @Body() dto: SendTestDto) {
    return this.sender.sendTest(id, dto.emails);
  }
}
