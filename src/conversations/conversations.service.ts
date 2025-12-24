// conversations/conversations.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  // Récupérer toutes les conversations d'un utilisateur
  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // dernier message
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return conversations.map(conv => ({
      id: conv.id,
      participants: conv.participants.map(p => ({ id: p.userId })),
      lastMessage: conv.messages[0] || null,
      unreadCount: 0, // à calculer selon readBy
      isGroup: conv.isGroup,
      groupName: conv.groupName,
      groupAvatar: conv.groupAvatar,
      muted: conv.muted,
      archived: conv.archived,
    }));
  }

  // Créer une conversation
  async create(dto: CreateConversationDto) {
    const conversation = await this.prisma.conversation.create({
      data: {
        isGroup: dto.isGroup,
        groupName: dto.groupName,
        groupAvatar: dto.groupAvatar,
        participants: {
          create: dto.participants.map(userId => ({ userId })),
        },
      },
      include: { participants: true },
    });
    return conversation;
  }

  // Archiver / désarchiver
  async archive(conversationId: string, archived: boolean) {
    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { archived },
      include: { participants: true },
    });
    if (!conversation) throw new NotFoundException('Conversation non trouvée');
    return conversation;
  }

  // Activer / désactiver notifications
  async mute(conversationId: string, muted: boolean) {
    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { muted },
      include: { participants: true },
    });
    if (!conversation) throw new NotFoundException('Conversation non trouvée');
    return conversation;
  }
}
