import { z } from 'zod';

export const configureSalarySchema = z.object({
  monthlyWage: z.coerce.number().positive().max(100_000_000),
  workingDaysPerWeek: z.coerce.number().int().min(1).max(7).default(5),
  breakTimeHours: z.coerce.number().min(0).max(8).default(1),
});

export const employeeIdParamsSchema = z.object({
  employeeId: z.string().uuid(),
});
