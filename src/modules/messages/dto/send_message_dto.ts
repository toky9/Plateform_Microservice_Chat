// dto/send-message.dto.ts
export class SendMessageDto {
  conversationId: string;
  senderId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  fileName?: string;
  fileSize?: string;
  replyTo?: {
    id: string;
    senderId: string;
    content: string;
  };
}

// dto/add-reaction.dto.ts
export class AddReactionDto {
  messageId: string;
  conversationId: string;
  userId: string;
  emoji: string;
}

// dto/remove-reaction.dto.ts
export class RemoveReactionDto {
  messageId: string;
  userId: string;
  emoji: string;
}

// dto/update-message.dto.ts
export class UpdateMessageDto {
  conversationId: string;
  content: string;
}

// dto/toggle-pin.dto.ts
export class TogglePinDto {
  conversationId: string;
  isPinned: boolean;
}

// dto/mark-as-read.dto.ts
export class MarkAsReadDto {
  userId: string;
}