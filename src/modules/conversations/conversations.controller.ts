import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';

import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

// conversations/conversations.controller.ts
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private service: ConversationsService) {}

  @Get()
  getUserConversations(@Query('userId') userId: string) {
    return this.service.getUserConversations(userId)
  }

  @Post()
  create(@Body() dto: CreateConversationDto) {
    return this.service.create(dto)
  }

  @Put(':id/archive')
  archive(@Param('id') id: string, @Body('archived') archived: boolean) {
    return this.service.archive(id, archived)
  }

  @Put(':id/mute')
  mute(@Param('id') id: string, @Body('muted') muted: boolean) {
    return this.service.mute(id, muted)
  }
}

