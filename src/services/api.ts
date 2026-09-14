import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { participantSessionHeaders } from '../utils/participantSession';

/**
 * API origin for axios.
 * - Dev default: `/api` (Vite proxies to backend :3001)
 * - Override with VITE_API_URL, e.g. `http://127.0.0.1:3001/api`
 * Browser Network may still show localhost:5173/api when using the proxy — that is normal.
 */
function resolveApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/$/, '');
  if (!raw) return '/api';
  // Allow either `http://host:3001` or `http://host:3001/api`
  if (/^https?:\/\//i.test(raw)) {
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  }
  return raw.startsWith('/') ? raw : `/${raw}`;
}

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const publicClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    const { activeWorkspaceId } = useWorkspaceStore.getState();
    if (activeWorkspaceId) {
      config.headers['X-Workspace-ID'] = activeWorkspaceId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const requestUrl: string = originalRequest.url || '';
    const skipRefresh =
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/verify-email') ||
      requestUrl.includes('/auth/resend-verification') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    if (error.response?.status === 401 && !originalRequest._retry && !skipRefresh) {
      originalRequest._retry = true;

      const { refreshToken, setAuth, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

          const { user } = useAuthStore.getState();
          if (user) {
            setAuth(user, newAccessToken, newRefreshToken);
          }

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch {
          logout();
          useWorkspaceStore.getState().clearWorkspace();
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
      } else {
        logout();
        useWorkspaceStore.getState().clearWorkspace();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post('/auth/login', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  getProfile: () =>
    api.get('/auth/profile'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.patch('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  verifyEmail: (token: string, redirect?: string) =>
    api.post('/auth/verify-email', { token, redirect }),
  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
  deleteAccount: (email: string) =>
    api.delete('/auth/account', { data: { email } }),
};

// Campaign API
export const campaignApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/campaigns', { params }),
  getDashboardSummary: () =>
    api.get('/campaigns/summary'),
  getById: (id: string) =>
    api.get(`/campaigns/${id}`),
  create: (data: any) =>
    api.post('/campaigns', data),
  update: (id: string, data: any) =>
    api.put(`/campaigns/${id}`, data),
  delete: (id: string) =>
    api.delete(`/campaigns/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/campaigns/${id}/status`, { status }),
  duplicate: (id: string) =>
    api.post(`/campaigns/${id}/duplicate`),
  getStats: (id: string) =>
    api.get(`/campaigns/${id}/stats`),
  getAnalytics: (id: string, params?: { range?: string; from?: string; to?: string }) =>
    api.get(`/campaigns/${id}/analytics`, { params }),
  getGlobalAnalytics: (params?: { range?: string; from?: string; to?: string }) =>
    api.get('/campaigns/analytics', { params }),
  exportAnalytics: (id: string, type: 'campaign' | 'actions' | 'referrals' | 'fraud', params?: { range?: string }) =>
    api.get(`/campaigns/${id}/analytics/export`, { params: { type, ...params }, responseType: 'blob' }),
  getPreview: (id: string) =>
    api.get(`/campaigns/${id}/preview`),
  createPreviewToken: (id: string) =>
    api.post(`/campaigns/${id}/preview-token`),
  
  // Prizes
  addPrize: (campaignId: string, data: any) =>
    api.post(`/campaigns/${campaignId}/prizes`, data),
  updatePrize: (campaignId: string, prizeId: string, data: any) =>
    api.put(`/campaigns/${campaignId}/prizes/${prizeId}`, data),
  deletePrize: (campaignId: string, prizeId: string) =>
    api.delete(`/campaigns/${campaignId}/prizes/${prizeId}`),
  
  // Entry Actions
  addAction: (campaignId: string, data: any) =>
    api.post(`/campaigns/${campaignId}/actions`, data),
  updateAction: (campaignId: string, actionId: string, data: any) =>
    api.put(`/campaigns/${campaignId}/actions/${actionId}`, data),
  deleteAction: (campaignId: string, actionId: string) =>
    api.delete(`/campaigns/${campaignId}/actions/${actionId}`),
  reorderActions: (campaignId: string, actionIds: string[]) =>
    api.post(`/campaigns/${campaignId}/actions/reorder`, { actionIds }),
  
  // Secret Codes
  addSecretCode: (campaignId: string, data: any) =>
    api.post(`/campaigns/${campaignId}/codes`, data),
  getSecretCodes: (campaignId: string) =>
    api.get(`/campaigns/${campaignId}/codes`),
  deleteSecretCode: (campaignId: string, codeId: string) =>
    api.delete(`/campaigns/${campaignId}/codes/${codeId}`),
  previewSecretCodes: (campaignId: string, data: { codes: Array<{ code: string; points?: number; maxUses?: number; expiresAt?: string | null }> }) =>
    api.post(`/campaigns/${campaignId}/codes/preview`, data),
  importSecretCodes: (campaignId: string, data: { codes: Array<{ code: string; points?: number; maxUses?: number; expiresAt?: string | null }>; confirm: boolean }) =>
    api.post(`/campaigns/${campaignId}/codes/import`, data),
  generateSecretCodes: (campaignId: string, data: { count: number; points?: number; maxUses?: number; prefix?: string; expiresAt?: string }) =>
    api.post(`/campaigns/${campaignId}/codes/generate`, data),
};

// Entry API
export const entryApi = {
  getCampaignEntries: (campaignId: string, params?: {
    page?: number;
    limit?: number;
    verified?: boolean;
    invalidated?: boolean;
    actionId?: string;
  }) =>
    api.get(`/entries/campaigns/${campaignId}/entries`, { params }),
  getCampaignParticipants: (campaignId: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get(`/entries/campaigns/${campaignId}/participants`, { params }),
  getParticipantEntries: (campaignId: string, participantId: string) =>
    api.get(`/entries/campaigns/${campaignId}/participants/${participantId}/entries`),
  getParticipantDetail: (campaignId: string, participantId: string) =>
    api.get(`/entries/campaigns/${campaignId}/participants/${participantId}`),
  downloadFile: (campaignId: string, fileId: string) =>
    api.get(`/campaigns/${campaignId}/files/${fileId}`, { responseType: 'blob' }),
  invalidateEntry: (entryId: string, reason: string) =>
    api.post(`/entries/entries/${entryId}/invalidate`, { reason }),
};

// Winner API
export const winnerApi = {
  getWinners: (campaignId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/winners/campaigns/${campaignId}/winners`, { params }),
  getDraws: (campaignId: string) =>
    api.get(`/winners/campaigns/${campaignId}/draws`),
  drawPreview: (campaignId: string, prizeId: string) =>
    api.get(`/winners/campaigns/${campaignId}/winners/draw-preview`, { params: { prizeId } }),
  drawWinners: (campaignId: string, data: {
    prizeId: string;
    count: number;
    excludePreviousWinners?: boolean;
    excludeDisqualified?: boolean;
    proceedDespiteHighRisk?: boolean;
  }) =>
    api.post(`/winners/campaigns/${campaignId}/winners/draw`, data),
  manualSelect: (campaignId: string, data: { participantId: string; prizeId: string }) =>
    api.post(`/winners/campaigns/${campaignId}/winners/manual`, data),
  markClaimed: (winnerId: string) =>
    api.patch(`/winners/winners/${winnerId}/claim`),
  notifyWinner: (winnerId: string) =>
    api.post(`/winners/winners/${winnerId}/notify`),
  removeWinner: (winnerId: string, data?: { redraw?: boolean; reason?: string }) =>
    api.delete(`/winners/winners/${winnerId}`, { data }),
  disqualifyWinner: (winnerId: string, data?: { redraw?: boolean; reason?: string }) =>
    api.post(`/winners/winners/${winnerId}/disqualify`, data || {}),
  getFraudReport: (campaignId: string) =>
    api.get(`/winners/campaigns/${campaignId}/fraud-report`),
  getFraudReview: (campaignId: string) =>
    api.get(`/winners/campaigns/${campaignId}/fraud-review`),
  updateFraudReview: (campaignId: string, participantId: string, data: { status: 'CLEARED' | 'FLAGGED' | 'DISQUALIFIED'; note?: string }) =>
    api.patch(`/winners/campaigns/${campaignId}/participants/${participantId}/fraud-review`, data),
};

// Public API (for widget/hosted page) — never uses owner JWT interceptors
export const publicApi = {
  getCampaign: (slug: string) =>
    publicClient.get(`/public/c/${slug}`),
  resolveHost: () =>
    publicClient.get('/public/resolve-host'),
  enter: (slug: string, data: {
    email: string;
    name?: string;
    phone?: string;
    referralCode?: string;
    captchaToken?: string;
    customFields?: Record<string, unknown>;
    visitorId?: string;
    consent?: { terms?: boolean; privacy?: boolean; rules?: boolean };
  }) =>
    publicClient.post(`/public/c/${slug}/enter`, data),
  getMe: (slug: string, token: string) =>
    publicClient.get(`/public/c/${slug}/me`, { headers: participantSessionHeaders(token) }),
  submitEntry: (slug: string, participantId: string, actionId: string, token: string, metadata?: any) =>
    publicClient.post(
      `/public/c/${slug}/participants/${participantId}/entries`,
      { actionId, metadata },
      { headers: participantSessionHeaders(token) }
    ),
  validateSecretCode: (slug: string, participantId: string, code: string, token: string) =>
    publicClient.post(
      `/public/c/${slug}/participants/${participantId}/secret-code`,
      { code },
      { headers: participantSessionHeaders(token) }
    ),
  getLeaderboard: (slug: string, limit?: number) =>
    publicClient.get(`/public/c/${slug}/leaderboard`, { params: { limit } }),
  uploadFile: (slug: string, participantId: string, actionId: string, file: File, token: string) => {
    const body = new FormData();
    body.append('actionId', actionId);
    body.append('file', file);
    return publicClient.post(
      `/public/c/${slug}/participants/${participantId}/uploads`,
      body,
      {
        headers: {
          ...participantSessionHeaders(token),
          'Content-Type': undefined as unknown as string,
        },
      }
    );
  },
  getPreview: (token: string) =>
    publicClient.get(`/public/preview/${token}`),
  trackEvent: (slug: string, data: {
    eventType: 'HOSTED_VIEW' | 'WIDGET_VIEW';
    visitorId: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }, preview = false) =>
    publicClient.post(`/public/c/${slug}/events`, data, {
      headers: preview ? { 'X-Promo-Preview': '1' } : {},
    }),
};

// Widget API
export const widgetApi = {
  getEmbedCode: (campaignId: string) =>
    api.get(`/widget/campaigns/${campaignId}/embed`),
  getQRCode: (campaignId: string, format?: 'png' | 'svg', size?: number) =>
    api.get(`/widget/campaigns/${campaignId}/qr`, { params: { format, size } }),
};

export const publishingApi = {
  listDomains: (campaignId: string) =>
    api.get(`/campaigns/${campaignId}/domains`),
  addDomain: (campaignId: string, hostname: string) =>
    api.post(`/campaigns/${campaignId}/domains`, { hostname }),
  verifyDomain: (campaignId: string, domainId: string) =>
    api.post(`/campaigns/${campaignId}/domains/${domainId}/verify`),
  disableDomain: (campaignId: string, domainId: string) =>
    api.delete(`/campaigns/${campaignId}/domains/${domainId}`),
  listAssignments: (campaignId: string) =>
    api.get(`/campaigns/${campaignId}/integrations`),
  assignIntegration: (campaignId: string, data: { integrationId: string; trigger?: string; enabled?: boolean; destination?: Record<string, unknown> }) =>
    api.post(`/campaigns/${campaignId}/integrations`, data),
  removeAssignment: (campaignId: string, assignmentId: string) =>
    api.delete(`/campaigns/${campaignId}/integrations/${assignmentId}`),
  listDeliveries: (campaignId: string) =>
    api.get(`/campaigns/${campaignId}/deliveries`),
  retryDelivery: (campaignId: string, deliveryId: string) =>
    api.post(`/campaigns/${campaignId}/deliveries/${deliveryId}/retry`),
};

// Export API
export const exportApi = {
  exportParticipants: (campaignId: string) =>
    api.get(`/widget/campaigns/${campaignId}/export/participants`, { responseType: 'blob' }),
  exportEntries: (campaignId: string) =>
    api.get(`/widget/campaigns/${campaignId}/export/entries`, { responseType: 'blob' }),
  exportWinners: (campaignId: string) =>
    api.get(`/widget/campaigns/${campaignId}/export/winners`, { responseType: 'blob' }),
  getGeoAnalytics: (campaignId: string) =>
    api.get(`/widget/campaigns/${campaignId}/geo-analytics`),
};

// Spin Wheel API
export const spinWheelApi = {
  getSegments: (campaignId: string) =>
    publicClient.get(`/spinwheel/campaigns/${campaignId}/segments`),
  spin: (campaignId: string, participantId: string, token: string) =>
    publicClient.post(
      `/spinwheel/campaigns/${campaignId}/spin`,
      { participantId },
      { headers: participantSessionHeaders(token) }
    ),
  getStatus: (campaignId: string, participantId: string, token: string) =>
    publicClient.get(
      `/spinwheel/campaigns/${campaignId}/participants/${participantId}/status`,
      { headers: participantSessionHeaders(token) }
    ),
  getHistory: (participantId: string, token: string, limit?: number) =>
    publicClient.get(`/spinwheel/participants/${participantId}/history`, {
      params: { limit },
      headers: participantSessionHeaders(token),
    }),
  claimResult: (resultId: string, participantId: string, token: string) =>
    publicClient.post(
      `/spinwheel/results/${resultId}/claim`,
      { participantId },
      { headers: participantSessionHeaders(token) }
    ),

  getAllSegments: (campaignId: string) =>
    api.get(`/spinwheel/campaigns/${campaignId}/admin/segments`),
  addSegment: (campaignId: string, data: any) =>
    api.post(`/spinwheel/campaigns/${campaignId}/segments`, data),
  updateSegment: (segmentId: string, data: any) =>
    api.put(`/spinwheel/segments/${segmentId}`, data),
  deleteSegment: (segmentId: string) =>
    api.delete(`/spinwheel/segments/${segmentId}`),
  createDefaultSegments: (campaignId: string) =>
    api.post(`/spinwheel/campaigns/${campaignId}/segments/default`),
};

// Templates API
export const templateApi = {
  getAll: () =>
    api.get('/templates'),
  getById: (id: string) =>
    api.get(`/templates/${id}`),
  create: (data: { name: string; description?: string; category: string; config: any }) =>
    api.post('/templates', data),
  createFromCampaign: (campaignId: string, name: string) =>
    api.post(`/templates/from-campaign/${campaignId}`, { name }),
  delete: (id: string) =>
    api.delete(`/templates/${id}`),
};

// Theme API
export const themeApi = {
  getAll: () =>
    api.get('/themes'),
  getFonts: () =>
    api.get('/fonts'),
};

// Rules Generator API
export const rulesApi = {
  generate: (data: {
    campaignId?: string;
    type?: 'full' | 'simple';
    sponsorName: string;
    sponsorAddress?: string;
    sponsorEmail?: string;
  }) =>
    api.post('/rules/generate', data),
};

// Draft / Auto-save API
export const draftApi = {
  save: (campaignId: string, draftData: any) =>
    api.post(`/campaigns/${campaignId}/draft`, { draftData }),
  get: (campaignId: string) =>
    api.get(`/campaigns/${campaignId}/draft`),
};

// Custom Form Fields API
export const formFieldApi = {
  getAll: (campaignId: string) =>
    api.get(`/campaigns/${campaignId}/form-fields`),
  add: (campaignId: string, data: {
    fieldType: string;
    label: string;
    placeholder?: string;
    helpText?: string;
    required?: boolean;
    options?: any;
    validation?: any;
  }) =>
    api.post(`/campaigns/${campaignId}/form-fields`, data),
  update: (fieldId: string, data: any) =>
    api.patch(`/form-fields/${fieldId}`, data),
  delete: (fieldId: string) =>
    api.delete(`/form-fields/${fieldId}`),
  reorder: (campaignId: string, fieldIds: string[]) =>
    api.post(`/campaigns/${campaignId}/form-fields/reorder`, { fieldIds }),
};

export const workspaceApi = {
  list: () => api.get('/workspaces'),
  create: (name: string) => api.post('/workspaces', { name }),
  getCurrent: () => api.get('/workspaces/current'),
  update: (name: string) => api.patch('/workspaces/current', { name }),
  members: () => api.get('/workspaces/current/members'),
  invite: (email: string, role?: 'ADMIN' | 'MEMBER') =>
    api.post('/workspaces/current/invitations', { email, role }),
  resendInvite: (invitationId: string) =>
    api.post(`/workspaces/current/invitations/${invitationId}/resend`),
  revokeInvite: (invitationId: string) =>
    api.delete(`/workspaces/current/invitations/${invitationId}`),
  updateMember: (memberId: string, role: 'ADMIN' | 'MEMBER') =>
    api.patch(`/workspaces/current/members/${memberId}`, { role }),
  removeMember: (memberId: string) =>
    api.delete(`/workspaces/current/members/${memberId}`),
  transfer: (userId: string) =>
    api.post('/workspaces/current/transfer', { userId }),
  entitlements: () => api.get('/workspaces/current/entitlements'),
  onboarding: () => api.get('/workspaces/current/onboarding'),
  previewInvite: (token: string) => api.get(`/workspaces/invitations/${token}`),
  acceptInvite: (token: string) => api.post('/workspaces/invitations/accept', { token }),
  apiKeys: () => api.get('/workspaces/current/api-keys'),
  createApiKey: (name: string) => api.post('/workspaces/current/api-keys', { name }),
  revokeApiKey: (id: string) => api.delete(`/workspaces/current/api-keys/${id}`),
  deleteWorkspace: (confirmName: string) => api.post('/workspaces/current/delete', { confirmName }),
};

export const billingApi = {
  plans: () => api.get('/billing/plans'),
  subscription: () => api.get('/billing/subscription'),
  summary: () => api.get('/billing/summary'),
  checkout: (planKey: string, interval: 'MONTHLY' | 'ANNUAL') =>
    api.post('/billing/checkout', { planKey, interval }),
  portal: () => api.post('/billing/portal'),
};

export const docsApi = {
  providers: () => publicClient.get('/docs/providers'),
  support: () => publicClient.get('/docs/support'),
  openapi: () => publicClient.get('/docs/openapi.json'),
};

export const integrationsApi = {
  list: () => api.get('/integrations'),
  catalog: () => api.get('/integrations/catalog'),
  create: (payload: unknown) => api.post('/integrations', payload),
  remove: (id: string) => api.delete(`/integrations/${id}`),
  toggle: (id: string) => api.post(`/integrations/${id}/toggle`),
  test: (id: string) => api.post(`/integrations/${id}/test`),
  testEvent: (id: string, event?: string) => api.post(`/integrations/${id}/test-event`, { event }),
  destinations: (id: string) => api.get(`/integrations/${id}/destinations`),
  deliveries: (params?: { campaignId?: string; provider?: string; status?: string; from?: string; to?: string }) =>
    api.get('/integrations/deliveries', { params }),
};

export function planLimitMessage(error: any): string | null {
  const code = error?.response?.data?.error?.code;
  const details = error?.response?.data?.error?.details;
  if (code === 'LIMIT_REACHED') {
    return `Plan limit reached for ${details?.feature || 'this feature'}. Upgrade to continue.`;
  }
  if (code === 'FEATURE_DISABLED') {
    return 'This feature is not included in the current plan.';
  }
  if (code === 'PLAN_REQUIRED') {
    return 'Choose a plan to start your 7-day free trial.';
  }
  return error?.response?.data?.error?.message || null;
}


