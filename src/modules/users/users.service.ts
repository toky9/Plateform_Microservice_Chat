import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Récupérer tous les utilisateurs sauf celui spécifié
  async getAvailableUsers(excludeId?: string) {
    const users = await this.prisma.user.findMany({
      where: excludeId ? {
        id: { not: excludeId }
      } : undefined,
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      status: user.status,
    }));
  }
}