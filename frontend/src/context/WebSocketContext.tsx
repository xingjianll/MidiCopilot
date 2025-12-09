import React, { createContext, useContext, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNotifications } from './NotificationContext';

interface WebSocketContextType {
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useNotifications();
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:8000/ws');

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'run_complete') {
        addNotification({
          type: 'success',
          title: 'Run Completed',
          message: `Run ${lastMessage.run_id} completed successfully${
            lastMessage.sample_id ? ` (Sample ID: ${lastMessage.sample_id})` : ''
          }`,
          duration: 5000,
        });
      } else if (lastMessage.type === 'run_failed') {
        addNotification({
          type: 'error',
          title: 'Run Failed',
          message: `Run ${lastMessage.run_id} failed: ${lastMessage.error}`,
          duration: 7000,
        });
      }
    }
  }, [lastMessage, addNotification]);

  return (
    <WebSocketContext.Provider value={{ isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};