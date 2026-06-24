import { UserRole, UserStatus } from "@prisma/client";

export interface CurrentUserType {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
