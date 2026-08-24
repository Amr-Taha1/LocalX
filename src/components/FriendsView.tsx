import React from 'react';
import { UserId, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { getUserDisplayName, getUserBio } from '../utils/formatters';
import { Users, MessageSquare, User as UserIcon, MapPin, Briefcase, GraduationCap } from 'lucide-react';

interface FriendsViewProps {
  onSelectChat: (userId: UserId) => void;
  onSelectProfile: (userId: UserId) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onSelectChat, onSelectProfile }) => {
  const { allUsers, currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const { language, t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('familyMembersTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('allFriendsInfo')}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of all 4 users */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allUsers.map(user => {
          const isOnline = isUserOnline(user.id);
          const isMe = user.id === currentUser?.id;

          return (
            <div
              key={user.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col transition hover:shadow-md"
            >
              {/* Cover preview */}
              <div className="h-24 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                <img
                  src={user.cover}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                {isMe && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-sm">
                    {language === 'ar' ? 'أنت' : 'You'}
                  </span>
                )}
              </div>

              {/* Profile Details */}
              <div className="p-4 sm:p-5 pt-0 flex-1 flex flex-col justify-between -mt-10">
                <div>
                  <div className="flex items-end justify-between mb-3">
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow"
                      />
                      <span
                        className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                        title={isOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-10">
                      {!isMe && (
                        <button
                          onClick={() => onSelectChat(user.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{t('sendMessage')}</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectProfile(user.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>{t('viewProfile')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      {getUserDisplayName(user, language)}
                    </h3>
                    <p className="text-xs font-medium">
                      <span className={isOnline ? 'text-emerald-500 font-semibold' : 'text-slate-400'}>
                        {isOnline ? t('online') : t('offline')}
                      </span>
                    </p>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {getUserBio(user, language)}
                  </p>

                  {/* Meta info */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {user.hometown && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{user.hometown}</span>
                      </div>
                    )}
                    {user.work && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{user.work}</span>
                      </div>
                    )}
                    {user.education && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{user.education}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
