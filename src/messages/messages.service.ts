// messages/messages.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  // Récupérer messages d'une conversation
  async getMessages(conversationId: string, limit = 50, offset = 0) {
    return this.prisma.message.findMany({
      where: { conversationId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: { reactions: true, readBy: true },
    });
  }

  // Créer un message
  async create(dto: CreateMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: dto.senderId,
        content: dto.content,
        type: dto.type || 'text',
        fileName: dto.fileName,
        fileSize: dto.fileSize,
      },
      include: { reactions: true, readBy: true },
    });
    return message;
  }

  // Modifier un message
  async update(messageId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.message.update({
      where: { id: messageId },
      data: { content: dto.content, isEdited: true },
      include: { reactions: true, readBy: true },
    });
    if (!message) throw new NotFoundException('Message non trouvé');
    return message;
  }

  // Supprimer un message
  async delete(messageId: string, conversationId: string) {
    await this.prisma.message.deleteMany({
      where: { id: messageId, conversationId },
    });
  }

  // Ajouter une réaction
  async addReaction(messageId: string, userId: string, emoji: string) {
    return this.prisma.reaction.create({
      data: { messageId, userId, emoji },
    });
  }

  // Retirer une réaction
  async removeReaction(messageId: string, userId: string, emoji: string) {
    return this.prisma.reaction.deleteMany({
      where: { messageId, userId, emoji },
    });
  }

  // Marquer comme lu
  async markAsRead(conversationId: string, userId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: { readBy: true },
    });

    const unread = messages.filter(
      m => !m.readBy.some(r => r.userId === userId),
    );

    await Promise.all(
      unread.map(m =>
        this.prisma.readReceipt.create({ data: { messageId: m.id, userId } }),
      ),
    );
  }
}
