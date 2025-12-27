import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

// @UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private service: ConversationsService) {}

  @Get()
  getUserConversations(@Query('userId') userId: string) {
    return this.service.getUserConversations(userId);
  }

  // Récupérer les messages d'une conversation
  @Get(':id/messages')
  getMessages(
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.getMessages(
      conversationId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Post()
  create(@Body() dto: CreateConversationDto) {
    return this.service.create(dto);
  }

  @Put(':id/archive')
  archive(@Param('id') id: string, @Body('archived') archived: boolean) {
    return this.service.archive(id, archived);
  }

  @Put(':id/mute')
  mute(@Param('id') id: string, @Body('muted') muted: boolean) {
    return this.service.mute(id, muted);
  }

  // Marquer comme lu
  @Post(':id/read')
  markAsRead(
    @Param('id') conversationId: string,
    @Body('userId') userId: string,
  ) {
    const reponse = this.service.markAsRead(conversationId, userId);
    return reponse;
  }

  // Rechercher dans les messages
  @Get(':id/search')
  searchMessages(
    @Param('id') conversationId: string,
    @Query('q') query: string,
  ) {
    return this.service.searchMessages(conversationId, query);
  }
}
