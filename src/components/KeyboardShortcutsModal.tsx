import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Keyboard, X, Compass, Zap, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  secondKey?: string;
  description: string;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const navigationShortcuts: ShortcutItem[] = [
    { key: 'H', description: t('shortcutFeed') },
    { key: 'M', description: t('shortcutMessenger') },
    { key: 'F', description: t('shortcutFriends') },
    { key: 'P', description: t('shortcutProfile') },
    { key: 'S', secondKey: '/', description: t('shortcutSearch') },
    { key: 'G', secondKey: ',', description: t('shortcutSettings') },
  ];

  const actionShortcuts: ShortcutItem[] = [
    { key: 'N', secondKey: 'C', description: t('shortcutNewPost') },
    { key: 'B', description: t('shortcutNewStory') },
    { key: 'L', secondKey: 'I', description: t('shortcutLanInfo') },
    { key: '?', description: t('shortcutShortcutsModal') },
    { key: 'Esc', description: t('shortcutCloseModal') },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t('shortcutsTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('shortcutsDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={t('cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Navigation Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>{t('navigationSection')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {navigationShortcuts.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs"
                >
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {item.description}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <kbd className="px-2 py-1 text-[11px] font-mono font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-md border border-slate-300 dark:border-slate-700 shadow-xs min-w-[24px] text-center">
                      {item.key}
                    </kbd>
                    {item.secondKey && (
                      <>
                        <span className="text-slate-400 text-[10px]">{language === 'ar' ? 'أو' : 'or'}</span>
                        <kbd className="px-2 py-1 text-[11px] font-mono font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-md border border-slate-300 dark:border-slate-700 shadow-xs min-w-[24px] text-center">
                          {item.secondKey}
                        </kbd>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>{t('actionsSection')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actionShortcuts.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs"
                >
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {item.description}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <kbd className="px-2 py-1 text-[11px] font-mono font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-md border border-slate-300 dark:border-slate-700 shadow-xs min-w-[24px] text-center">
                      {item.key}
                    </kbd>
                    {item.secondKey && (
                      <>
                        <span className="text-slate-400 text-[10px]">{language === 'ar' ? 'أو' : 'or'}</span>
                        <kbd className="px-2 py-1 text-[11px] font-mono font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-md border border-slate-300 dark:border-slate-700 shadow-xs min-w-[24px] text-center">
                          {item.secondKey}
                        </kbd>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{language === 'ar' ? 'اضغط ? في أي وقت لفتح هذه النافذة' : 'Press ? anytime to open this helper'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition text-xs shadow-sm cursor-pointer"
          >
            {language === 'ar' ? 'فهمت' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
