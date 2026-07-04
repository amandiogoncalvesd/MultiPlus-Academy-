import { SetMetadata } from '@nestjs/common';

export type UserRoleType = 'admin' | 'teacher' | 'student' | 'parent';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoleType[]) => SetMetadata(ROLES_KEY, roles);
