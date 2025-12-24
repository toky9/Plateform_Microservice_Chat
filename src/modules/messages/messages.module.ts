import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ChatGateway } from 'src/websocket/chat/chat.gateway';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, PrismaService, JwtService, ChatGateway],
})
export class MessagesModule {}
