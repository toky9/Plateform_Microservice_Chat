import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { ChatGateway } from 'src/websocket/chat/chat.gateway';
import {
  AddReactionDto,
  RemoveReactionDto,
  SendMessageDto,
  TogglePinDto,
  UpdateMessageDto,
} from './dto/send_message_dto';
import { join } from 'path';
import { unlink } from 'fs/promises';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway, // 👈 Injecter le gateway
  ) {}

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

  // Envoyer un message
  async sendMessage(dto: SendMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: dto.senderId,
        content: dto.content,
        type: dto.type || 'text',
        fileName: dto.fileName,
        fileSize: dto.fileSize,
      },
      include: {
        sender: true,
        reactions: true,
        readBy: true,
      },
    });

    const formattedMessage = {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      timestamp: message.createdAt,
      type: message.type as 'text' | 'image' | 'file',
      fileName: message.fileName,
      fileSize: message.fileSize,
      reactions: [],
      isEdited: message.isEdited,
      isPinned: message.isPinned,
      readBy: [],
    };

    // 🔥 Émettre le message via WebSocket
    this.chatGateway.emitToConversation(
      dto.conversationId,
      'message-received',
      { message: formattedMessage },
    );

    return formattedMessage;
  }

  // Ajouter une réaction
  async addReaction(dto: AddReactionDto) {
    // const existing = await this.prisma.reaction.findUnique({
    //   where: {
    //     messageId_userId_emoji: {
    //       messageId: dto.messageId,
    //       userId: dto.userId,
    //       emoji: dto.emoji,
    //     },
    //   },
    // });

    // // Add reaction
    // if (!existing) {
    //   await this.prisma.reaction.create({
    //     data: {
    //       messageId: dto.messageId,
    //       userId: dto.userId,
    //       emoji: dto.emoji,
    //     },
    //   });
    // }

    // Autoriser 1 seul reaction par utilisateur donc supprimer les anciens
    await this.prisma.reaction.deleteMany({
      where: {
        messageId: dto.messageId,
        userId: dto.userId,
      },
    });

    // Add reaction
    await this.prisma.reaction.create({
      data: {
        messageId: dto.messageId,
        userId: dto.userId,
        emoji: dto.emoji,
      },
    });

    const updatedMessage = await this.getMessageWithDetails(dto.messageId);

    // 🔥 Émettre la mise à jour via WebSocket
    this.chatGateway.emitToConversation(dto.conversationId, 'reaction-added', {
      message: updatedMessage,
    });

    return updatedMessage;
  }

  // Retirer une réaction
  async removeReaction(dto: RemoveReactionDto) {
    await this.prisma.reaction.deleteMany({
      where: {
        messageId: dto.messageId,
        userId: dto.userId,
        emoji: dto.emoji,
      },
    });

    const updatedMessage = await this.getMessageWithDetails(dto.messageId);

    // 🔥 Émettre la mise à jour via WebSocket
    const message = await this.prisma.message.findUnique({
      where: { id: dto.messageId },
    });

    this.chatGateway.emitToConversation(
      message!.conversationId,
      'reaction-removed',
      { message: updatedMessage },
    );

    return updatedMessage;
  }

  // Modifier un message
  async editMessage(messageId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: dto.content,
        isEdited: true,
      },
      include: {
        sender: true,
        reactions: true,
        readBy: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    const formattedMessage = {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      timestamp: message.createdAt,
      type: message.type as 'text' | 'image' | 'file',
      fileName: message.fileName,
      fileSize: message.fileSize,
      reactions: this.groupReactions(message.reactions),
      isEdited: message.isEdited,
      isPinned: message.isPinned,
      readBy: message.readBy.map((r) => r.userId),
    };

    // 🔥 Émettre la modification via WebSocket
    this.chatGateway.emitToConversation(dto.conversationId, 'message-edited', {
      message: formattedMessage,
    });

    return formattedMessage;
  }

  // Supprimer un message
  // async deleteMessage(messageId: string, conversationId: string) {
  //   await this.prisma.message.delete({
  //     where: { id: messageId },
  //   });

  //   // 🔥 Émettre la suppression via WebSocket
  //   this.chatGateway.emitToConversation(conversationId, 'message-deleted', {
  //     messageId,
  //   });
  // }

  async deleteMessage(messageId: string, conversationId: string) {
    // 1. Récupérer le message
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message introuvable');
    }

    // 2. Supprimer le fichier si message de type file
    if (
      (message.type === 'file' || message.type === 'image') &&
      message.fileName
    ) {
      const filePath = join(process.cwd(), 'uploads', message.fileName);

      try {
        await unlink(filePath);
      } catch (err) {
        // Log uniquement — ne pas bloquer la suppression du message
        console.error('Erreur suppression fichier:', err.message);
      }
    }
    // 3. Supprimer le message (cascade FK OK)

    // ✅ UNE SEULE suppression
    // Reaction et ReadReceipt : onDelete: Cascade
    await this.prisma.message.delete({
      where: { id: messageId },
    });

    // Si sans delete en cascade onDelete: Cascade

    // await this.prisma.$transaction([
    //   this.prisma.reaction.deleteMany({
    //     where: { messageId },
    //   }),
    //   this.prisma.readReceipt.deleteMany({
    //     where: { messageId },
    //   }),
    //   this.prisma.message.delete({
    //     where: { id: messageId },
    //   }),
    // ]);

    this.chatGateway.emitToConversation(conversationId, 'message-deleted', {
      messageId,
    });

    const reponse = {
      succes: true,
      message: 'Message supprimer',
    };

    return reponse;
  }

  // Épingler/Désépingler
  async togglePin(messageId: string, dto: TogglePinDto) {
    const message = await this.prisma.message.update({
      where: { id: messageId },
      data: { isPinned: dto.isPinned },
      include: {
        sender: true,
        reactions: true,
        readBy: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    const formattedMessage = {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      timestamp: message.createdAt,
      type: message.type as 'text' | 'image' | 'file',
      fileName: message.fileName,
      fileSize: message.fileSize,
      reactions: this.groupReactions(message.reactions),
      isEdited: message.isEdited,
      isPinned: message.isPinned,
      readBy: message.readBy.map((r) => r.userId),
    };

    // 🔥 Émettre le changement via WebSocket
    this.chatGateway.emitToConversation(dto.conversationId, 'message-pinned', {
      message: formattedMessage,
    });

    return formattedMessage;
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

    // 🔥 Émettre la lecture via WebSocket
    this.chatGateway.emitToConversation(conversationId, 'messages-read', {
      userId,
    });
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

  // Méthode privée pour récupérer un message avec tous les détails
  private async getMessageWithDetails(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: true,
        reactions: true,
        readBy: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    return {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      timestamp: message.createdAt,
      type: message.type as 'text' | 'image' | 'file',
      fileName: message.fileName,
      fileSize: message.fileSize,
      reactions: this.groupReactions(message.reactions),
      isEdited: message.isEdited,
      isPinned: message.isPinned,
      readBy: message.readBy.map((r) => r.userId),
    };
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
