import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getUserDisplayName } from '../utils/formatters';
import { 
  Settings, 
  Globe, 
  Moon, 
  Sun, 
  KeyRound, 
  User,
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ShieldCheck,
  Save
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentUser, changePin, updateProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme, setTheme } = useTheme();

  // Profile Name state
  const [name, setName] = useState<string>(currentUser?.name || currentUser?.nameAr || '');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<string>('');
  const [profileError, setProfileError] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || currentUser.nameAr || '');
    }
  }, [currentUser]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError(language === 'ar' ? 'يرجى إدخال اسم صحيح' : 'Please enter a valid display name.');
      return;
    }

    setProfileSaving(true);
    const chosenName = name.trim();
    const success = await updateProfile({
      name: chosenName,
      nameAr: chosenName,
    });
    setProfileSaving(false);

    if (success) {
      setProfileSuccess(t('profileUpdated'));
      setTimeout(() => setProfileSuccess(''), 4000);
    } else {
      setProfileError(language === 'ar' ? 'فشل حفظ الاسم' : 'Failed to update name.');
    }
  };

  // Change PIN state
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [pinSuccess, setPinSuccess] = useState<string>('');
  const [submittingPin, setSubmittingPin] = useState<boolean>(false);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (!currentPin || !newPin || !confirmPin) {
      setPinError(language === 'ar' ? 'جميع الحقول مطلوبة.' : 'All fields are required.');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinError(t('pinLengthError'));
      return;
    }
    if (newPin !== confirmPin) {
      setPinError(t('pinMismatch'));
      return;
    }

    setSubmittingPin(true);
    const res = await changePin(currentPin, newPin);
    setSubmittingPin(false);

    if (res.success) {
      setPinSuccess(t('pinChangedSuccess'));
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      setPinError(res.error || (language === 'ar' ? 'فشل تحديث رمز PIN' : 'Failed to update PIN'));
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('settings')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'ar' ? 'تخصيص اللغة، المظهر، ورمز PIN للأمان.' : 'Customize language, theme, and security PIN.'}
          </p>
        </div>
      </div>

      {/* 1. Language & Appearance Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-5">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" />
          <span>{t('language')} & {t('appearance')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Language Selector */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t('language')} / اللغة
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition border ${
                  language === 'en'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                English (LTR)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition border ${
                  language === 'ar'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                العربية (RTL)
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t('appearance')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="settings-theme-light-btn"
                onClick={() => setTheme('light')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border ${
                  theme === 'light'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('lightMode')}</span>
              </button>
              <button
                type="button"
                id="settings-theme-dark-btn"
                onClick={() => setTheme('dark')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border ${
                  theme === 'dark'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t('darkMode')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Profile Display Name Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          <span>{language === 'ar' ? 'تعديل اسم الحساب' : 'Profile Display Name'}</span>
        </h3>

        <form onSubmit={handleUpdateName} className="space-y-3 max-w-md">
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
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm border border-transparent focus:border-indigo-500 focus:outline-none font-medium"
            />
          </div>

          {profileError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
          >
            {profileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{t('saveChanges')}</span>
          </button>
        </form>
      </div>

      {/* 3. Security PIN Change Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-500" />
          <span>{t('changePin')} ({getUserDisplayName(currentUser, language)})</span>
        </h3>

        <form onSubmit={handleChangePin} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('currentPin')}
            </label>
            <input
              type="password"
              maxLength={4}
              value={currentPin}
              onChange={e => setCurrentPin(e.target.value)}
              placeholder="••••"
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs border border-transparent focus:border-indigo-500 focus:outline-none tracking-widest"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('newPin')}
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                placeholder="••••"
                className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs border border-transparent focus:border-indigo-500 focus:outline-none tracking-widest"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('confirmPin')}
              </label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value)}
                placeholder="••••"
                className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs border border-transparent focus:border-indigo-500 focus:outline-none tracking-widest"
              />
            </div>
          </div>

          {pinError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          {pinSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pinSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submittingPin}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
          >
            {submittingPin && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{t('changePin')}</span>
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4" />
          <span>{language === 'ar' ? 'شبكة محلية خاصة وآمنة 100%' : '100% Private Offline Network'}</span>
        </div>
      </div>
    </div>
  );
};
