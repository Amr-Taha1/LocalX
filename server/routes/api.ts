import express, { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Server as SocketIOServer } from 'socket.io';
import { db, DbPost, DbComment, DbStory, DbMessage, DbNotification } from '../db';
import { getLocalIpAddresses } from '../network';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Storage configuration with filename sanitization and MIME extension fallback
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'files';
    if (file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'videos';
    }
    const dest = path.join(UPLOADS_DIR, folder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) {
      if (file.mimetype === 'image/jpeg') ext = '.jpg';
      else if (file.mimetype === 'image/png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else if (file.mimetype === 'image/gif') ext = '.gif';
      else if (file.mimetype === 'image/svg+xml') ext = '.svg';
      else if (file.mimetype === 'video/mp4') ext = '.mp4';
      else if (file.mimetype === 'video/webm') ext = '.webm';
      else if (file.mimetype === 'video/quicktime') ext = '.mov';
      else if (file.mimetype === 'video/x-matroska') ext = '.mkv';
      else if (file.mimetype === 'application/pdf') ext = '.pdf';
      else ext = '.bin';
    }
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, safeName);
  },
});

// Upload limits (easily configurable from server config)
export const UPLOAD_LIMITS = {
  maxFileSizeMb: 100, // 100MB per file
  maxFilesPerUpload: 15,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/bmp', 'image/heic'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/avi', 'video/mpeg', 'video/3gpp'],
  allowedDocTypes: [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

const upload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_LIMITS.maxFileSizeMb * 1024 * 1024,
    files: UPLOAD_LIMITS.maxFilesPerUpload,
  },
  fileFilter: (req, file, cb) => {
    // Allow any image, video, audio, or document
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const isAudio = file.mimetype.startsWith('audio/');
    const isDoc =
      file.mimetype.startsWith('application/') ||
      file.mimetype.startsWith('text/') ||
      UPLOAD_LIMITS.allowedDocTypes.includes(file.mimetype);

    if (isImage || isVideo || isAudio || isDoc) {
      cb(null, true);
    } else {
      // Default allow with warning rather than crashing user uploads
      cb(null, true);
    }
  },
});

export function createApiRouter(io: SocketIOServer): Router {
  const router = express.Router();

  // Helper to sanitize users (strip PIN)
  const sanitizeUser = (user: any) => {
    const { pin, ...safeUser } = user;
    return safeUser;
  };

  // 1. Auth & Users
  router.get('/users', (req: Request, res: Response) => {
    const users = db.getUsers().map(sanitizeUser);
    res.json(users);
  });

  router.post('/auth/login', (req: Request, res: Response) => {
    const { userId, pin } = req.body;
    if (!userId || !pin) {
      return res.status(400).json({ error: 'User ID and PIN are required' });
    }

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.pin !== pin) {
      return res.status(401).json({ error: 'Invalid 4-digit PIN' });
    }

    return res.json({
      success: true,
      user: sanitizeUser(user),
    });
  });

  router.post('/auth/change-pin', (req: Request, res: Response) => {
    const { userId, currentPin, newPin } = req.body;
    if (!userId || !currentPin || !newPin) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.pin !== currentPin) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }

    db.updateUser(userId, { pin: newPin });
    res.json({ success: true, message: 'PIN updated successfully' });
  });

  router.get('/users/:id', (req: Request, res: Response) => {
    const user = db.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(sanitizeUser(user));
  });

  router.put('/users/:id/profile', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, nameAr, role, roleAr, bio, bioAr, hometown, work, education, avatar, cover } = req.body;
    
    // When a user sets their profile name or bio, set both English and Arabic fields to this chosen value
    // so it remains identical regardless of language toggle
    const chosenName = (name !== undefined ? name : nameAr)?.trim();
    const chosenBio = (bio !== undefined ? bio : bioAr);

    const updated = db.updateUser(id, {
      ...(chosenName !== undefined && { name: chosenName, nameAr: chosenName }),
      ...(role !== undefined && { role: role.trim() }),
      ...(roleAr !== undefined && { roleAr: roleAr.trim() }),
      ...(chosenBio !== undefined && { bio: chosenBio, bioAr: chosenBio }),
      ...(hometown !== undefined && { hometown }),
      ...(work !== undefined && { work }),
      ...(education !== undefined && { education }),
      ...(avatar !== undefined && { avatar }),
      ...(cover !== undefined && { cover }),
    });

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    const safeUser = sanitizeUser(updated);
    io.emit('user:profile_updated', safeUser);
    res.json(safeUser);
  });

  // 2. Posts
  router.get('/posts', (req: Request, res: Response) => {
    const posts = db.getPosts();
    const comments = db.getComments();

    const enriched = posts.map(p => ({
      ...p,
      commentsCount: comments.filter(c => c.postId === p.id).length,
    }));

    res.json(enriched);
  });

  router.post('/posts', (req: Request, res: Response) => {
    const { userId, text, media } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const newPost: DbPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      text: text || '',
      media: media || [],
      reactions: [],
      createdAt: new Date().toISOString(),
    };

    db.createPost(newPost);

    // Create notifications for other 3 family members
    const users = db.getUsers();
    const sender = users.find(u => u.id === userId);
    users.forEach(u => {
      if (u.id !== userId) {
        const notif: DbNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          recipientId: u.id,
          senderId: userId,
          type: 'post',
          targetId: newPost.id,
          summary: `${sender?.name || 'A family member'} shared a new post`,
          summaryAr: `نشر ${sender?.nameAr || 'فرد من العائلة'} منشوراً جديداً`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        db.createNotification(notif);
        io.emit('notification:new', notif);
      }
    });

    const enriched = { ...newPost, commentsCount: 0 };
    io.emit('post:created', enriched);
    io.emit('post:new', enriched);
    res.status(201).json(enriched);
  });

  router.put('/posts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { text, media, userId } = req.body;

    const existing = db.getPostById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this post' });
    }

    const updated = db.updatePost(id, {
      ...(text !== undefined && { text }),
      ...(media !== undefined && { media }),
    });

    const comments = db.getComments(id);
    const enriched = { ...updated, commentsCount: comments.length };
    io.emit('post:updated', enriched);
    res.json(enriched);
  });

  router.delete('/posts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    const existing = db.getPostById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    db.deletePost(id);
    io.emit('post:deleted', { id });
    res.json({ success: true, id });
  });

  // 3. Reactions
  router.post('/posts/:id/react', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, type } = req.body;

    const post = db.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    let reactions = post.reactions || [];
    const existingIndex = reactions.findIndex(r => r.userId === userId);

    if (existingIndex !== -1) {
      if (reactions[existingIndex].type === type) {
        // Toggle off (unlike)
        reactions.splice(existingIndex, 1);
      } else {
        // Update reaction
        reactions[existingIndex] = { userId, type, createdAt: new Date().toISOString() };
      }
    } else {
      reactions.push({ userId, type, createdAt: new Date().toISOString() });

      // Notify post author if not self
      if (post.userId !== userId) {
        const sender = db.getUserById(userId);
        const notif: DbNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          recipientId: post.userId,
          senderId: userId,
          type: 'reaction',
          targetId: post.id,
          summary: `${sender?.name || 'A family member'} reacted with ${type} to your post`,
          summaryAr: `تفاعل ${sender?.nameAr || 'فرد من العائلة'} مع منشورك`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        db.createNotification(notif);
        io.emit('notification:new', notif);
      }
    }

    db.updatePost(id, { reactions });
    const comments = db.getComments(id);
    const updatedPost = { ...post, reactions, commentsCount: comments.length };

    io.emit('post:reacted', { postId: id, reactions });
    io.emit('post:updated', updatedPost);
    res.json(updatedPost);
  });

  // 4. Comments
  router.get('/posts/:id/comments', (req: Request, res: Response) => {
    const comments = db.getComments(req.params.id);
    res.json(comments);
  });

  router.post('/posts/:id/comments', (req: Request, res: Response) => {
    const { id: postId } = req.params;
    const { userId, text, media, parentId } = req.body;

    if (!userId || (!text?.trim() && !media)) {
      return res.status(400).json({ error: 'User and comment text or media required' });
    }

    const post = db.getPostById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const newComment: DbComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      postId,
      userId,
      text: (text || '').trim(),
      media: media || undefined,
      parentId: parentId || undefined,
      reactions: [],
      createdAt: new Date().toISOString(),
    };

    db.createComment(newComment);

    const sender = db.getUserById(userId);

    // If this is a reply to another comment, notify the parent comment author
    if (parentId) {
      const allComments = db.getComments(postId);
      const parentComment = allComments.find(c => c.id === parentId);
      if (parentComment && parentComment.userId !== userId) {
        const replyNotif: DbNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          recipientId: parentComment.userId,
          senderId: userId,
          type: 'comment',
          targetId: post.id,
          summary: `${sender?.name || 'A family member'} replied to your comment`,
          summaryAr: `رد ${sender?.nameAr || 'فرد من العائلة'} على تعليقك`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        db.createNotification(replyNotif);
        io.emit('notification:new', replyNotif);
      }
    }

    // Notify post author if not self
    if (post.userId !== userId && (!parentId || post.userId !== (db.getComments(postId).find(c => c.id === parentId)?.userId))) {
      const notif: DbNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientId: post.userId,
        senderId: userId,
        type: 'comment',
        targetId: post.id,
        summary: `${sender?.name || 'A family member'} commented on your post`,
        summaryAr: `علق ${sender?.nameAr || 'فرد من العائلة'} على منشورك`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      db.createNotification(notif);
      io.emit('notification:new', notif);
    }

    io.emit('comment:created', newComment);
    res.status(201).json(newComment);
  });

  router.post('/comments/:id/react', (req: Request, res: Response) => {
    const { id: commentId } = req.params;
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ error: 'User and reaction type required' });
    }

    const updated = db.reactComment(commentId, userId, type);
    if (!updated) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Emit real-time comment reaction event
    io.emit('comment:reacted', {
      commentId,
      postId: updated.postId,
      reactions: updated.reactions || [],
      comment: updated,
    });

    // Notify comment author if reacted and not self
    const userReacted = updated.reactions?.find(r => r.userId === userId);
    if (userReacted && updated.userId !== userId) {
      const sender = db.getUserById(userId);
      const reactionLabels: Record<string, { en: string; ar: string }> = {
        like: { en: 'liked', ar: 'أعجب بـ' },
        love: { en: 'loved', ar: 'تفاعل بـ ❤️ مع' },
        haha: { en: 'reacted 😂 to', ar: 'تفاعل بـ 😂 مع' },
        wow: { en: 'reacted 😮 to', ar: 'تفاعل بـ 😮 مع' },
        sad: { en: 'reacted 😢 to', ar: 'تفاعل بـ 😢 مع' },
        angry: { en: 'reacted 😡 to', ar: 'تفاعل بـ 😡 مع' },
      };
      const label = reactionLabels[type] || { en: 'reacted to', ar: 'تفاعل مع' };

      const notif: DbNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientId: updated.userId,
        senderId: userId,
        type: 'reaction',
        targetId: updated.postId,
        summary: `${sender?.name || 'A family member'} ${label.en} your comment`,
        summaryAr: `${label.ar} ${sender?.nameAr || 'فرد من العائلة'} تعليقك`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      db.createNotification(notif);
      io.emit('notification:new', notif);
    }

    res.json(updated);
  });

  router.put('/comments/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, text } = req.body;

    const comments = db.getComments();
    const existing = comments.find(c => c.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = db.updateComment(id, text);
    io.emit('comment:updated', updated);
    res.json(updated);
  });

  router.delete('/comments/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    const comments = db.getComments();
    const existing = comments.find(c => c.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.deleteComment(id);
    io.emit('comment:deleted', { id, postId: existing.postId });
    res.json({ success: true, id });
  });

  // 5. Stories
  router.get('/stories', (req: Request, res: Response) => {
    const stories = db.getStories();
    res.json(stories);
  });

  router.post('/stories', (req: Request, res: Response) => {
    const { userId, text, bgColor, fontStyle, caption, media } = req.body;
    const mediaList = Array.isArray(media) ? media : [];
    const storyText = typeof text === 'string' ? text.trim() : '';

    if (!userId || (mediaList.length === 0 && !storyText)) {
      return res.status(400).json({ error: 'Either text or media is required for a story' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours expiry

    const newStory: DbStory = {
      id: `story-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      text: storyText || undefined,
      bgColor: bgColor || 'from-indigo-600 to-purple-800',
      fontStyle: fontStyle || 'sans',
      caption: caption || '',
      media: mediaList,
      createdAt: now.toISOString(),
      expiresAt,
      views: [userId],
    };

    db.createStory(newStory);

    // Notify other family members
    const users = db.getUsers();
    const sender = users.find(u => u.id === userId);
    users.forEach(u => {
      if (u.id !== userId) {
        const notif: DbNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          recipientId: u.id,
          senderId: userId,
          type: 'story',
          targetId: newStory.id,
          summary: `${sender?.name || 'A family member'} added a new story`,
          summaryAr: `نشر ${sender?.nameAr || 'فرد من العائلة'} قصة جديدة`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        db.createNotification(notif);
        io.emit('notification:new', notif);
      }
    });

    io.emit('story:created', newStory);
    res.status(201).json(newStory);
  });

  router.delete('/stories/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    const stories = db.getStories();
    const existing = stories.find(s => s.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Story not found' });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.deleteStory(id);
    io.emit('story:deleted', { id });
    res.json({ success: true, id });
  });

  router.post('/stories/:id/view', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const story = db.viewStory(id, userId);
    if (story) {
      io.emit('story:viewed', { storyId: id, userId });
    }
    res.json({ success: true });
  });

  router.post('/stories/:id/react', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ error: 'User ID and reaction type are required' });
    }

    const updated = db.reactStory(id, userId, type);
    if (!updated) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Broadcast story reaction
    io.emit('story:reacted', {
      storyId: id,
      reactions: updated.reactions || [],
      story: updated,
      reactedBy: userId,
      type,
    });

    // Notify story owner if not self
    const userReacted = updated.reactions?.find(r => r.userId === userId);
    if (userReacted && updated.userId !== userId) {
      const sender = db.getUserById(userId);
      const reactionLabels: Record<string, { en: string; ar: string }> = {
        like: { en: 'liked', ar: 'أعجب بـ' },
        love: { en: 'loved', ar: 'تفاعل بـ ❤️ مع' },
        haha: { en: 'reacted 😂 to', ar: 'تفاعل بـ 😂 مع' },
        wow: { en: 'reacted 😮 to', ar: 'تفاعل بـ 😮 مع' },
        sad: { en: 'reacted 😢 to', ar: 'تفاعل بـ 😢 مع' },
        angry: { en: 'reacted 😡 to', ar: 'تفاعل بـ 😡 مع' },
      };
      const label = reactionLabels[type] || { en: 'reacted to', ar: 'تفاعل مع' };

      const notif: DbNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientId: updated.userId,
        senderId: userId,
        type: 'reaction',
        targetId: updated.id,
        summary: `${sender?.name || 'A family member'} ${label.en} your story`,
        summaryAr: `${label.ar} ${sender?.nameAr || 'فرد من العائلة'} قصتك`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      db.createNotification(notif);
      io.emit('notification:new', notif);
    }

    res.json(updated);
  });

  // 6. Messages / Messenger
  router.get('/messages/:otherUserId', (req: Request, res: Response) => {
    const { otherUserId } = req.params;
    const currentUserId = req.query.currentUserId as string;

    if (!currentUserId) {
      return res.status(400).json({ error: 'currentUserId query param is required' });
    }

    // Mark unread messages from other user as read
    db.markMessagesRead(currentUserId, otherUserId);
    const messages = db.getMessages(currentUserId, otherUserId);
    res.json(messages);
  });

  router.post('/messages', (req: Request, res: Response) => {
    const { senderId, receiverId, text, media } = req.body;
    const mediaList = Array.isArray(media) ? media : [];
    const msgText = typeof text === 'string' ? text.trim() : '';

    if (!senderId || !receiverId || (!msgText && mediaList.length === 0)) {
      return res.status(400).json({ error: 'Message content or media is required' });
    }

    const newMsg: DbMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      receiverId,
      text: msgText,
      media: mediaList,
      createdAt: new Date().toISOString(),
      read: false,
    };

    db.createMessage(newMsg);

    // Notify receiver with descriptive summary
    const sender = db.getUserById(senderId);
    const senderName = sender?.name || 'A family member';
    const senderNameAr = sender?.nameAr || 'فرد من العائلة';

    let summary = '';
    let summaryAr = '';

    if (msgText) {
      const truncated = msgText.slice(0, 35) + (msgText.length > 35 ? '...' : '');
      summary = `${senderName}: "${truncated}"`;
      summaryAr = `${senderNameAr}: "${truncated}"`;
    } else if (mediaList.length > 0) {
      const hasImg = mediaList.some(m => m.type === 'image');
      const hasVid = mediaList.some(m => m.type === 'video');
      if (hasImg && hasVid) {
        summary = `${senderName} sent photos and videos`;
        summaryAr = `أرسل لك ${senderNameAr} صوراً ومقاطع فيديو`;
      } else if (hasImg) {
        summary = `${senderName} sent a photo`;
        summaryAr = `أرسل لك ${senderNameAr} صورة`;
      } else if (hasVid) {
        summary = `${senderName} sent a video`;
        summaryAr = `أرسل لك ${senderNameAr} مقطع فيديو`;
      } else {
        summary = `${senderName} sent an attachment`;
        summaryAr = `أرسل لك ${senderNameAr} ملفاً`;
      }
    }

    const notif: DbNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: receiverId,
      senderId,
      type: 'message',
      targetId: newMsg.id,
      summary,
      summaryAr,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.createNotification(notif);
    io.emit('notification:new', notif);

    io.emit('message:new', newMsg);
    res.status(201).json(newMsg);
  });

  router.delete('/messages/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    const success = db.deleteMessage(id, userId);
    if (success) {
      io.emit('message:deleted', { id });
      return res.json({ success: true, id });
    }
    return res.status(403).json({ error: 'Cannot delete this message' });
  });

  // 7. Notifications
  router.get(['/notifications', '/notifications/:userId'], (req: Request, res: Response) => {
    const userId = (req.params.userId || req.query.userId) as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const notifs = db.getNotifications(userId);
    res.json(notifs);
  });

  router.post('/notifications/read', (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    db.markNotificationsRead(userId);
    res.json({ success: true });
  });

  router.put(['/notifications/read-all', '/notifications/read'], (req: Request, res: Response) => {
    const userId = (req.body.userId || req.query.userId) as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    db.markNotificationsRead(userId);
    res.json({ success: true });
  });

  router.put('/notifications/:id/read', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;
    if (userId) {
      const notifs = db.getNotifications(userId);
      const target = notifs.find(n => n.id === id);
      if (target) {
        target.read = true;
      }
    }
    res.json({ success: true, id });
  });

  // 8. Upload endpoint (Supports multi-files: images, videos, documents)
  router.post('/upload', upload.array('files', UPLOAD_LIMITS.maxFilesPerUpload), (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedItems = files.map(file => {
        let type: 'image' | 'video' | 'file' = 'file';
        let subfolder = 'files';
        if (file.mimetype.startsWith('image/')) {
          type = 'image';
          subfolder = 'images';
        } else if (file.mimetype.startsWith('video/')) {
          type = 'video';
          subfolder = 'videos';
        }

        const url = `/uploads/${subfolder}/${file.filename}`;
        return {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          url,
          name: file.originalname,
          type,
          size: file.size,
          mimeType: file.mimetype,
        };
      });

      res.json({
        success: true,
        files: uploadedItems,
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      res.status(500).json({ error: err.message || 'File upload failed' });
    }
  });

  // 9. System / LAN Info
  router.get('/system/network', (req: Request, res: Response) => {
    const { primaryIp, allIps } = getLocalIpAddresses();
    const port = 3000;
    res.json({
      localIp: primaryIp,
      allIps,
      port,
      lanUrl: `http://${primaryIp}:${port}`,
      localhostUrl: `http://localhost:${port}`,
      uploadLimits: UPLOAD_LIMITS,
    });
  });

  // 10. Search across users, posts, comments
  router.get('/search', (req: Request, res: Response) => {
    const query = ((req.query.q as string) || '').toLowerCase().trim();
    if (!query) {
      return res.json({ users: [], posts: [], comments: [] });
    }

    const users = db.getUsers()
      .map(sanitizeUser)
      .filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.nameAr.includes(query) ||
        u.bio.toLowerCase().includes(query) ||
        u.bioAr.includes(query) ||
        u.work.toLowerCase().includes(query)
      );

    const posts = db.getPosts().filter(p => p.text.toLowerCase().includes(query));
    const comments = db.getComments().filter(c => c.text.toLowerCase().includes(query));

    res.json({
      users,
      posts,
      comments,
    });
  });

  return router;
}
