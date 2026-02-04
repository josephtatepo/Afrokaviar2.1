import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
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
    
    if (user.email === "josephtatepo@gmail.com") {
      const { adminUsers } = await import("@shared/schema");
      const [existingAdmin] = await db.select().from(adminUsers).where(eq(adminUsers.userId, user.id));
      if (!existingAdmin) {
        await db.insert(adminUsers).values({
          userId: user.id,
          role: "root_admin",
          invitedBy: null,
        });
      }
    }
    
    return user;
  }
}

export const authStorage = new AuthStorage();
