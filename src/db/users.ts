import { desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { orders, users } from './schema.ts';

const OWNER_ADMIN_EMAIL = 'siuiqbal23@gmail.com';

export async function getOrCreateUser(params: {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  emailVerified?: boolean;
}) {
  try {
    const normalizedEmail = params.email.trim().toLowerCase();
    const isOwnerAdmin = normalizedEmail === OWNER_ADMIN_EMAIL;

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.uid, params.uid));

    const existingRow = existing[0];
    const resolvedRole = isOwnerAdmin
      ? 'admin'
      : existingRow?.role ?? 'customer';

    const result = await db
      .insert(users)
      .values({
        uid: params.uid,
        email: params.email,
        name: params.name?.trim() || params.email.split('@')[0] || 'Pelanggan',
        phone: params.phone?.trim() || '',
        role: resolvedRole,
        emailVerified: Boolean(params.emailVerified),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: params.email,
          ...(params.name?.trim() ? { name: params.name.trim() } : {}),
          ...(params.phone?.trim() ? { phone: params.phone.trim() } : {}),
          ...(params.emailVerified !== undefined
            ? { emailVerified: params.emailVerified }
            : {}),
          role: resolvedRole,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Gagal menyelaraskan akaun pengguna.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid));
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed in getUserByUid:', error);
    throw new Error('Gagal mendapatkan profil pengguna.', { cause: error });
  }
}

export async function touchUserLastSeen(uid: string) {
  try {
    await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.uid, uid));
  } catch {
    // non-fatal activity timestamp update
  }
}

export async function listAllUsersForAdmin() {
  try {
    const [userRows, orderStats] = await Promise.all([
      db.select().from(users).orderBy(desc(users.updatedAt)),
      db
        .select({
          userUid: orders.userUid,
          orderCount: sql<number>`count(*)::int`,
          totalSpent: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::float8`,
        })
        .from(orders)
        .groupBy(orders.userUid),
    ]);

    const statsByUid = new Map<
      string,
      { orderCount: number; totalSpent: number }
    >();
    for (const stat of orderStats) {
      statsByUid.set(stat.userUid, {
        orderCount: Number(stat.orderCount || 0),
        totalSpent: Number(stat.totalSpent || 0),
      });
    }

    return userRows.map((u) => {
      const stat = statsByUid.get(u.uid);
      return {
        uid: u.uid,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: (u.role === 'admin' ? 'admin' : 'customer') as 'admin' | 'customer',
        emailVerified: Boolean(u.emailVerified),
        orderCount: stat?.orderCount ?? 0,
        totalSpent: stat?.totalSpent ?? 0,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    console.error('Database query failed in listAllUsersForAdmin:', error);
    throw new Error('Gagal memuatkan senarai e-mel pengguna.', { cause: error });
  }
}

export async function updateUserProfile(
  uid: string,
  patch: { name?: string; phone?: string }
) {
  try {
    const rows = await db
      .update(users)
      .set({
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone.trim() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed in updateUserProfile:', error);
    throw new Error('Gagal mengemas kini profil.', { cause: error });
  }
}
