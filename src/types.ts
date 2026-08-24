export type UserId = 'ahmed' | 'mohamed' | 'sara' | 'amr';

export interface User {
  id: UserId;
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
  pin?: string; // Stored only on server
}

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface Reaction {
  userId: UserId;
  type: ReactionType;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: UserId;
  text: string;
  media?: MediaItem;
  parentId?: string;
  reactions?: Reaction[];
  createdAt: string;
  updatedAt?: string;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'file';
  name: string;
  size?: number;
  mimeType?: string;
}

export interface Post {
  id: string;
  userId: UserId;
  text: string;
  media: MediaItem[];
  reactions: Reaction[];
  commentsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StoryMediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  duration?: number; // duration in seconds, default 5s for image
}

export interface Story {
  id: string;
  userId: UserId;
  text?: string;
  bgColor?: string;
  fontStyle?: string;
  caption?: string;
  media: StoryMediaItem[];
  reactions?: Reaction[];
  createdAt: string;
  expiresAt: string;
  views: UserId[];
}

export interface Message {
  id: string;
  senderId: UserId;
  receiverId: UserId;
  text: string;
  media?: MediaItem[];
  createdAt: string;
  read: boolean;
}

export type NotificationType = 'post' | 'comment' | 'reaction' | 'message' | 'story';

export interface Notification {
  id: string;
  recipientId: UserId;
  senderId: UserId;
  type: NotificationType;
  targetId?: string; // postId, messageId, storyId
  summary: string;
  summaryAr: string;
  read: boolean;
  createdAt: string;
}

export interface LanInfo {
  localIp: string;
  allIps: string[];
  port: number;
  lanUrl: string;
  localhostUrl: string;
  uploadLimits: {
    maxFileSizeMb: number;
    maxFilesPerUpload: number;
    allowedImageTypes: string[];
    allowedVideoTypes: string[];
    allowedDocTypes: string[];
  };
}

export type TabType = 'feed' | 'stories' | 'messenger' | 'notifications' | 'friends' | 'profile' | 'search' | 'settings';
