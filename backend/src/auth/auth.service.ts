import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../generated/prisma/enums';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await hash(dto.password, 10),
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role ?? Role.PARTICIPANT,
      },
      omit: { passwordHash: true },
    });
    
    return { accessToken: this.sign(user.id, user.role), user };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    if (user.isBlocked) {
      throw new ForbiddenException('Аккаунт заблокирован');
    }

    const { passwordHash: _, ...publicUser } = user;
    return { accessToken: this.sign(user.id, user.role), user: publicUser };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: { passwordHash: true },
      include: { mentorProfile: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  private sign(userId: number, role: Role) {
    const payload: JwtPayload = { sub: userId, role };
    return this.jwt.sign(payload);
  }
}