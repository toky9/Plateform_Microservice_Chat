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
        participants: {
          include: {
            user: true, // <-- déjà correct
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      participants: conv.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar,
        status: p.user.status,
      })),
      lastMessage: conv.messages[0] ?? null,
      unreadCount: 0, // à calculer plus tard
      isGroup: conv.isGroup,
      groupName: conv.groupName,
      groupAvatar: conv.groupAvatar,
      muted: conv.muted,
      archived: conv.archived,
    }));
  }

  // Créer une conversation
  // async create(dto: CreateConversationDto) {
  //   const conversation = await this.prisma.conversation.create({
  //     data: {
  //       isGroup: dto.isGroup,
  //       groupName: dto.groupName,
  //       groupAvatar: dto.groupAvatar,
  //       participants: {
  //         create: dto.participants.map(user => ({ user })),
  //       },
  //     },
  //     include: { participants: true },
  //   });
  //   return conversation;
  // }

  async create(dto: CreateConversationDto) {
    // 1. UPSERT des users (base CHAT)
    for (const participant of dto.participants) {
      await this.prisma.user.upsert({
        where: { id: participant.id },
        update: {
          name: participant.name,
          avatar: participant.avatarUrl,
        },
        create: {
          id: participant.id,
          name: participant.name,
          avatar: participant.avatarUrl,
        },
      });
    }

    // 2. Création de la conversation
    const conv = await this.prisma.conversation.create({
      data: {
        isGroup: dto.isGroup,
        groupName: dto.groupName,
        groupAvatar: dto.groupAvatar,
        participants: {
          create: dto.participants.map((p) => ({
            userId: p.id, // ⚠️ PAS de connect ici
          })),
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });

    const conversation = {
      id: conv.id,
      participants: conv.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar,
        status: p.user.status,
      })),
      unreadCount: 0, // à calculer plus tard
      isGroup: conv.isGroup,
      groupName: conv.groupName,
      groupAvatar: conv.groupAvatar,
      muted: conv.muted,
      archived: conv.archived,
    };

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
