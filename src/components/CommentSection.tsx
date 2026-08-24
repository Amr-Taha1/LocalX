import React, { useState, useEffect, useRef } from 'react';
import { Comment, ReactionType, Reaction, User, MediaItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { formatTimeAgo } from '../utils/formatters';
import { 
  Send, 
  Image as ImageIcon, 
  X, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  CornerDownRight, 
  ChevronDown, 
  ChevronUp,
  Smile,
  Loader2
} from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
  onCommentCountChange?: (count: number) => void;
}

const REACTION_CONFIG: Record<ReactionType, { emoji: string; labelEn: string; labelAr: string; color: string }> = {
  like: { emoji: '👍', labelEn: 'Like', labelAr: 'إعجاب', color: 'text-blue-600 dark:text-blue-400 font-semibold' },
  love: { emoji: '❤️', labelEn: 'Love', labelAr: 'أحببته', color: 'text-rose-500 font-semibold' },
  haha: { emoji: '😂', labelEn: 'Haha', labelAr: 'هاها', color: 'text-amber-500 font-semibold' },
  wow: { emoji: '😮', labelEn: 'Wow', labelAr: 'واو', color: 'text-amber-500 font-semibold' },
  sad: { emoji: '😢', labelEn: 'Sad', labelAr: 'أحزنني', color: 'text-amber-600 font-semibold' },
  angry: { emoji: '😡', labelEn: 'Angry', labelAr: 'أغضبني', color: 'text-orange-600 font-semibold' },
};

const REACTION_LIST: ReactionType[] = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  postId, 
  onCommentCountChange 
}) => {
  const { currentUser, allUsers } = useAuth();
  const { language, t, isRtl } = useLanguage();
  const { socket } = useSocket();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState<string>('');
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  
  // Image attachment in comment
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeReactionPickerCommentId, setActiveReactionPickerCommentId] = useState<string | null>(null);
  const [optionsMenuCommentId, setOptionsMenuCommentId] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reactionPickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch comments on mount
  useEffect(() => {
    let isMounted = true;
    const fetchComments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/posts/${postId}/comments`);
        if (res.ok && isMounted) {
          const data: Comment[] = await res.json();
          setComments(data);
          if (onCommentCountChange) {
            onCommentCountChange(data.length);
          }
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchComments();
    return () => { isMounted = false; };
  }, [postId]);

  // Socket listener for real-time comment synchronization
  useEffect(() => {
    if (!socket) return;

    const handleCommentCreated = (newC: Comment) => {
      if (newC.postId === postId) {
        setComments(prev => {
          if (prev.some(c => c.id === newC.id)) return prev;
          const updated = [...prev, newC];
          if (onCommentCountChange) onCommentCountChange(updated.length);
          return updated;
        });

        // Automatically expand reply thread if it's a reply
        if (newC.parentId) {
          setExpandedReplies(prev => ({ ...prev, [newC.parentId!]: true }));
        }
      }
    };

    const handleCommentUpdated = (updatedC: Comment) => {
      if (updatedC.postId === postId) {
        setComments(prev => prev.map(c => c.id === updatedC.id ? updatedC : c));
      }
    };

    const handleCommentDeleted = ({ id, postId: deletedPostId }: { id: string; postId: string }) => {
      if (deletedPostId === postId) {
        setComments(prev => {
          const updated = prev.filter(c => c.id !== id && c.parentId !== id);
          if (onCommentCountChange) onCommentCountChange(updated.length);
          return updated;
        });
      }
    };

    const handleCommentReacted = ({ commentId, postId: reactedPostId, reactions }: { commentId: string; postId: string; reactions: Reaction[] }) => {
      if (reactedPostId === postId) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions } : c));
      }
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:updated', handleCommentUpdated);
    socket.on('comment:deleted', handleCommentDeleted);
    socket.on('comment:reacted', handleCommentReacted);

    return () => {
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:updated', handleCommentUpdated);
      socket.off('comment:deleted', handleCommentDeleted);
      socket.off('comment:reacted', handleCommentReacted);
    };
  }, [socket, postId, onCommentCountChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setAttachedFile(file);
      setAttachedPreview(URL.createObjectURL(file));
      e.target.value = '';
    }
  };

  const removeAttachedImage = () => {
    if (attachedPreview) {
      URL.revokeObjectURL(attachedPreview);
    }
    setAttachedFile(null);
    setAttachedPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!commentText.trim() && !attachedFile) || !currentUser || isSubmitting) return;

    setIsSubmitting(true);

    try {
      let uploadedMedia: MediaItem | undefined = undefined;

      if (attachedFile) {
        const formData = new FormData();
        formData.append('files', attachedFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.files && uploadData.files.length > 0) {
            uploadedMedia = uploadData.files[0];
          }
        }
      }

      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          text: commentText,
          media: uploadedMedia,
          parentId: replyingTo ? (replyingTo.parentId || replyingTo.id) : undefined,
        }),
      });

      if (res.ok) {
        const newC: Comment = await res.json();
        setComments(prev => {
          if (prev.some(c => c.id === newC.id)) return prev;
          const next = [...prev, newC];
          if (onCommentCountChange) onCommentCountChange(next.length);
          return next;
        });

        // Clear input and state
        setCommentText('');
        removeAttachedImage();
        setReplyingTo(null);

        if (newC.parentId) {
          setExpandedReplies(prev => ({ ...prev, [newC.parentId!]: true }));
        }
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactComment = async (commentId: string, type: ReactionType) => {
    if (!currentUser) return;
    setActiveReactionPickerCommentId(null);

    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const currentReactions = [...(c.reactions || [])];
      const existingIdx = currentReactions.findIndex(r => r.userId === currentUser.id);

      if (existingIdx !== -1) {
        if (currentReactions[existingIdx].type === type) {
          currentReactions.splice(existingIdx, 1); // toggle off
        } else {
          currentReactions[existingIdx] = {
            userId: currentUser.id,
            type,
            createdAt: new Date().toISOString(),
          };
        }
      } else {
        currentReactions.push({
          userId: currentUser.id,
          type,
          createdAt: new Date().toISOString(),
        });
      }
      return { ...c, reactions: currentReactions };
    }));

    try {
      const res = await fetch(`/api/comments/${commentId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, type }),
      });
      if (res.ok) {
        const updated: Comment = await res.json();
        setComments(prev => prev.map(c => c.id === commentId ? updated : c));
      }
    } catch (err) {
      console.error('Failed to react to comment:', err);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentText.trim() || !currentUser) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, text: editCommentText }),
      });
      if (res.ok) {
        const updated: Comment = await res.json();
        setComments(prev => prev.map(c => c.id === commentId ? updated : c));
        setEditingCommentId(null);
      }
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    setOptionsMenuCommentId(null);

    // Optimistic removal
    setComments(prev => {
      const next = prev.filter(c => c.id !== commentId && c.parentId !== commentId);
      if (onCommentCountChange) onCommentCountChange(next.length);
      return next;
    });

    try {
      await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const startReply = (targetComment: Comment) => {
    setReplyingTo(targetComment);
    const targetUser = allUsers.find(u => u.id === targetComment.userId);
    const name = language === 'ar' ? targetUser?.nameAr : targetUser?.name;
    setCommentText(`@${name || targetComment.userId} `);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  // Group top-level comments and their replies
  const rootComments = comments.filter(c => !c.parentId);
  const repliesByParentId = comments.reduce((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  const renderCommentItem = (c: Comment, isReply = false) => {
    const author = allUsers.find(u => u.id === c.userId);
    const isCommentAuthor = currentUser?.id === c.userId;
    const commentReactions = c.reactions || [];
    const myReaction = commentReactions.find(r => r.userId === currentUser?.id);

    // Group reaction icons for the badge
    const counts = commentReactions.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const uniqueTypes = Object.keys(counts) as ReactionType[];
    const totalReactions = commentReactions.length;

    // Build names tooltip for reactions
    const reactorNames = commentReactions.map(r => {
      const u = allUsers.find(user => user.id === r.userId);
      return language === 'ar' ? (u?.nameAr || u?.name) : (u?.name || u?.nameAr);
    }).filter(Boolean).join(', ');

    const childReplies = repliesByParentId[c.id] || [];
    const hasReplies = childReplies.length > 0;
    const isRepliesExpanded = !!expandedReplies[c.id];

    return (
      <div key={c.id} className="relative group text-xs animate-fade-in">
        <div className="flex items-start gap-2 sm:gap-2.5">
          {/* Avatar */}
          <img
            src={author?.avatar}
            alt={author?.name}
            className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5`}
          />

          <div className="flex-1 min-w-0">
            {/* Editing mode or Bubble mode */}
            {editingCommentId === c.id ? (
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-indigo-500/50 space-y-2">
                <input
                  type="text"
                  value={editCommentText}
                  onChange={e => setEditCommentText(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditingCommentId(null)}
                    className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={() => handleUpdateComment(c.id)}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold"
                  >
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative inline-block max-w-[92%] sm:max-w-[85%]">
                {/* Main Comment Bubble */}
                <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 transition shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-semibold text-slate-900 dark:text-white leading-tight hover:underline cursor-pointer">
                      {language === 'ar' ? (author?.nameAr || author?.name) : (author?.name || author?.nameAr)}
                    </span>

                    {/* 3-dots Menu trigger */}
                    {isCommentAuthor && (
                      <div className="relative">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setOptionsMenuCommentId(prev => prev === c.id ? null : c.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition"
                          title="Options"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {optionsMenuCommentId === c.id && (
                          <div
                            className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-full mt-1 w-28 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 animate-fade-in`}
                          >
                            <button
                              onClick={() => {
                                setOptionsMenuCommentId(null);
                                setEditingCommentId(c.id);
                                setEditCommentText(c.text);
                              }}
                              className="w-full px-2.5 py-1.5 text-left rtl:text-right flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 text-[11px]"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>{t('editComment')}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="w-full px-2.5 py-1.5 text-left rtl:text-right flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px]"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{t('deleteComment')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comment Text */}
                  {c.text && (
                    <p className="text-xs sm:text-[13px] whitespace-pre-wrap break-words leading-relaxed">
                      {c.text}
                    </p>
                  )}

                  {/* Attached Media Photo in Comment */}
                  {c.media && (
                    <div className="mt-2 rounded-xl overflow-hidden max-w-xs border border-slate-200 dark:border-slate-700">
                      <img
                        src={c.media.url}
                        alt="Comment attachment"
                        onClick={() => setPreviewImageModal(c.media?.url || null)}
                        className="w-full max-h-56 object-cover cursor-pointer hover:opacity-95 transition"
                      />
                    </div>
                  )}
                </div>

                {/* Floating Reactions Badge (Facebook style) */}
                {totalReactions > 0 && (
                  <div
                    title={reactorNames}
                    className={`absolute ${isRtl ? '-left-2' : '-right-2'} -bottom-2 bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-650 rounded-full px-1.5 py-0.5 shadow-md flex items-center gap-0.5 cursor-pointer z-10 hover:scale-105 transition-transform`}
                  >
                    <div className="flex items-center -space-x-1">
                      {uniqueTypes.slice(0, 3).map(type => (
                        <span key={type} className="text-xs scale-90 inline-block">
                          {REACTION_CONFIG[type].emoji}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 ml-0.5">
                      {totalReactions}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons bar below comment (Like, Reply, Timestamp) */}
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 px-1 select-none">
              {/* Like / React Button with Facebook Reaction Bar on Hover */}
              <div 
                className="relative"
                onMouseEnter={() => {
                  if (reactionPickerTimeoutRef.current) clearTimeout(reactionPickerTimeoutRef.current);
                  setActiveReactionPickerCommentId(c.id);
                }}
                onMouseLeave={() => {
                  reactionPickerTimeoutRef.current = setTimeout(() => {
                    setActiveReactionPickerCommentId(null);
                  }, 300);
                }}
              >
                <button
                  onClick={() => handleReactComment(c.id, myReaction ? myReaction.type : 'like')}
                  className={`hover:underline transition flex items-center gap-1 ${
                    myReaction ? REACTION_CONFIG[myReaction.type].color : 'font-semibold hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {myReaction && <span>{REACTION_CONFIG[myReaction.type].emoji}</span>}
                  <span>
                    {myReaction
                      ? language === 'ar'
                        ? REACTION_CONFIG[myReaction.type].labelAr
                        : REACTION_CONFIG[myReaction.type].labelEn
                      : t('like')}
                  </span>
                </button>

                {/* Facebook Reactions Floating Bar */}
                {activeReactionPickerCommentId === c.id && (
                  <div 
                    className={`absolute bottom-full mb-1.5 ${isRtl ? 'right-0' : 'left-0'} bg-white dark:bg-slate-850 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 px-2 py-1 flex items-center gap-1.5 z-40 animate-fade-in`}
                    onMouseEnter={() => {
                      if (reactionPickerTimeoutRef.current) clearTimeout(reactionPickerTimeoutRef.current);
                    }}
                  >
                    {REACTION_LIST.map(type => {
                      const cfg = REACTION_CONFIG[type];
                      return (
                        <button
                          key={type}
                          onClick={() => handleReactComment(c.id, type)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-130 active:scale-95 transition-all duration-150 transform origin-bottom hover:-translate-y-1"
                          title={language === 'ar' ? cfg.labelAr : cfg.labelEn}
                        >
                          {cfg.emoji}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reply Button */}
              <button
                onClick={() => startReply(c)}
                className="font-semibold hover:underline hover:text-slate-800 dark:hover:text-slate-200"
              >
                {t('reply')}
              </button>

              {/* Timestamp */}
              <span className="text-slate-400 dark:text-slate-500 font-normal">
                {formatTimeAgo(c.createdAt, language)}
              </span>

              {/* Edited marker */}
              {c.updatedAt && (
                <span className="text-[10px] text-slate-400 font-normal">
                  ({language === 'ar' ? 'معدل' : 'edited'})
                </span>
              )}
            </div>

            {/* Nested Replies Section (Facebook Threading) */}
            {hasReplies && !isReply && (
              <div className="mt-2.5 space-y-2.5">
                {/* View / Hide Replies Button */}
                <button
                  onClick={() => toggleReplies(c.id)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <CornerDownRight className={`w-3.5 h-3.5 ${isRtl ? 'scale-x-[-1]' : ''}`} />
                  {isRepliesExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      <span>{t('hideReplies')}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      <span>
                        {language === 'ar'
                          ? `عرض ${childReplies.length} من الردود`
                          : `View ${childReplies.length} ${childReplies.length === 1 ? 'reply' : 'replies'}`}
                      </span>
                    </>
                  )}
                </button>

                {/* Render Nested Child Replies */}
                {isRepliesExpanded && (
                  <div className={`space-y-2.5 ${isRtl ? 'pr-4 sm:pr-6 border-r-2 border-slate-200/80 dark:border-slate-700/80' : 'pl-4 sm:pl-6 border-l-2 border-slate-200/80 dark:border-slate-700/80'}`}>
                    {childReplies.map(reply => renderCommentItem(reply, true))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5" onClick={() => setOptionsMenuCommentId(null)}>
      {/* Replying banner indicator if active */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-700 dark:text-indigo-300 animate-fade-in">
          <div className="flex items-center gap-1.5 truncate">
            <CornerDownRight className={`w-3.5 h-3.5 shrink-0 ${isRtl ? 'scale-x-[-1]' : ''}`} />
            <span>{t('replyingTo')}:</span>
            <span className="font-semibold">
              {(() => {
                const u = allUsers.find(user => user.id === replyingTo.userId);
                return language === 'ar' ? (u?.nameAr || u?.name) : (u?.name || u?.nameAr);
              })()}
            </span>
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setCommentText('');
            }}
            className="p-1 text-indigo-500 hover:text-indigo-800 dark:hover:text-indigo-200 rounded-full"
            title={t('cancelReply')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Image Preview before sending */}
      {attachedPreview && (
        <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-xs shadow-md animate-fade-in">
          <img src={attachedPreview} alt="Attached preview" className="max-h-36 object-cover rounded-xl" />
          <button
            onClick={removeAttachedImage}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer"
            title={t('removePhoto')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Comment Input Bar (Facebook Style) */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <img
          src={currentUser?.avatar}
          alt={currentUser?.name}
          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
        />

        <div className="relative flex-1 flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition shadow-inner">
          <input
            ref={inputRef}
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={replyingTo ? `${t('reply')}...` : t('writeComment')}
            className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />

          {/* Action buttons inside input: Photo Attachment */}
          <div className="flex items-center gap-1 pr-2 rtl:pr-0 rtl:pl-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-full transition"
              title={t('attachPhoto')}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={(!commentText.trim() && !attachedFile) || isSubmitting}
          className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white disabled:opacity-40 disabled:pointer-events-none transition shadow-sm shrink-0 cursor-pointer"
          title={t('send')}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          )}
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4 text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>{language === 'ar' ? 'جاري تحميل التعليقات...' : 'Loading comments...'}</span>
        </div>
      ) : rootComments.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">{t('noCommentsYet')}</p>
      ) : (
        <div className="space-y-3 pt-1">
          {rootComments.map(c => renderCommentItem(c, false))}
        </div>
      )}

      {/* Lightbox / Modal for Attached Images */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] flex items-center justify-center">
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImageModal} 
              alt="Zoomed comment attachment" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
