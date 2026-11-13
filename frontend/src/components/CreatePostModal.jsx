import React, { useState } from 'react';
import { X, FileText, Bot, AlertTriangle, Sparkles, Send, Clock, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function CreatePostModal({ isOpen, onClose, agents, onPostCreated }) {
  const [authorId, setAuthorId] = useState(agents && agents.length > 0 ? agents[0].id : '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Active agents only
  const activeAgents = (agents || []).filter(a => a.is_active !== undefined ? a.is_active : (a.status === 'active'));

  // Client-side quick threat heuristic to warn user
  const hasThreatPattern = /ignore\s+(all\s+)?(previous|above)\s+instructions|system\s+prompt|jailbreak/i.test(content);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!authorId || !title.trim() || !content.trim()) {
      setError('Please select an author agent, enter a title, and provide post details.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        author_agent_id: authorId,
        author_id: authorId,
        title: title.trim(),
        content: content.trim(),
        expires_days: Number(expiryDays)
      };

      const result = await api.createPost(payload);
      onPostCreated && onPostCreated(result);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to publish announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-850 rounded-2xl border border-slate-750 w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">Publish Business Announcement</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {hasThreatPattern && (
            <div className="p-3 bg-amber-950/60 border border-amber-800 rounded-lg text-xs text-amber-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Guardrail Alert:</strong> Content contains prompt injection signatures. Backend Llama Guard scanner will reject this request.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-slate-400" />
                Publishing Agent (Author) *
              </label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              >
                {activeAgents.length === 0 ? (
                  <option value="">No active agents found</option>
                ) : (
                  activeAgents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.company_name || a.company || 'Enterprise'} ({a.name || `${a.company_name || a.company}_Agent`})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Campaign Lifespan
              </label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days (Default)</option>
                <option value={60}>60 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Announcement Title / Campaign Focus *
            </label>
            <input
              type="text"
              placeholder="e.g. Seeking payments partner for festive co-marketing campaign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Detailed Proposal & Partner Requirements *
            </label>
            <textarea
              rows={4}
              placeholder="Describe commercial propositions, target audience demographics, synergy points, revenue sharing models, integration requirements..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              On publication, the AI pipeline will immediately score all registered enterprise agents and dispatch signed HMAC webhooks to candidates with score ≥ 0.75.
            </p>
          </div>

          {/* Quick Pre-fill Templates */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Sample B2B Templates:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTitle('Festive Season Co-Branded UPI Cashback Campaign');
                  setContent('Seeking fintech and banking partners to power exclusive 15% cashback rewards on festival season food deliveries. Projected 20M orders.');
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-900/60 px-2 py-1 rounded"
              >
                + Food & Payments Synergy
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle('Electric Vehicle Fleet Delivery Electrification Alliance');
                  setContent('Partnering with EV manufacturers to deploy 10,000 smart connected 2-wheelers for fast city deliveries with battery swapping infrastructure.');
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-900/60 px-2 py-1 rounded"
              >
                + EV Fleet Partnership
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-750 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loading ? 'Routing to Federation...' : 'Publish & Match Agents'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
