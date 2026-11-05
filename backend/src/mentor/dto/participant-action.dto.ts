import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { EnrollmentStatus } from '../../generated/prisma/enums';

export const PARTICIPANT_ACTIONS = [EnrollmentStatus.ATTENDED, EnrollmentStatus.NO_SHOW, EnrollmentStatus.REJECTED] as const;

export class ParticipantActionDto {
  @ApiProperty({ enum: PARTICIPANT_ACTIONS, description: 'Посетил, не пришёл или отклонить заявку' })
  @IsIn(PARTICIPANT_ACTIONS)
  status!: (typeof PARTICIPANT_ACTIONS)[number];
}