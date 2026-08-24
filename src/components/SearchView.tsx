import React, { useState, useEffect } from 'react';
import { User, Post, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getUserDisplayName, getUserBio } from '../utils/formatters';
import { PostCard } from './PostCard';
import { Search as SearchIcon, Users, FileText, MessageSquare, Loader2 } from 'lucide-react';

interface SearchViewProps {
  initialQuery?: string;
  onSelectUser: (userId: string) => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  initialQuery = '',
  onSelectUser,
  onEditPost,
  onDeletePost,
}) => {
  const { allUsers } = useAuth();
  const { language, t } = useLanguage();

  const [query, setQuery] = useState<string>(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'people' | 'comments'>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<{
    users: User[];
    posts: Post[];
    comments: Comment[];
  }>({ users: [], posts: [], comments: [] });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], posts: [], comments: [] });
      return;
    }

    setLoading(true);
    const debounce = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then(res => res.json())
        .then(data => {
          setResults(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Search error:', err);
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(debounce);
  }, [query]);

  const totalCount = results.users.length + results.posts.length + results.comments.length;

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rtl:left-auto rtl:right-3.5" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full py-2.5 px-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin rtl:right-auto rtl:left-3.5" />
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: 'all', label: t('searchTabAll'), count: totalCount },
            { id: 'posts', label: t('searchTabPosts'), count: results.posts.length },
            { id: 'people', label: t('searchTabPeople'), count: results.users.length },
            { id: 'comments', label: t('searchTabComments'), count: results.comments.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {query && <span className="opacity-80">({tab.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Results Container */}
      {!query ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          <SearchIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 stroke-1 mb-2" />
          <p>{t('searchPlaceholder')}</p>
        </div>
      ) : totalCount === 0 && !loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center text-slate-400 text-sm">
          {t('noSearchResults')} "{query}"
        </div>
      ) : (
        <div className="space-y-4">
          {/* People Section */}
          {(activeTab === 'all' || activeTab === 'people') && results.users.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                {t('searchTabPeople')} ({results.users.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user.id)}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-left rtl:text-right hover:border-indigo-500 transition shadow-sm"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {getUserDisplayName(user, language)}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {getUserBio(user, language)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Posts Section */}
          {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                {t('searchTabPosts')} ({results.posts.length})
              </h3>
              {results.posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={onEditPost}
                  onDelete={onDeletePost}
                />
              ))}
            </div>
          )}

          {/* Comments Section */}
          {(activeTab === 'all' || activeTab === 'comments') && results.comments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                {t('searchTabComments')} ({results.comments.length})
              </h3>
              <div className="space-y-2">
                {results.comments.map(c => {
                  const author = allUsers.find(u => u.id === c.userId);
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={author?.avatar}
                          alt={author?.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {getUserDisplayName(author, language)}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 pl-7 rtl:pl-0 rtl:pr-7">
                        {c.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
