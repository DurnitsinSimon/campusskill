import { Role } from '../generated/prisma/enums';

export interface JwtPayload {
  sub: number; 
  role: Role;
}