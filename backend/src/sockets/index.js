import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let ioInstance = null;

/**
 * Real-time channel used for live attendance status (present/absent/on-leave
 * dots on employee cards) and future in-app notifications. Every connection
 * joins a room scoped to its company so events never cross tenants.
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

  ioInstance = io;
  return io;
}

/** Used by services (e.g. attendance) to push events without importing the
 * Express/HTTP layer. Safe to call before sockets are initialized (e.g. in
 * tests that boot the app without a real HTTP server) — just no-ops. */
export function emitToCompany(companyId, event, payload) {
  ioInstance?.to(`company:${companyId}`).emit(event, payload);
}
