
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // À configurer selon vos besoins
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      console.log(`User ${userId} connected with socket ${client.id}`);
      
      // Notifier les autres utilisateurs que cet utilisateur est en ligne
      this.server.emit('user-status', {
        userId,
        status: 'online',
      });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.connectedUsers.entries()).find(
      ([_, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
      
      // Notifier les autres utilisateurs que cet utilisateur est hors ligne
      this.server.emit('user-status', {
        userId,
        status: 'offline',
      });
    }
  }

  // Envoyer un nouveau message à tous les participants d'une conversation
  @SubscribeMessage('new-message')
  handleNewMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; message: any },
  ) {
    // Émettre le message à tous les clients sauf l'émetteur
    client.broadcast.emit('message-received', {
      conversationId: data.conversationId,
      message: data.message,
    });
  }

  // Notifier qu'un utilisateur est en train de taper
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string; userName: string },
  ) {
    client.broadcast.emit('user-typing', {
      conversationId: data.conversationId,
      userId: data.userId,
      userName: data.userName,
    });
  }

  // Notifier qu'un utilisateur a arrêté de taper
  @SubscribeMessage('stop-typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    client.broadcast.emit('user-stop-typing', {
      conversationId: data.conversationId,
      userId: data.userId,
    });
  }

  // Méthode pour émettre un événement depuis les services
  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.emit(event, { conversationId, ...data });
  }

  // Méthode pour émettre à un utilisateur spécifique
  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }
}


// import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

// // websocket/chat.gateway.ts
// @WebSocketGateway({ path: '/api/ws', cors: true })
// export class ChatGateway {
//   private clients = new Map<string, WebSocket>()

//   handleConnection(client: WebSocket, req: any) {
//     const userId = new URL(req.url, 'http://localhost')
//       .searchParams.get('userId')

//     if (userId) this.clients.set(userId, client)
//   }

//   handleDisconnect(client: WebSocket) {
//     for (const [userId, ws] of this.clients) {
//       if (ws === client) this.clients.delete(userId)
//     }
//   }

//   broadcastMessage(conversationId: string, message: any) {
//     // ici tu peux filtrer par participants
//     this.clients.forEach(ws => {
//       ws.send(JSON.stringify({
//         type: 'new_message',
//         payload: message
//       }))
//     })
//   }
// }