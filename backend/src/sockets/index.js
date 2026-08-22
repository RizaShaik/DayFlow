import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Real-time channel used for live attendance status (present/absent/on-leave
 * dots on employee cards) and future in-app notifications.
 * Wired up in Phase 5 alongside the attendance module.
 */
export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error('missing token');
      const payload = jwt.verify(token, env.jwt.accessSecret);
      socket.user = payload;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`company:${socket.user.companyId}`);
    logger.debug(`socket connected: user=${socket.user.sub}`);
  });

  return io;
}
