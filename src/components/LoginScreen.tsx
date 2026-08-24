import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { UserId, User } from '../types';
import { LocalXLogo } from './LocalXLogo';
import { getUserDisplayName } from '../utils/formatters';
import { Lock, ShieldCheck, Wifi, Moon, Sun, Globe, ArrowRight, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { allUsers, login, lanInfo } = useAuth();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [selectedUserId, setSelectedUserId] = useState<UserId | null>(null);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.id);
    setPin('');
    setError('');
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4 && selectedUserId) {
        handleSubmitPin(selectedUserId, nextPin);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClearPin = () => {
    setPin('');
    setError('');
  };

  const handleSubmitPin = async (userId: UserId, pinValue: string) => {
    if (pinValue.length !== 4) {
      setError(t('pinLengthError'));
      return;
    }
    setSubmitting(true);
    setError('');
    const res = await login(userId, pinValue);
    setSubmitting(false);
    if (!res.success) {
      setError(t('invalidPin'));
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Top Header / Quick controls */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <LocalXLogo variant="horizontal" size="sm" />
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            id="lang-toggle-btn"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Change Language"
          >
            <Globe className="w-4 h-4 text-slate-500" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 shadow-sm"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {!selectedUserId ? (
          <div className="w-full text-center space-y-8 animate-fadeIn">
            <div className="space-y-4 flex flex-col items-center">
              {/* Exact 1:1 LocalX Image from image.png */}
              <LocalXLogo variant="hero" />

              <div className="space-y-1 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('tagline')}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('welcomeBack')}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  {t('selectAccount')}
                </p>
              </div>
            </div>

            {/* 4 Predefined User Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
              {allUsers.map(user => {
                return (
                  <button
                    key={user.id}
                    id={`user-select-${user.id}`}
                    onClick={() => handleSelectUser(user)}
                    className="group relative flex flex-col items-center text-center p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all duration-200 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <div className="relative mb-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-indigo-100 dark:border-slate-800 group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg mt-1 mb-1">
                      {getUserDisplayName(user, language)}
                    </h3>
                    <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                      <span>{t('unlock')}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* PIN Input Screen */
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
            {/* User header */}
            <div className="text-center space-y-3 mb-6">
              <div className="relative inline-block">
                <img
                  src={selectedUser?.avatar}
                  alt={selectedUser?.name}
                  className="w-20 h-20 rounded-full object-cover border-3 border-indigo-500 mx-auto shadow"
                />
                <button
                  id="switch-user-btn"
                  onClick={() => setSelectedUserId(null)}
                  className="absolute -top-1 -right-1 text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full px-2 py-0.5 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                  title="Switch user"
                >
                  ✕
                </button>
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {getUserDisplayName(selectedUser, language)}
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {t('enterPin')}
              </p>
            </div>

            {/* Masked PIN dots */}
            <div className="flex justify-center gap-3 my-4">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                    pin.length > i
                      ? 'bg-indigo-600 dark:bg-indigo-400 border-indigo-600 scale-110'
                      : 'bg-transparent border-slate-300 dark:border-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium mb-3 p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Number Pad for Touch & Desktop */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[240px] mx-auto my-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  key={digit}
                  id={`keypad-${digit}`}
                  type="button"
                  onClick={() => handlePinInput(digit)}
                  disabled={submitting}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 active:scale-95 text-lg font-bold text-slate-800 dark:text-slate-200 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {digit}
                </button>
              ))}
              <button
                id="keypad-clear"
                type="button"
                onClick={handleClearPin}
                className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-slate-600 dark:text-slate-400 transition"
              >
                C
              </button>
              <button
                id="keypad-0"
                type="button"
                onClick={() => handlePinInput('0')}
                disabled={submitting}
                className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 active:scale-95 text-lg font-bold text-slate-800 dark:text-slate-200 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                0
              </button>
              <button
                id="keypad-backspace"
                type="button"
                onClick={handleDeleteDigit}
                className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 transition"
                title="Delete"
              >
                ⌫
              </button>
            </div>

            {/* Back button */}
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                id="cancel-pin-btn"
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="w-full py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Banner */}
      <footer className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{language === 'ar' ? 'شبكة محلية خاصة وآمنة 100%' : '100% Private Offline Network'}</span>
        </div>
      </footer>
    </div>
  );
};
