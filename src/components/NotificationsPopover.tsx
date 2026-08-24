import React from 'react';
import { Notification, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatTimeAgo } from '../utils/formatters';
import { Bell, CheckCheck, MessageCircle, Heart, FileText, Sparkles, X } from 'lucide-react';

interface NotificationsPopoverProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNotification: (notif: Notification) => void;
  onMarkAllRead: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  notifications,
  isOpen,
  onClose,
  onSelectNotification,
  onMarkAllRead,
}) => {
  const { allUsers } = useAuth();
  const { language, t, isRtl } = useLanguage();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'reaction':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      case 'comment':
        return <MessageCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />;
      case 'message':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />;
      case 'story':
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div
      className={`absolute top-14 ${
        isRtl ? 'left-4' : 'right-4'
      } w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-fadeIn`}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {t('notifications')}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {notifications.some(n => !n.read) && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{t('markAllRead')}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 stroke-1" />
            <p>{t('noNotifications')}</p>
          </div>
        ) : (
          notifications.map(notif => {
            const sender: User | undefined = allUsers.find(u => u.id === notif.senderId);

            return (
              <button
                key={notif.id}
                onClick={() => {
                  onSelectNotification(notif);
                  onClose();
                }}
                className={`w-full p-3.5 flex items-start gap-3 text-left rtl:text-right hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                  !notif.read ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''
                }`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <img
                    src={sender?.avatar}
                    alt={sender?.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                    {getIcon(notif.type)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-snug">
                    {language === 'ar' ? notif.summaryAr : notif.summary}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {formatTimeAgo(notif.createdAt, language)}
                  </span>
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
