
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
            user: true,
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
        avatarUrl: p.user.avatarUrl,
        status: p.user.status,
      })),
      lastMessage: conv.messages[0] ?? null,
      unreadCount: 0, // À calculer si nécessaire
      isGroup: conv.isGroup,
      groupName: conv.groupName,
      groupAvatar: conv.groupAvatar,
      muted: conv.muted,
      archived: conv.archived,
    }));
  }

  // Récupérer les messages d'une conversation
  async getMessages(conversationId: string, limit = 50, offset = 0) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: true,
        reactions: true,
        readBy: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      content: msg.content,
      timestamp: msg.createdAt,
      type: msg.type as 'text' | 'image' | 'file',
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      reactions: this.groupReactions(msg.reactions),
      isEdited: msg.isEdited,
      isPinned: msg.isPinned,
      readBy: msg.readBy.map((r) => r.userId),
    }));
  }

  // Créer une conversation
  async create(dto: CreateConversationDto) {
    // 1. UPSERT des users
    for (const participant of dto.participants) {
      await this.prisma.user.upsert({
        where: { id: participant.id },
        update: {
          name: participant.name,
          avatarUrl: participant.avatarUrl,
          status: participant.status,
        },
        create: {
          id: participant.id,
          name: participant.name,
          avatarUrl: participant.avatarUrl,
          status: participant.status!,
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
            userId: p.id,
          })),
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });

    return {
      id: conv.id,
      participants: conv.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        avatarUrl: p.user.avatarUrl,
        status: p.user.status,
      })),
      unreadCount: 0,
      isGroup: conv.isGroup,
      groupName: conv.groupName,
      groupAvatar: conv.groupAvatar,
      muted: conv.muted,
      archived: conv.archived,
    };
  }

  // Archiver / désarchiver
  async archive(conversationId: string, archived: boolean) {
    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { archived },
      include: { 
        participants: {
          include: { user: true }
        } 
      },
    });
    
    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }
    
    return {
      id: conversation.id,
      participants: conversation.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        avatarUrl: p.user.avatarUrl,
        status: p.user.status,
      })),
      unreadCount: 0,
      isGroup: conversation.isGroup,
      groupName: conversation.groupName,
      groupAvatar: conversation.groupAvatar,
      muted: conversation.muted,
      archived: conversation.archived,
    };
  }

  // Activer / désactiver notifications
  async mute(conversationId: string, muted: boolean) {
    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { muted },
      include: { 
        participants: {
          include: { user: true }
        } 
      },
    });
    
    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }
    
    return {
      id: conversation.id,
      participants: conversation.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        avatarUrl: p.user.avatarUrl,
        status: p.user.status,
      })),
      unreadCount: 0,
      isGroup: conversation.isGroup,
      groupName: conversation.groupName,
      groupAvatar: conversation.groupAvatar,
      muted: conversation.muted,
      archived: conversation.archived,
    };
  }

  // Marquer comme lu
  async markAsRead(conversationId: string, userId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
    });

    for (const message of messages) {
      await this.prisma.readReceipt.upsert({
        where: {
          messageId_userId: {
            messageId: message.id,
            userId,
          },
        },
        create: {
          messageId: message.id,
          userId,
        },
        update: {},
      });
    }
  }

  // Rechercher dans les messages
  async searchMessages(conversationId: string, query: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        sender: true,
        reactions: true,
        readBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      content: msg.content,
      timestamp: msg.createdAt,
      type: msg.type as 'text' | 'image' | 'file',
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      reactions: this.groupReactions(msg.reactions),
      isEdited: msg.isEdited,
      isPinned: msg.isPinned,
      readBy: msg.readBy.map((r) => r.userId),
    }));
  }

  // Grouper les réactions par emoji
  private groupReactions(reactions: any[]) {
    const grouped = reactions.reduce((acc, reaction) => {
      const existing = acc.find((r: any) => r.emoji === reaction.emoji);
      if (existing) {
        existing.users.push(reaction.userId);
      } else {
        acc.push({ emoji: reaction.emoji, users: [reaction.userId] });
      }
      return acc;
    }, []);
    return grouped;
  }
}

