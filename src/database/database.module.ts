// database.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Permet de rendre PrismaService injectable partout sans le re-déclarer
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
