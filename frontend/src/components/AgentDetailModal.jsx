import React, { useState } from 'react';
import { X, Bot, Building, Globe, Key, FileText, ShieldCheck, Activity, Edit3, Save, Power } from 'lucide-react';
import { api } from '../services/api';

export default function AgentDetailModal({ isOpen, onClose, agent, onAgentUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [manifesto, setManifesto] = useState(agent ? (agent.interest_manifesto || agent.manifesto || '') : '');
  const [status, setStatus] = useState(agent ? (agent.is_active !== undefined ? (agent.is_active ? 'active' : 'inactive') : (agent.status || 'active')) : 'active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (agent) {
      setManifesto(agent.interest_manifesto || agent.manifesto || '');
      setStatus(agent.is_active !== undefined ? (agent.is_active ? 'active' : 'inactive') : (agent.status || 'active'));
      setIsEditing(false);
      setError(null);
    }
  }, [agent]);

  if (!isOpen || !agent) return null;

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateAgent(agent.id, {
        interest_manifesto: manifesto.trim(),
        manifesto: manifesto.trim(),
        is_active: status === 'active',
        status: status
      });
      onAgentUpdated && onAgentUpdated(updated);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update agent details.');
    } finally {
      setLoading(false);
    }
  };

  const trustPercent = Math.round((agent.trust_score || 1.0) * 100);
  const compName = agent.company_name || agent.company || 'Enterprise';
  const agentName = agent.name || `${compName}_Agent`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-850 rounded-2xl border border-slate-750 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-750 flex items-center justify-between sticky top-0 bg-slate-850 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold">
              {compName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{agentName}</h2>
              <p className="text-xs text-slate-400">{compName} · {agent.industry_category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Status</span>
              <span className={`text-xs font-bold uppercase ${
                status === 'active' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {status}
              </span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Trust Score</span>
              <span className="text-xs font-bold text-indigo-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {trustPercent}%
              </span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Vector Dim</span>
              <span className="text-xs font-bold text-slate-200 font-mono">
                30 Normalized
              </span>
            </div>
          </div>

          {/* Webhook Endpoint */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              Webhook URL
            </label>
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 break-all">
              {agent.webhook_url}
            </div>
          </div>

          {/* Manifesto */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Strategic Manifesto
              </label>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Manifesto
                </button>
              )}
            </div>

            {isEditing ? (
              <textarea
                rows={5}
                value={manifesto}
                onChange={(e) => setManifesto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
              />
            ) : (
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                {agent.interest_manifesto || agent.manifesto}
              </div>
            )}
          </div>

          {/* Status Toggle if Editing */}
          {isEditing && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-300 font-medium">Agent Participation State:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
              >
                <option value="active">Active (Eligible for Matching)</option>
                <option value="inactive">Inactive (Excluded from Funnel)</option>
              </select>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-slate-750 flex items-center justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setManifesto(agent.manifesto);
                  }}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {loading ? 'Saving & Re-embedding...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-lg"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
