
import { Injectable, OnModuleInit } from '@nestjs/common';
import { prisma } from './prisma.config';

@Injectable()
export class PrismaService implements OnModuleInit {
  async onModuleInit() {
    await prisma.$connect();
  }

  get conversation() {
    return prisma.conversation;
  }

  get message() {
    return prisma.message;
  }

  get user() {
    return prisma.user;
  }

  get conversationParticipant() {
    return prisma.conversationParticipant;
  }

  get reaction() {
    return prisma.reaction;
  }

  get readReceipt() {
    return prisma.readReceipt;
  }
}

