import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getUserByUid,
  updateUserProfile,
} from './src/db/users.ts';
import {
  checkVerifiedOtpToken,
  createAndSendEmailOtp,
  createRealOrder,
  deleteOrderByReference,
  getAllOrdersForAdmin,
  getOrderRowByReference,
  getPublicTransactions,
  getStoreConfigJson,
  getTelegramConfig,
  getUserOrders,
  listInfoPosts,
  replaceInfoPosts,
  saveStoreConfigJson,
  saveTelegramConfig,
  sendTelegramMessage,
  sendTelegramOrderNotification,
  updateOrderByReference,
  verifyEmailOtp,
} from './src/db/repository.ts';
import type {
  InfoPost,
  PaymentStatusCode,
  TopupStatusCode,
} from './src/types/store.ts';

dotenv.config();

const PORT = 3000;
const OWNER_ADMIN_EMAIL = 'siuiqbal23@gmail.com';

async function isAdminUser(req: AuthRequest): Promise<boolean> {
  const uid = req.user?.uid;
  const email = (req.user?.email || '').toLowerCase();
  if (!uid) return false;
  if (email === OWNER_ADMIN_EMAIL) return true;
  const userRow = await getUserByUid(uid);
  return userRow?.role === 'admin';
}

function isTransientDbSocketError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth++) {
    const rec = current as { code?: string; message?: string; cause?: unknown };
    if (rec.code === 'ENOENT' || rec.code === 'ECONNREFUSED') return true;
    if (
      typeof rec.message === 'string' &&
      (rec.message.includes('ENOENT') || rec.message.includes('.s.PGSQL.'))
    ) {
      return true;
    }
    current = rec.cause;
  }
  return false;
}

function sendRouteError(
  res: express.Response,
  error: unknown,
  fallbackMessage: string
) {
  if (isTransientDbSocketError(error)) {
    res.status(503).json({
      error: 'Sambungan pangkalan data sedang dimulakan. Sila cuba sebentar lagi.',
    });
    return;
  }
  const msg = error instanceof Error ? error.message : fallbackMessage;
  res.status(500).json({ error: msg });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Public Bootstrap (Catalog overrides + Active InfoPosts — NEVER exposes orders/PII, bot tokens, or adminPin)
  app.get('/api/bootstrap', async (_req, res) => {
    try {
      const [configData, posts, tgCfg] = await Promise.all([
        getStoreConfigJson(),
        listInfoPosts(false),
        getTelegramConfig(),
      ]);

      let sanitizedConfig: Record<string, unknown> | null = configData
        ? { ...configData }
        : null;
      if (sanitizedConfig) {
        const rawSettings =
          sanitizedConfig.settings &&
          typeof sanitizedConfig.settings === 'object'
            ? { ...(sanitizedConfig.settings as Record<string, unknown>) }
            : {};
        delete rawSettings.adminPin;
        const waDigits = String(rawSettings.whatsappCs || '').replace(/\D/g, '');
        const phoneStr = String(rawSettings.phone || '').trim();
        if (
          (!phoneStr || phoneStr === '+60 11-2345 6789') &&
          waDigits &&
          waDigits !== '601123456789'
        ) {
          rawSettings.phone = `+${waDigits}`;
        }
        if (tgCfg.channelUrl) {
          rawSettings.telegramChannelUrl = tgCfg.channelUrl;
        }
        if (tgCfg.channelName) {
          rawSettings.telegramChannelName = tgCfg.channelName;
        }
        sanitizedConfig.settings = rawSettings;

        if (Array.isArray(sanitizedConfig.paymentAccounts)) {
          const adminDigits =
            waDigits && waDigits !== '601123456789'
              ? waDigits
              : String(rawSettings.phone || '').replace(/\D/g, '');
          const localDigits =
            adminDigits.startsWith('60') && adminDigits.length >= 10
              ? `0${adminDigits.slice(2)}`
              : !adminDigits.startsWith('0') && adminDigits.startsWith('1')
                ? `0${adminDigits}`
                : adminDigits;
          const formattedLocal =
            localDigits.length === 10
              ? `${localDigits.slice(0, 3)}-${localDigits.slice(3, 6)}-${localDigits.slice(6)}`
              : localDigits.length === 11
                ? `${localDigits.slice(0, 3)}-${localDigits.slice(3, 7)}-${localDigits.slice(7)}`
                : localDigits;
          const hasRealAdminPhone =
            Boolean(formattedLocal) &&
            localDigits !== '01123456789' &&
            localDigits !== '601123456789';

          sanitizedConfig.paymentAccounts = sanitizedConfig.paymentAccounts.map(
            (item) => {
              if (!item || typeof item !== 'object') return item;
              const acc = { ...(item as Record<string, unknown>) };
              const ch = String(acc.channelCode || '').toUpperCase();
              const isTng = acc.id === 'pay-tng' || ch === 'TNG';
              const accDigits = String(acc.accountNumber || '').replace(
                /\D/g,
                ''
              );
              if (
                hasRealAdminPhone &&
                (accDigits === '' ||
                  accDigits === '01123456789' ||
                  accDigits === '601123456789')
              ) {
                acc.accountNumber = formattedLocal;
              }
              if (isTng && acc.qrImageUrl === undefined) {
                acc.qrImageUrl = '/assets/aistudio/20260920_125927_866903c8.jpg';
              }
              if (isTng && acc.requireProof === undefined) {
                acc.requireProof = true;
              }
              if (isTng && acc.notifyChannel === undefined) {
                acc.notifyChannel = 'telegram';
              }
              return acc;
            }
          );
        }
      } else if (tgCfg.channelUrl || tgCfg.channelName) {
        sanitizedConfig = {
          settings: {
            telegramChannelUrl: tgCfg.channelUrl,
            telegramChannelName: tgCfg.channelName,
          },
        };
      }

      res.json({
        config: sanitizedConfig,
        infoPosts: posts,
      });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal memuatkan data kedai.');
    }
  });

  // Public Bar 2 Transactions Feed (Strictly anonymized, NO reference/invoice code, NO PII)
  app.get('/api/transactions/public', async (_req, res) => {
    try {
      const items = await getPublicTransactions();
      res.json({ transactions: items });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal memuatkan transaksi terkini.');
    }
  });

  // Sign Up Email OTP Verification Endpoints
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'Format e-mel tidak sah.' });
        return;
      }
      const result = await createAndSendEmailOtp(email);
      res.json({
        ok: true,
        delivery: result.delivery,
        ...(result.previewOtp ? { previewOtp: result.previewOtp } : {}),
      });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal menghantar kod OTP.');
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const code = String(req.body?.code || '').trim();
      if (!email || !/^\d{6}$/.test(code)) {
        res.status(400).json({ error: 'Sila masukkan kod OTP 6 digit.' });
        return;
      }
      const result = await verifyEmailOtp(email, code);
      if (!result.verified) {
        res
          .status(400)
          .json({ error: 'Kod OTP tidak sah atau telah tamat tempoh.' });
        return;
      }
      res.json(result);
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal mengesahkan OTP.');
    }
  });

  // Sync Firebase Auth user with PostgreSQL users table
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || String(req.body?.email || '');
      const name = String(req.body?.name || req.user!.name || '');
      const phone = String(req.body?.phone || '');
      const otpVerificationToken = String(
        req.body?.otpVerificationToken || ''
      );

      let isVerified = Boolean(req.user!.email_verified);
      if (!isVerified && otpVerificationToken && email) {
        const otpValid = await checkVerifiedOtpToken(
          email,
          otpVerificationToken
        );
        if (otpValid) {
          isVerified = true;
          try {
            await adminAuth.updateUser(uid, { emailVerified: true });
          } catch (fbErr) {
            console.warn('Could not update Firebase emailVerified flag:', fbErr);
          }
        }
      }

      const dbUser = await getOrCreateUser({
        uid,
        email,
        name,
        phone,
        emailVerified: isVerified,
      });

      res.json({
        user: {
          uid: dbUser.uid,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
          loggedIn: true,
          emailVerified: dbUser.emailVerified,
          role: dbUser.role === 'admin' ? 'admin' : 'customer',
        },
      });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal menyelaraskan akaun pengguna.');
    }
  });

  // Current User Profile
  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const existing = await getUserByUid(uid);
      const dbUser =
        existing ??
        (await getOrCreateUser({
          uid,
          email: req.user!.email || '',
          name: req.user!.name,
          emailVerified: Boolean(req.user!.email_verified),
        }));

      res.json({
        user: {
          uid: dbUser.uid,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
          loggedIn: true,
          emailVerified: dbUser.emailVerified,
          role: dbUser.role === 'admin' ? 'admin' : 'customer',
        },
      });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal memuatkan profil.');
    }
  });

  app.patch('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const name =
        typeof req.body?.name === 'string' ? req.body.name : undefined;
      const phone =
        typeof req.body?.phone === 'string' ? req.body.phone : undefined;
      const updated = await updateUserProfile(uid, { name, phone });
      if (!updated) {
        res.status(404).json({ error: 'Profil tidak ditemui.' });
        return;
      }
      res.json({
        user: {
          uid: updated.uid,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          loggedIn: true,
          emailVerified: updated.emailVerified,
          role: updated.role === 'admin' ? 'admin' : 'customer',
        },
      });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal mengemas kini profil.');
    }
  });

  // Logged-in User's Own Orders (includes Purchase Code IDs)
  app.get('/api/orders/mine', requireAuth, async (req: AuthRequest, res) => {
    try {
      const myOrders = await getUserOrders(req.user!.uid);
      res.json({ orders: myOrders });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal memuatkan sejarah transaksi.');
    }
  });

  // Single Order Invoice (Owner or Admin only)
  app.get(
    '/api/orders/:reference',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const reference = String(req.params.reference || '');
        const row = await getOrderRowByReference(reference);
        if (!row) {
          res.status(404).json({ error: 'Invois tidak ditemui.' });
          return;
        }
        const admin = await isAdminUser(req);
        if (row.userUid !== req.user!.uid && !admin) {
          res
            .status(403)
            .json({ error: 'Anda tidak mempunyai akses kepada invois ini.' });
          return;
        }
        res.json({
          order: {
            id: `ord-${row.id}`,
            reference: row.reference,
            createdAt: row.createdAt.toISOString(),
            brandId: row.brandId,
            brandSlug: row.brandSlug,
            brandName: row.brandName,
            brandImage: row.brandImage,
            productId: row.productId,
            productName: row.productName,
            accountId: row.accountId,
            serverId: row.serverId ?? undefined,
            customerName: row.customerName,
            whatsapp: row.whatsapp,
            email: row.email ?? undefined,
            paymentAccountId: row.paymentAccountId,
            paymentMethodName: row.paymentMethodName,
            paymentChannelCode: row.paymentChannelCode,
            paymentAccountNumber: row.paymentAccountNumber,
            paymentAccountLabel: row.paymentAccountLabel,
            subtotal: row.subtotal,
            discountAmount: row.discountAmount,
            voucherCode: row.voucherCode ?? undefined,
            totalAmount: row.totalAmount,
            paymentStatus: row.paymentStatus as PaymentStatusCode,
            topupStatus: row.topupStatus as TopupStatusCode,
            paymentProofUrl: row.paymentProofUrl ?? undefined,
            deliveryProofUrl: row.deliveryProofUrl ?? undefined,
            notes: row.notes ?? undefined,
          },
        });
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : 'Gagal memuatkan invois.';
        res.status(500).json({ error: msg });
      }
    }
  );

  // Create Real Order (Mandatory Auth)
  app.post('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      // Ensure user row exists in PostgreSQL
      await getOrCreateUser({
        uid,
        email: req.user!.email || String(req.body?.email || ''),
        name: String(req.body?.customerName || req.user!.name || ''),
        phone: String(req.body?.whatsapp || ''),
        emailVerified: Boolean(req.user!.email_verified),
      });

      const body = req.body || {};
      if (
        !body.brandId ||
        !body.brandName ||
        !body.productId ||
        !body.productName ||
        !body.accountId ||
        !body.customerName ||
        !body.whatsapp ||
        !body.paymentAccountId
      ) {
        res.status(400).json({ error: 'Butiran pesanan tidak lengkap.' });
        return;
      }

      const created = await createRealOrder(uid, {
        brandId: String(body.brandId),
        brandSlug: String(body.brandSlug || ''),
        brandName: String(body.brandName),
        brandImage: String(body.brandImage || ''),
        productId: String(body.productId),
        productName: String(body.productName),
        accountId: String(body.accountId),
        serverId: body.serverId ? String(body.serverId) : undefined,
        customerName: String(body.customerName),
        whatsapp: String(body.whatsapp),
        email: body.email ? String(body.email) : undefined,
        paymentAccountId: String(body.paymentAccountId),
        paymentMethodName: String(body.paymentMethodName || ''),
        paymentChannelCode: String(body.paymentChannelCode || ''),
        paymentAccountNumber: String(body.paymentAccountNumber || ''),
        paymentAccountLabel: String(body.paymentAccountLabel || ''),
        subtotal: Number(body.subtotal || 0),
        discountAmount: Number(body.discountAmount || 0),
        voucherCode: body.voucherCode ? String(body.voucherCode) : undefined,
        totalAmount: Number(body.totalAmount || 0),
        paymentProofUrl: body.paymentProofUrl
          ? String(body.paymentProofUrl)
          : undefined,
        notes: body.notes ? String(body.notes) : undefined,
      });

      sendTelegramOrderNotification(created, 'new').catch((tgErr) => {
        console.warn('Telegram order notification skipped:', tgErr);
      });

      res.status(201).json({ order: created });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal mencipta pesanan.');
    }
  });

  // Upload Payment Proof (Owner or Admin)
  app.patch(
    '/api/orders/:reference/proof',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const reference = String(req.params.reference || '');
        const paymentProofUrl = String(req.body?.paymentProofUrl || '');
        if (!paymentProofUrl) {
          res.status(400).json({ error: 'Gambar bukti bayaran diperlukan.' });
          return;
        }
        const existing = await getOrderRowByReference(reference);
        if (!existing) {
          res.status(404).json({ error: 'Invois tidak ditemui.' });
          return;
        }
        const admin = await isAdminUser(req);
        if (existing.userUid !== req.user!.uid && !admin) {
          res.status(403).json({ error: 'Akses ditolak.' });
          return;
        }
        const updated = await updateOrderByReference(reference, {
          paymentProofUrl,
        });
        if (updated) {
          sendTelegramOrderNotification(updated, 'update').catch((tgErr) => {
            console.warn('Telegram proof update notification skipped:', tgErr);
          });
        }
        res.json({ order: updated });
      } catch (error: unknown) {
        const msg =
          error instanceof Error
            ? error.message
            : 'Gagal memuat naik bukti bayaran.';
        res.status(500).json({ error: msg });
      }
    }
  );

  // Admin: List All Real Orders
  app.get('/api/admin/orders', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await isAdminUser(req))) {
        res.status(403).json({ error: 'Akses admin diperlukan.' });
        return;
      }
      const allOrders = await getAllOrdersForAdmin();
      res.json({ orders: allOrders });
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Gagal memuatkan senarai pesanan.';
      res.status(500).json({ error: msg });
    }
  });

  // Admin: Update Order Status / Notes
  app.patch(
    '/api/admin/orders/:reference',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        if (!(await isAdminUser(req))) {
          res.status(403).json({ error: 'Akses admin diperlukan.' });
          return;
        }
        const reference = String(req.params.reference || '');
        const patch: {
          paymentStatus?: PaymentStatusCode;
          topupStatus?: TopupStatusCode;
          notes?: string;
        } = {};
        if (req.body?.paymentStatus !== undefined) {
          patch.paymentStatus = Number(
            req.body.paymentStatus
          ) as PaymentStatusCode;
        }
        if (req.body?.topupStatus !== undefined) {
          patch.topupStatus = Number(req.body.topupStatus) as TopupStatusCode;
        }
        if (req.body?.notes !== undefined) {
          patch.notes = String(req.body.notes);
        }
        const updated = await updateOrderByReference(reference, patch);
        if (!updated) {
          res.status(404).json({ error: 'Pesanan tidak ditemui.' });
          return;
        }
        if (
          patch.paymentStatus !== undefined ||
          patch.topupStatus !== undefined
        ) {
          sendTelegramOrderNotification(updated, 'update').catch((tgErr) => {
            console.warn('Telegram update notification skipped:', tgErr);
          });
        }
        res.json({ order: updated });
      } catch (error: unknown) {
        sendRouteError(res, error, 'Gagal mengemas kini pesanan.');
      }
    }
  );

  // Admin: Delete Order
  app.delete(
    '/api/admin/orders/:reference',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        if (!(await isAdminUser(req))) {
          res.status(403).json({ error: 'Akses admin diperlukan.' });
          return;
        }
        const reference = String(req.params.reference || '');
        const ok = await deleteOrderByReference(reference);
        res.json({ ok });
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : 'Gagal memadam pesanan.';
        res.status(500).json({ error: msg });
      }
    }
  );

  // Admin: Save Info Posts
  app.put('/api/admin/info', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await isAdminUser(req))) {
        res.status(403).json({ error: 'Akses admin diperlukan.' });
        return;
      }
      const posts = Array.isArray(req.body?.infoPosts)
        ? (req.body.infoPosts as InfoPost[])
        : [];
      const saved = await replaceInfoPosts(posts);
      res.json({ infoPosts: saved });
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Gagal menyimpan informasi.';
      res.status(500).json({ error: msg });
    }
  });

  // Admin: Save Store Config (Categories, Brands, Sliders, Vouchers, FAQs, Payments, Templates, Settings)
  app.put('/api/admin/store', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await isAdminUser(req))) {
        res.status(403).json({ error: 'Akses admin diperlukan.' });
        return;
      }
      const config = req.body?.config;
      if (!config || typeof config !== 'object') {
        res.status(400).json({ error: 'Data konfigurasi tidak sah.' });
        return;
      }
      await saveStoreConfigJson(config as Record<string, unknown>);
      res.json({ ok: true });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal menyimpan konfigurasi kedai.');
    }
  });

  // Admin: Get Telegram Info Channel Config
  app.get('/api/admin/telegram', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await isAdminUser(req))) {
        res.status(403).json({ error: 'Akses admin diperlukan.' });
        return;
      }
      const telegram = await getTelegramConfig();
      res.json({ telegram });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal memuatkan tetapan Telegram.');
    }
  });

  // Admin: Save Telegram Info Channel Config
  app.put('/api/admin/telegram', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!(await isAdminUser(req))) {
        res.status(403).json({ error: 'Akses admin diperlukan.' });
        return;
      }
      const saved = await saveTelegramConfig({
        enabled: Boolean(req.body?.enabled),
        botToken: String(req.body?.botToken || ''),
        channelId: String(req.body?.channelId || ''),
        channelUrl: String(req.body?.channelUrl || ''),
        channelName: String(req.body?.channelName || 'Telegram Info Channel'),
      });
      res.json({ telegram: saved });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Gagal menyimpan tetapan Telegram.');
    }
  });

  // Admin: Test Telegram Info Channel Notification
  app.post(
    '/api/admin/telegram/test',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        if (!(await isAdminUser(req))) {
          res.status(403).json({ error: 'Akses admin diperlukan.' });
          return;
        }
        const saved = await getTelegramConfig();
        const botToken = String(req.body?.botToken || saved.botToken || '');
        const channelId = String(req.body?.channelId || saved.channelId || '');
        const result = await sendTelegramMessage(
          botToken,
          channelId,
          '✅ <b>Ujian Sambungan Berjaya!</b>\n\nBot TopupBalz telah bersambung dengan Telegram Info Channel ini. Notifikasi pembelian baharu akan dipaparkan di sini.'
        );
        if (!result.ok) {
          res.status(400).json({ error: result.error || 'Ujian gagal.' });
          return;
        }
        res.json({ ok: true });
      } catch (error: unknown) {
        sendRouteError(res, error, 'Gagal menguji sambungan Telegram.');
      }
    }
  );

  // Frontend Serving (Vite dev middleware or static dist)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TopupBalz server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TopupBalz server:', err);
  process.exit(1);
});
