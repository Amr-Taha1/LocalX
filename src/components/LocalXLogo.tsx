import React from 'react';

interface LocalXLogoProps {
  variant?: 'hero' | 'horizontal' | 'icon-only' | 'text-only';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showEmblem?: boolean;
  className?: string;
}

export const LocalXLogo: React.FC<LocalXLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showEmblem = false,
  className = '',
}) => {
  // Hero variant: exact 1:1 match of user's image.png
  if (variant === 'hero') {
    return (
      <div dir="ltr" style={{ direction: 'ltr' }} className={`inline-flex items-center justify-center select-none ${className}`}>
        <svg
          viewBox="0 0 400 400"
          className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl shadow-2xl border border-slate-800/80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Deep Navy Dark Canvas */}
          <rect width="400" height="400" rx="24" fill="#04040c" />

          <defs>
            {/* White to silver gradient for L */}
            <linearGradient id="hero-l" x1="140" y1="120" x2="220" y2="220" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* Electric Blue-Purple gradient for Wing */}
            <linearGradient id="hero-k" x1="200" y1="170" x2="270" y2="170" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="45%" stopColor="#4F46E5" />
              <stop offset="80%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>

            {/* Gradient for X */}
            <linearGradient id="hero-x" x1="270" y1="240" x2="310" y2="280" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>

          {/* White 'L' */}
          <path
            d="M 148 132
               C 148 123.2 155.2 116 164 116
               C 172.8 116 180 123.2 180 132
               L 180 200
               C 180 205.5 184.5 210 190 210
               L 226 210
               C 231.5 210 235.2 215.2 233 220.2
               L 228 230.8
               C 226 235.2 221.5 238 216.8 238
               L 170 238
               C 157.8 238 148 228.2 148 216
               Z"
            fill="url(#hero-l)"
          />

          {/* Electric Blue/Purple Chevron Wing */}
          <path
            d="M 200 192
               L 238 140
               L 266 140
               C 270.2 140 272.5 144.8 269.8 147.8
               L 235 193
               L 271 239.2
               C 273.8 242.2 271.5 247 267.2 247
               L 240 247
               Z"
            fill="url(#hero-k)"
          />

          {/* Wordmark: LocalX in Vector Paths */}
          {/* L */}
          <path
            d="M 96 260 C 96 255.5 99.5 252 104 252 C 108.5 252 112 255.5 112 260 L 112 280 C 112 283.3 114.7 286 118 286 L 130 286 C 134.4 286 138 289.6 138 294 C 138 298.4 134.4 302 130 302 L 112 302 C 103.2 302 96 294.8 96 286 Z"
            fill="#FFFFFF"
          />

          {/* o */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 148 264 C 148 257.4 153.4 252 160 252 L 174 252 C 180.6 252 186 257.4 186 264 L 186 290 C 186 296.6 180.6 302 174 302 L 160 302 C 153.4 302 148 296.6 148 290 Z M 160 262 C 157.8 262 156 263.8 156 266 L 156 288 C 156 290.2 157.8 292 160 292 L 174 292 C 176.2 292 178 290.2 178 288 L 178 266 C 178 263.8 176.2 262 174 262 Z"
            fill="#FFFFFF"
          />

          {/* c */}
          <path
            d="M 226 260 C 226 255.6 222.4 252 218 252 L 204 252 C 197.4 252 192 257.4 192 264 L 192 290 C 192 296.6 197.4 302 204 302 L 218 302 C 222.4 302 226 298.4 226 294 C 226 289.6 222.4 286 218 286 L 205 286 C 202.8 286 201 284.2 201 282 L 201 272 C 201 269.8 202.8 268 205 268 L 218 268 C 222.4 268 226 264.4 226 260 Z"
            fill="#FFFFFF"
          />

          {/* a */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 232 264 C 232 257.4 237.4 252 244 252 L 258 252 C 264.6 252 270 257.4 270 264 L 270 296 C 270 299.3 267.3 302 264 302 C 260.7 302 258 299.3 258 296 L 258 292 C 255.5 298 249.8 302 243 302 C 236 302 232 296 232 289 Z M 241 270 C 240.5 270 240 270.8 240 271.8 L 240 284.2 C 240 287.6 242.8 290.4 246.2 290.4 C 249.6 290.4 252.4 287.6 252.4 284.2 L 252.4 271.8 C 252.4 270.8 251.9 270 251.4 270 Z"
            fill="#FFFFFF"
          />

          {/* l */}
          <path
            d="M 278 256 C 278 252.5 280.8 249.6 284.4 249.6 C 287.9 249.6 290.8 252.5 290.8 256 L 290.8 298 C 290.8 301.5 287.9 304.4 284.4 304.4 C 280.8 304.4 278 301.5 278 298 Z"
            fill="#FFFFFF"
          />

          {/* X */}
          <path
            d="M 298 260 C 295 256.2 296.2 252 300.2 250.5 C 304.2 249 308 250.8 310 254.5 L 322 274 L 334 254.5 C 336 250.8 339.8 249 343.8 250.5 C 347.8 252 349 256.2 346 260 L 331 280 L 347 301 C 349.5 304.5 348.5 308.8 344.5 310.2 C 340.5 311.8 336.8 310 334.8 306.5 L 322 286 L 309.2 306.5 C 307.2 310 303.5 311.8 299.5 310.2 C 295.5 308.8 294.5 304.5 297 301 L 313 280 Z"
            fill="url(#hero-x)"
          />
        </svg>
      </div>
    );
  }

  // Size configurations
  const sizeConfig = {
    xs: { height: 18, width: 80, icon: 20 },
    sm: { height: 22, width: 96, icon: 24 },
    md: { height: 26, width: 114, icon: 30 },
    lg: { height: 34, width: 150, icon: 40 },
    xl: { height: 44, width: 194, icon: 52 },
  };

  const { height, width, icon } = sizeConfig[size] || sizeConfig.md;

  if (variant === 'icon-only') {
    return (
      <svg
        dir="ltr"
        width={icon}
        height={icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
      >
        <defs>
          <linearGradient id="icon-l-g" x1="20" y1="15" x2="65" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="icon-w-g" x1="45" y1="48" x2="95" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="35%" stopColor="#4F46E5" />
            <stop offset="70%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <path d="M 24 23 C 24 17.5 28.5 13 34 13 C 39.5 13 44 17.5 44 23 L 44 63 C 44 65.2 45.8 67 48 67 L 74 67 C 77 67 79 70 77.5 72.5 L 70.5 83 C 69 85.2 66.5 86.5 63.8 86.5 L 37 86.5 C 29.8 86.5 24 80.7 24 73.5 Z" fill="url(#icon-l-g)" />
        <path d="M 52 48 L 73.5 26 L 90 26 C 92.5 26 93.8 28.8 92.2 30.5 L 73 51 L 93.2 72.5 C 94.8 74.2 93.5 77 91 77 L 74.5 77 Z" fill="url(#icon-w-g)" />
      </svg>
    );
  }

  // Wordmark LocalX without emblem
  return (
    <div
      dir="ltr"
      style={{ direction: 'ltr' }}
      className={`inline-flex items-center gap-2 select-none shrink-0 ${className}`}
    >
      {showEmblem && (
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <defs>
            <linearGradient id={`h-nav-l-${size}`} x1="20" y1="15" x2="65" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id={`h-nav-w-${size}`} x1="45" y1="48" x2="95" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="35%" stopColor="#4F46E5" />
              <stop offset="70%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          <path d="M 24 23 C 24 17.5 28.5 13 34 13 C 39.5 13 44 17.5 44 23 L 44 63 C 44 65.2 45.8 67 48 67 L 74 67 C 77 67 79 70 77.5 72.5 L 70.5 83 C 69 85.2 66.5 86.5 63.8 86.5 L 37 86.5 C 29.8 86.5 24 80.7 24 73.5 Z" fill={`url(#h-nav-l-${size})`} />
          <path d="M 52 48 L 73.5 26 L 90 26 C 92.5 26 93.8 28.8 92.2 30.5 L 73 51 L 93.2 72.5 C 94.8 74.2 93.5 77 91 77 L 74.5 77 Z" fill={`url(#h-nav-w-${size})`} />
        </svg>
      )}

      {/* Pure Vector LocalX Wordmark */}
      <svg
        height={height}
        width={width}
        viewBox="0 0 100 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 overflow-visible"
      >
        <defs>
          <linearGradient id={`w-x-grad-${size}`} x1="72" y1="2" x2="98" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>

        {/* 'Local' in pure paths */}
        <g className="fill-slate-900 dark:fill-white">
          {/* L */}
          <path d="M 2 3 C 2 1.8 2.8 1 4 1 C 5.2 1 6 1.8 6 3 L 6 17 C 6 18.1 6.9 19 8 19 L 14 19 C 15.1 19 16 19.9 16 21 C 16 22.1 15.1 23 14 23 L 8 23 C 4.7 23 2 20.3 2 17 Z" />
          {/* o */}
          <path fillRule="evenodd" clipRule="evenodd" d="M 20 6 C 20 3.8 21.8 2 24 2 L 29 2 C 31.2 2 33 3.8 33 6 L 33 17 C 33 19.2 31.2 21 29 21 L 24 21 C 21.8 21 20 19.2 20 17 Z M 24 6 C 23.5 6 23 6.5 23 7 L 23 16 C 23 16.5 23.5 17 24 17 L 29 17 C 29.5 17 30 16.5 30 16 L 30 7 C 30 6.5 29.5 6 29 6 Z" />
          {/* c */}
          <path d="M 48 5 C 48 3.9 47.1 3 46 3 L 40 3 C 37.8 3 36 4.8 36 7 L 36 16 C 36 18.2 37.8 20 40 20 L 46 20 C 47.1 20 48 19.1 48 18 C 48 16.9 47.1 16 46 16 L 41 16 C 39.9 16 39 15.1 39 14 L 39 9 C 39 7.9 39.9 7 41 7 L 46 7 C 47.1 7 48 6.1 48 5 Z" />
          {/* a */}
          <path fillRule="evenodd" clipRule="evenodd" d="M 51 6 C 51 3.8 52.8 2 55 2 L 60 2 C 62.2 2 64 3.8 64 6 L 64 19 C 64 20.1 63.1 21 62 21 C 60.9 21 60 20.1 60 19 L 60 18 C 58.8 20 56.5 21 54 21 C 51.5 21 51 19 51 17 Z M 55 7 C 54.5 7 54 7.5 54 8 L 54 15 C 54 15.5 54.5 16 55 16 L 59 16 C 59.5 16 60 15.5 60 15 L 60 8 C 60 7.5 59.5 7 59 7 Z" />
          {/* l */}
          <path d="M 68 2 C 68 0.9 68.9 0 70 0 C 71.1 0 72 0.9 72 2 L 72 20 C 72 21.1 71.1 22 70 22 C 68.9 22 68 21.1 68 20 Z" />
        </g>

        {/* 'X' in vibrant gradient */}
        <path
          d="M 77 4 C 75.8 2.6 76.2 0.8 77.6 0.2 C 79 -0.4 80.6 0.2 81.4 1.6 L 86 8.5 L 90.6 1.6 C 91.4 0.2 93 -0.4 94.4 0.2 C 95.8 0.8 96.2 2.6 95 4 L 89.5 11.5 L 95.5 19.5 C 96.5 20.9 96.1 22.7 94.7 23.3 C 93.3 23.9 91.7 23.3 90.9 21.9 L 86 14.5 L 81.1 21.9 C 80.3 23.3 78.7 23.9 77.3 23.3 C 75.9 22.7 75.5 20.9 76.5 19.5 L 82.5 11.5 Z"
          fill={`url(#w-x-grad-${size})`}
        />
      </svg>
    </div>
  );
};
