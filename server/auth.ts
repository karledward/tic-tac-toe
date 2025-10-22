import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Register a new user with email and password
 */
export async function registerUser(
  email: string,
  password: string,
  name: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("User with this email already exists");
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
    role: "user",
  });

  return { id: userId, email, name, role: "user" as const };
}

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Find user by email
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = result[0];

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  // Update last signed in
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

