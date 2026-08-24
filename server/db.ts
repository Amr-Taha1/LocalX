import fs from 'fs';
import path from 'path';

export interface DbUser {
  id: 'ahmed' | 'mohamed' | 'sara' | 'amr';
  name: string;
  nameAr: string;
  role: string;
  roleAr: string;
  avatar: string;
  cover: string;
  bio: string;
  bioAr: string;
  hometown: string;
  work: string;
  education: string;
  joinedDate: string;
  pin: string; // 4-digit PIN
}

export interface DbPost {
  id: string;
  userId: 'ahmed' | 'mohamed' | 'sara' | 'amr';
  text: string;
  media: Array<{
    id: string;
    url: string;
    type: 'image' | 'video' | 'file';
    name: string;
    size?: number;
    mimeType?: string;
  }>;
  reactions: Array<{
    userId: 'ahmed' | 'mohamed' | 'sara' | 'amr';
    type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface DbComment {
  id: string;
  postId: string;
  userId: 'ahmed' | 'mohamed' | 'sara' | 'amr';
  text: string;
  media?: {
    id: string;
    url: string;
    type: 'image' | 'video' | 'file';
    name: string;
    size?: number;
    mimeType?: string;
  };
  parentId?: string;
  reactions?: Array<{
    userId: 'ahmed' | 'mohamed' | 'sara' | 'amr';
    type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface DbStory {
  id: string;
  userId: 'ahmed' | 'mohamed' | 'sara' | 'amr';
  text?: string;
  bgColor?: string;
  fontStyle?: string;
  caption?: string;
  media: Array<{
    id: string;
    url: string;
    type: 'image' | 'video';
    duration?: number;
  }>;
  reactions?: Array<{
    userId: 'ahmed' | 'mohamed' | 'sara' | 'amr';
    type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
    createdAt: string;
  }>;
  createdAt: string;
  expiresAt: string;
  views: Array<'ahmed' | 'mohamed' | 'sara' | 'amr'>;
}

export interface DbMessage {
  id: string;
  senderId: 'ahmed' | 'mohamed' | 'sara' | 'amr';
  receiverId: 'ahmed' | 'mohamed' | 'sara' | 'amr';
  text: string;
  media?: Array<{
    id: string;
    url: string;
    type: 'image' | 'video' | 'file';
    name: string;
    size?: number;
    mimeType?: string;
  }>;
  createdAt: string;
  read: boolean;
}

export interface DbNotification {
  id: string;
  recipientId: 'ahmed' | 'mohamed' | 'sara' | 'amr';
  senderId: 'ahmed' | 'mohamed' | 'sara' | 'amr';
  type: 'post' | 'comment' | 'reaction' | 'message' | 'story';
  targetId?: string;
  summary: string;
  summaryAr: string;
  read: boolean;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure directories exist
export function initFileSystem() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const uploadSubdirs = ['images', 'videos', 'files', 'stories', 'avatars', 'covers'];
  for (const sub of uploadSubdirs) {
    const p = path.join(UPLOADS_DIR, sub);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
  }

  // Check and initialize default JSON databases
  initUsers();
  initPosts();
  initComments();
  initStories();
  initChats();
  initNotifications();
}

function readJson<T>(filename: string, defaultValue: T): T {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      writeJson(filename, defaultValue);
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return defaultValue;
  }
}

function writeJson<T>(filename: string, data: T): void {
  const filePath = path.join(DATA_DIR, filename);
  const tempPath = `${filePath}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
  }
}

// Preset default users (clean slate ready for use from scratch)
const DEFAULT_USERS: DbUser[] = [
  {
    id: 'ahmed',
    name: 'Ahmed',
    nameAr: 'أحمد',
    role: '',
    roleAr: '',
    avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="%234f46e5"/><text x="50%" y="54%" font-size="44" font-family="system-ui,-apple-system,sans-serif" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">A</text></svg>',
    cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400"><rect width="1200" height="400" fill="%231e293b"/></svg>',
    bio: '',
    bioAr: '',
    hometown: '',
    work: '',
    education: '',
    joinedDate: '2025-01-01T00:00:00.000Z',
    pin: '1111',
  },
  {
    id: 'mohamed',
    name: 'Mohamed',
    nameAr: 'محمد',
    role: '',
    roleAr: '',
    avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="%232563eb"/><text x="50%" y="54%" font-size="44" font-family="system-ui,-apple-system,sans-serif" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">M</text></svg>',
    cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400"><rect width="1200" height="400" fill="%231e293b"/></svg>',
    bio: '',
    bioAr: '',
    hometown: '',
    work: '',
    education: '',
    joinedDate: '2025-01-01T00:00:00.000Z',
    pin: '2222',
  },
  {
    id: 'sara',
    name: 'Sara',
    nameAr: 'سارة',
    role: '',
    roleAr: '',
    avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="%23db2777"/><text x="50%" y="54%" font-size="44" font-family="system-ui,-apple-system,sans-serif" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">S</text></svg>',
    cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400"><rect width="1200" height="400" fill="%231e293b"/></svg>',
    bio: '',
    bioAr: '',
    hometown: '',
    work: '',
    education: '',
    joinedDate: '2025-01-01T00:00:00.000Z',
    pin: '3333',
  },
  {
    id: 'amr',
    name: 'Amr',
    nameAr: 'عمرو',
    role: '',
    roleAr: '',
    avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="%23d97706"/><text x="50%" y="54%" font-size="44" font-family="system-ui,-apple-system,sans-serif" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">A</text></svg>',
    cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400"><rect width="1200" height="400" fill="%231e293b"/></svg>',
    bio: '',
    bioAr: '',
    hometown: '',
    work: '',
    education: '',
    joinedDate: '2025-01-01T00:00:00.000Z',
    pin: '4444',
  },
];

function initUsers() {
  const users = readJson<DbUser[]>('users.json', []);
  if (users.length === 0) {
    writeJson('users.json', DEFAULT_USERS);
  }
}

function initPosts() {
  const posts = readJson<DbPost[]>('posts.json', []);
  if (posts.length === 0) {
    writeJson('posts.json', []);
  }
}

function initComments() {
  const comments = readJson<DbComment[]>('comments.json', []);
  if (comments.length === 0) {
    writeJson('comments.json', []);
  }
}

function initStories() {
  const stories = readJson<DbStory[]>('stories.json', []);
  if (stories.length === 0) {
    writeJson('stories.json', []);
  }
}

function initChats() {
  const chats = readJson<DbMessage[]>('chats.json', []);
  if (chats.length === 0) {
    writeJson('chats.json', []);
  }
}

function initNotifications() {
  const notifs = readJson<DbNotification[]>('notifications.json', []);
  if (notifs.length === 0) {
    writeJson('notifications.json', []);
  }
}

// Database CRUD exports
export const db = {
  getUsers: () => readJson<DbUser[]>('users.json', DEFAULT_USERS),
  getUserById: (id: string) => readJson<DbUser[]>('users.json', DEFAULT_USERS).find(u => u.id === id),
  updateUser: (id: string, updates: Partial<DbUser>) => {
    const users = readJson<DbUser[]>('users.json', DEFAULT_USERS);
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      writeJson('users.json', users);
      return users[idx];
    }
    return null;
  },

  getPosts: () => readJson<DbPost[]>('posts.json', []),
  getPostById: (id: string) => readJson<DbPost[]>('posts.json', []).find(p => p.id === id),
  createPost: (post: DbPost) => {
    const posts = readJson<DbPost[]>('posts.json', []);
    posts.unshift(post);
    writeJson('posts.json', posts);
    return post;
  },
  updatePost: (id: string, updates: Partial<DbPost>) => {
    const posts = readJson<DbPost[]>('posts.json', []);
    const idx = posts.findIndex(p => p.id === id);
    if (idx !== -1) {
      posts[idx] = { ...posts[idx], ...updates, updatedAt: new Date().toISOString() };
      writeJson('posts.json', posts);
      return posts[idx];
    }
    return null;
  },
  deletePost: (id: string) => {
    const posts = readJson<DbPost[]>('posts.json', []);
    const filtered = posts.filter(p => p.id !== id);
    writeJson('posts.json', filtered);
    // Also delete associated comments
    const comments = readJson<DbComment[]>('comments.json', []);
    writeJson('comments.json', comments.filter(c => c.postId !== id));
    return true;
  },

  getComments: (postId?: string) => {
    const comments = readJson<DbComment[]>('comments.json', []);
    if (postId) {
      return comments.filter(c => c.postId === postId);
    }
    return comments;
  },
  createComment: (comment: DbComment) => {
    const comments = readJson<DbComment[]>('comments.json', []);
    comments.push(comment);
    writeJson('comments.json', comments);
    return comment;
  },
  updateComment: (id: string, text: string) => {
    const comments = readJson<DbComment[]>('comments.json', []);
    const idx = comments.findIndex(c => c.id === id);
    if (idx !== -1) {
      comments[idx].text = text;
      comments[idx].updatedAt = new Date().toISOString();
      writeJson('comments.json', comments);
      return comments[idx];
    }
    return null;
  },
  deleteComment: (id: string) => {
    const comments = readJson<DbComment[]>('comments.json', []);
    // Also delete nested replies if deleting parent comment
    const filtered = comments.filter(c => c.id !== id && c.parentId !== id);
    writeJson('comments.json', filtered);
    return true;
  },
  reactComment: (id: string, userId: 'ahmed' | 'mohamed' | 'sara' | 'amr', type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') => {
    const comments = readJson<DbComment[]>('comments.json', []);
    const comment = comments.find(c => c.id === id);
    if (!comment) return null;

    if (!comment.reactions) {
      comment.reactions = [];
    }

    const existingIdx = comment.reactions.findIndex(r => r.userId === userId);
    if (existingIdx !== -1) {
      if (comment.reactions[existingIdx].type === type) {
        // Toggle off if clicking same reaction
        comment.reactions.splice(existingIdx, 1);
      } else {
        // Change reaction
        comment.reactions[existingIdx] = {
          userId,
          type,
          createdAt: new Date().toISOString(),
        };
      }
    } else {
      comment.reactions.push({
        userId,
        type,
        createdAt: new Date().toISOString(),
      });
    }

    writeJson('comments.json', comments);
    return comment;
  },

  getStories: () => {
    const stories = readJson<DbStory[]>('stories.json', []);
    const now = new Date().toISOString();
    // Return only active unexpired stories
    return stories.filter(s => s.expiresAt > now);
  },
  createStory: (story: DbStory) => {
    const stories = readJson<DbStory[]>('stories.json', []);
    stories.unshift(story);
    writeJson('stories.json', stories);
    return story;
  },
  deleteStory: (id: string) => {
    const stories = readJson<DbStory[]>('stories.json', []);
    writeJson('stories.json', stories.filter(s => s.id !== id));
    return true;
  },
  viewStory: (storyId: string, userId: 'ahmed' | 'mohamed' | 'sara' | 'amr') => {
    const stories = readJson<DbStory[]>('stories.json', []);
    const story = stories.find(s => s.id === storyId);
    if (story && !story.views.includes(userId)) {
      story.views.push(userId);
      writeJson('stories.json', stories);
    }
    return story;
  },
  reactStory: (storyId: string, userId: 'ahmed' | 'mohamed' | 'sara' | 'amr', type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') => {
    const stories = readJson<DbStory[]>('stories.json', []);
    const story = stories.find(s => s.id === storyId);
    if (!story) return null;

    if (!story.reactions) {
      story.reactions = [];
    }

    const existingIdx = story.reactions.findIndex(r => r.userId === userId);
    if (existingIdx !== -1) {
      if (story.reactions[existingIdx].type === type) {
        // Toggle off if same reaction
        story.reactions.splice(existingIdx, 1);
      } else {
        // Change reaction
        story.reactions[existingIdx] = {
          userId,
          type,
          createdAt: new Date().toISOString(),
        };
      }
    } else {
      story.reactions.push({
        userId,
        type,
        createdAt: new Date().toISOString(),
      });
    }

    writeJson('stories.json', stories);
    return story;
  },

  getMessages: (user1: string, user2: string) => {
    const messages = readJson<DbMessage[]>('chats.json', []);
    return messages.filter(
      m => (m.senderId === user1 && m.receiverId === user2) || (m.senderId === user2 && m.receiverId === user1)
    );
  },
  createMessage: (msg: DbMessage) => {
    const messages = readJson<DbMessage[]>('chats.json', []);
    messages.push(msg);
    writeJson('chats.json', messages);
    return msg;
  },
  deleteMessage: (id: string, userId: string) => {
    const messages = readJson<DbMessage[]>('chats.json', []);
    const msg = messages.find(m => m.id === id);
    if (msg && msg.senderId === userId) {
      writeJson('chats.json', messages.filter(m => m.id !== id));
      return true;
    }
    return false;
  },
  markMessagesRead: (receiverId: string, senderId: string) => {
    const messages = readJson<DbMessage[]>('chats.json', []);
    let updated = false;
    for (const m of messages) {
      if (m.receiverId === receiverId && m.senderId === senderId && !m.read) {
        m.read = true;
        updated = true;
      }
    }
    if (updated) {
      writeJson('chats.json', messages);
    }
  },

  getNotifications: (userId: string) => {
    const notifs = readJson<DbNotification[]>('notifications.json', []);
    return notifs.filter(n => n.recipientId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  createNotification: (notif: DbNotification) => {
    const notifs = readJson<DbNotification[]>('notifications.json', []);
    notifs.unshift(notif);
    writeJson('notifications.json', notifs);
    return notif;
  },
  markNotificationsRead: (userId: string) => {
    const notifs = readJson<DbNotification[]>('notifications.json', []);
    for (const n of notifs) {
      if (n.recipientId === userId) {
        n.read = true;
      }
    }
    writeJson('notifications.json', notifs);
  },
};
