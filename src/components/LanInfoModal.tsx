import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Wifi, Copy, Check, QrCode, Server, Shield, X, HardDrive, Smartphone } from 'lucide-react';

interface LanInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanInfoModal: React.FC<LanInfoModalProps> = ({ isOpen, onClose }) => {
  const { lanInfo } = useAuth();
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const lanUrl = lanInfo?.lanUrl || window.location.origin;

  useEffect(() => {
    if (lanUrl) {
      QRCode.toDataURL(lanUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Failed to generate offline QR:', err));
    }
  }, [lanUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(lanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                {t('networkDetails')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('lanOnlyBadge')}
              </p>
            </div>
          </div>
          <button
            id="close-lan-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Main LAN Address Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('lanAccessUrl')}
            </span>
            <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-mono text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 break-all">
                {lanUrl}
              </span>
              <button
                id="copy-lan-address-btn"
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('copied') : t('copyLanUrl')}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('lanHelpText')}
            </p>
          </div>

          {/* QR Code and Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {qrDataUrl && (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center gap-2">
                <img
                  src={qrDataUrl}
                  alt="LAN QR Code"
                  className="w-32 h-32 rounded-lg border border-slate-100 dark:border-slate-800 bg-white p-1"
                />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {language === 'ar' ? 'امسح الرمز للفتح بالهاتف مباشرة' : 'Scan QR code with your phone camera'}
                </span>
              </div>
            )}

            <div className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 ${!qrDataUrl ? 'sm:col-span-2' : ''}`}>
              <Smartphone className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <strong className="text-slate-800 dark:text-slate-200 font-semibold block">
                  {language === 'ar' ? 'الهواتف والأجهزة اللوحية' : 'Phones & Tablets'}
                </strong>
                <p className="text-slate-500 dark:text-slate-400">
                  {language === 'ar'
                    ? 'اتصل بنفس شبكة الـ Wi-Fi المنزلية وافتح رابط الشبكة في المتصفح.'
                    : 'Connect to the same home Wi-Fi and open the LAN address in Chrome/Safari.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3">
            <Server className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-slate-800 dark:text-slate-200 font-semibold block">{t('serverPort')}</strong>
              <p className="text-slate-500 dark:text-slate-400 font-mono">Port: {lanInfo?.port || 3000} (Host: 0.0.0.0)</p>
            </div>
          </div>

          {/* Storage & Limits */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <HardDrive className="w-4 h-4 text-amber-500" />
              <span>{t('storageAndLimits')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1">
              <div>• {t('maxFileSize')}: <strong>{lanInfo?.uploadLimits?.maxFileSizeMb || 50} MB</strong></div>
              <div>• {t('maxFilesCount')}: <strong>{lanInfo?.uploadLimits?.maxFilesPerUpload || 10} {language === 'ar' ? 'ملفات' : 'files'}</strong></div>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              {t('storageInfo')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
