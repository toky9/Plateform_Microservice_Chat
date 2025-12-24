import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService, PrismaService, JwtService],
})
export class ConversationsModule {}
