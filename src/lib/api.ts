import { auth } from './firebase';
import type {
  InfoPost,
  OrderItem,
  PublicOrderSummary,
  TopupBalzStoreState,
  UserProfile,
} from '../types/store';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) return {};
  const token = await currentUser.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  authenticated = false
): Promise<T> {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const authHeaders = authenticated ? await getAuthHeaders() : {};
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...((options.headers as Record<string, string>) || {}),
    };

    const resp = await fetch(url, {
      ...options,
      headers,
    });

    const data = await resp.json().catch(() => ({}));
    if (resp.ok) {
      return data as T;
    }

    lastError = new Error(data?.error || `Ralat pelayan (${resp.status})`);
    if (resp.status === 503 && attempt < maxAttempts - 1) {
      const delayMs = 600 * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }
    throw lastError;
  }

  throw lastError ?? new Error('Ralat pelayan');
}

export async function fetchBootstrap(): Promise<{
  config: Partial<TopupBalzStoreState> | null;
  infoPosts: InfoPost[];
}> {
  const d: any = await apiFetch('/api/bootstrap');
  if (!d || !Array.isArray(d.infoPosts)) {
    throw new Error('API tidak tersedia');
  }
  return d;
}

export async function fetchPublicTransactions(): Promise<{
  transactions: PublicOrderSummary[];
}> {
  return apiFetch('/api/transactions/public');
}

export async function sendSignupOtp(email: string): Promise<{
  ok: boolean;
  delivery: 'email' | 'preview';
  previewOtp?: string;
}> {
  return apiFetch('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifySignupOtp(
  email: string,
  code: string
): Promise<{ verified: boolean; verificationToken: string }> {
  return apiFetch('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function syncFirebaseUser(payload: {
  email?: string;
  name?: string;
  phone?: string;
  otpVerificationToken?: string;
}): Promise<{ user: UserProfile }> {
  return apiFetch(
    '/api/auth/sync',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );
}

export async function fetchMyProfile(): Promise<{ user: UserProfile }> {
  return apiFetch('/api/me', {}, true);
}

export async function updateMyProfile(patch: {
  name?: string;
  phone?: string;
}): Promise<{ user: UserProfile }> {
  return apiFetch(
    '/api/me',
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
    true
  );
}

export async function fetchMyOrders(): Promise<{ orders: OrderItem[] }> {
  return apiFetch('/api/orders/mine', {}, true);
}

export async function fetchOrderByReference(
  reference: string
): Promise<{ order: OrderItem }> {
  return apiFetch(`/api/orders/${encodeURIComponent(reference)}`, {}, true);
}

export async function createOrderApi(
  payload: Omit<
    OrderItem,
    'id' | 'reference' | 'createdAt' | 'paymentStatus' | 'topupStatus'
  >
): Promise<{ order: OrderItem }> {
  return apiFetch(
    '/api/orders',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );
}

export async function uploadOrderProofApi(
  reference: string,
  paymentProofUrl: string
): Promise<{ order: OrderItem }> {
  return apiFetch(
    `/api/orders/${encodeURIComponent(reference)}/proof`,
    {
      method: 'PATCH',
      body: JSON.stringify({ paymentProofUrl }),
    },
    true
  );
}

export async function fetchAdminOrdersApi(): Promise<{ orders: OrderItem[] }> {
  return apiFetch('/api/admin/orders', {}, true);
}

export async function updateAdminOrderApi(
  reference: string,
  patch: Partial<Pick<OrderItem, 'paymentStatus' | 'topupStatus' | 'notes'>>
): Promise<{ order: OrderItem }> {
  return apiFetch(
    `/api/admin/orders/${encodeURIComponent(reference)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
    true
  );
}

export async function deleteAdminOrderApi(
  reference: string
): Promise<{ ok: boolean }> {
  return apiFetch(
    `/api/admin/orders/${encodeURIComponent(reference)}`,
    {
      method: 'DELETE',
    },
    true
  );
}

export async function saveAdminInfoPostsApi(
  infoPosts: InfoPost[]
): Promise<{ infoPosts: InfoPost[] }> {
  return apiFetch(
    '/api/admin/info',
    {
      method: 'PUT',
      body: JSON.stringify({ infoPosts }),
    },
    true
  );
}

export async function saveAdminStoreConfigApi(
  config: Partial<TopupBalzStoreState>
): Promise<{ ok: boolean }> {
  return apiFetch(
    '/api/admin/store',
    {
      method: 'PUT',
      body: JSON.stringify({ config }),
    },
    true
  );
}

export interface TelegramConfigDto {
  enabled: boolean;
  botToken: string;
  channelId: string;
  channelUrl: string;
  channelName: string;
}

export async function fetchAdminTelegramApi(): Promise<{
  telegram: TelegramConfigDto;
}> {
  return apiFetch('/api/admin/telegram', {}, true);
}

export async function saveAdminTelegramApi(
  telegram: TelegramConfigDto
): Promise<{ telegram: TelegramConfigDto }> {
  return apiFetch(
    '/api/admin/telegram',
    {
      method: 'PUT',
      body: JSON.stringify(telegram),
    },
    true
  );
}

export async function testAdminTelegramApi(payload?: {
  botToken?: string;
  channelId?: string;
}): Promise<{ ok: boolean }> {
  return apiFetch(
    '/api/admin/telegram/test',
    {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    },
    true
  );
}

