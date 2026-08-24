import React, { useState } from 'react';
import { MediaItem } from '../types';
import { Play, FileText, Download, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';

interface MediaGalleryProps {
  media: MediaItem[];
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ media }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!media || media.length === 0) return null;

  const visualItems = media.filter(m => m.type === 'image' || m.type === 'video');
  const fileItems = media.filter(m => m.type === 'file');

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex < visualItems.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    } else {
      setLightboxIndex(0);
    }
  };

  const prevLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    } else {
      setLightboxIndex(visualItems.length - 1);
    }
  };

  return (
    <div className="space-y-2 mt-3">
      {/* Visual Media (Images + Videos) Grid */}
      {visualItems.length > 0 && (
        <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800">
          {visualItems.length === 1 && (
            <div className="relative group max-h-[500px] flex items-center justify-center bg-black/5">
              {visualItems[0].type === 'image' ? (
                <img
                  src={visualItems[0].url}
                  alt={visualItems[0].name}
                  onClick={() => openLightbox(0)}
                  className="w-full h-auto max-h-[500px] object-cover cursor-pointer hover:opacity-95 transition"
                  loading="lazy"
                />
              ) : (
                <div className="w-full bg-black">
                  <video
                    src={visualItems[0].url}
                    controls
                    preload="metadata"
                    playsInline
                    className="w-full max-h-[500px] object-contain mx-auto"
                  />
                </div>
              )}
            </div>
          )}

          {visualItems.length === 2 && (
            <div className="grid grid-cols-2 gap-1 bg-slate-200 dark:bg-slate-800">
              {visualItems.map((item, idx) => (
                <div key={item.id} className="relative aspect-square overflow-hidden bg-black/10">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      onClick={() => openLightbox(idx)}
                      className="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      preload="metadata"
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {visualItems.length === 3 && (
            <div className="grid grid-cols-2 gap-1 bg-slate-200 dark:bg-slate-800">
              <div className="relative aspect-square overflow-hidden row-span-2">
                {visualItems[0].type === 'image' ? (
                  <img
                    src={visualItems[0].url}
                    alt={visualItems[0].name}
                    onClick={() => openLightbox(0)}
                    className="w-full h-full object-cover cursor-pointer hover:scale-102 transition"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={visualItems[0].url}
                    controls
                    preload="metadata"
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="grid grid-rows-2 gap-1 h-full">
                {visualItems.slice(1, 3).map((item, idx) => (
                  <div key={item.id} className="relative aspect-video sm:aspect-auto h-full overflow-hidden">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        onClick={() => openLightbox(idx + 1)}
                        className="w-full h-full object-cover cursor-pointer hover:scale-102 transition"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        preload="metadata"
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visualItems.length >= 4 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-1 bg-slate-200 dark:bg-slate-800">
              {visualItems.slice(0, 4).map((item, idx) => {
                const isExtra = idx === 3 && visualItems.length > 4;
                return (
                  <div key={item.id} className="relative aspect-square overflow-hidden bg-black/10">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        onClick={() => openLightbox(idx)}
                        className="w-full h-full object-cover cursor-pointer hover:scale-102 transition"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        preload="metadata"
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    )}
                    {isExtra && (
                      <div
                        onClick={() => openLightbox(3)}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold cursor-pointer backdrop-blur-[2px] hover:bg-black/70 transition"
                      >
                        +{visualItems.length - 3}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Document / Attached Files List */}
      {fileItems.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {fileItems.map(file => (
            <a
              key={file.id}
              href={file.url}
              download={file.name}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition group text-xs text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="truncate font-medium">{file.name}</span>
                {file.size && (
                  <span className="text-[11px] text-slate-400 shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                )}
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" />
            </a>
          ))}
        </div>
      )}

      {/* Lightbox Modal for Full-View */}
      {lightboxIndex !== null && visualItems[lightboxIndex] && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {visualItems.length > 1 && (
            <>
              <button
                onClick={prevLightbox}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
                title="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextLightbox}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
                title="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            onClick={e => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center"
          >
            {visualItems[lightboxIndex].type === 'image' ? (
              <img
                src={visualItems[lightboxIndex].url}
                alt={visualItems[lightboxIndex].name}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <video
                src={visualItems[lightboxIndex].url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
            )}
            <p className="text-xs text-white/60 mt-3 font-medium">
              {lightboxIndex + 1} / {visualItems.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
