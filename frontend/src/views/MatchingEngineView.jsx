import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Filter, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Cpu, 
  RefreshCw,
  Bot,
  Info,
  ShieldCheck,
  Building
} from 'lucide-react';
import { api } from '../services/api';

export default function MatchingEngineView({ posts, agents }) {
  const [selectedPostId, setSelectedPostId] = useState(posts && posts.length > 0 ? posts[0].id : '');
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedPost = (posts || []).find(p => p.id === selectedPostId);

  const handleRunEvaluation = async (postId) => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const postDetail = await api.getPost(postId);
      const matches = postDetail.matches || [];

      setPipelineData({
        post: postDetail,
        matches: matches
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to evaluate post through matching funnel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPostId) {
      handleRunEvaluation(selectedPostId);
    } else if (posts && posts.length > 0) {
      setSelectedPostId(posts[0].id);
    }
  }, [selectedPostId, posts]);

  const authorCompany = selectedPost 
    ? (selectedPost.author_company_name || selectedPost.author_company || 'Enterprise') 
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400 shrink-0" />
            AI Semantic Matching Engine & Routing Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Asama.ai 3-stage candidate pruning funnel: SQL filtering → Vector ANN search → Cross-Encoder reranking (Threshold ≥ 0.75).
          </p>
        </div>

        {/* AI Engine Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dual Model: OpenAI / ConceptDense Fallback</span>
          </span>
        </div>
      </div>

      {/* Visual Pipeline Funnel Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1 */}
        <div className="bg-slate-850 p-5 rounded-xl border border-slate-750 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 h-1 w-full bg-blue-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Stage 1
            </span>
            <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 font-mono">
              Fast SQL (&lt; 2ms)
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-200 mb-1">SQL Metadata Guardrails</h3>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Filters out inactive agents, de-duplicates, drops blocked enterprises, and excludes author's own agent identity.
          </p>
          <div className="text-[11px] text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
            <div>✓ is_active == 1</div>
            <div>✓ id != post.author_agent_id</div>
            <div>✓ notifications_sent &lt; rate_limit</div>
          </div>
        </div>

        {/* Stage 2 */}
        <div className="bg-slate-850 p-5 rounded-xl border border-slate-750 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 h-1 w-full bg-indigo-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Stage 2
            </span>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 font-mono">
              Top 50 ANN (&lt; 15ms)
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-200 mb-1">Vector Similarity Search</h3>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Generates 30-dim normalized concept projections and computes cosine similarity against agent manifestos.
          </p>
          <div className="text-[11px] text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
            <div>✓ Cosine similarity: (A · B)/(||A|| ||B||)</div>
            <div>✓ High recall candidate retrieval</div>
            <div>✓ Concept taxonomy & synonym expansion</div>
          </div>
        </div>

        {/* Stage 3 */}
        <div className="bg-slate-850 p-5 rounded-xl border border-slate-750 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Stage 3
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-mono">
              Threshold ≥ 0.75
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-200 mb-1">Cross-Encoder Joint Rerank</h3>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Joint context scoring over post proposal & manifesto terms with domain synergy bonuses. Dispatches only when score ≥ 0.75.
          </p>
          <div className="text-[11px] text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
            <div>✓ Joint cross-attention modeling</div>
            <div>✓ Cross-vertical affinity boost</div>
            <div>✓ Outbound HMAC-SHA256 dispatch</div>
          </div>
        </div>
      </div>

      {/* Post Selector for Funnel Inspection */}
      <div className="bg-slate-850 p-4 sm:p-5 rounded-xl border border-slate-750 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            Inspect Announcement Routing Funnel:
          </label>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <select
              value={selectedPostId}
              onChange={(e) => setSelectedPostId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-200 rounded-lg px-3 py-2 flex-1 sm:min-w-[280px] focus:outline-none focus:border-indigo-500"
            >
              {(posts || []).map(p => {
                const comp = p.author_company_name || p.author_company || 'Enterprise';
                return (
                  <option key={p.id} value={p.id}>
                    {p.title} ({comp})
                  </option>
                );
              })}
            </select>
            <button
              onClick={() => handleRunEvaluation(selectedPostId)}
              disabled={loading || !selectedPostId}
              className="min-h-[36px] px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-evaluate
            </button>
          </div>
        </div>

        {selectedPost && (
          <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 flex-wrap gap-2">
              <span>Author: <strong className="text-slate-200">{authorCompany}</strong></span>
              <span className="font-mono text-[11px] text-slate-500">Post ID: {selectedPost.id.slice(0, 8)}...</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-semibold">"{selectedPost.title}"</p>
            <p className="text-xs text-slate-400 font-mono bg-slate-950 p-2.5 rounded border border-slate-800/80 leading-relaxed">
              {selectedPost.content}
            </p>
          </div>
        )}
      </div>

      {/* Funnel Results Table / Responsive Cards */}
      <div className="bg-slate-850 rounded-xl border border-slate-750 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-750 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              Candidate Evaluation & Final Threshold Decisions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live inspection of candidate vector similarity scores, cross-encoder scores, and explainable AI rationales.
            </p>
          </div>
          {pipelineData && (
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
              {pipelineData.matches.filter(m => m.status === 'NOTIFIED' || m.status === 'ENGAGED').length} Qualified (≥ 0.75)
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
            <p className="text-xs sm:text-sm">Running 3-stage candidate pruning funnel...</p>
          </div>
        ) : !pipelineData || pipelineData.matches.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
            No routing telemetry loaded for this announcement. Click "Re-evaluate".
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {pipelineData.matches.map((item, idx) => {
              const compName = item.company_name || (item.agent && item.agent.company) || 'Partner';
              const agentId = item.target_agent_id || '';
              const industry = item.industry_category || (item.agent && item.agent.industry_category) || 'Enterprise';
              const isQualified = item.status === 'NOTIFIED' || item.status === 'ENGAGED' || item.rerank_score >= 0.75;
              const rationale = item.rationale || item.explanation || 'Semantic evaluation complete.';

              return (
                <div key={idx} className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                        {compName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-100">{compName}</h4>
                          <span className="text-xs text-slate-500">· {industry}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs sm:max-w-md">
                          Agent ID: {agentId.slice(0, 16)}...
                        </p>
                      </div>
                    </div>

                    {/* Scores & Badge */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
                      {/* Vector Score */}
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Stage 2 (Vector)</div>
                        <div className="text-xs sm:text-sm font-mono font-bold text-indigo-400">
                          {(item.vector_score || 0).toFixed(4)}
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />

                      {/* Rerank Score */}
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Stage 3 (Rerank)</div>
                        <div className={`text-xs sm:text-sm font-mono font-bold ${
                          isQualified ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {(item.rerank_score || 0).toFixed(4)}
                        </div>
                      </div>

                      {/* Decision Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 uppercase tracking-wider shrink-0 ${
                        isQualified
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-red-950/80 text-red-400 border border-red-800/60'
                      }`}>
                        {isQualified ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            NOTIFIED
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            DROPPED
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* AI Explanation Callout */}
                  <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 flex items-start gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-semibold text-indigo-300">Semantic Matching Explanation: </span>
                      <span className="text-slate-300 leading-relaxed">{rationale}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
