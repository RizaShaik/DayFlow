import { useContext } from 'react';
import { SocketContext } from '../context/socket-context.js';

/** Returns the current Socket.IO connection, or null if not yet connected
 * (e.g. still authenticating). Consumers should guard for null. */
export function useSocket() {
  return useContext(SocketContext);
}
