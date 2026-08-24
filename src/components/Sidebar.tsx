import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getUserDisplayName } from '../utils/formatters';
import { 
  Home, 
  MessageSquare, 
  Users, 
  User as UserIcon, 
  Search, 
  Settings,
  PlusCircle,
  Keyboard
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string, meta?: any) => void;
  unreadMessageCount: number;
  onOpenLanModal: () => void;
  onOpenCreatePost?: () => void;
  onOpenShortcutsModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unreadMessageCount,
  onOpenLanModal,
  onOpenCreatePost,
  onOpenShortcutsModal,
}) => {
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();

  if (!currentUser) return null;

  const navItems = [
    { id: 'feed', label: t('feed'), icon: Home, shortcut: 'H' },
    { id: 'messenger', label: t('messenger'), icon: MessageSquare, badge: unreadMessageCount, shortcut: 'M' },
    { id: 'friends', label: t('friends'), icon: Users, shortcut: 'F' },
    { id: 'profile', label: t('profile'), icon: UserIcon, meta: { userId: currentUser.id }, shortcut: 'P' },
    { id: 'search', label: t('search'), icon: Search, shortcut: '/' },
    { id: 'settings', label: t('settings'), icon: Settings, shortcut: 'G' },
  ];

  return (
    <aside className={`w-64 shrink-0 hidden lg:flex flex-col gap-3.5 sticky top-20 ${
      currentTab === 'messenger' ? 'h-full' : 'h-[calc(100vh-100px)]'
    }`}>
      {/* Current User Quick Mini-Card */}
      <button
        onClick={() => onSelectTab('profile', { userId: currentUser.id })}
        className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3 text-left rtl:text-right hover:border-indigo-500 transition group focus:outline-none cursor-pointer"
      >
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
            {getUserDisplayName(currentUser, language)}
          </p>
        </div>
      </button>

      {/* Quick Create Post Action Button */}
      {onOpenCreatePost && (
        <button
          onClick={onOpenCreatePost}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-between shadow-sm transition active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            <span>{t('publish')}</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white/20 rounded text-white/90">
            N
          </kbd>
        </button>
      )}

      {/* Nav Menu */}
      <nav className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id, item.meta)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && item.badge > 0 ? (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : (
                  <kbd
                    className={`px-1.5 py-0.5 text-[10px] font-mono font-medium rounded ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700/60'
                    }`}
                  >
                    {item.shortcut}
                  </kbd>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Keyboard Shortcuts Trigger */}
      {onOpenShortcutsModal && (
        <button
          onClick={onOpenShortcutsModal}
          className="mt-auto p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t('keyboardShortcuts')}</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">
            ?
          </kbd>
        </button>
      )}
    </aside>
  );
};

