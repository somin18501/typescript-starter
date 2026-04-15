import { Prisma } from '@prisma/client';

export type Report = Prisma.ReportGetPayload<Record<string, never>>;
export type ReportWithUser = Prisma.ReportGetPayload<{
  include: { user: true };
}>;
