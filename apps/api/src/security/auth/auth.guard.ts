import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from './public.decorator';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  school_id: string; // Tenant
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (isPublic) {
        return true;
      }
      this.logger.warn(`Access Denied: Missing or malformed authorization header for path: ${request.url}`);
      throw new UnauthorizedException('Token de autenticação ausente ou malformado.');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Get secret from env.
      // In Supabase, the JWT secret is usually SUPABASE_JWT_SECRET or JWT_SECRET or API_SECRET.
      // We will fall back to a standard string for development/testing if not configured.
      const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error(
          'CRITICAL: SUPABASE_JWT_SECRET or JWT_SECRET environment variable is not set. ' +
          'Authentication is disabled for security. Set the variable and restart the server.'
        );
      }

      const payload = jwt.verify(token, jwtSecret) as any;

      if (!payload) {
        throw new UnauthorizedException('Token inválido ou sem payload.');
      }

      // Map roles from DB/Supabase metadata or custom claims to standard roles: admin, teacher, student, parent
      let rawRole = payload.role || payload.user_metadata?.role || 'student';
      rawRole = rawRole.toLowerCase();
      
      let mappedRole: 'admin' | 'teacher' | 'student' | 'parent' = 'student';
      if (rawRole.includes('admin') || rawRole === 'super_admin') {
        mappedRole = 'admin';
      } else if (rawRole === 'teacher' || rawRole === 'professor') {
        mappedRole = 'teacher';
      } else if (rawRole === 'student' || rawRole === 'aluno') {
        mappedRole = 'student';
      } else if (rawRole === 'parent') {
        mappedRole = 'parent';
      }

      // Extract school_id (tenant context) from payload or user_metadata or default
      const schoolId = payload.school_id || payload.user_metadata?.school_id || 'default-school-id';

      // Inject the typed req.user
      request.user = {
        id: payload.sub || payload.user_id || payload.id,
        email: payload.email,
        role: mappedRole,
        school_id: schoolId,
      } as AuthenticatedUser;

      return true;
    } catch (error: any) {
      if (isPublic) {
        return true;
      }
      this.logger.error(`Authentication Failed: ${error.message} for path: ${request.url}`);
      throw new UnauthorizedException(`Sessão expirada ou token de assinatura inválido: ${error.message}`);
    }
  }
}
