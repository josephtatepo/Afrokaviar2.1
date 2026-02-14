import { users, type User, type UpsertUser } from "@shared/models/auth";
import { adminUsers } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

const ROOT_ADMIN_EMAIL = "josephtatepo@gmail.com";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    try {
      if (user.email === ROOT_ADMIN_EMAIL) {
        const [existingAdmin] = await db.select().from(adminUsers).where(eq(adminUsers.userId, user.id));
        if (!existingAdmin) {
          await db.insert(adminUsers).values({
            userId: user.id,
            role: "root_admin",
            invitedBy: null,
          });
          console.log("[Auth] Root admin record created for", user.email);
        }
      }
    } catch (err) {
      console.error("[Auth] Failed to create admin record:", err);
    }
    
    return user;
  }
}

export async function ensureRootAdmin() {
  try {
    const [rootUser] = await db.select().from(users).where(eq(users.email, ROOT_ADMIN_EMAIL));
    if (!rootUser) {
      console.log("[Auth] Root admin user has not logged in yet, skipping bootstrap");
      return;
    }
    const [existingAdmin] = await db.select().from(adminUsers).where(eq(adminUsers.userId, rootUser.id));
    if (!existingAdmin) {
      await db.insert(adminUsers).values({
        userId: rootUser.id,
        role: "root_admin",
        invitedBy: null,
      });
      console.log("[Auth] Root admin bootstrapped for", ROOT_ADMIN_EMAIL);
    } else {
      console.log("[Auth] Root admin already exists for", ROOT_ADMIN_EMAIL);
    }
  } catch (err) {
    console.error("[Auth] Error bootstrapping root admin:", err);
  }
}

export const authStorage = new AuthStorage();
