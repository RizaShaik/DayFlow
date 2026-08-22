import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../api/tokenStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { SocketContext } from './socket-context.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { status } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      setSocket(null);
      return;
    }

    const instance = io(SOCKET_URL, {
      auth: { token: getAccessToken() },
      withCredentials: true,
    });
    setSocket(instance);

    return () => {
      instance.disconnect();
    };
    // Re-connects whenever auth status flips (sign in/out). A long-lived
    // session outliving the 15m access token won't refresh this socket's
    // auth — acceptable for this scope, a real deployment would re-auth
    // the socket alongside the axios refresh flow.
  }, [status]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
