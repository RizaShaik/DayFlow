import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { employeesRouter } from '../modules/employees/employees.routes.js';
import { departmentsRouter } from '../modules/departments/departments.routes.js';
import { attendanceRouter } from '../modules/attendance/attendance.routes.js';
import { timeoffRouter } from '../modules/timeoff/timeoff.routes.js';
import { payrollRouter } from '../modules/payroll/payroll.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', async (req, res) => {
  let dbConnected = false;
  try {
    dbConnected = await checkDatabaseConnection();
  } catch {
    dbConnected = false;
  }
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptimeSeconds: process.uptime(),
      db: dbConnected ? 'connected' : 'unavailable',
    },
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/employees', employeesRouter);
apiRouter.use('/departments', departmentsRouter);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/timeoff', timeoffRouter);
apiRouter.use('/payroll', payrollRouter);
