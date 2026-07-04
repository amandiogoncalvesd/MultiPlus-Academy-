import { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.guard';

export interface TenantContext {
  school_id: string;
  user_id: string;
  role: string;
}

/**
 * Extracts and returns the tenant (school_id) context from the request.
 * Useful for service-level operations to enforce multi-tenancy rules.
 */
export function getTenantContext(req: Request): TenantContext {
  const user = req.user as AuthenticatedUser;
  if (!user) {
    return {
      school_id: 'default-school-id',
      user_id: 'anonymous',
      role: 'anonymous',
    };
  }

  return {
    school_id: user.school_id,
    user_id: user.id,
    role: user.role,
  };
}
