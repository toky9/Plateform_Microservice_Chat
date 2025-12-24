import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { UploadModule } from './upload/upload.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [PrismaModule, UsersModule, ConversationsModule, MessagesModule, UploadModule, WebsocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
