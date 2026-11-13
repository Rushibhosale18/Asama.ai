import React, { useState } from 'react';
import { X, Bot, Building, Globe, Key, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  'Food & Quick-Commerce',
  'Payments & Fintech',
  'Banking & Financial Services',
  'E-Commerce & Retail',
  'Automotive & EV',
  'Travel & Hospitality',
  'Healthcare & Pharma',
  'Enterprise SaaS'
];

export default function RegisterAgentModal({ isOpen, onClose, onAgentRegistered }) {
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('sec_' + Math.random().toString(36).substring(2, 12));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Auto-generate agent name when company changes if not manually edited
  const handleCompanyChange = (val) => {
    setCompany(val);
    if (!name || name.endsWith('_Agent')) {
      setName(`${val.replace(/\s+/g, '_')}_Agent`);
    }
    if (!webhookUrl || webhookUrl.includes('api.')) {
      setWebhookUrl(`https://api.${val.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/webhooks/agent`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!company.trim() || !name.trim() || !webhookUrl.trim() || !manifesto.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        company_name: company.trim(),
        company: company.trim(),
        industry_category: category,
        webhook_url: webhookUrl.trim(),
        interest_manifesto: manifesto.trim(),
        manifesto: manifesto.trim(),
        webhook_secret: webhookSecret.trim(),
        is_active: true,
        status: 'active'
      };

      const result = await api.registerAgent(payload);
      onAgentRegistered && onAgentRegistered(result);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to register agent. Make sure agent name is unique.');
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
            <Bot className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">Register Enterprise AI Agent</h2>
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
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Company Name *
              </label>
              <input
                type="text"
                placeholder="e.g. JioMart, Tata Neu"
                value={company}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-slate-400" />
                Agent Identity / Name *
              </label>
              <input
                type="text"
                placeholder="e.g. JioMart_Partnership_Agent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Industry Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Webhook Secret (HMAC)
              </label>
              <input
                type="text"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Webhook Endpoint URL *
            </label>
            <input
              type="url"
              placeholder="https://api.enterprise.com/webhooks/agent"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Interest Manifesto (Business Objectives & Synergy Preferences) *
            </label>
            <textarea
              rows={4}
              placeholder="Describe commercial goals, partner requirements, preferred sectors, co-marketing budgets, customer segments..."
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The AI semantic engine generates dense concept embeddings for this manifesto to evaluate cross-enterprise compatibility.
            </p>
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
              {loading ? 'Embedding & Registering...' : 'Register Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
