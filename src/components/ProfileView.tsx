import React, { useState, useEffect, useRef } from 'react';
import { UserId, User, Post, Story } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getUserDisplayName, getUserBio } from '../utils/formatters';
import { PostCard } from './PostCard';
import { 
  Camera, 
  Edit3, 
  Loader2
} from 'lucide-react';

interface ProfileViewProps {
  userId: UserId;
  posts: Post[];
  stories: Story[];
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  onOpenStoryViewer: (userId: UserId) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  posts,
  stories,
  onEditPost,
  onDeletePost,
  onOpenStoryViewer,
}) => {
  const { allUsers, currentUser, updateProfile } = useAuth();
  const { language, t } = useLanguage();

  const user = allUsers.find(u => u.id === userId) || currentUser;
  const isMe = currentUser?.id === userId;

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(getUserDisplayName(user));
  const [bio, setBio] = useState<string>(getUserBio(user));
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [uploadingCover, setUploadingCover] = useState<boolean>(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !isEditing) {
      setName(getUserDisplayName(user));
      setBio(getUserBio(user));
    }
  }, [user?.id, user?.name, user?.bio, isEditing]);

  if (!user) return null;

  const userPosts = posts.filter(p => p.userId === userId);
  const userStories = stories.filter(s => s.userId === userId);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const chosenName = name.trim();
    const chosenBio = bio.trim();
    await updateProfile({
      name: chosenName,
      nameAr: chosenName,
      bio: chosenBio,
      bioAr: chosenBio,
      hometown: '',
      work: '',
      education: '',
    });
    setSaving(false);
    setIsEditing(false);
  };

  const handleUploadImage = async (file: File, type: 'avatar' | 'cover') => {
    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('files', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploaded = data.files?.[0];
        if (uploaded) {
          await updateProfile({
            [type]: uploaded.url,
          });
        }
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-44 sm:h-64 bg-slate-200 dark:bg-slate-800 overflow-hidden group">
          <img
            src={user.cover}
            alt="Cover photo"
            className="w-full h-full object-cover"
          />
          {isMe && (
            <>
              <input
                type="file"
                ref={coverInputRef}
                onChange={e => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'cover')}
                accept="image/*"
                className="hidden"
              />
              <button
                id="change-cover-btn"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5 transition shadow"
              >
                {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                <span>{t('changeCover')}</span>
              </button>
            </>
          )}
        </div>

        {/* Profile Info Bar */}
        <div className="p-4 sm:p-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            {/* Avatar */}
            <div className="relative inline-block self-start sm:self-auto">
              <div 
                onClick={() => {
                  if (userStories.length > 0) {
                    onOpenStoryViewer(userId);
                  }
                }}
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ${
                  userStories.length > 0 
                    ? 'p-1 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 cursor-pointer shadow-xl hover:scale-105 transition-transform' 
                    : 'border-4 border-white dark:border-slate-900 shadow-lg'
                }`}
                title={userStories.length > 0 ? t('viewStory') : undefined}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                />
              </div>
              {isMe && (
                <>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={e => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'avatar')}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    id="change-avatar-btn"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-1 right-1 p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition"
                    title={t('changeAvatar')}
                  >
                    {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                </>
              )}
            </div>

            {/* Edit Profile Button for owner */}
            {isMe && !isEditing && (
              <button
                id="edit-profile-btn"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>{t('editProfile')}</span>
              </button>
            )}
          </div>

          {/* User Details / Bio */}
          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {getUserDisplayName(user, language)}
                </h1>
              </div>

              {(user.bio || user.bioAr) && (
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed whitespace-pre-wrap">
                  {getUserBio(user, language)}
                </p>
              )}
            </div>
          ) : (
            /* Edit profile form */
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              {/* Single Profile Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('profileName')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب اسمك هنا (عربي أو إنجليزي)' : 'Enter your name (English or Arabic)'}
                  className="w-full sm:max-w-md p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium border border-transparent focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Single Bio Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('bio')}
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  placeholder={language === 'ar' ? 'اكتب نبذة عنك هنا...' : 'Write your bio here...'}
                  className="w-full sm:max-w-xl p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm border border-transparent focus:border-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t('saveChanges')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* User's Posts Feed */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          {language === 'ar' ? `منشورات ${user.nameAr}` : `${user.name}'s Posts`} ({userPosts.length})
        </h2>

        {userPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center text-slate-400 text-sm">
            {t('noPostsYet')}
          </div>
        ) : (
          userPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={onEditPost}
              onDelete={onDeletePost}
            />
          ))
        )}
      </div>
    </div>
  );
};
