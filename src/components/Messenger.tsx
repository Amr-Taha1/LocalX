import React, { useState, useEffect, useRef } from 'react';
import { User, UserId, Message, MediaItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { formatTimeAgo, formatFileSize, getUserDisplayName } from '../utils/formatters';
import { 
  Send, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileText, 
  X, 
  Trash2, 
  ChevronLeft, 
  CheckCheck, 
  Paperclip,
  Loader2,
  Download,
  Maximize2,
  AlertCircle,
  Play
} from 'lucide-react';

interface MessengerProps {
  initialUserId?: UserId | null;
}

interface AttachedMediaPreview {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video' | 'file';
  name: string;
  size: number;
}

export const Messenger: React.FC<MessengerProps> = ({ initialUserId }) => {
  const { currentUser, allUsers } = useAuth();
  const { socket, isUserOnline, typingUsers, sendTypingStart, sendTypingStop } = useSocket();
  const { language, t, isRtl } = useLanguage();

  const [selectedUserId, setSelectedUserId] = useState<UserId | null>(() => {
    if (initialUserId && initialUserId !== currentUser?.id) return initialUserId;
    const firstOther = allUsers.find(u => u.id !== currentUser?.id);
    return firstOther ? firstOther.id : null;
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedMediaPreview[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  // Lightbox for full-size image viewing
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const otherUsers = allUsers.filter(u => u.id !== currentUser?.id);
  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  // Load messages when selected user changes
  useEffect(() => {
    if (!currentUser || !selectedUserId) return;

    setLoadingMessages(true);
    setErrorMessage('');
    fetch(`/api/messages/${selectedUserId}?currentUserId=${currentUser.id}`)
      .then(res => res.json())
      .then((data: Message[]) => {
        setMessages(Array.isArray(data) ? data : []);
        setLoadingMessages(false);
        // Clear unread count for this user
        setUnreadCounts(prev => ({ ...prev, [selectedUserId]: 0 }));
      })
      .catch(err => {
        console.error('Failed to load messages:', err);
        setLoadingMessages(false);
      });
  }, [selectedUserId, currentUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time message listener
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewMessage = (msg: Message) => {
      if (
        (msg.senderId === selectedUserId && msg.receiverId === currentUser.id) ||
        (msg.senderId === currentUser.id && msg.receiverId === selectedUserId)
      ) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } else if (msg.receiverId === currentUser.id) {
        // Increment unread count for the sender
        setUnreadCounts(prev => ({
          ...prev,
          [msg.senderId]: (prev[msg.senderId] || 0) + 1,
        }));
      }
    };

    const handleDeleteMessage = ({ id }: { id: string }) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleDeleteMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleDeleteMessage);
    };
  }, [socket, selectedUserId, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!selectedUserId) return;

    sendTypingStart(selectedUserId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(selectedUserId);
    }, 2000);
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    forcedType?: 'image' | 'video' | 'file'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: AttachedMediaPreview[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let type: 'image' | 'video' | 'file' = forcedType || 'file';
      if (!forcedType) {
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
      }

      newItems.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type,
        name: file.name,
        size: file.size,
      });
    }

    setAttachedFiles(prev => [...prev, ...newItems]);
    setErrorMessage('');
    e.target.value = '';
    textInputRef.current?.focus();
  };

  const removeAttachedFile = (id: string) => {
    setAttachedFiles(prev => {
      const target = prev.find(p => p.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && attachedFiles.length === 0) || !currentUser || !selectedUserId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStop(selectedUserId);

    setUploadingFiles(true);
    setErrorMessage('');
    setUploadProgressText(
      attachedFiles.length > 0
        ? language === 'ar'
          ? 'جاري رفع الصور والملفات...'
          : 'Uploading media...'
        : ''
    );

    try {
      let uploadedMedia: MediaItem[] = [];

      // 1. Upload media files if any are attached
      if (attachedFiles.length > 0) {
        const formData = new FormData();
        attachedFiles.forEach(item => {
          formData.append('files', item.file);
        });

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errJson = await uploadRes.json().catch(() => ({}));
          throw new Error(errJson.error || 'Failed to upload media files.');
        }

        const uploadData = await uploadRes.json();
        uploadedMedia = uploadData.files || [];
      }

      // 2. Create message on server
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedUserId,
          text: inputText.trim(),
          media: uploadedMedia,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to send message.');
      }

      const createdMsg: Message = await res.json();

      // Immediately append message to state (instant feedback for sender)
      setMessages(prev => {
        if (prev.some(m => m.id === createdMsg.id)) return prev;
        return [...prev, createdMsg];
      });

      // Cleanup local preview URLs
      attachedFiles.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });

      setInputText('');
      setAttachedFiles([]);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setErrorMessage(err.message || 'Failed to deliver message. Please try again.');
    } finally {
      setUploadingFiles(false);
      setUploadProgressText('');
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/messages/${msgId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  if (!currentUser) return null;

  const isOtherUserTyping = selectedUserId ? typingUsers.has(selectedUserId) : false;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden h-[calc(100vh-145px)] sm:h-[calc(100vh-135px)] lg:h-full w-full flex-1 flex flex-col md:flex-row transition-colors">
      {/* Hidden File Pickers */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={e => handleFileSelect(e, 'image')}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={e => handleFileSelect(e, 'video')}
        accept="video/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={e => handleFileSelect(e)}
        multiple
        className="hidden"
      />

      {/* Left Chat List (Desktop always visible, Mobile hidden when chat selected) */}
      <div
        className={`w-full md:w-80 border-r rtl:border-r-0 rtl:border-l border-slate-200/80 dark:border-slate-800 flex flex-col ${
          selectedUserId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-base text-slate-900 dark:text-white">
            {t('chats')}
          </h2>
          <span className="text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
            4 {language === 'ar' ? 'أفراد العائلة' : 'Family Members'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {otherUsers.map(user => {
            const isOnline = isUserOnline(user.id);
            const isSelected = selectedUserId === user.id;
            const unread = unreadCounts[user.id] || 0;

            return (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full p-3.5 flex items-center gap-3 text-left rtl:text-right hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                  isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {getUserDisplayName(user, language)}
                    </h4>
                    {unread > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    <span className={isOnline ? 'text-emerald-500 font-medium' : ''}>
                      {isOnline ? t('online') : t('offline')}
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Conversation Panel */}
      <div className={`flex-1 flex flex-col h-full ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Top Header */}
            {/* Chat Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                {/* Back button on mobile */}
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Back to chats"
                >
                  <ChevronLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                </button>

                <div className="relative">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                      isUserOnline(selectedUser.id) ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    {getUserDisplayName(selectedUser, language)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    {isOtherUserTyping ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                        {t('typing')}
                      </span>
                    ) : isUserOnline(selectedUser.id) ? (
                      <span className="text-emerald-500 font-medium">{t('online')}</span>
                    ) : (
                      <span>{t('offline')}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-32 text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري تحميل الرسائل...' : 'Loading conversation...'}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                    👋
                  </div>
                  <p className="text-sm font-medium">{t('noMessagesYet')}</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === currentUser.id;
                  const hasMedia = msg.media && msg.media.length > 0;
                  const hasText = Boolean(msg.text && msg.text.trim());

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}
                    >
                      <div
                        className={`relative max-w-[85%] sm:max-w-md rounded-2xl text-xs sm:text-sm overflow-hidden ${
                          isMine
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700 shadow-sm'
                        }`}
                      >
                        {/* Media attachments */}
                        {hasMedia && (
                          <div className={`space-y-1.5 ${hasText ? 'p-2 pb-0' : 'p-2'}`}>
                            {msg.media!.map(item => (
                              <div
                                key={item.id}
                                className="rounded-xl overflow-hidden bg-black/10 dark:bg-black/40 relative group/media"
                              >
                                {item.type === 'image' && (
                                  <div className="relative group cursor-pointer">
                                    <img
                                      src={item.url}
                                      alt={item.name}
                                      onClick={() => setLightboxImage({ url: item.url, name: item.name })}
                                      className="max-h-72 w-full object-cover rounded-xl transition-transform duration-200 hover:opacity-95"
                                      loading="lazy"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setLightboxImage({ url: item.url, name: item.name })}
                                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition shadow backdrop-blur-sm"
                                      title="View full size"
                                    >
                                      <Maximize2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}

                                {item.type === 'video' && (
                                  <div className="relative rounded-xl overflow-hidden bg-black">
                                    <video
                                      src={item.url}
                                      controls
                                      playsInline
                                      preload="metadata"
                                      className="max-h-72 w-full rounded-xl"
                                    />
                                  </div>
                                )}

                                {item.type === 'file' && (
                                  <a
                                    href={item.url}
                                    download={item.name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition ${
                                      isMine
                                        ? 'bg-white/15 hover:bg-white/25 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                      <FileText className="w-4 h-4 shrink-0 opacity-80" />
                                      <div className="min-w-0">
                                        <p className="font-medium truncate">{item.name}</p>
                                        {item.size && (
                                          <p className="text-[10px] opacity-70">
                                            {formatFileSize(item.size)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <Download className="w-4 h-4 shrink-0 opacity-80" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Message Text */}
                        {hasText && (
                          <div className="p-3">
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {msg.text}
                            </p>
                          </div>
                        )}

                        {/* Delete button for sender's messages */}
                        {isMine && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white/80 hover:text-rose-400 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition shadow"
                            title={t('deleteMessage')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Timestamp and delivery indicator */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                        <span>{formatTimeAgo(msg.createdAt, language)}</span>
                        {isMine && <CheckCheck className="w-3 h-3 text-indigo-500" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              {/* Attached file previews tray before sending */}
              {attachedFiles.length > 0 && (
                <div className="mb-2.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span className="font-semibold">
                      {attachedFiles.length} {language === 'ar' ? 'ملفات مرفقة' : 'attached items'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        attachedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
                        setAttachedFiles([]);
                      }}
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      {language === 'ar' ? 'إلغاء الكل' : 'Clear all'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {attachedFiles.map(item => (
                      <div
                        key={item.id}
                        className="relative group shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                      >
                        {item.type === 'image' && (
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {item.type === 'video' && (
                          <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white">
                            <VideoIcon className="w-6 h-6 text-sky-400" />
                            <span className="text-[9px] px-1 truncate w-full text-center">Video</span>
                          </div>
                        )}
                        {item.type === 'file' && (
                          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 p-1.5 flex flex-col justify-between text-slate-700 dark:text-slate-300">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            <span className="text-[9px] font-medium truncate">{item.name}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeAttachedFile(item.id)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress / Error Notification */}
              {errorMessage && (
                <div className="mb-2 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Media Picker Quick Buttons */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingFiles}
                    className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    title={language === 'ar' ? 'إرسال صور' : 'Send photos'}
                  >
                    <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingFiles}
                    className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    title={language === 'ar' ? 'إرسال فيديو' : 'Send videos'}
                  >
                    <VideoIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFiles}
                    className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    title={t('attachFile')}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>

                <input
                  ref={textInputRef}
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={`${t('typeMessage')} ${getUserDisplayName(selectedUser, language)}...`}
                  disabled={uploadingFiles}
                  className="flex-1 py-2 px-3.5 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition"
                />

                <button
                  type="submit"
                  disabled={uploadingFiles || (!inputText.trim() && attachedFiles.length === 0)}
                  className="p-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition shrink-0 shadow-sm flex items-center justify-center"
                  title={t('send')}
                >
                  {uploadingFiles ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl">
              💬
            </div>
            <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">
              {t('selectChatToStart')}
            </h3>
            <p className="text-xs max-w-xs">{t('allFriendsInfo')}</p>
          </div>
        )}
      </div>

      {/* Full-Screen Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
            <a
              href={lightboxImage.url}
              download={lightboxImage.name}
              onClick={e => e.stopPropagation()}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
              title="Download image"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => setLightboxImage(null)}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-4xl max-h-[85vh] flex items-center justify-center overflow-hidden">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <p className="text-white/70 text-xs mt-3 truncate max-w-md">{lightboxImage.name}</p>
        </div>
      )}
    </div>
  );
};
