// messages/dto/create-message.dto.ts
export class CreateMessageDto {
  conversationId: string
  senderId: string
  content: string
  type?: 'text' | 'image' | 'file'
  fileName?: string
  fileSize?: string
  replyTo?: { id: string; senderId: string; content: string }
}
