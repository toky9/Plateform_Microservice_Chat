// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export type JwtPayload = {
    sub: string;
    email: string;
    type: UserType;
    role: string;
    avatarUrl: string;
    verified: boolean;
    name: string;
};

type UserType = "ASSOCIATION" | "GIVER_PRO" | "GIVER_PERSONAL"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    const token = req?.cookies?.['access_token'];
                    return token;
                },
                ExtractJwt.fromAuthHeaderAsBearerToken(), // optionnel si tu veux les deux
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.secret'),
        });
    }

    async validate(payload: JwtPayload) {
        return {
            id: payload.sub,
            type: payload.type,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            avatarUrl: payload.avatarUrl,
            verified: payload.verified,
        };
    }
}
