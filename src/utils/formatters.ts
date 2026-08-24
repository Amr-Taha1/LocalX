import { Language } from '../i18n/translations';

export function formatTimeAgo(isoString: string, lang: Language): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) {
    return lang === 'ar' ? 'الآن' : 'Just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return lang === 'ar' ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return lang === 'ar' ? `منذ ${diffHour} ساعة` : `${diffHour}h ago`;
  }

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) {
    return lang === 'ar' ? `منذ ${diffDay} أيام` : `${diffDay}d ago`;
  }

  return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getUserDisplayName(
  user?: { name: string; nameAr?: string } | null, 
  _lang?: Language
): string {
  if (!user) return '';
  return user.name || user.nameAr || '';
}

export function getUserRole(
  user?: { role?: string; roleAr?: string } | null, 
  _lang?: Language
): string {
  if (!user) return '';
  return user.role || user.roleAr || '';
}

export function getUserBio(
  user?: { bio?: string; bioAr?: string } | null, 
  _lang?: Language
): string {
  if (!user) return '';
  return user.bio || user.bioAr || '';
}
