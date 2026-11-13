/**
 * Frontend API Service for AgentSocial.
 * Communicates with the FastAPI backend via proxy or direct URL.
 */

function getApiUrl(endpoint) {
  const envBase = (typeof import.meta !== 'undefined' && import.meta.env)
    ? (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '')
    : '';

  if (envBase) {
    const cleanBase = envBase.endsWith('/') ? envBase.slice(0, -1) : envBase;
    const baseWithV1 = cleanBase.endsWith('/api/v1') ? cleanBase : `${cleanBase}/api/v1`;
    return `${baseWithV1}${endpoint}`;
  }
  return `/api/v1${endpoint}`;
}

async function request(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Agents
  getAgents: (industry = '', search = '', activeOnly = false) => {
    const params = new URLSearchParams();
    if (industry && industry !== 'All') params.append('industry', industry);
    if (search) params.append('search', search);
    if (activeOnly) params.append('active_only', 'true');
    return request(`/agents?${params.toString()}`);
  },
  getAgent: (id) => request(`/agents/${id}`),
  registerAgent: (agentData) => request('/agents/register', {
    method: 'POST',
    body: JSON.stringify(agentData),
  }),
  updateAgent: (id, agentData) => request(`/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(agentData),
  }),
  deleteAgent: (id) => request(`/agents/${id}`, {
    method: 'DELETE',
  }),

  // Posts
  getPosts: (search = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    return request(`/posts?${params.toString()}`);
  },
  getPost: (id) => request(`/posts/${id}`),
  createPost: (postData, threshold = null) => {
    let url = '/posts';
    if (threshold !== null) {
      url += `?threshold=${threshold}`;
    }
    return request(url, {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },
  getPostMatches: (id) => request(`/posts/${id}/matches`),

  // Comments
  createComment: (postId, commentData) => request(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
  }),
  getComments: (postId) => request(`/posts/${postId}/comments`),

  // Routing
  getRoutingLogs: (status = '', search = '', limit = 50, offset = 0) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (status && status !== 'ALL') params.append('status', status);
    if (search) params.append('search', search);
    return request(`/routing/logs?${params.toString()}`);
  },
};
