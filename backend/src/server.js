import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { initSockets } from './sockets/index.js';
import { logger } from './utils/logger.js';

const app = createApp();
const httpServer = http.createServer(app);

initSockets(httpServer);

httpServer.listen(env.port, () => {
  logger.info(`Dayflow API listening on http://localhost:${env.port} [${env.nodeEnv}]`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});
