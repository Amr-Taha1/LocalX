import React, { useState, useEffect } from 'react';
import { Post, ReactionType, Reaction, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatTimeAgo, getUserDisplayName } from '../utils/formatters';
import { MediaGallery } from './MediaGallery';
import { CommentSection } from './CommentSection';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Send, 
  Check, 
  ThumbsUp, 
  Smile, 
  Frown, 
  Flame,
  Clock
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
}

const REACTION_CONFIG: Record<ReactionType, { emoji: string; labelEn: string; labelAr: string; color: string }> = {
  like: { emoji: '👍', labelEn: 'Like', labelAr: 'إعجاب', color: 'text-blue-600' },
  love: { emoji: '❤️', labelEn: 'Love', labelAr: 'أحببته', color: 'text-rose-500' },
  haha: { emoji: '😂', labelEn: 'Haha', labelAr: 'هاها', color: 'text-amber-500' },
  wow: { emoji: '😮', labelEn: 'Wow', labelAr: 'واو', color: 'text-amber-500' },
  sad: { emoji: '😢', labelEn: 'Sad', labelAr: 'أحزنني', color: 'text-amber-600' },
  angry: { emoji: '😡', labelEn: 'Angry', labelAr: 'أغضبني', color: 'text-orange-600' },
};

export const PostCard: React.FC<PostCardProps> = ({ post, onEdit, onDelete }) => {
  const { currentUser, allUsers } = useAuth();
  const { language, t, isRtl } = useLanguage();

  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showReactionPicker, setShowReactionPicker] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [commentsCount, setCommentsCount] = useState<number>(post.commentsCount || 0);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [reactions, setReactions] = useState<Reaction[]>(post.reactions || []);

  const author: User | undefined = allUsers.find(u => u.id === post.userId);
  const isAuthor = currentUser?.id === post.userId;

  // Sync reactions if post prop updates
  useEffect(() => {
    setReactions(post.reactions || []);
  }, [post.reactions]);

  useEffect(() => {
    if (typeof post.commentsCount === 'number') {
      setCommentsCount(post.commentsCount);
    }
  }, [post.commentsCount]);

  // Current user's reaction on this post
  const myReaction = reactions.find(r => r.userId === currentUser?.id);

  // Group reactions for badge summary
  const reactionCounts = reactions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueReactionTypes = Object.keys(reactionCounts) as ReactionType[];

  const handleReact = async (type: ReactionType) => {
    if (!currentUser) return;
    setShowReactionPicker(false);

    // Instant optimistic update
    const previousReactions = [...reactions];
    const nextReactions = [...reactions];
    const existingIndex = nextReactions.findIndex(r => r.userId === currentUser.id);

    if (existingIndex !== -1) {
      if (nextReactions[existingIndex].type === type) {
        // Toggle off (unlike)
        nextReactions.splice(existingIndex, 1);
      } else {
        // Change reaction emoji instantly
        nextReactions[existingIndex] = {
          userId: currentUser.id,
          type,
          createdAt: new Date().toISOString(),
        };
      }
    } else {
      nextReactions.push({
        userId: currentUser.id,
        type,
        createdAt: new Date().toISOString(),
      });
    }

    setReactions(nextReactions);

    try {
      const res = await fetch(`/api/posts/${post.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, type }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reactions) {
          setReactions(data.reactions);
        }
      } else {
        // Rollback on error
        setReactions(previousReactions);
      }
    } catch (err) {
      console.error('Failed to react:', err);
      setReactions(previousReactions);
    }
  };

  const handleToggleComments = () => {
    setShowComments(prev => !prev);
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/#post-${post.id}`;
    navigator.clipboard.writeText(postUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  return (
    <article
      id={`post-${post.id}`}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-5 transition-colors"
    >
      {/* Post Author Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <img
            src={author?.avatar}
            alt={author?.name}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
              {getUserDisplayName(author, language)}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{formatTimeAgo(post.createdAt, language)}</span>
              {post.updatedAt && (
                <span className="text-[11px] text-slate-400">• ({language === 'ar' ? 'معدل' : 'edited'})</span>
              )}
            </div>
          </div>
        </div>

        {/* Options dropdown for Author */}
        {isAuthor && (
          <div className="relative">
            <button
              id={`post-options-btn-${post.id}`}
              onClick={() => setShowOptions(prev => !prev)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Post Options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showOptions && (
              <div
                className={`absolute ${
                  isRtl ? 'left-0' : 'right-0'
                } mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20 animate-fadeIn text-xs`}
              >
                <button
                  onClick={() => {
                    setShowOptions(false);
                    onEdit(post);
                  }}
                  className="w-full px-3 py-2 text-left rtl:text-right flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t('editPost')}</span>
                </button>
                <button
                  onClick={() => {
                    setShowOptions(false);
                    onDelete(post.id);
                  }}
                  className="w-full px-3 py-2 text-left rtl:text-right flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('deletePost')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Text Content */}
      {post.text && (
        <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
          {post.text}
        </p>
      )}

      {/* Media Gallery (Single, 2-grid, 3-grid, 4-grid, Videos & Files) */}
      <MediaGallery media={post.media} />

      {/* Reaction Summary Counters & Comment counts */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5">
          {uniqueReactionTypes.length > 0 && (
            <div className="flex items-center -space-x-1 rtl:space-x-reverse">
              {uniqueReactionTypes.map(type => (
                <span key={type} className="text-sm" title={REACTION_CONFIG[type]?.labelEn}>
                  {REACTION_CONFIG[type]?.emoji}
                </span>
              ))}
            </div>
          )}
          <span>{reactions.length}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleComments}
            className="hover:underline text-slate-500 dark:text-slate-400 font-medium"
          >
            {commentsCount} {t('comments')}
          </button>
        </div>
      </div>

      {/* Action Buttons: Like / Reaction Picker, Comment, Share */}
      <div className="relative flex items-center justify-between gap-1 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Floating Reaction Picker */}
        {showReactionPicker && (
          <div
            className={`absolute -top-12 ${
              isRtl ? 'right-0' : 'left-0'
            } flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 z-30 animate-bounceShort`}
            onMouseLeave={() => setShowReactionPicker(false)}
          >
            {(Object.keys(REACTION_CONFIG) as ReactionType[]).map(type => (
              <button
                key={type}
                onClick={() => handleReact(type)}
                className="text-2xl hover:scale-125 active:scale-95 transition-transform p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                title={language === 'ar' ? REACTION_CONFIG[type].labelAr : REACTION_CONFIG[type].labelEn}
              >
                {REACTION_CONFIG[type].emoji}
              </button>
            ))}
          </div>
        )}

        {/* Reaction Button */}
        <button
          onClick={() => handleReact(myReaction ? myReaction.type : 'like')}
          onMouseEnter={() => setShowReactionPicker(true)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            myReaction
              ? `${REACTION_CONFIG[myReaction.type].color} bg-indigo-50/50 dark:bg-indigo-950/30`
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {myReaction ? (
            <span className="text-base">{REACTION_CONFIG[myReaction.type].emoji}</span>
          ) : (
            <ThumbsUp className="w-4 h-4" />
          )}
          <span>
            {myReaction
              ? language === 'ar'
                ? REACTION_CONFIG[myReaction.type].labelAr
                : REACTION_CONFIG[myReaction.type].labelEn
              : t('like')}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={handleToggleComments}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{t('comments')}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {shareCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          <span>{shareCopied ? t('copied') : t('share')}</span>
        </button>
      </div>

      {/* Expandable Facebook-Style Comments Drawer */}
      {showComments && (
        <CommentSection
          postId={post.id}
          onCommentCountChange={setCommentsCount}
        />
      )}
    </article>
  );
};
