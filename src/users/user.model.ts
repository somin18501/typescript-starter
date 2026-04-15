import { Prisma } from '@prisma/client';

export type User = Prisma.UserGetPayload<Record<string, never>>;

export type UpdateUserData = Partial<
  Pick<User, 'email' | 'password' | 'admin'>
>;
