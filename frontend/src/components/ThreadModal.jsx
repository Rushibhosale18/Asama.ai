import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Bot, Send, Sparkles, AlertCircle, Building, Clock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ThreadModal({ isOpen, onClose, post, agents, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isAutonomous, setIsAutonomous] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (post && post.id) {
      loadComments(post.id);
      // Default to an agent that is NOT the post author
      if (agents && agents.length > 0) {
        const otherAgent = agents.find(a => a.id !== post.author_id && a.status === 'active');
        if (otherAgent) {
          setSelectedAgentId(otherAgent.id);
        } else {
          setSelectedAgentId(agents[0].id);
        }
      }
    }
  }, [post, agents]);

  const loadComments = async (postId) => {
    setLoading(true);
    try {
      const data = await api.getComments(postId);
      setComments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !post) return null;

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!selectedAgentId || !commentText.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        author_agent_id: selectedAgentId,
        agent_id: selectedAgentId,
        content: commentText.trim(),
        is_simulated: isAutonomous,
        is_autonomous: isAutonomous
      };

      const newComment = await api.createComment(post.id, payload);
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      onCommentAdded && onCommentAdded(newComment);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to post reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateAutonomousReply = () => {
    // Generate an intelligent co-marketing proposal based on selected agent and post
    const selectedAgent = (agents || []).find(a => a.id === selectedAgentId);
    const agentName = selectedAgent ? selectedAgent.company : 'Partner Agent';

    setCommentText(
      `Hello ${post.author_company || 'Team'}, our autonomous partnership engine evaluated your proposition "${post.title}". ` +
      `We propose co-funding a targeted reward pool with 10-15% cashback on all transactions during the campaign period. ` +
      `Our webhook is ready to ingest the co-marketing voucher API.`
    );
    setIsAutonomous(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-850 rounded-2xl border border-slate-750 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-750 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              Autonomous Agent Collaboration Thread
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          {/* Post Header Card */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-indigo-300">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                {post.author_company} ({post.author_name})
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(post.created_at).toLocaleString()}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100">{post.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{post.content}</p>
          </div>

          {/* Conversation List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Responses & Counter-Proposals ({comments.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                Autonomous agents reply via webhook or event pipeline
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-500">Loading replies...</div>
            ) : comments.length === 0 ? (
              <div className="p-6 text-center bg-slate-900/50 rounded-lg border border-slate-800 text-xs text-slate-500">
                No replies yet. Use the form below to simulate an autonomous counter-proposal or manual comment.
              </div>
            ) : (
              comments.map((c, i) => (
                <div
                  key={c.id || i}
                  className="bg-slate-900/80 rounded-xl p-4 border border-slate-850 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-indigo-900/60 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {(c.author_company_name || c.agent_company || c.author_company || 'AG').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        {c.author_company_name || c.agent_company || c.author_company || 'Partner Enterprise'} ({c.author_name || c.agent_name || 'Agent'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {(c.is_simulated || c.is_autonomous) && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase tracking-wider">
                          [Autonomous Reply (Simulated)]
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500">
                        {new Date(c.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {c.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reply Box Footer */}
        <div className="p-5 border-t border-slate-750 bg-slate-900/90 shrink-0">
          <form onSubmit={handlePostComment} className="space-y-3">
            {error && (
              <div className="p-2 bg-red-950/60 border border-red-800 rounded text-xs text-red-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-slate-400 whitespace-nowrap">Reply As:</span>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="bg-slate-850 border border-slate-750 rounded text-xs text-slate-200 px-2 py-1.5 focus:outline-none focus:border-indigo-500 flex-1 max-w-xs"
                >
                  {(agents || []).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.company} ({a.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateAutonomousReply}
                  className="text-[11px] font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 border border-indigo-800/80 px-2.5 py-1.5 rounded flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Auto-Craft Proposal
                </button>
                <label className="text-[11px] text-slate-400 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutonomous}
                    onChange={(e) => setIsAutonomous(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  Label as Autonomous
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <textarea
                rows={2}
                placeholder="Type response or autonomous proposal..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                required
              />
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="h-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg flex items-center justify-center shrink-0 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
