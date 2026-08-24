import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Post, Story, Notification, UserId } from './types';
import { getUserDisplayName } from './utils/formatters';

// Components
import { LoginScreen } from './components/LoginScreen';
import { LanInfoModal } from './components/LanInfoModal';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { StoriesBar } from './components/StoriesBar';
import { CreatePostModal } from './components/CreatePostModal';
import { CreateStoryModal } from './components/CreateStoryModal';
import { StoryViewerModal } from './components/StoryViewerModal';
import { PostCard } from './components/PostCard';
import { Messenger } from './components/Messenger';
import { FriendsView } from './components/FriendsView';
import { ProfileView } from './components/ProfileView';
import { SearchView } from './components/SearchView';
import { SettingsView } from './components/SettingsView';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';

import { 
  Image, 
  Video, 
  FileText, 
  Sparkles, 
  Plus, 
  Loader2, 
  AlertCircle,
  Wifi
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, lanInfo } = useAuth();
  const { socket } = useSocket();
  const { language, t } = useLanguage();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('feed');
  const [targetUserId, setTargetUserId] = useState<UserId | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showLanModal, setShowLanModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showCreatePost, setShowCreatePost] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showCreateStory, setShowCreateStory] = useState<boolean>(false);
  const [activeStoryUserId, setActiveStoryUserId] = useState<string | null>(null);

  // Data state
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(true);

  // Fetch initial posts & stories
  const loadPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data: Post[] = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  const loadStories = async () => {
    try {
      const res = await fetch('/api/stories');
      if (res.ok) {
        const data: Story[] = await res.json();
        setStories(data);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
    }
  };

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications/${currentUser.id}`);
      if (res.ok) {
        const data: Notification[] = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadPosts();
      loadStories();
      loadNotifications();
    }
  }, [currentUser]);

  // Realtime Socket listeners for posts, stories, notifications
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handlePostNew = (newPost: Post) => {
      setPosts(prev => [newPost, ...prev.filter(p => p.id !== newPost.id)]);
    };

    const handlePostUpdated = (updatedPost: Post) => {
      setPosts(prev => prev.map(p => (p.id === updatedPost.id ? updatedPost : p)));
    };

    const handlePostReacted = ({ postId, reactions }: { postId: string; reactions: any[] }) => {
      setPosts(prev => prev.map(p => (p.id === postId ? { ...p, reactions } : p)));
    };

    const handlePostDeleted = ({ id }: { id: string }) => {
      setPosts(prev => prev.filter(p => p.id !== id));
    };

    const handleStoryNew = (newStory: Story) => {
      setStories(prev => [newStory, ...prev.filter(s => s.id !== newStory.id)]);
    };

    const handleStoryDeleted = ({ id }: { id: string }) => {
      setStories(prev => prev.filter(s => s.id !== id));
    };

    const handleStoryReacted = ({ storyId, reactions, story }: { storyId: string; reactions: any[]; story?: Story }) => {
      setStories(prev => prev.map(s => (s.id === storyId ? (story || { ...s, reactions }) : s)));
    };

    const handleStoryViewed = ({ storyId, userId }: { storyId: string; userId: any }) => {
      setStories(prev => prev.map(s => {
        if (s.id === storyId && !s.views?.includes(userId)) {
          return { ...s, views: [...(s.views || []), userId] };
        }
        return s;
      }));
    };

    const handleNotificationNew = (notif: Notification) => {
      if (notif.recipientId === currentUser.id) {
        setNotifications(prev => [notif, ...prev]);
      }
    };

    const handleMessageNew = (msg: any) => {
      if (msg.receiverId === currentUser.id && currentTab !== 'messenger') {
        setUnreadMessageCount(prev => prev + 1);
      }
    };

    socket.on('post:new', handlePostNew);
    socket.on('post:created', handlePostNew);
    socket.on('post:updated', handlePostUpdated);
    socket.on('post:reacted', handlePostReacted);
    socket.on('post:deleted', handlePostDeleted);
    socket.on('story:new', handleStoryNew);
    socket.on('story:created', handleStoryNew);
    socket.on('story:deleted', handleStoryDeleted);
    socket.on('story:reacted', handleStoryReacted);
    socket.on('story:viewed', handleStoryViewed);
    socket.on('notification:new', handleNotificationNew);
    socket.on('message:new', handleMessageNew);

    return () => {
      socket.off('post:new', handlePostNew);
      socket.off('post:created', handlePostNew);
      socket.off('post:updated', handlePostUpdated);
      socket.off('post:reacted', handlePostReacted);
      socket.off('post:deleted', handlePostDeleted);
      socket.off('story:new', handleStoryNew);
      socket.off('story:created', handleStoryNew);
      socket.off('story:deleted', handleStoryDeleted);
      socket.off('story:reacted', handleStoryReacted);
      socket.off('story:viewed', handleStoryViewed);
      socket.off('notification:new', handleNotificationNew);
      socket.off('message:new', handleMessageNew);
    };
  }, [socket, currentUser, currentTab]);

  const handleTabChange = (tab: string, meta?: any) => {
    setCurrentTab(tab);
    if (tab === 'messenger') {
      setUnreadMessageCount(0);
      if (meta?.userId) setTargetUserId(meta.userId);
    } else if (tab === 'profile' && meta?.userId) {
      setTargetUserId(meta.userId);
    } else if (tab === 'search') {
      if (meta?.query) setSearchQuery(meta.query);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!currentUser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox');

      // Escape key closes open modals
      if (e.key === 'Escape') {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          return;
        }
        if (showCreatePost) {
          setShowCreatePost(false);
          setEditingPost(null);
          return;
        }
        if (showCreateStory) {
          setShowCreateStory(false);
          return;
        }
        if (showLanModal) {
          setShowLanModal(false);
          return;
        }
        if (activeStoryUserId) {
          setActiveStoryUserId(null);
          return;
        }
        return;
      }

      // If user is currently typing in an input field or textarea, do NOT intercept single-key shortcuts
      if (isTyping) return;

      // Do not hijack browser combinations (Cmd, Ctrl, Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Handle '?' to toggle Shortcuts Cheat Sheet
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      const key = e.key.toLowerCase();

      // Navigation Shortcuts:
      // 'H' -> Feed / Home
      if (key === 'h') {
        e.preventDefault();
        handleTabChange('feed');
      }
      // 'M' -> Messenger
      else if (key === 'm') {
        e.preventDefault();
        handleTabChange('messenger');
      }
      // 'F' -> Friends / Family
      else if (key === 'f') {
        e.preventDefault();
        handleTabChange('friends');
      }
      // 'P' -> Profile
      else if (key === 'p') {
        e.preventDefault();
        handleTabChange('profile', { userId: currentUser.id });
      }
      // 'S' or '/' -> Search
      else if (key === 's' || e.key === '/') {
        e.preventDefault();
        handleTabChange('search');
      }
      // 'G' or ',' -> Settings
      else if (key === 'g' || e.key === ',') {
        e.preventDefault();
        handleTabChange('settings');
      }
      // Action Shortcuts:
      // 'N' or 'C' -> Trigger 'Create Post' modal
      else if (key === 'n' || key === 'c') {
        e.preventDefault();
        setEditingPost(null);
        setShowCreatePost(true);
      }
      // 'B' -> Create Story modal
      else if (key === 'b') {
        e.preventDefault();
        setShowCreateStory(true);
      }
      // 'L' or 'I' -> LAN Info / QR modal
      else if (key === 'l' || key === 'i') {
        e.preventDefault();
        setShowLanModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    currentUser,
    showShortcutsModal,
    showCreatePost,
    showCreateStory,
    showLanModal,
    activeStoryUserId,
  ]);

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  if (!currentUser) {
    return <LoginScreen onOpenLanModal={() => setShowLanModal(true)} />;
  }

  return (
    <div className={`min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white ${
      currentTab === 'messenger' ? 'h-screen overflow-hidden pb-16 lg:pb-0' : 'pb-16 lg:pb-8'
    }`}>
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        onOpenLanModal={() => setShowLanModal(true)}
        onOpenShortcutsModal={() => setShowShortcutsModal(true)}
        notifications={notifications}
        unreadMessageCount={unreadMessageCount}
        onMarkNotificationRead={(notifId) => {
          setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
        }}
        onMarkAllNotificationsRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }}
      />

      {/* Main Container */}
      <main className={`max-w-7xl w-full mx-auto px-3 sm:px-6 flex gap-6 flex-1 ${
        currentTab === 'messenger' 
          ? 'pt-3 pb-3 h-[calc(100vh-64px)] overflow-hidden' 
          : 'pt-5'
      }`}>
        {/* Left Sidebar on Desktop */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleTabChange}
          unreadMessageCount={unreadMessageCount}
          onOpenLanModal={() => setShowLanModal(true)}
          onOpenCreatePost={() => {
            setEditingPost(null);
            setShowCreatePost(true);
          }}
          onOpenShortcutsModal={() => setShowShortcutsModal(true)}
        />

        {/* Center Content Area */}
        <div className={`flex-1 min-w-0 ${
          currentTab === 'messenger' 
            ? 'h-full flex flex-col' 
            : 'max-w-3xl mx-auto lg:mx-0'
        }`}>
          {/* TAB 1: Feed View */}
          {currentTab === 'feed' && (
            <div className="space-y-4">
              {/* Stories Bar */}
              <StoriesBar
                stories={stories}
                onOpenCreate={() => setShowCreateStory(true)}
                onOpenViewer={(userId) => setActiveStoryUserId(userId)}
              />

              {/* Feed Post Composer Trigger */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <button
                    id="open-create-post-btn"
                    onClick={() => {
                      setEditingPost(null);
                      setShowCreatePost(true);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 text-left rtl:text-right text-xs sm:text-sm font-medium transition"
                  >
                    {language === 'ar' 
                      ? `بماذا تفكر يا ${getUserDisplayName(currentUser, language)}؟` 
                      : `${t('whatsOnYourMind')}, ${getUserDisplayName(currentUser, language)}?`}
                  </button>
                </div>

                <div className="flex items-center justify-around pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  <button
                    onClick={() => {
                      setEditingPost(null);
                      setShowCreatePost(true);
                    }}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 transition"
                  >
                    <Image className="w-4 h-4" />
                    <span>{t('photos')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingPost(null);
                      setShowCreatePost(true);
                    }}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 transition"
                  >
                    <Video className="w-4 h-4" />
                    <span>{t('videos')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingPost(null);
                      setShowCreatePost(true);
                    }}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t('files')}</span>
                  </button>
                </div>
              </div>

              {/* Feed Post List */}
              {loadingFeed ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" />
                  <p className="text-xs">Loading family posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto text-2xl">
                    🏡
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                    {t('noPostsYet')}
                  </h3>
                  <p className="text-xs max-w-sm mx-auto">
                    Share moments, photos, videos, and updates with your family on your private LAN network.
                  </p>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm"
                  >
                    {t('createPost')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onEdit={p => {
                        setEditingPost(p);
                        setShowCreatePost(true);
                      }}
                      onDelete={handleDeletePost}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Messenger View */}
          {currentTab === 'messenger' && (
            <Messenger initialUserId={targetUserId} />
          )}

          {/* TAB 3: Family Members View */}
          {currentTab === 'friends' && (
            <FriendsView
              onSelectChat={userId => handleTabChange('messenger', { userId })}
              onSelectProfile={userId => handleTabChange('profile', { userId })}
            />
          )}

          {/* TAB 4: Profile View */}
          {currentTab === 'profile' && (
            <ProfileView
              userId={targetUserId || currentUser.id}
              posts={posts}
              stories={stories}
              onEditPost={p => {
                setEditingPost(p);
                setShowCreatePost(true);
              }}
              onDeletePost={handleDeletePost}
              onOpenStoryViewer={userId => setActiveStoryUserId(userId)}
            />
          )}

          {/* TAB 5: Search View */}
          {currentTab === 'search' && (
            <SearchView
              initialQuery={searchQuery}
              onSelectUser={userId => handleTabChange('profile', { userId })}
              onEditPost={p => {
                setEditingPost(p);
                setShowCreatePost(true);
              }}
              onDeletePost={handleDeletePost}
            />
          )}

          {/* TAB 6: Settings View */}
          {currentTab === 'settings' && <SettingsView />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        unreadMessageCount={unreadMessageCount}
      />

      {/* Modals */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <LanInfoModal
        isOpen={showLanModal}
        onClose={() => setShowLanModal(false)}
      />

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => {
          setShowCreatePost(false);
          setEditingPost(null);
        }}
        postToEdit={editingPost}
        onSuccess={() => {
          loadPosts();
        }}
      />

      <CreateStoryModal
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onSuccess={() => {
          loadStories();
        }}
      />

      {activeStoryUserId && (
        <StoryViewerModal
          stories={stories}
          initialUserId={activeStoryUserId}
          isOpen={Boolean(activeStoryUserId)}
          onClose={() => setActiveStoryUserId(null)}
          onStoryDeleted={() => loadStories()}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <MainLayout />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
