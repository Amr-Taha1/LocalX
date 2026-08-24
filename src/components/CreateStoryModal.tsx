import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { StoryMediaItem } from '../types';
import { getUserDisplayName } from '../utils/formatters';
import { Image, Video, X, Sparkles, AlertCircle, Loader2, Type, Palette } from 'lucide-react';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface LocalStoryPreview {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  name: string;
}

const BG_GRADIENTS = [
  { id: 'indigo-purple', name: 'Indigo Purple', class: 'bg-gradient-to-br from-indigo-600 to-purple-800' },
  { id: 'rose-orange', name: 'Sunset Glow', class: 'bg-gradient-to-br from-rose-500 via-pink-600 to-orange-400' },
  { id: 'emerald-teal', name: 'Emerald Teal', class: 'bg-gradient-to-br from-emerald-600 to-teal-800' },
  { id: 'blue-cyan', name: 'Ocean Blue', class: 'bg-gradient-to-br from-blue-600 to-cyan-500' },
  { id: 'amber-red', name: 'Warm Flame', class: 'bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700' },
  { id: 'dark-slate', name: 'Midnight', class: 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900' },
];

const FONT_STYLES = [
  { id: 'sans', name: 'Modern Sans', class: 'font-sans font-bold' },
  { id: 'serif', name: 'Classic Serif', class: 'font-serif font-semibold italic' },
  { id: 'mono', name: 'Clean Mono', class: 'font-mono font-medium' },
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const { t, language, isRtl } = useLanguage();

  const [storyMode, setStoryMode] = useState<'text' | 'media'>('text');
  
  // Text Story State
  const [textContent, setTextContent] = useState<string>('');
  const [selectedBg, setSelectedBg] = useState<string>(BG_GRADIENTS[0].class);
  const [selectedFont, setSelectedFont] = useState<string>(FONT_STYLES[0].id);

  // Media Story State
  const [caption, setCaption] = useState<string>('');
  const [previews, setPreviews] = useState<LocalStoryPreview[]>([]);

  // Status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentUser) return null;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: LocalStoryPreview[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newItems.push({
        id: `story-file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type,
        name: file.name,
      });
    }

    setPreviews(prev => [...prev, ...newItems]);
    setStoryMode('media');
    e.target.value = '';
  };

  const removePreview = (id: string) => {
    setPreviews(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (storyMode === 'text') {
      if (!textContent.trim()) {
        setError(t('storyTextPlaceholder') || 'Please enter text for your story.');
        return;
      }
    } else {
      if (previews.length === 0) {
        setError(language === 'ar' ? 'يرجى إضافة صورة واحدة على الأقل أو فيديو لقصتك.' : 'Please add at least one photo or video to your story.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (storyMode === 'text') {
        // Submit text-only story
        const res = await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            text: textContent.trim(),
            bgColor: selectedBg,
            fontStyle: selectedFont,
            media: [],
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to create text story');
        }
      } else {
        // 1. Upload files
        const formData = new FormData();
        previews.forEach(p => {
          formData.append('files', p.file);
        });

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload story media');
        }

        const uploadData = await uploadRes.json();
        const uploadedFiles = uploadData.files || [];

        // 2. Format StoryMedia items
        const storyMedia: StoryMediaItem[] = uploadedFiles.map((f: any) => ({
          id: f.id,
          url: f.url,
          type: f.type === 'video' ? 'video' : 'image',
          duration: f.type === 'video' ? 15 : 5,
        }));

        // 3. Create Story on server
        const res = await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            caption,
            media: storyMedia,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to create story');
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error publishing story');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFontClass = (fontId: string) => {
    switch (fontId) {
      case 'serif':
        return 'font-serif italic';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-sans font-bold';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 p-0.5">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-xs">
                ✨
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t('createStory')}
              </h3>
              <p className="text-[11px] text-slate-400">{t('storyExpiresIn')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Type Selector Tabs */}
        <div className="px-4 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStoryMode('text')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              storyMode === 'text'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>{t('textStory')}</span>
          </button>
          <button
            type="button"
            onClick={() => setStoryMode('media')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              storyMode === 'media'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>{t('mediaStory')}</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {storyMode === 'text' ? (
            /* TEXT STORY MODE */
            <div className="space-y-4">
              {/* Interactive Live Card Preview */}
              <div
                className={`relative w-full aspect-[9/12] max-h-64 sm:max-h-72 rounded-2xl p-6 flex items-center justify-center text-center text-white shadow-inner transition-all duration-300 ${selectedBg}`}
              >
                <textarea
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  placeholder={t('storyTextPlaceholder')}
                  rows={4}
                  className={`w-full bg-transparent text-white placeholder-white/70 text-center text-lg sm:text-xl resize-none border-0 focus:outline-none drop-shadow-md leading-relaxed ${getFontClass(
                    selectedFont
                  )}`}
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-white/80"
                  />
                  <span className="text-xs font-semibold text-white/90 drop-shadow">
                    {getUserDisplayName(currentUser, language)}
                  </span>
                </div>
              </div>

              {/* Background Style Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('storyBackground')}
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {BG_GRADIENTS.map(bg => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setSelectedBg(bg.class)}
                      className={`w-8 h-8 rounded-full shrink-0 transition-transform ${bg.class} ${
                        selectedBg === bg.class
                          ? 'ring-2 ring-indigo-600 dark:ring-white scale-110 shadow-md'
                          : 'opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                      title={bg.name}
                    />
                  ))}
                </div>
              </div>

              {/* Font Style Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('storyFont')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FONT_STYLES.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFont(f.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs border transition ${
                        selectedFont === f.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      } ${f.class}`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* MEDIA STORY MODE (Photos / Videos) */
            <div className="space-y-4">
              {/* Caption Input */}
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder={t('storyCaptionPlaceholder')}
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-indigo-500 focus:outline-none text-sm transition"
              />

              {/* Media Pickers */}
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={e => handleFiles(e, 'image')}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={e => handleFiles(e, 'video')}
                  accept="video/*"
                  multiple
                  className="hidden"
                />

                <button
                  type="button"
                  id="add-story-photos-btn"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex-1 py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                >
                  <Image className="w-4 h-4 text-emerald-500" />
                  <span>+ {t('addPhotos')}</span>
                </button>

                <button
                  type="button"
                  id="add-story-videos-btn"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex-1 py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/40 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                >
                  <Video className="w-4 h-4 text-sky-500" />
                  <span>+ {language === 'ar' ? 'إضافة فيديو' : 'Add Videos'}</span>
                </button>
              </div>

              {/* Media Previews */}
              {previews.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {language === 'ar' ? `شرائح القصة (${previews.length})` : `Story slides (${previews.length})`}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {previews.map((item, idx) => (
                      <div
                        key={item.id}
                        className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black/10 border border-slate-200 dark:border-slate-700 group"
                      >
                        {item.type === 'image' ? (
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.previewUrl}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePreview(item.id)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              id="submit-story-btn"
              disabled={
                isSubmitting ||
                (storyMode === 'text' && !textContent.trim()) ||
                (storyMode === 'media' && previews.length === 0)
              }
              className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:opacity-90 disabled:opacity-50 text-white transition shadow-sm flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? t('uploadingStory') : t('publish')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
