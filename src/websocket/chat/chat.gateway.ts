import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

// websocket/chat.gateway.ts
@WebSocketGateway({ path: '/api/ws', cors: true })
export class ChatGateway {
  private clients = new Map<string, WebSocket>()

  handleConnection(client: WebSocket, req: any) {
    const userId = new URL(req.url, 'http://localhost')
      .searchParams.get('userId')

    if (userId) this.clients.set(userId, client)
  }

  handleDisconnect(client: WebSocket) {
    for (const [userId, ws] of this.clients) {
      if (ws === client) this.clients.delete(userId)
    }
  }

  broadcastMessage(conversationId: string, message: any) {
    // ici tu peux filtrer par participants
    this.clients.forEach(ws => {
      ws.send(JSON.stringify({
        type: 'new_message',
        payload: message
      }))
    })
  }
}

