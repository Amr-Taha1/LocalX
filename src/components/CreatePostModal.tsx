import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MediaItem, Post } from '../types';
import { getUserDisplayName } from '../utils/formatters';
import { Image, Video, FileText, X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postToEdit?: Post | null;
  onSuccess?: () => void;
}

interface LocalFilePreview {
  id: string;
  file?: File;
  previewUrl: string;
  type: 'image' | 'video' | 'file';
  name: string;
  size?: number;
  existingItem?: MediaItem;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  postToEdit,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();

  const [text, setText] = useState<string>(postToEdit ? postToEdit.text : '');
  const [selectedPreviews, setSelectedPreviews] = useState<LocalFilePreview[]>(() => {
    if (postToEdit?.media) {
      return postToEdit.media.map(m => ({
        id: m.id,
        previewUrl: m.url,
        type: m.type,
        name: m.name,
        size: m.size,
        existingItem: m,
      }));
    }
    return [];
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, forcedType?: 'image' | 'video' | 'file') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPreviews: LocalFilePreview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let type: 'image' | 'video' | 'file' = forcedType || 'file';
      if (!forcedType) {
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
      }

      const previewUrl = URL.createObjectURL(file);
      newPreviews.push({
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        previewUrl,
        type,
        name: file.name,
        size: file.size,
      });
    }

    setSelectedPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removePreview = (id: string) => {
    setSelectedPreviews(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && selectedPreviews.length === 0) {
      setError(language === 'ar' ? 'يرجى إضافة نص أو وسائط لمنشورك.' : 'Please add some text or media to your post.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setUploadProgress(t('uploadProgress'));

    try {
      // 1. Separate new files to upload vs existing items
      const newFiles = selectedPreviews.filter(p => p.file).map(p => p.file as File);
      const existingMedia = selectedPreviews.filter(p => p.existingItem).map(p => p.existingItem as MediaItem);

      let uploadedMedia: MediaItem[] = [];

      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach(file => {
          formData.append('files', file);
        });

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload media files');
        }

        const uploadData = await uploadRes.json();
        uploadedMedia = uploadData.files || [];
      }

      const finalMedia: MediaItem[] = [...existingMedia, ...uploadedMedia];

      if (postToEdit) {
        // Edit post
        const res = await fetch(`/api/posts/${postToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            text,
            media: finalMedia,
          }),
        });

        if (!res.ok) throw new Error('Failed to update post');
      } else {
        // Create new post
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            text,
            media: finalMedia,
          }),
        });

        if (!res.ok) throw new Error('Failed to create post');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
            {postToEdit ? t('editPost') : t('createPost')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* User Preview */}
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {getUserDisplayName(currentUser, language)}
              </p>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {language === 'ar' ? 'منشور عائلي • شبكة محلية' : 'Family Post • LAN'}
              </span>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            id="post-text-input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!isSubmitting && (text.trim() || selectedPreviews.length > 0)) {
                  handleSubmit(e as any);
                }
              }
            }}
            placeholder={t('createPost')}
            rows={4}
            className="w-full p-3 bg-transparent border-0 focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm sm:text-base resize-none focus:outline-none"
          />

          {/* Previews of Selected Media */}
          {selectedPreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              {selectedPreviews.map(preview => (
                <div
                  key={preview.id}
                  className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/10 group"
                >
                  {preview.type === 'image' && (
                    <img
                      src={preview.previewUrl}
                      alt={preview.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {preview.type === 'video' && (
                    <video
                      src={preview.previewUrl}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {preview.type === 'file' && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 text-center">
                      <FileText className="w-6 h-6 text-indigo-500 mb-1" />
                      <span className="text-[11px] truncate max-w-full font-medium">{preview.name}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removePreview(preview.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition shadow"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Media Attach Bar */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t('addPhotosVideos')}
            </span>

            <div className="flex items-center gap-1">
              {/* Hidden file inputs */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => handleFileChange(e, 'image')}
                accept="image/*"
                multiple
                className="hidden"
              />
              <input
                type="file"
                ref={videoInputRef}
                onChange={e => handleFileChange(e, 'video')}
                accept="video/*"
                multiple
                className="hidden"
              />
              <input
                type="file"
                ref={docInputRef}
                onChange={e => handleFileChange(e, 'file')}
                multiple
                className="hidden"
              />

              <button
                type="button"
                id="attach-image-btn"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                title="Add Photos"
              >
                <Image className="w-5 h-5" />
              </button>

              <button
                type="button"
                id="attach-video-btn"
                onClick={() => videoInputRef.current?.click()}
                className="p-2 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition"
                title="Add Videos"
              >
                <Video className="w-5 h-5" />
              </button>

              <button
                type="button"
                id="attach-doc-btn"
                onClick={() => docInputRef.current?.click()}
                className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                title="Attach Files"
              >
                <FileText className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-between">
            {uploadProgress ? (
              <span className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadProgress}</span>
              </span>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                id="submit-post-btn"
                disabled={isSubmitting || (!text.trim() && selectedPreviews.length === 0)}
                className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition shadow-sm"
              >
                {isSubmitting ? t('publishing') : (postToEdit ? t('saveChanges') : t('publish'))}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
