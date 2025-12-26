import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

// @UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  // Obtenir les utilisateurs disponibles (sauf l'utilisateur actuel)
  @Get()
  getAvailableUsers(@Query('excludeId') excludeId: string) {
    return this.service.getAvailableUsers(excludeId);
  }
}