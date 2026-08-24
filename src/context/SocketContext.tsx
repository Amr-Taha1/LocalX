import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { UserId } from '../types';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: UserId[];
  isUserOnline: (userId: UserId) => boolean;
  typingUsers: Map<string, string>; // senderId -> senderName
  sendTypingStart: (receiverId: UserId) => void;
  sendTypingStop: (receiverId: UserId) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<UserId[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Connect to server (same origin on LAN)
    const newSocket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      if (currentUser) {
        newSocket.emit('user:online', currentUser.id);
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('presence:update', (users: UserId[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('typing:start', ({ senderId }: { senderId: string }) => {
      setTypingUsers(prev => new Map(prev).set(senderId, senderId));
    });

    newSocket.on('typing:stop', ({ senderId }: { senderId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.delete(senderId);
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Update online presence when current user changes
  useEffect(() => {
    if (socket && connected && currentUser) {
      socket.emit('user:online', currentUser.id);
    }
  }, [currentUser, socket, connected]);

  const isUserOnline = (userId: UserId) => {
    // Current user is always considered online if connected
    if (currentUser?.id === userId && connected) return true;
    return onlineUsers.includes(userId);
  };

  const sendTypingStart = (receiverId: UserId) => {
    if (socket && currentUser) {
      socket.emit('typing:start', { senderId: currentUser.id, receiverId });
    }
  };

  const sendTypingStop = (receiverId: UserId) => {
    if (socket && currentUser) {
      socket.emit('typing:stop', { senderId: currentUser.id, receiverId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        onlineUsers,
        isUserOnline,
        typingUsers,
        sendTypingStart,
        sendTypingStop,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
