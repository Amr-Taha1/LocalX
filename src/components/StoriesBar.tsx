import React, { useMemo } from 'react';
import { Story, User, UserId } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getUserDisplayName } from '../utils/formatters';
import { Plus, Type, Layers } from 'lucide-react';

interface StoriesBarProps {
  stories: Story[];
  onOpenCreate: () => void;
  onOpenViewer: (userId: UserId) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  onOpenCreate,
  onOpenViewer,
}) => {
  const { currentUser, allUsers } = useAuth();
  const { language, t } = useLanguage();

  if (!currentUser) return null;

  // Group stories by author (userId) like Instagram
  const userStoryGroups = useMemo(() => {
    const map: Record<string, Story[]> = {};
    stories.forEach(story => {
      if (!map[story.userId]) {
        map[story.userId] = [];
      }
      map[story.userId].push(story);
    });

    const groups = Object.entries(map).map(([userId, userStories]) => {
      // Sort oldest to newest
      const sorted = [...userStories].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      // The latest story will be used for cover preview
      const latestStory = sorted[sorted.length - 1];
      const hasUnseen = sorted.some(s => !s.views?.includes(currentUser.id));
      const totalSlides = sorted.reduce(
        (acc, s) => acc + (s.media && s.media.length > 0 ? s.media.length : 1),
        0
      );
      const totalReactions = sorted.reduce(
        (acc, s) => acc + (s.reactions?.length || 0),
        0
      );
      const author: User | undefined = allUsers.find(u => u.id === userId);

      return {
        userId: userId as UserId,
        author,
        stories: sorted,
        latestStory,
        hasUnseen,
        totalSlides,
        totalReactions,
      };
    });

    // Sort: currentUser first if they have stories, then unseen stories, then latest updated
    groups.sort((a, b) => {
      if (a.userId === currentUser.id) return -1;
      if (b.userId === currentUser.id) return 1;
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      return new Date(b.latestStory.createdAt).getTime() - new Date(a.latestStory.createdAt).getTime();
    });

    return groups;
  }, [stories, currentUser.id, allUsers]);

  const myGroup = userStoryGroups.find(g => g.userId === currentUser.id);
  const otherGroups = userStoryGroups.filter(g => g.userId !== currentUser.id);

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-3 min-w-max px-1">
        {/* Card 1: Your Story (Instagram style: View your own integrated stories or add new) */}
        {myGroup ? (
          <div className="relative w-28 h-40 sm:w-32 sm:h-48 rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition shrink-0 text-left rtl:text-right border border-slate-200/60 dark:border-slate-800">
            {/* Background preview of your latest story */}
            <button
              onClick={() => onOpenViewer(currentUser.id)}
              className="absolute inset-0 w-full h-full text-left rtl:text-right focus:outline-none cursor-pointer"
              title={t('viewStory')}
            >
              {!myGroup.latestStory.media || myGroup.latestStory.media.length === 0 ? (
                <div
                  className={`w-full h-full p-3 flex items-center justify-center text-center text-white ${
                    myGroup.latestStory.bgColor || 'bg-gradient-to-br from-indigo-600 to-purple-800'
                  }`}
                >
                  <p className="text-xs font-bold line-clamp-4 drop-shadow">
                    {myGroup.latestStory.text}
                  </p>
                </div>
              ) : myGroup.latestStory.media[0]?.type === 'image' ? (
                <img
                  src={myGroup.latestStory.media[0].url}
                  alt="My story preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <video
                  src={myGroup.latestStory.media[0]?.url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
            </button>

            {/* Author Avatar with Active Ring */}
            <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 pointer-events-none">
              <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 shadow">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover border border-white dark:border-slate-900"
                />
              </div>
            </div>

            {/* Floating Add '+' button to append a new story to existing ones */}
            <button
              id="add-another-story-btn"
              onClick={e => {
                e.stopPropagation();
                onOpenCreate();
              }}
              className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md transition-transform hover:scale-110 z-10 cursor-pointer"
              title={t('createStory')}
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Footer: Your Story & Count */}
            <div className="absolute bottom-2.5 inset-x-2.5 text-white pointer-events-none">
              <p className="text-xs font-semibold drop-shadow-md truncate">
                {t('yourStory')}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-white/90 font-medium drop-shadow">
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>
                    {myGroup.totalSlides} {myGroup.totalSlides === 1 ? t('story') : t('stories')}
                  </span>
                </span>
                {myGroup.totalReactions > 0 && (
                  <span className="inline-flex items-center gap-0.5 bg-rose-500/80 px-1.5 py-0.2 rounded-full text-[9px] font-bold shadow">
                    ❤️ {myGroup.totalReactions}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty "+ Add Story" Card when current user has no active stories */
          <button
            id="create-story-card-btn"
            onClick={onOpenCreate}
            className="relative w-28 h-40 sm:w-32 sm:h-48 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-between group hover:shadow-md transition shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <div className="w-full h-2/3 overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div className="w-full h-1/3 pt-4 px-2 text-center bg-white dark:bg-slate-900 flex items-center justify-center">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {t('yourStory')}
              </span>
            </div>
          </button>
        )}

        {/* Other Family Members' Integrated Story Cards (1 card per user) */}
        {otherGroups.map(group => {
          const author = group.author;
          const isTextStory = !group.latestStory.media || group.latestStory.media.length === 0;
          const firstMedia = group.latestStory.media?.[0];

          return (
            <button
              key={group.userId}
              onClick={() => onOpenViewer(group.userId)}
              className="relative w-28 h-40 sm:w-32 sm:h-48 rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition shrink-0 text-left rtl:text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200/60 dark:border-slate-800 cursor-pointer"
            >
              {/* Thumbnail preview */}
              {isTextStory ? (
                <div
                  className={`w-full h-full p-3 flex items-center justify-center text-center text-white ${
                    group.latestStory.bgColor || 'bg-gradient-to-br from-indigo-600 to-purple-800'
                  }`}
                >
                  <p className="text-xs font-bold line-clamp-4 drop-shadow">
                    {group.latestStory.text}
                  </p>
                </div>
              ) : firstMedia?.type === 'image' ? (
                <img
                  src={firstMedia.url}
                  alt="Story thumbnail"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <video
                  src={firstMedia?.url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}

              {/* Dark overlay */}
              {!isTextStory && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
              )}

              {/* Author Avatar with Gradient Ring */}
              <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5">
                <div
                  className={`w-9 h-9 rounded-full p-0.5 ${
                    group.hasUnseen
                      ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 shadow-md'
                      : 'bg-slate-400/80 dark:bg-slate-600'
                  }`}
                >
                  <img
                    src={author?.avatar}
                    alt={author?.name}
                    className="w-full h-full rounded-full object-cover border border-white dark:border-slate-900"
                  />
                </div>
              </div>

              {/* Multi-story item badge in top right */}
              {group.totalSlides > 1 && (
                <div className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold flex items-center gap-0.5 shadow">
                  <Layers className="w-2.5 h-2.5" />
                  <span>{group.totalSlides}</span>
                </div>
              )}

              {/* Author Name & Slide count */}
              <div className="absolute bottom-2.5 inset-x-2.5 text-white">
                <p className="text-xs font-semibold drop-shadow-md truncate">
                  {getUserDisplayName(author, language)}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-medium drop-shadow">
                  <span>
                    {group.totalSlides} {group.totalSlides === 1 ? t('story') : t('stories')}
                  </span>
                  {group.totalReactions > 0 && (
                    <span className="inline-flex items-center gap-0.5 bg-rose-500/80 px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white shadow">
                      ❤️ {group.totalReactions}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
