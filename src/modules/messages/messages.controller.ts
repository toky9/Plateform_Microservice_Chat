import { Body, Controller, Delete, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { MessagesService } from './messages.service';
import { ChatGateway } from 'src/websocket/chat/chat.gateway';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

// messages/messages.controller.ts
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private service: MessagesService,
    private gateway: ChatGateway
  ) {}

  @Post()
  async send(@Body() dto: CreateMessageDto) {
    const message = await this.service.create(dto)
    this.gateway.broadcastMessage(dto.conversationId, message)
    return message
  }

  @Put(':id')
  edit(@Param('id') id: string, @Body() dto: UpdateMessageDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body('conversationId') conversationId: string) {
    return this.service.delete(id, conversationId)
  }
}

