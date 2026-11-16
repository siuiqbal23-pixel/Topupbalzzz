import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull().default('Pelanggan'),
  phone: text('phone').notNull().default(''),
  role: text('role').notNull().default('customer'), // 'customer' | 'admin'
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailOtps = pgTable('email_otps', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  codeHash: text('code_hash').notNull(),
  verificationToken: text('verification_token'),
  verified: boolean('verified').notNull().default(false),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  reference: text('reference').notNull().unique(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  brandId: text('brand_id').notNull(),
  brandSlug: text('brand_slug').notNull(),
  brandName: text('brand_name').notNull(),
  brandImage: text('brand_image').notNull().default(''),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  accountId: text('account_id').notNull(),
  serverId: text('server_id'),
  customerName: text('customer_name').notNull(),
  whatsapp: text('whatsapp').notNull(),
  email: text('email'),
  paymentAccountId: text('payment_account_id').notNull(),
  paymentMethodName: text('payment_method_name').notNull(),
  paymentChannelCode: text('payment_channel_code').notNull(),
  paymentAccountNumber: text('payment_account_number').notNull(),
  paymentAccountLabel: text('payment_account_label').notNull(),
  subtotal: doublePrecision('subtotal').notNull(),
  discountAmount: doublePrecision('discount_amount').notNull().default(0),
  voucherCode: text('voucher_code'),
  totalAmount: doublePrecision('total_amount').notNull(),
  paymentStatus: integer('payment_status').notNull().default(0),
  topupStatus: integer('topup_status').notNull().default(0),
  paymentProofUrl: text('payment_proof_url'),
  deliveryProofUrl: text('delivery_proof_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const infoPosts = pgTable('info_posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  image: text('image'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const storeConfigs = pgTable('store_configs', {
  key: text('key').primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  buyer: one(users, {
    fields: [orders.userUid],
    references: [users.uid],
  }),
}));
