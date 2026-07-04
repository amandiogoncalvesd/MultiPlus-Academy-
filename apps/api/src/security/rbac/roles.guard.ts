import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserRoleType } from './roles.decorator';
import { AuthenticatedUser } from '../auth/auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow passage (handled by AuthGuard/TenantGuard)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      this.logger.error('RolesGuard applied but no user found in request context.');
      throw new ForbiddenException('Acesso negado: Utilizador não autenticado.');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      this.logger.warn(
        `Security Breach Attempt - User ${user.id} (${user.email}) with role '${user.role}' tried to access role-restricted path: ${request.url}. Required roles: ${requiredRoles.join(', ')}`
      );
      throw new ForbiddenException(
        `Acesso negado: Perfil '${user.role}' não tem permissão para esta funcionalidade.`
      );
    }

    return true;
  }
}
