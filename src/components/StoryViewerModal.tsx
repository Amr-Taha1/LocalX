import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Story, User, UserId, ReactionType, Reaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { formatTimeAgo, getUserDisplayName, getUserRole } from '../utils/formatters';
import { 
  X, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Eye, 
  Volume2, 
  VolumeX, 
  Loader2,
  Heart,
  Users
} from 'lucide-react';

interface StoryViewerModalProps {
  stories: Story[];
  initialUserId?: UserId | string | null;
  isOpen: boolean;
  onClose: () => void;
  onStoryDeleted?: () => void;
}

interface StorySlide {
  storyId: string;
  slideId: string;
  userId: string;
  createdAt: string;
  views: string[];
  reactions: Reaction[];
  isText: boolean;
  text?: string;
  bgColor?: string;
  fontStyle?: string;
  caption?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  duration: number; // in seconds
}

interface UserStoryGroup {
  userId: string;
  author: User | undefined;
  slides: StorySlide[];
  hasUnseen: boolean;
}

interface FloatingParticle {
  id: string;
  emoji: string;
  x: number; // percentage from left (10 to 90)
  drift: number; // px horizontal drift
  size: number;
}

const REACTION_CONFIG: Record<ReactionType, { emoji: string; labelEn: string; labelAr: string; color: string }> = {
  like: { emoji: '👍', labelEn: 'Like', labelAr: 'إعجاب', color: 'text-blue-500' },
  love: { emoji: '❤️', labelEn: 'Love', labelAr: 'أحببته', color: 'text-rose-500' },
  haha: { emoji: '😂', labelEn: 'Haha', labelAr: 'هاها', color: 'text-amber-500' },
  wow: { emoji: '😮', labelEn: 'Wow', labelAr: 'واو', color: 'text-amber-400' },
  sad: { emoji: '😢', labelEn: 'Sad', labelAr: 'أحزنني', color: 'text-sky-400' },
  angry: { emoji: '😡', labelEn: 'Angry', labelAr: 'أغضبني', color: 'text-orange-500' },
};

const REACTION_LIST: ReactionType[] = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories: initialStories,
  initialUserId,
  isOpen,
  onClose,
  onStoryDeleted,
}) => {
  const { currentUser, allUsers } = useAuth();
  const { t, language, isRtl } = useLanguage();
  const { socket } = useSocket();

  // Maintain local stories state for real-time reactions and views
  const [localStories, setLocalStories] = useState<Story[]>(initialStories);
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);

  useEffect(() => {
    setLocalStories(initialStories);
  }, [initialStories]);

  // Real-time socket listener for story reactions and views
  useEffect(() => {
    if (!socket) return;

    const handleStoryReacted = ({ 
      storyId, 
      reactions, 
      story, 
      type,
      reactedBy 
    }: { 
      storyId: string; 
      reactions: Reaction[]; 
      story?: Story; 
      type?: ReactionType;
      reactedBy?: string;
    }) => {
      setLocalStories(prev => prev.map(s => s.id === storyId ? (story || { ...s, reactions }) : s));

      // Trigger floating reaction burst if someone reacted with an emoji
      if (type && REACTION_CONFIG[type]) {
        spawnFloatingReaction(REACTION_CONFIG[type].emoji);
      }
    };

    const handleStoryViewed = ({ storyId, userId }: { storyId: string; userId: any }) => {
      setLocalStories(prev => prev.map(s => {
        if (s.id === storyId && !s.views?.includes(userId)) {
          return { ...s, views: [...(s.views || []), userId] };
        }
        return s;
      }));
    };

    socket.on('story:reacted', handleStoryReacted);
    socket.on('story:viewed', handleStoryViewed);

    return () => {
      socket.off('story:reacted', handleStoryReacted);
      socket.off('story:viewed', handleStoryViewed);
    };
  }, [socket]);

  // Group and flatten stories by user
  const userGroups: UserStoryGroup[] = useMemo(() => {
    const map: Record<string, Story[]> = {};
    localStories.forEach(story => {
      if (!map[story.userId]) {
        map[story.userId] = [];
      }
      map[story.userId].push(story);
    });

    const groups: UserStoryGroup[] = Object.entries(map).map(([userId, userStories]) => {
      // Sort stories chronologically (oldest first)
      const sortedStories = [...userStories].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const slides: StorySlide[] = [];
      sortedStories.forEach(story => {
        const isText = !story.media || story.media.length === 0;
        if (isText) {
          slides.push({
            storyId: story.id,
            slideId: `slide-${story.id}-text`,
            userId: story.userId,
            createdAt: story.createdAt,
            views: story.views || [],
            reactions: story.reactions || [],
            isText: true,
            text: story.text,
            bgColor: story.bgColor,
            fontStyle: story.fontStyle,
            caption: story.caption,
            duration: 6, // 6 seconds for text story
          });
        } else {
          story.media.forEach((item, mediaIdx) => {
            slides.push({
              storyId: story.id,
              slideId: `slide-${story.id}-${item.id || mediaIdx}`,
              userId: story.userId,
              createdAt: story.createdAt,
              views: story.views || [],
              reactions: story.reactions || [],
              isText: false,
              mediaUrl: item.url,
              mediaType: item.type,
              caption: story.caption,
              duration: item.type === 'video' ? (item.duration || 15) : 5,
            });
          });
        }
      });

      const author = allUsers.find(u => u.id === userId);
      const hasUnseen = sortedStories.some(s => !s.views?.includes(currentUser?.id || ''));

      return {
        userId,
        author,
        slides,
        hasUnseen,
      };
    });

    return groups;
  }, [localStories, currentUser?.id, allUsers]);

  const [currentUserIdx, setCurrentUserIdx] = useState<number>(0);
  const [currentSlideIdx, setCurrentSlideIdx] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number>(0);
  const playOverlayTimeout = useRef<any>(null);

  // Initialize viewer to requested initialUserId and find first unviewed slide
  useEffect(() => {
    if (!isOpen || userGroups.length === 0) return;

    let targetUserIdx = 0;
    if (initialUserId) {
      const idx = userGroups.findIndex(g => g.userId === initialUserId);
      if (idx !== -1) {
        targetUserIdx = idx;
      }
    }

    const group = userGroups[targetUserIdx];
    let startSlideIdx = 0;
    if (group && group.slides.length > 0 && currentUser) {
      const firstUnviewedIdx = group.slides.findIndex(
        s => !s.views.includes(currentUser.id)
      );
      if (firstUnviewedIdx !== -1) {
        startSlideIdx = firstUnviewedIdx;
      }
    }

    setCurrentUserIdx(targetUserIdx);
    setCurrentSlideIdx(startSlideIdx);
    setProgress(0);
    setIsPaused(false);
    setShowActivityModal(false);
  }, [isOpen, initialUserId, userGroups.length]);

  const currentGroup = userGroups[currentUserIdx];
  const currentSlide = currentGroup?.slides?.[currentSlideIdx];
  const author = currentGroup?.author;
  const isAuthor = currentUser?.id === currentSlide?.userId;
  const isVideo = !currentSlide?.isText && currentSlide?.mediaType === 'video';

  // Current user's reaction on the current slide/story
  const currentReactions = currentSlide?.reactions || [];
  const myReaction = currentReactions.find(r => r.userId === currentUser?.id);

  // Mark current story slide as viewed
  useEffect(() => {
    if (!isOpen || !currentSlide || !currentUser) return;

    if (!currentSlide.views.includes(currentUser.id)) {
      fetch(`/api/stories/${currentSlide.storyId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      }).catch(err => console.error('Failed to mark story as viewed:', err));
    }
  }, [isOpen, currentSlide?.storyId, currentUser]);

  // Video playback synchronization
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPaused || showActivityModal || showDeleteConfirm) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPaused, showActivityModal, showDeleteConfirm, currentUserIdx, currentSlideIdx]);

  // Handle timer progression for text / image story slides (for video, we sync via timeupdate)
  useEffect(() => {
    if (!isOpen || !currentSlide || isPaused || isVideo || showActivityModal || showDeleteConfirm) return;

    const duration = currentSlide.duration * 1000;
    const stepInterval = 50; // update progress every 50ms
    const stepIncrement = (stepInterval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNextSlide();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, stepInterval);

    return () => clearInterval(timer);
  }, [isOpen, currentUserIdx, currentSlideIdx, isPaused, currentSlide, isVideo, showActivityModal, showDeleteConfirm]);

  // Reset slide state when switching slides
  useEffect(() => {
    setProgress(0);
    setIsBuffering(false);
    setShowActivityModal(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (!isPaused && !showActivityModal && !showDeleteConfirm) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [currentUserIdx, currentSlideIdx]);

  // Keyboard navigation & controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showActivityModal) {
          setShowActivityModal(false);
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowRight') {
        isRtl ? handlePrevSlide() : handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        isRtl ? handleNextSlide() : handlePrevSlide();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPaused, isRtl, currentUserIdx, currentSlideIdx, userGroups, showActivityModal, showDeleteConfirm]);

  if (!isOpen || !currentGroup || !currentSlide) return null;

  const togglePlayPause = () => {
    setIsPaused(prev => {
      const next = !prev;
      setShowPlayOverlay(true);
      if (playOverlayTimeout.current) clearTimeout(playOverlayTimeout.current);
      playOverlayTimeout.current = setTimeout(() => {
        setShowPlayOverlay(false);
      }, 700);
      return next;
    });
  };

  const handleNextSlide = () => {
    if (currentSlideIdx < currentGroup.slides.length - 1) {
      // Advance to next slide for current user
      setCurrentSlideIdx(prev => prev + 1);
      setProgress(0);
    } else if (currentUserIdx < userGroups.length - 1) {
      // Advance to next user's first slide
      setCurrentUserIdx(prev => prev + 1);
      setCurrentSlideIdx(0);
      setProgress(0);
    } else {
      // Reached the end of all family stories
      onClose();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIdx > 0) {
      // Go to previous slide for current user
      setCurrentSlideIdx(prev => prev - 1);
      setProgress(0);
    } else if (currentUserIdx > 0) {
      // Go to previous user's last slide
      const prevUser = userGroups[currentUserIdx - 1];
      setCurrentUserIdx(prev => prev - 1);
      setCurrentSlideIdx(prevUser.slides.length - 1);
      setProgress(0);
    }
  };

  const spawnFloatingReaction = (emoji: string) => {
    const newParticles: FloatingParticle[] = Array.from({ length: 4 }).map((_, i) => ({
      id: `particle-${Date.now()}-${Math.random()}`,
      emoji,
      x: 30 + Math.random() * 40, // spread around center
      drift: (Math.random() - 0.5) * 80,
      size: 24 + Math.random() * 16,
    }));

    setFloatingParticles(prev => [...prev, ...newParticles]);

    setTimeout(() => {
      setFloatingParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 2000);
  };

  const handleReact = async (type: ReactionType) => {
    if (!currentUser || !currentSlide) return;

    const emoji = REACTION_CONFIG[type].emoji;
    spawnFloatingReaction(emoji);

    // Optimistic update
    setLocalStories(prev => prev.map(s => {
      if (s.id !== currentSlide.storyId) return s;
      const currentList = [...(s.reactions || [])];
      const existingIdx = currentList.findIndex(r => r.userId === currentUser.id);

      if (existingIdx !== -1) {
        if (currentList[existingIdx].type === type) {
          currentList.splice(existingIdx, 1); // toggle off
        } else {
          currentList[existingIdx] = {
            userId: currentUser.id,
            type,
            createdAt: new Date().toISOString(),
          };
        }
      } else {
        currentList.push({
          userId: currentUser.id,
          type,
          createdAt: new Date().toISOString(),
        });
      }
      return { ...s, reactions: currentList };
    }));

    try {
      await fetch(`/api/stories/${currentSlide.storyId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, type }),
      });
    } catch (err) {
      console.error('Failed to react to story:', err);
    }
  };

  const handleOpenDeleteModal = () => {
    if (!currentUser || !isAuthor) return;
    setIsPaused(true);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentUser || !currentSlide || isDeleting) return;
    setIsDeleting(true);

    try {
      await fetch(`/api/stories/${currentSlide.storyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (onStoryDeleted) onStoryDeleted();

      setShowDeleteConfirm(false);
      setIsDeleting(false);

      // If user has other slides, advance or step back
      if (currentGroup.slides.length > 1) {
        if (currentSlideIdx >= currentGroup.slides.length - 1) {
          setCurrentSlideIdx(prev => Math.max(0, prev - 1));
        }
        setProgress(0);
        setIsPaused(false);
      } else if (userGroups.length > 1) {
        if (currentUserIdx < userGroups.length - 1) {
          setCurrentUserIdx(currentUserIdx);
          setCurrentSlideIdx(0);
        } else {
          setCurrentUserIdx(Math.max(0, currentUserIdx - 1));
          setCurrentSlideIdx(0);
        }
        setProgress(0);
        setIsPaused(false);
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Failed to delete story:', err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setIsPaused(false);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      const pct = (current / total) * 100;
      setProgress(pct);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    if (diff > 50) {
      isRtl ? handleNextSlide() : handlePrevSlide();
    } else if (diff < -50) {
      isRtl ? handlePrevSlide() : handleNextSlide();
    }
  };

  // Group reactions for summary badges
  const reactionCounts = currentReactions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const uniqueReactionTypes = Object.keys(reactionCounts) as ReactionType[];
  const totalReactionsCount = currentReactions.length;

  return (
    <div
      id="story-viewer-modal-backdrop"
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/50 text-white hover:bg-white/20 transition backdrop-blur-sm shadow-lg cursor-pointer"
        title="Close story (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Desktop Previous Story Arrow (User or Slide) */}
      {(currentUserIdx > 0 || currentSlideIdx > 0) && (
        <button
          onClick={handlePrevSlide}
          className="hidden md:flex absolute left-6 z-40 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition shadow-lg items-center justify-center cursor-pointer"
          title="Previous"
        >
          {isRtl ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
        </button>
      )}

      {/* Desktop Next Story Arrow (User or Slide) */}
      {(currentUserIdx < userGroups.length - 1 || currentSlideIdx < currentGroup.slides.length - 1) && (
        <button
          onClick={handleNextSlide}
          className="hidden md:flex absolute right-6 z-40 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition shadow-lg items-center justify-center cursor-pointer"
          title="Next"
        >
          {isRtl ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
        </button>
      )}

      {/* Main Story Container */}
      <div className="relative w-full max-w-md h-full max-h-[94vh] sm:rounded-2xl overflow-hidden bg-slate-950 flex flex-col justify-between shadow-2xl border border-white/10">
        {/* Top Header & Segmented Progress Bars for Current User's Integrated Stories */}
        <div className="absolute top-0 inset-x-0 z-30 p-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent space-y-3">
          {/* Instagram-style Segmented Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {currentGroup.slides.map((s, idx) => (
              <div
                key={s.slideId}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      idx < currentSlideIdx
                        ? '100%'
                        : idx === currentSlideIdx
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author info & Actions bar */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <img
                src={author?.avatar}
                alt={author?.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-white/80 shrink-0 shadow-md"
              />
              <div>
                <h4 className="font-semibold text-sm leading-tight drop-shadow">
                  {getUserDisplayName(author, language)}
                </h4>
                <div className="flex items-center gap-2 text-xs text-white/80 drop-shadow mt-0.5">
                  <span>{formatTimeAgo(currentSlide.createdAt, language)}</span>

                  {/* Views / Activity Indicator Pill */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowActivityModal(true);
                    }}
                    className="flex items-center gap-1 text-[11px] bg-white/20 hover:bg-white/30 backdrop-blur-md px-2 py-0.5 rounded-full transition cursor-pointer"
                    title={t('viewersAndReactions')}
                  >
                    <Eye className="w-3 h-3" />
                    <span>{currentSlide.views.length}</span>
                    {totalReactionsCount > 0 && (
                      <span className="flex items-center gap-0.5 ml-1 border-l border-white/30 pl-1 rtl:border-l-0 rtl:border-r rtl:pr-1 rtl:pl-0">
                        {uniqueReactionTypes.slice(0, 2).map(t => (
                          <span key={t} className="text-xs scale-90">
                            {REACTION_CONFIG[t].emoji}
                          </span>
                        ))}
                        <span className="font-semibold">{totalReactionsCount}</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons: Play/Pause, Mute, Delete */}
            <div className="flex items-center gap-1.5">
              {/* Play / Pause Toggle Button */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition border border-white/10 cursor-pointer"
                title={isPaused ? t('play') : t('pause')}
              >
                {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
              </button>

              {/* Mute / Unmute Button (for videos) */}
              {isVideo && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setIsMuted(prev => !prev);
                  }}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition border border-white/10 cursor-pointer"
                  title={isMuted ? t('unmute') : t('mute')}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              {/* Delete Story Button (author only) */}
              {isAuthor && (
                <button
                  id="story-delete-btn"
                  onClick={e => {
                    e.stopPropagation();
                    handleOpenDeleteModal();
                  }}
                  className="p-1.5 rounded-full bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white transition shadow-sm cursor-pointer"
                  title={t('deleteStory')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Story Content Render (Text Story or Media Story) */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
          {currentSlide.isText ? (
            /* TEXT STORY CANVAS */
            <div
              className={`w-full h-full p-8 flex items-center justify-center text-center text-white ${
                currentSlide.bgColor || 'bg-gradient-to-br from-indigo-600 to-purple-800'
              }`}
            >
              <p
                className={`text-xl sm:text-2xl drop-shadow-lg leading-relaxed whitespace-pre-wrap max-w-sm ${
                  currentSlide.fontStyle === 'serif'
                    ? 'font-serif italic font-semibold'
                    : currentSlide.fontStyle === 'mono'
                    ? 'font-mono font-medium'
                    : 'font-sans font-bold'
                }`}
              >
                {currentSlide.text}
              </p>
            </div>
          ) : (
            /* MEDIA STORY CANVAS (IMAGE OR VIDEO) */
            <div className="w-full h-full bg-black flex items-center justify-center relative">
              {currentSlide.mediaType === 'image' ? (
                <img
                  src={currentSlide.mediaUrl}
                  alt="Story content"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={currentSlide.mediaUrl}
                  autoPlay
                  playsInline
                  preload="auto"
                  muted={isMuted}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleNextSlide}
                  onWaiting={() => setIsBuffering(true)}
                  onPlaying={() => setIsBuffering(false)}
                  onCanPlay={() => setIsBuffering(false)}
                  onLoadedData={() => setIsBuffering(false)}
                  onStalled={() => setIsBuffering(true)}
                  className="w-full h-full object-contain cursor-pointer"
                />
              )}

              {/* Buffering Spinner */}
              {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-20">
                  <div className="p-3.5 rounded-full bg-black/60 backdrop-blur-sm text-white">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                </div>
              )}

              {/* Center Play / Pause Indicator Badge Overlay */}
              {(isPaused || showPlayOverlay) && !isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-fade-in">
                  <div className="p-4 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-xl scale-110 transition-transform">
                    {isPaused ? (
                      <Play className="w-10 h-10 fill-white translate-x-0.5" />
                    ) : (
                      <Pause className="w-10 h-10 fill-white" />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Floating Emoji Particles Layer */}
          {floatingParticles.map(p => (
            <div
              key={p.id}
              className="absolute bottom-20 pointer-events-none z-40 animate-float-reaction"
              style={{
                left: `${p.x}%`,
                fontSize: `${p.size}px`,
                // @ts-ignore
                '--tw-float-x': `${p.drift}px`,
              }}
            >
              {p.emoji}
            </div>
          ))}

          {/* Tap Zones: Left (25%), Center (50% toggle pause/play), Right (25%) */}
          {/* Left Zone: Previous Slide */}
          <button
            onClick={e => {
              e.stopPropagation();
              isRtl ? handleNextSlide() : handlePrevSlide();
            }}
            className="absolute inset-y-0 left-0 w-1/4 z-20 focus:outline-none cursor-pointer"
            aria-label="Previous slide"
          />

          {/* Center Zone: Toggle Play / Pause */}
          <button
            onClick={e => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="absolute inset-y-0 left-1/4 w-1/2 z-20 focus:outline-none cursor-pointer"
            aria-label="Toggle play pause"
          />

          {/* Right Zone: Next Slide */}
          <button
            onClick={e => {
              e.stopPropagation();
              isRtl ? handlePrevSlide() : handleNextSlide();
            }}
            className="absolute inset-y-0 right-0 w-1/4 z-20 focus:outline-none cursor-pointer"
            aria-label="Next slide"
          />
        </div>

        {/* Bottom Area: Caption & Facebook/Instagram Style Reaction Dock */}
        <div className="relative z-30 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/75 to-transparent space-y-2.5">
          {/* Caption bar if media story has a caption */}
          {!currentSlide.isText && currentSlide.caption && (
            <div className="text-white text-center pb-1">
              <p className="text-xs sm:text-sm font-medium drop-shadow-md leading-relaxed px-2 line-clamp-2">
                {currentSlide.caption}
              </p>
            </div>
          )}

          {/* Facebook-Style Story Reaction Toolbar */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/15 shadow-2xl">
            {/* Quick 6 Emoji Reaction Buttons */}
            <div className="flex items-center justify-around flex-1">
              {REACTION_LIST.map(type => {
                const config = REACTION_CONFIG[type];
                const isSelected = myReaction?.type === type;
                return (
                  <button
                    key={type}
                    onClick={e => {
                      e.stopPropagation();
                      handleReact(type);
                    }}
                    className={`relative p-1.5 sm:p-2 rounded-full transition-all duration-200 transform hover:scale-130 active:scale-95 cursor-pointer ${
                      isSelected 
                        ? 'bg-white/30 scale-115 ring-2 ring-white/60 shadow-lg' 
                        : 'hover:bg-white/15'
                    }`}
                    title={language === 'ar' ? config.labelAr : config.labelEn}
                  >
                    <span className="text-xl sm:text-2xl leading-none inline-block">
                      {config.emoji}
                    </span>
                    {isSelected && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Story Activity Trigger Button */}
            <button
              onClick={e => {
                e.stopPropagation();
                setShowActivityModal(true);
              }}
              className="p-2 rounded-full bg-white/15 hover:bg-white/30 text-white transition flex items-center justify-center shrink-0 cursor-pointer border border-white/10"
              title={t('storyActivity')}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Story Activity / Viewers & Reactions Bottom Sheet Modal */}
        {showActivityModal && (
          <div
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-5 text-white max-h-[70vh] flex flex-col shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">
                    {t('viewersAndReactions')}
                  </h3>
                </div>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Reactions Summary Breakdown */}
              {totalReactionsCount > 0 && (
                <div className="py-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs text-slate-400 font-medium shrink-0">
                    {t('storyReactions')}:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {uniqueReactionTypes.map(t => (
                      <div
                        key={t}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/80 text-xs font-semibold"
                      >
                        <span>{REACTION_CONFIG[t].emoji}</span>
                        <span>{reactionCounts[t]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Viewers & Reactors List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                {currentSlide.views.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">
                    {t('noActiveStories')}
                  </p>
                ) : (
                  currentSlide.views.map(viewerId => {
                    const user = allUsers.find(u => u.id === viewerId);
                    const userReaction = currentReactions.find(r => r.userId === viewerId);

                    return (
                      <div
                        key={viewerId}
                        className="flex items-center justify-between p-2 rounded-2xl bg-slate-800/60 border border-slate-700/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={user?.avatar}
                            alt={user?.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-600"
                          />
                          <div className="truncate">
                            <h4 className="font-semibold text-xs text-white truncate">
                              {getUserDisplayName(user, language)}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              {getUserRole(user, language)}
                            </p>
                          </div>
                        </div>

                        {/* Reaction Badge if this viewer reacted */}
                        {userReaction ? (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-xs font-semibold text-indigo-300 shrink-0">
                            <span className="text-sm">
                              {REACTION_CONFIG[userReaction.type].emoji}
                            </span>
                            <span className="text-[11px]">
                              {language === 'ar' 
                                ? REACTION_CONFIG[userReaction.type].labelAr 
                                : REACTION_CONFIG[userReaction.type].labelEn}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">
                            {t('views')}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Custom In-App Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full max-w-xs bg-slate-900 border border-slate-700/80 rounded-2xl p-5 text-center shadow-2xl text-white">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold mb-1.5 text-white">
                {t('deleteStory')}
              </h3>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                {t('confirmDeleteStory')}
              </p>
              <div className="flex gap-2.5">
                <button
                  id="cancel-delete-story-btn"
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setIsPaused(false);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  id="confirm-delete-story-btn"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/40 cursor-pointer"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>{t('deleteStory')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
