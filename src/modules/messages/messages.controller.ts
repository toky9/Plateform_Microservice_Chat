import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Post, 
  Put, 
  Query,
  UseGuards 
} from '@nestjs/common';

import { MessagesService } from './messages.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { AddReactionDto, MarkAsReadDto, RemoveReactionDto, SendMessageDto, TogglePinDto, UpdateMessageDto } from './dto/send_message_dto';

// @UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private service: MessagesService) {}

  // Récupérer les messages d'une conversation
  @Get('conversation/:conversationId')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.getMessages(
      conversationId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  // Envoyer un message
  @Post()
  sendMessage(@Body() dto: SendMessageDto) {
    return this.service.sendMessage(dto);
  }

  // Ajouter une réaction
  @Post('reactions')
  addReaction(@Body() dto: AddReactionDto) {
    return this.service.addReaction(dto);
  }

  // Retirer une réaction
  @Delete('reactions')
  removeReaction(@Body() dto: RemoveReactionDto) {
    return this.service.removeReaction(dto);
  }

  // Modifier un message
  @Put(':messageId')
  editMessage(
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.service.editMessage(messageId, dto);
  }

  // Supprimer un message
  @Delete(':messageId')
  deleteMessage(
    @Param('messageId') messageId: string,
    @Body('conversationId') conversationId: string,
  ) {
    return this.service.deleteMessage(messageId, conversationId);
  }

  // Épingler/Désépingler un message
  @Put(':messageId/pin')
  togglePin(
    @Param('messageId') messageId: string,
    @Body() dto: TogglePinDto,
  ) {
    return this.service.togglePin(messageId, dto);
  }

  // Marquer comme lu
  @Post('conversations/:conversationId/read')
  markAsRead(
    @Param('conversationId') conversationId: string,
    @Body() dto: MarkAsReadDto,
  ) {
    return this.service.markAsRead(conversationId, dto.userId);
  }

  // Rechercher dans les messages
  @Get('conversations/:conversationId/search')
  searchMessages(
    @Param('conversationId') conversationId: string,
    @Query('q') query: string,
  ) {
    return this.service.searchMessages(conversationId, query);
  }
}