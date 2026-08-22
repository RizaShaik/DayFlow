import { z } from 'zod';

export const createLeaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  remarks: z.string().trim().max(500).optional(),
});

export const decideRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewComment: z.string().trim().max(500).optional(),
});

export const listRequestsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const requestIdParamsSchema = z.object({
  id: z.string().uuid(),
});
