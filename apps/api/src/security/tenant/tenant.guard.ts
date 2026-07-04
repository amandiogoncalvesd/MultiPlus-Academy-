import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.guard';

@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      this.logger.error('TenantGuard applied but no authenticated user is present.');
      throw new ForbiddenException('Acesso negado: Contexto de utilizador indisponível.');
    }

    if (!user.school_id) {
      this.logger.error(`User ${user.id} has no school_id (tenant context) assigned.`);
      throw new ForbiddenException('Acesso negado: Não pertence a nenhuma escola (Tenant).');
    }

    // Check request parameters (e.g. /courses/:schoolId or similar)
    const paramSchoolId = request.params.schoolId || request.params.school_id || request.query.schoolId || request.query.school_id || request.body.schoolId || request.body.school_id;

    if (paramSchoolId && paramSchoolId !== user.school_id) {
      // Admins are generally allowed to bypass cross-tenant validation if managing schools, 
      // but under strict Zero-Trust, we can log and prevent it, or allow only if user.role === 'admin'
      if (user.role === 'admin') {
        this.logger.log(`Admin ${user.id} accessing cross-tenant resource: Target School: ${paramSchoolId}`);
        return true;
      }

      this.logger.error(
        `Cross-Tenant Access Breach Attempt - User ${user.id} (${user.email}) from school '${user.school_id}' tried to access resource belonging to school '${paramSchoolId}'`
      );
      throw new ForbiddenException(
        'Acesso negado: Não possui permissão para consultar dados de outra escola (multi-tenant boundary violation).'
      );
    }

    return true;
  }
}
