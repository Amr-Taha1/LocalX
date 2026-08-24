import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { Notification, UserId } from '../types';
import { getUserDisplayName } from '../utils/formatters';
import { NotificationsPopover } from './NotificationsPopover';
import { LocalXLogo } from './LocalXLogo';
import { 
  Moon, 
  Sun, 
  Globe, 
  Bell, 
  MessageSquare, 
  Search, 
  LogOut, 
  User as UserIcon, 
  Settings as SettingsIcon,
  Shield,
  Keyboard
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string, meta?: any) => void;
  onOpenLanModal: () => void;
  onOpenShortcutsModal?: () => void;
  notifications: Notification[];
  unreadMessageCount: number;
  onMarkNotificationRead?: (notifId: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenLanModal,
  onOpenShortcutsModal,
  notifications,
  unreadMessageCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}) => {
  const { currentUser, logout } = useAuth();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useSocket();

  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [navSearch, setNavSearch] = useState<string>('');

  if (!currentUser) return null;

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const handleNavSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      onSelectTab('search', { query: navSearch.trim() });
      setNavSearch('');
    }
  };

  const handleSelectNotif = async (notif: Notification) => {
    // mark as read
    onMarkNotificationRead?.(notif.id);
    try {
      await fetch(`/api/notifications/${notif.id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }

    if (notif.type === 'message') {
      onSelectTab('messenger', { userId: notif.senderId });
    } else {
      onSelectTab('feed');
    }
  };

  const handleMarkAllRead = async () => {
    onMarkAllNotificationsRead?.();
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('feed')}
            className="flex items-center gap-2.5 group focus:outline-none cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            title="LocalX"
            dir="ltr"
          >
            <LocalXLogo variant="horizontal" size="sm" />
          </button>
        </div>

        {/* Center: Search Bar (Desktop) */}
        <form
          onSubmit={handleNavSearchSubmit}
          className="hidden md:flex flex-1 max-w-md mx-4 relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={navSearch}
            onChange={e => setNavSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full py-2 px-9 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition"
          />
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Language Toggle */}
          <button
            id="lang-toggle-btn"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-bold flex items-center gap-1"
            title="Change Language"
          >
            <Globe className="w-4 h-4" />
            <span className="uppercase">{language === 'en' ? 'AR' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              id="nav-notifications-btn"
              onClick={() => setShowNotifications(prev => !prev)}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={t('notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            <NotificationsPopover
              notifications={notifications}
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onSelectNotification={handleSelectNotif}
              onMarkAllRead={handleMarkAllRead}
            />
          </div>

          {/* User Profile Dropdown */}
          <div className="relative ml-1">
            <button
              id="user-profile-menu-btn"
              onClick={() => setShowUserMenu(prev => !prev)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/40 transition focus:outline-none"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            </button>

            {showUserMenu && (
              <div
                className={`absolute ${
                  isRtl ? 'left-0' : 'right-0'
                } mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fadeIn text-xs`}
              >
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {getUserDisplayName(currentUser, language)}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onSelectTab('profile', { userId: currentUser.id });
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left rtl:text-right"
                  >
                    <UserIcon className="w-4 h-4 text-indigo-500" />
                    <span>{t('profile')}</span>
                  </button>

                  <button
                    onClick={() => {
                       setShowUserMenu(false);
                       onSelectTab('settings');
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left rtl:text-right"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-500" />
                    <span>{t('settings')}</span>
                  </button>

                  {onOpenShortcutsModal && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenShortcutsModal();
                      }}
                      className="w-full px-3.5 py-2 flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left rtl:text-right"
                    >
                      <div className="flex items-center gap-2.5">
                        <Keyboard className="w-4 h-4 text-slate-500" />
                        <span>{t('keyboardShortcuts')}</span>
                      </div>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 rounded border border-slate-200 dark:border-slate-700">
                        ?
                      </kbd>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left rtl:text-right"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('switchAccount')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
