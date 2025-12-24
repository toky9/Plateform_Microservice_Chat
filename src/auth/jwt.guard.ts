// auth/jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return false

    const payload = this.jwt.verify(token)
    req.user = payload
    return true
  }
}
