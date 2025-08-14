import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { UserRole } from '../../users/schemas/user.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const RolesMeta = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const roles: UserRole[] = Reflect.getMetadata(ROLES_KEY, context.getHandler()) ?? [];
    if (!roles.length) return true;
    const userRole = request.user?.role;
    return roles.includes(userRole);
  }
}

export const Roles = (...roles: UserRole[]) =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), RolesMeta(...roles));;