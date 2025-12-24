import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { UploadModule } from './upload/upload.module';
import { WebsocketModule } from './websocket/websocket.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [ DatabaseModule, UsersModule, ConversationsModule, MessagesModule, UploadModule, WebsocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
