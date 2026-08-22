const levels = ['debug', 'info', 'warn', 'error'];

function timestamp() {
  return new Date().toISOString();
}

function log(level, ...args) {
  const line = `[${timestamp()}] [${level.toUpperCase()}]`;
  console[level === 'debug' ? 'log' : level](line, ...args);
}

export const logger = Object.fromEntries(
  levels.map((level) => [level, (...args) => log(level, ...args)])
);
