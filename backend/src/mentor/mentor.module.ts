import { Module } from '@nestjs/common';
import { MentorController } from './mentor.controller';
import { MentorService } from './mentor.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [NotificationsModule, EnrollmentsModule],
  controllers: [MentorController],
  providers: [MentorService],
})
export class MentorModule {}