import { IsEnum } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class UpdateUserRoleDto {
  @IsEnum(UserRole, { message: 'role must be one of: admin | client' })
  role: UserRole;
}