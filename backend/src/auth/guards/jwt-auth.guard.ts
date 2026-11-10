import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token)
      throw new UnauthorizedException('Требуется авторизация');

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Токен недействителен или истёк');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true, isBlocked: true },
    });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    if (user.isBlocked)
      throw new ForbiddenException('Аккаунт заблокирован администратором');

    request.user = { sub: payload.sub, role: user.role };
    return true;
  }
}
