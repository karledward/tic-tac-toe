import { eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { games, InsertGame, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: Partial<InsertUser> & { id: string }): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    
    if (existing.length > 0) {
      // Update existing user
      const updateSet: Record<string, unknown> = {};
      
      if (user.name !== undefined) updateSet.name = user.name;
      if (user.email !== undefined) updateSet.email = user.email;
      if (user.passwordHash !== undefined) updateSet.passwordHash = user.passwordHash;
      if (user.lastSignedIn !== undefined) updateSet.lastSignedIn = user.lastSignedIn;
      if (user.role !== undefined) updateSet.role = user.role;
      
      if (Object.keys(updateSet).length === 0) {
        updateSet.lastSignedIn = new Date();
      }
      
      await db.update(users).set(updateSet).where(eq(users.id, user.id));
    } else {
      // Insert new user - require all fields
      if (!user.name || !user.email || !user.passwordHash) {
        throw new Error("Name, email, and passwordHash are required for new users");
      }
      
      await db.insert(users).values({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role || (user.id === ENV.ownerId ? 'admin' : 'user'),
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Save a completed game to the database
 */
export async function saveGame(game: InsertGame) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save game: database not available");
    return null;
  }

  try {
    await db.insert(games).values(game);
    return game;
  } catch (error) {
    console.error("[Database] Failed to save game:", error);
    throw error;
  }
}

/**
 * Get all games for a specific user
 */
export async function getUserGames(userId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user games: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(games)
      .where(eq(games.playerXId, userId))
      .union(
        db.select().from(games).where(eq(games.playerOId, userId))
      )
      .orderBy(games.createdAt);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get user games:", error);
    return [];
  }
}

/**
 * Get user statistics (wins, losses, draws)
 */
export async function getUserStats(userId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user stats: database not available");
    return { wins: 0, losses: 0, draws: 0, totalGames: 0 };
  }

  try {
    const userGames = await getUserGames(userId);
    
    const wins = userGames.filter(game => game.winnerId === userId).length;
    const draws = userGames.filter(game => game.result === "draw").length;
    const losses = userGames.length - wins - draws;

    return {
      wins,
      losses,
      draws,
      totalGames: userGames.length,
    };
  } catch (error) {
    console.error("[Database] Failed to get user stats:", error);
    return { wins: 0, losses: 0, draws: 0, totalGames: 0 };
  }
}
