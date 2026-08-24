import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { db } from './db';

// Track connected sockets per user
const userSockets = new Map<string, Set<string>>();

export function setupSocketIO(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    let currentUserId: string | null = null;

    socket.on('user:online', (userId: string) => {
      if (!userId) return;
      currentUserId = userId;
      
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);

      // Broadcast list of currently online users
      const onlineUsers = Array.from(userSockets.keys()).filter(id => (userSockets.get(id)?.size ?? 0) > 0);
      io.emit('presence:update', onlineUsers);
    });

    socket.on('typing:start', ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
      // Send to receiver sockets
      const sockets = userSockets.get(receiverId);
      if (sockets) {
        sockets.forEach(sockId => {
          io.to(sockId).emit('typing:start', { senderId });
        });
      }
    });

    socket.on('typing:stop', ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
      const sockets = userSockets.get(receiverId);
      if (sockets) {
        sockets.forEach(sockId => {
          io.to(sockId).emit('typing:stop', { senderId });
        });
      }
    });

    socket.on('disconnect', () => {
      if (currentUserId && userSockets.has(currentUserId)) {
        const set = userSockets.get(currentUserId)!;
        set.delete(socket.id);
        if (set.size === 0) {
          userSockets.delete(currentUserId);
        }
      }
      const onlineUsers = Array.from(userSockets.keys()).filter(id => (userSockets.get(id)?.size ?? 0) > 0);
      io.emit('presence:update', onlineUsers);
    });
  });

  return io;
}
