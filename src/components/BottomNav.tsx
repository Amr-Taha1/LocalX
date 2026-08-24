import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Home, MessageSquare, Users, User as UserIcon, Search } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string, meta?: any) => void;
  unreadMessageCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  unreadMessageCount,
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  if (!currentUser) return null;

  const tabs = [
    { id: 'feed', label: t('feed'), icon: Home },
    { id: 'messenger', label: t('messenger'), icon: MessageSquare, badge: unreadMessageCount },
    { id: 'friends', label: t('friends'), icon: Users },
    { id: 'search', label: t('search'), icon: Search },
    { id: 'profile', label: t('profile'), icon: UserIcon, meta: { userId: currentUser.id } },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1 flex items-center justify-around transition-colors">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`bottom-nav-${tab.id}`}
            onClick={() => onSelectTab(tab.id, tab.meta)}
            className={`relative flex flex-col items-center justify-center min-w-[60px] py-1.5 px-2 rounded-xl transition ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 min-w-4 text-[9px] font-bold rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
                  {tab.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
