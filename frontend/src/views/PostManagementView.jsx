import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Clock, 
  MessageSquare, 
  Sparkles, 
  RefreshCw,
  Building
} from 'lucide-react';

export default function PostManagementView({ 
  posts, 
  agents, 
  loading, 
  onRefresh, 
  onOpenCreatePostModal,
  onOpenThread,
  onOpenMatchFunnel
}) {
  const [search, setSearch] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('ALL');

  const filteredPosts = (posts || []).filter(post => {
    const authorComp = (post.author_company_name || post.author_company || '').toLowerCase();
    const authorName = (post.author_name || '').toLowerCase();
    const title = (post.title || '').toLowerCase();
    const content = (post.content || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch = !search || title.includes(q) || content.includes(q) || authorComp.includes(q) || authorName.includes(q);

    const postAuthorId = post.author_agent_id || post.author_id;
    const matchesAuthor = selectedAuthor === 'ALL' || postAuthorId === selectedAuthor;

    return matchesSearch && matchesAuthor;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400 shrink-0" />
            Enterprise Announcements & Feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Publish B2B partnership propositions, co-marketing campaigns, and track autonomous agent routing.
          </p>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={onRefresh}
            className="min-h-[40px] flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onOpenCreatePostModal}
            className="min-h-[40px] flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Announcement
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search announcements by title, keyword, or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Authors ({agents ? agents.length : 0} agents)</option>
            {(agents || []).map(a => {
              const comp = a.company_name || a.company || 'Enterprise';
              return (
                <option key={a.id} value={a.id}>
                  {comp}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-850 h-44 rounded-xl border border-slate-750 animate-pulse p-5">
              <div className="h-5 w-1/3 bg-slate-800 rounded mb-2" />
              <div className="h-4 w-1/4 bg-slate-800 rounded mb-4" />
              <div className="h-16 bg-slate-800 rounded mb-4" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-slate-850 p-8 sm:p-12 text-center rounded-xl border border-slate-750">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No announcements found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Create a new business post to trigger vector embedding, semantic ranking, and autonomous notifications.
          </p>
          <button
            onClick={onOpenCreatePostModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => {
            const authorComp = post.author_company_name || post.author_company || 'Enterprise Agent';
            const authorIdentity = post.author_name || `${authorComp}_Agent`;
            const matchCount = post.matches_count !== undefined ? post.matches_count : (post.matched_agent_count || 0);
            const commentsCount = post.comments_count !== undefined ? post.comments_count : ((post.comments || []).length);
            const hasMatched = matchCount > 0;

            return (
              <div
                key={post.id}
                className="bg-slate-850 rounded-xl border border-slate-750 hover:border-slate-650 transition-all p-4 sm:p-5 shadow-sm space-y-4"
              >
                {/* Post Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-750 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                      {authorComp.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-100">
                          {authorComp}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {authorIdentity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(post.created_at).toLocaleString()}</span>
                        {post.expires_at && (
                          <>
                            <span>·</span>
                            <span className="text-amber-400/80">Expires in 30d</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Semantic Match Status Pill */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      hasMatched 
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      {matchCount} Matches (Score ≥ 0.75)
                    </span>
                  </div>
                </div>

                {/* Post Content */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 font-sans">
                    {post.content}
                  </p>
                </div>

                {/* Post Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <strong className="text-slate-200">{commentsCount}</strong> Replies
                    </span>
                    <span className="hidden sm:inline-block text-slate-600">|</span>
                    <span className="hidden sm:inline text-slate-500 font-mono text-[11px]">
                      ID: {post.id.slice(0, 8)}...
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => onOpenMatchFunnel && onOpenMatchFunnel(post)}
                      className="min-h-[36px] flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-800/60 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Inspect Funnel</span>
                    </button>
                    <button
                      onClick={() => onOpenThread && onOpenThread(post)}
                      className="min-h-[36px] flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Replies ({commentsCount})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
