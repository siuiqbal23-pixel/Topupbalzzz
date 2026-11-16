import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { and, desc, eq, gt } from 'drizzle-orm';
import { db } from './index.ts';
import { emailOtps, infoPosts, orders, storeConfigs } from './schema.ts';
import type {
  InfoPost,
  OrderItem,
  PaymentStatusCode,
  PublicOrderSummary,
  TopupStatusCode,
} from '../types/store.ts';

function toOrderItem(row: typeof orders.$inferSelect): OrderItem {
  return {
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
  };
}

export async function getPublicTransactions(): Promise<PublicOrderSummary[]> {
  try {
    const rows = await db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        brandName: orders.brandName,
        productName: orders.productName,
        paymentChannelCode: orders.paymentChannelCode,
        totalAmount: orders.totalAmount,
        paymentStatus: orders.paymentStatus,
        topupStatus: orders.topupStatus,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(25);

    return rows.map((r) => ({
      id: `pub-${r.id}`,
      createdAt: r.createdAt.toISOString(),
      brandName: r.brandName,
      productName: r.productName,
      paymentChannelCode: r.paymentChannelCode,
      totalAmount: r.totalAmount,
      paymentStatus: r.paymentStatus as PaymentStatusCode,
      topupStatus: r.topupStatus as TopupStatusCode,
    }));
  } catch (error) {
    console.error('Database query failed in getPublicTransactions:', error);
    throw new Error('Gagal memuatkan aktiviti transaksi.', { cause: error });
  }
}

export async function getUserOrders(userUid: string): Promise<OrderItem[]> {
  try {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.userUid, userUid))
      .orderBy(desc(orders.createdAt));

    return rows.map(toOrderItem);
  } catch (error) {
    console.error('Database query failed in getUserOrders:', error);
    throw new Error('Gagal memuatkan sejarah transaksi.', { cause: error });
  }
}

export async function getAllOrdersForAdmin(): Promise<OrderItem[]> {
  try {
    const rows = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    return rows.map(toOrderItem);
  } catch (error) {
    console.error('Database query failed in getAllOrdersForAdmin:', error);
    throw new Error('Gagal memuatkan senarai pesanan admin.', { cause: error });
  }
}

export async function getOrderRowByReference(reference: string) {
  try {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.reference, reference));
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed in getOrderRowByReference:', error);
    throw new Error('Gagal mendapatkan maklumat invois.', { cause: error });
  }
}

export async function createRealOrder(
  userUid: string,
  payload: Omit<
    OrderItem,
    'id' | 'reference' | 'createdAt' | 'paymentStatus' | 'topupStatus'
  >
): Promise<OrderItem> {
  try {
    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = String(crypto.randomInt(10000, 99999));
    const reference = `TRX-${yyyymmdd}-${suffix}`;

    const inserted = await db
      .insert(orders)
      .values({
        reference,
        userUid,
        brandId: payload.brandId,
        brandSlug: payload.brandSlug,
        brandName: payload.brandName,
        brandImage: payload.brandImage || '',
        productId: payload.productId,
        productName: payload.productName,
        accountId: payload.accountId,
        serverId: payload.serverId ?? null,
        customerName: payload.customerName,
        whatsapp: payload.whatsapp,
        email: payload.email ?? null,
        paymentAccountId: payload.paymentAccountId,
        paymentMethodName: payload.paymentMethodName,
        paymentChannelCode: payload.paymentChannelCode,
        paymentAccountNumber: payload.paymentAccountNumber,
        paymentAccountLabel: payload.paymentAccountLabel,
        subtotal: payload.subtotal,
        discountAmount: payload.discountAmount ?? 0,
        voucherCode: payload.voucherCode ?? null,
        totalAmount: payload.totalAmount,
        paymentStatus: 0,
        topupStatus: 0,
        paymentProofUrl: payload.paymentProofUrl ?? null,
        notes:
          payload.notes ??
          'Pesanan manual dibuat. Menunggu pengesahan resit di WhatsApp.',
      })
      .returning();

    return toOrderItem(inserted[0]);
  } catch (error) {
    console.error('Database query failed in createRealOrder:', error);
    throw new Error('Gagal mencipta pesanan dalam pangkalan data.', {
      cause: error,
    });
  }
}

export async function updateOrderByReference(
  reference: string,
  patch: Partial<{
    paymentStatus: PaymentStatusCode;
    topupStatus: TopupStatusCode;
    paymentProofUrl: string;
    deliveryProofUrl: string;
    notes: string;
  }>
): Promise<OrderItem | null> {
  try {
    const updated = await db
      .update(orders)
      .set({
        ...(patch.paymentStatus !== undefined
          ? { paymentStatus: patch.paymentStatus }
          : {}),
        ...(patch.topupStatus !== undefined
          ? { topupStatus: patch.topupStatus }
          : {}),
        ...(patch.paymentProofUrl !== undefined
          ? { paymentProofUrl: patch.paymentProofUrl }
          : {}),
        ...(patch.deliveryProofUrl !== undefined
          ? { deliveryProofUrl: patch.deliveryProofUrl }
          : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      })
      .where(eq(orders.reference, reference))
      .returning();

    return updated[0] ? toOrderItem(updated[0]) : null;
  } catch (error) {
    console.error('Database query failed in updateOrderByReference:', error);
    throw new Error('Gagal mengemas kini pesanan.', { cause: error });
  }
}

export async function deleteOrderByReference(reference: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(orders)
      .where(eq(orders.reference, reference))
      .returning({ id: orders.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteOrderByReference:', error);
    throw new Error('Gagal memadam pesanan.', { cause: error });
  }
}

// Info Posts (Bar 4)
export async function listInfoPosts(onlyActive: boolean): Promise<InfoPost[]> {
  try {
    const rows = onlyActive
      ? await db
          .select()
          .from(infoPosts)
          .where(eq(infoPosts.active, true))
          .orderBy(desc(infoPosts.createdAt))
      : await db.select().from(infoPosts).orderBy(desc(infoPosts.createdAt));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      image: r.image ?? undefined,
      active: r.active,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Database query failed in listInfoPosts:', error);
    throw new Error('Gagal memuatkan informasi.', { cause: error });
  }
}

export async function replaceInfoPosts(posts: InfoPost[]): Promise<InfoPost[]> {
  try {
    await db.delete(infoPosts);
    if (posts.length > 0) {
      await db.insert(infoPosts).values(
        posts.map((p) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          image: p.image ?? null,
          active: p.active,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        }))
      );
    }
    return await listInfoPosts(false);
  } catch (error) {
    console.error('Database query failed in replaceInfoPosts:', error);
    throw new Error('Gagal menyimpan informasi.', { cause: error });
  }
}

// Store Catalog / Settings JSONB persistence
export async function getStoreConfigJson(): Promise<Record<
  string,
  unknown
> | null> {
  try {
    const rows = await db
      .select()
      .from(storeConfigs)
      .where(eq(storeConfigs.key, 'main'));
    if (!rows[0]) return null;
    return rows[0].data as Record<string, unknown>;
  } catch (error) {
    console.error('Database query failed in getStoreConfigJson:', error);
    throw new Error('Gagal memuatkan konfigurasi kedai.', { cause: error });
  }
}

export async function saveStoreConfigJson(data: Record<string, unknown>) {
  try {
    await db
      .insert(storeConfigs)
      .values({
        key: 'main',
        data,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: storeConfigs.key,
        set: {
          data,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Database query failed in saveStoreConfigJson:', error);
    throw new Error('Gagal menyimpan konfigurasi kedai.', { cause: error });
  }
}

// Email OTP helpers for Sign Up verification
function hashOtp(email: string, code: string): string {
  return crypto
    .createHash('sha256')
    .update(`${email.trim().toLowerCase()}:${code.trim()}`)
    .digest('hex');
}

const DEFAULT_RESEND_FROM = 'TopupBalz <onboarding@resend.dev>';
const UNVERIFIABLE_PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.com.my',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
]);

function resolveResendFromAddress(rawFrom?: string): string {
  const trimmed = (rawFrom || '').trim();
  if (!trimmed) return DEFAULT_RESEND_FROM;

  const angleMatch = trimmed.match(/<([^>]+)>/);
  const emailPart = (angleMatch ? angleMatch[1] : trimmed).trim().toLowerCase();
  const atIndex = emailPart.lastIndexOf('@');
  if (atIndex <= 0) return DEFAULT_RESEND_FROM;

  const domain = emailPart.slice(atIndex + 1);
  if (!domain || !domain.includes('.') || UNVERIFIABLE_PUBLIC_EMAIL_DOMAINS.has(domain)) {
    return DEFAULT_RESEND_FROM;
  }

  return trimmed;
}

async function sendOtpViaResend(
  resendKey: string,
  from: string,
  toEmail: string,
  code: string
): Promise<{ ok: boolean; status: number; errBody: string }> {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject: 'Kod OTP Pengesahan Pendaftaran TopupBalz',
      html: `<p>Kod OTP pengesahan pendaftaran anda ialah: <strong style="font-size:20px;letter-spacing:3px">${code}</strong></p><p>Kod ini sah selama 10 minit.</p>`,
    }),
  });

  if (resp.ok) {
    return { ok: true, status: resp.status, errBody: '' };
  }

  const errBody = await resp.text().catch(() => '');
  return { ok: false, status: resp.status, errBody };
}

export interface EmailOtpConfig {
  enabled: boolean;
  gmailUser: string;
  gmailAppPassword: string;
  senderName: string;
}

export interface EmailOtpPublicConfig {
  enabled: boolean;
  gmailUser: string;
  senderName: string;
  hasAppPassword: boolean;
  envConfigured: boolean;
}

const DEFAULT_EMAIL_OTP_CONFIG: EmailOtpConfig = {
  enabled: false,
  gmailUser: '',
  gmailAppPassword: '',
  senderName: 'TopupBalz',
};

export async function getEmailOtpConfig(): Promise<EmailOtpConfig> {
  try {
    const rows = await db
      .select()
      .from(storeConfigs)
      .where(eq(storeConfigs.key, 'email_otp'))
      .limit(1);
    const raw = (rows[0]?.data as Partial<EmailOtpConfig> | undefined) || {};
    return {
      enabled: Boolean(raw.enabled),
      gmailUser: typeof raw.gmailUser === 'string' ? raw.gmailUser.trim() : '',
      gmailAppPassword:
        typeof raw.gmailAppPassword === 'string'
          ? raw.gmailAppPassword.replace(/\s+/g, '')
          : '',
      senderName:
        typeof raw.senderName === 'string' && raw.senderName.trim()
          ? raw.senderName.trim()
          : 'TopupBalz',
    };
  } catch (error) {
    console.error('Database query failed in getEmailOtpConfig:', error);
    return { ...DEFAULT_EMAIL_OTP_CONFIG };
  }
}

export async function getPublicEmailOtpConfig(): Promise<EmailOtpPublicConfig> {
  const cfg = await getEmailOtpConfig();
  const envUser = (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
  const envPass = (
    process.env.GMAIL_APP_PASSWORD ||
    process.env.SMTP_PASS ||
    ''
  ).replace(/\s+/g, '');

  return {
    enabled: cfg.enabled,
    gmailUser: cfg.gmailUser || envUser,
    senderName: cfg.senderName || 'TopupBalz',
    hasAppPassword: Boolean(cfg.gmailAppPassword || envPass),
    envConfigured: Boolean(envUser && envPass),
  };
}

export async function saveEmailOtpConfig(input: {
  enabled: boolean;
  gmailUser: string;
  gmailAppPassword?: string;
  senderName?: string;
}): Promise<EmailOtpPublicConfig> {
  try {
    const existing = await getEmailOtpConfig();
    const newPass =
      typeof input.gmailAppPassword === 'string' &&
      input.gmailAppPassword.trim()
        ? input.gmailAppPassword.replace(/\s+/g, '')
        : existing.gmailAppPassword;

    const clean: EmailOtpConfig = {
      enabled: Boolean(input.enabled),
      gmailUser: (input.gmailUser || '').trim().toLowerCase(),
      gmailAppPassword: newPass,
      senderName: (input.senderName || '').trim() || 'TopupBalz',
    };

    await db
      .insert(storeConfigs)
      .values({
        key: 'email_otp',
        data: clean,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: storeConfigs.key,
        set: {
          data: clean,
          updatedAt: new Date(),
        },
      });

    return getPublicEmailOtpConfig();
  } catch (error) {
    console.error('Database query failed in saveEmailOtpConfig:', error);
    throw new Error('Gagal menyimpan tetapan E-mel OTP.', { cause: error });
  }
}

async function resolveActiveGmailCredentials(): Promise<{
  user: string;
  pass: string;
  senderName: string;
} | null> {
  const cfg = await getEmailOtpConfig();
  if (cfg.enabled && cfg.gmailUser && cfg.gmailAppPassword) {
    return {
      user: cfg.gmailUser,
      pass: cfg.gmailAppPassword,
      senderName: cfg.senderName || 'TopupBalz',
    };
  }

  const envUser = (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
  const envPass = (
    process.env.GMAIL_APP_PASSWORD ||
    process.env.SMTP_PASS ||
    ''
  ).replace(/\s+/g, '');

  if (envUser && envPass) {
    return {
      user: envUser,
      pass: envPass,
      senderName: cfg.senderName || 'TopupBalz',
    };
  }

  return null;
}

async function sendOtpViaGmailSmtp(params: {
  user: string;
  pass: string;
  senderName: string;
  toEmail: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: params.user,
        pass: params.pass.replace(/\s+/g, ''),
      },
    });
    await transporter.sendMail({
      from: `${params.senderName} <${params.user}>`,
      to: params.toEmail,
      subject: params.subject,
      html: params.html,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Gagal menghantar e-mel melalui Gmail SMTP.',
    };
  }
}

export async function testGmailSmtpConnection(input: {
  gmailUser?: string;
  gmailAppPassword?: string;
  senderName?: string;
  toEmail?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const saved = await getEmailOtpConfig();
  const user = (
    input.gmailUser ||
    saved.gmailUser ||
    process.env.GMAIL_USER ||
    process.env.SMTP_USER ||
    ''
  )
    .trim()
    .toLowerCase();
  const pass = (
    input.gmailAppPassword ||
    saved.gmailAppPassword ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.SMTP_PASS ||
    ''
  ).replace(/\s+/g, '');
  const senderName = (input.senderName || saved.senderName || 'TopupBalz').trim();
  const toEmail = (input.toEmail || user).trim().toLowerCase();

  if (!user || !pass) {
    return {
      ok: false,
      error: 'Sila isi Alamat Gmail dan App Password Google (16 aksara).',
    };
  }

  return sendOtpViaGmailSmtp({
    user,
    pass,
    senderName,
    toEmail,
    subject: 'Ujian Penghantaran OTP Gmail - TopupBalz',
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;"><h2 style="color:#ea580c;margin:0 0 12px;">TopupBalz - Ujian Berjaya</h2><p style="color:#334155;font-size:14px;line-height:1.5;">Sambungan Gmail SMTP anda aktif dan sedia menghantar kod OTP pendaftaran sebenar terus ke peti masuk Gmail pengguna.</p><p style="margin-top:16px;font-size:18px;font-weight:bold;letter-spacing:4px;color:#0f172a;">123456</p></div>`,
  });
}

export async function createAndSendEmailOtp(rawEmail: string): Promise<{
  delivery: 'email' | 'preview';
  previewOtp?: string;
}> {
  const email = rawEmail.trim().toLowerCase();
  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = hashOtp(email, code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await db.insert(emailOtps).values({
      email,
      codeHash,
      verified: false,
      expiresAt,
    });
  } catch (error) {
    console.error('Database query failed in createAndSendEmailOtp:', error);
    throw new Error('Gagal menjana kod OTP pengesahan.', { cause: error });
  }

  // 1. Prefer Gmail SMTP when configured (delivers real OTPs to any Gmail/email inbox)
  const gmailCreds = await resolveActiveGmailCredentials();
  if (gmailCreds) {
    const smtpRes = await sendOtpViaGmailSmtp({
      user: gmailCreds.user,
      pass: gmailCreds.pass,
      senderName: gmailCreds.senderName,
      toEmail: email,
      subject: `Kod OTP Pengesahan Pendaftaran TopupBalz: ${code}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;"><h2 style="color:#ea580c;margin:0 0 10px;">TopupBalz</h2><p style="color:#334155;font-size:14px;margin:0 0 16px;">Gunakan kod OTP 6 digit di bawah untuk mengesahkan pendaftaran akaun anda:</p><div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:16px;text-align:center;margin:0 0 16px;"><span style="font-size:28px;font-weight:800;letter-spacing:6px;color:#ea580c;">${code}</span></div><p style="color:#64748b;font-size:12px;margin:0;">Kod ini sah selama 10 minit. Jangan kongsikan kod ini kepada sesiapa.</p></div>`,
    });
    if (smtpRes.ok) {
      return { delivery: 'email' };
    }
  }

  // 2. Fallback to Resend API if configured
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const primaryFrom = resolveResendFromAddress(process.env.RESEND_FROM_EMAIL);
    try {
      let attempt = await sendOtpViaResend(resendKey, primaryFrom, email, code);

      // If a custom RESEND_FROM_EMAIL domain isn't verified yet, retry once via onboarding@resend.dev
      if (!attempt.ok && attempt.status === 403 && primaryFrom !== DEFAULT_RESEND_FROM) {
        attempt = await sendOtpViaResend(resendKey, DEFAULT_RESEND_FROM, email, code);
      }

      if (attempt.ok) {
        return { delivery: 'email' };
      }

      // Fall back silently to on-screen preview OTP when Resend is in sandbox/unverified-domain mode
      // so user registration stays unblocked without polluting stderr logs.
      return { delivery: 'preview', previewOtp: code };
    } catch {
      return { delivery: 'preview', previewOtp: code };
    }
  }

  return { delivery: 'preview', previewOtp: code };
}

export async function verifyEmailOtp(
  rawEmail: string,
  rawCode: string
): Promise<{ verified: boolean; verificationToken?: string }> {
  const email = rawEmail.trim().toLowerCase();
  const codeHash = hashOtp(email, rawCode);

  try {
    const rows = await db
      .select()
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.email, email),
          gt(emailOtps.expiresAt, new Date())
        )
      )
      .orderBy(desc(emailOtps.createdAt))
      .limit(1);

    const latest = rows[0];
    if (!latest || latest.codeHash !== codeHash) {
      return { verified: false };
    }

    const verificationToken = crypto.randomUUID();
    await db
      .update(emailOtps)
      .set({
        verified: true,
        verificationToken,
      })
      .where(eq(emailOtps.id, latest.id));

    return { verified: true, verificationToken };
  } catch (error) {
    console.error('Database query failed in verifyEmailOtp:', error);
    throw new Error('Gagal mengesahkan kod OTP.', { cause: error });
  }
}

export async function checkVerifiedOtpToken(
  rawEmail: string,
  token: string
): Promise<boolean> {
  const email = rawEmail.trim().toLowerCase();
  try {
    const rows = await db
      .select()
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.email, email),
          eq(emailOtps.verificationToken, token),
          eq(emailOtps.verified, true),
          gt(emailOtps.expiresAt, new Date())
        )
      )
      .limit(1);
    return rows.length > 0;
  } catch (error) {
    console.error('Database query failed in checkVerifiedOtpToken:', error);
    throw new Error('Gagal menyemak token OTP.', { cause: error });
  }
}

// Telegram Info Channel Configuration & Notifications
export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  channelId: string;
  channelUrl: string;
  channelName: string;
}

const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  enabled: false,
  botToken: '',
  channelId: '',
  channelUrl: '',
  channelName: 'Telegram Info Channel',
};

export async function getTelegramConfig(): Promise<TelegramConfig> {
  try {
    const rows = await db
      .select()
      .from(storeConfigs)
      .where(eq(storeConfigs.key, 'telegram'));
    if (!rows[0] || typeof rows[0].data !== 'object' || !rows[0].data) {
      return { ...DEFAULT_TELEGRAM_CONFIG };
    }
    const raw = rows[0].data as Partial<TelegramConfig>;
    return {
      enabled: Boolean(raw.enabled),
      botToken: typeof raw.botToken === 'string' ? raw.botToken : '',
      channelId: typeof raw.channelId === 'string' ? raw.channelId : '',
      channelUrl: typeof raw.channelUrl === 'string' ? raw.channelUrl : '',
      channelName:
        typeof raw.channelName === 'string' && raw.channelName.trim()
          ? raw.channelName
          : 'Telegram Info Channel',
    };
  } catch (error) {
    console.error('Database query failed in getTelegramConfig:', error);
    throw new Error('Gagal memuatkan tetapan Telegram.', { cause: error });
  }
}

export async function saveTelegramConfig(
  cfg: TelegramConfig
): Promise<TelegramConfig> {
  try {
    const clean: TelegramConfig = {
      enabled: Boolean(cfg.enabled),
      botToken: cfg.botToken.trim(),
      channelId: cfg.channelId.trim(),
      channelUrl: cfg.channelUrl.trim(),
      channelName: cfg.channelName.trim() || 'Telegram Info Channel',
    };
    await db
      .insert(storeConfigs)
      .values({
        key: 'telegram',
        data: clean,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: storeConfigs.key,
        set: {
          data: clean,
          updatedAt: new Date(),
        },
      });
    return clean;
  } catch (error) {
    console.error('Database query failed in saveTelegramConfig:', error);
    throw new Error('Gagal menyimpan tetapan Telegram.', { cause: error });
  }
}

function escapeTelegramHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function paymentStatusLabel(code: PaymentStatusCode): string {
  if (code === 2) return 'Lunas / Disahkan';
  if (code === -1) return 'Dibatalkan';
  if (code === -2) return 'Tamat Tempoh';
  return 'Menunggu Pengesahan';
}

function topupStatusLabel(code: TopupStatusCode): string {
  if (code === 1) return 'Sedang Diproses';
  if (code === 2) return 'Berjaya Dikreditkan';
  if (code === 3) return 'Gagal / Dibatalkan';
  return 'Menunggu';
}

export async function sendTelegramMessage(
  botToken: string,
  channelId: string,
  htmlText: string
): Promise<{ ok: boolean; error?: string }> {
  const token = botToken.trim();
  const chatId = channelId.trim();
  if (!token || !chatId) {
    return { ok: false, error: 'Bot Token atau ID Channel Telegram belum ditetapkan.' };
  }
  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: htmlText,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }
    );
    const json = (await resp.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
    };
    if (!resp.ok || !json.ok) {
      return {
        ok: false,
        error: json.description || `Telegram API ralat (${resp.status})`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Gagal menghubungi Telegram API.',
    };
  }
}

export async function sendTelegramPhoto(
  botToken: string,
  channelId: string,
  dataUrl: string,
  captionHtml: string
): Promise<{ ok: boolean; error?: string }> {
  const token = botToken.trim();
  const chatId = channelId.trim();
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!token || !chatId || !match) {
    return { ok: false, error: 'Format gambar atau tetapan bot tidak sah.' };
  }
  try {
    const mime = match[1];
    const ext = mime.includes('png')
      ? 'png'
      : mime.includes('webp')
        ? 'webp'
        : 'jpg';
    const buffer = Buffer.from(match[2], 'base64');
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('photo', new Blob([buffer], { type: mime }), `resit.${ext}`);
    form.append('caption', captionHtml.slice(0, 1020));
    form.append('parse_mode', 'HTML');

    const resp = await fetch(
      `https://api.telegram.org/bot${encodeURIComponent(token)}/sendPhoto`,
      {
        method: 'POST',
        body: form,
      }
    );
    const json = (await resp.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
    };
    if (!resp.ok || !json.ok) {
      return {
        ok: false,
        error: json.description || `Telegram API ralat (${resp.status})`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Gagal menghantar gambar ke Telegram.',
    };
  }
}

export async function sendTelegramOrderNotification(
  order: OrderItem,
  event: 'new' | 'update'
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const cfg = await getTelegramConfig();
  if (!cfg.enabled || !cfg.botToken || !cfg.channelId) {
    return { ok: false, skipped: true };
  }

  const header =
    event === 'new'
      ? '🛒 <b>PESANAN BAHARU MASUK</b>'
      : '🔔 <b>KEMAS KINI STATUS TRANSAKSI</b>';

  const accountDisplay = order.serverId
    ? `${order.accountId} (${order.serverId})`
    : order.accountId;

  const lines = [
    header,
    '',
    `<b>No. Rujukan:</b> <code>${escapeTelegramHtml(order.reference)}</code>`,
    `<b>Game:</b> ${escapeTelegramHtml(order.brandName)}`,
    `<b>Produk:</b> ${escapeTelegramHtml(order.productName)}`,
    `<b>ID Akaun:</b> <code>${escapeTelegramHtml(accountDisplay)}</code>`,
    `<b>Kaedah Bayaran:</b> ${escapeTelegramHtml(order.paymentMethodName)} (${escapeTelegramHtml(order.paymentChannelCode)})`,
    `<b>Jumlah Bayaran:</b> RM ${order.totalAmount.toFixed(2)}`,
    `<b>Status Bayaran:</b> ${escapeTelegramHtml(paymentStatusLabel(order.paymentStatus))}`,
    `<b>Status Topup:</b> ${escapeTelegramHtml(topupStatusLabel(order.topupStatus))}`,
    `<b>Bukti Bayaran:</b> ${order.paymentProofUrl ? 'Dilampirkan' : 'Belum dimuat naik'}`,
    `<b>Masa:</b> ${escapeTelegramHtml(new Date(order.createdAt).toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' }))}`,
  ];

  const htmlText = lines.join('\n');

  if (order.paymentProofUrl?.startsWith('data:image/')) {
    const photoResult = await sendTelegramPhoto(
      cfg.botToken,
      cfg.channelId,
      order.paymentProofUrl,
      htmlText
    );
    if (photoResult.ok) {
      return photoResult;
    }
  }

  return sendTelegramMessage(cfg.botToken, cfg.channelId, htmlText);
}

