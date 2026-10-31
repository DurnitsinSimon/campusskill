import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { WorkshopsModule } from './workshops/workshops.module';
import { SkillsModule } from './skills/skills.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';


@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    WorkshopsModule,
    SkillsModule,
    NotificationsModule,
    EnrollmentsModule
  ],
  controllers: [AppController],
})
export class AppModule {}
