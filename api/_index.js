var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/const.ts
var COOKIE_NAME, ONE_YEAR_MS, AXIOS_TIMEOUT_MS, UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG;
var init_const = __esm({
  "shared/const.ts"() {
    "use strict";
    COOKIE_NAME = "app_session_id";
    ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
    AXIOS_TIMEOUT_MS = 3e4;
    UNAUTHED_ERR_MSG = "Please login (10001)";
    NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
  }
});

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}
var init_cookies = __esm({
  "server/_core/cookies.ts"() {
    "use strict";
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}
var TITLE_MAX_LENGTH, CONTENT_MAX_LENGTH, trimValue, isNonEmptyString, buildEndpointUrl, validatePayload;
var init_notification = __esm({
  "server/_core/notification.ts"() {
    "use strict";
    init_env();
    TITLE_MAX_LENGTH = 1200;
    CONTENT_MAX_LENGTH = 2e4;
    trimValue = (value) => value.trim();
    isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
    buildEndpointUrl = (baseUrl) => {
      const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      return new URL(
        "webdevtoken.v1.WebDevService/SendNotification",
        normalizedBase
      ).toString();
    };
    validatePayload = (input) => {
      if (!isNonEmptyString(input.title)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification title is required."
        });
      }
      if (!isNonEmptyString(input.content)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification content is required."
        });
      }
      const title = trimValue(input.title);
      const content = trimValue(input.content);
      if (title.length > TITLE_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
        });
      }
      if (content.length > CONTENT_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
        });
      }
      return { title, content };
    };
  }
});

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t, router, publicProcedure, requireUser, protectedProcedure, adminProcedure;
var init_trpc = __esm({
  "server/_core/trpc.ts"() {
    "use strict";
    init_const();
    t = initTRPC.context().create({
      transformer: superjson
    });
    router = t.router;
    publicProcedure = t.procedure;
    requireUser = t.middleware(async (opts) => {
      const { ctx, next } = opts;
      if (!ctx.user) {
        throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
      }
      return next({
        ctx: {
          ...ctx,
          user: ctx.user
        }
      });
    });
    protectedProcedure = t.procedure.use(requireUser);
    adminProcedure = t.procedure.use(
      t.middleware(async (opts) => {
        const { ctx, next } = opts;
        if (!ctx.user || ctx.user.role !== "admin") {
          throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
        }
        return next({
          ctx: {
            ...ctx,
            user: ctx.user
          }
        });
      })
    );
  }
});

// server/_core/systemRouter.ts
import { z } from "zod";
var systemRouter;
var init_systemRouter = __esm({
  "server/_core/systemRouter.ts"() {
    "use strict";
    init_notification();
    init_trpc();
    systemRouter = router({
      health: publicProcedure.input(
        z.object({
          timestamp: z.number().min(0, "timestamp cannot be negative")
        })
      ).query(() => ({
        ok: true
      })),
      notifyOwner: adminProcedure.input(
        z.object({
          title: z.string().min(1, "title is required"),
          content: z.string().min(1, "content is required")
        })
      ).mutation(async ({ input }) => {
        const delivered = await notifyOwner(input);
        return {
          success: delivered
        };
      })
    });
  }
});

// drizzle/schema.ts
import { mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users, games;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: varchar("id", { length: 64 }).primaryKey(),
      name: text("name").notNull(),
      email: varchar("email", { length: 320 }).notNull().unique(),
      passwordHash: text("passwordHash").notNull(),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow()
    });
    games = mysqlTable("games", {
      id: varchar("id", { length: 64 }).primaryKey(),
      playerXId: varchar("playerXId", { length: 64 }).notNull().references(() => users.id),
      playerOId: varchar("playerOId", { length: 64 }).notNull().references(() => users.id),
      winnerId: varchar("winnerId", { length: 64 }).references(() => users.id),
      // null for draw
      result: mysqlEnum("result", ["X", "O", "draw"]).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
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
async function upsertUser(user) {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const existing = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (existing.length > 0) {
      const updateSet = {};
      if (user.name !== void 0) updateSet.name = user.name;
      if (user.email !== void 0) updateSet.email = user.email;
      if (user.passwordHash !== void 0) updateSet.passwordHash = user.passwordHash;
      if (user.lastSignedIn !== void 0) updateSet.lastSignedIn = user.lastSignedIn;
      if (user.role !== void 0) updateSet.role = user.role;
      if (Object.keys(updateSet).length === 0) {
        updateSet.lastSignedIn = /* @__PURE__ */ new Date();
      }
      await db.update(users).set(updateSet).where(eq(users.id, user.id));
    } else {
      if (!user.name || !user.email || !user.passwordHash) {
        throw new Error("Name, email, and passwordHash are required for new users");
      }
      await db.insert(users).values({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role || (user.id === ENV.ownerId ? "admin" : "user")
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUser(id) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function saveGame(game) {
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
async function getUserGames(userId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user games: database not available");
    return [];
  }
  try {
    const result = await db.select().from(games).where(eq(games.playerXId, userId)).union(
      db.select().from(games).where(eq(games.playerOId, userId))
    ).orderBy(games.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get user games:", error);
    return [];
  }
}
async function getUserStats(userId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user stats: database not available");
    return { wins: 0, losses: 0, draws: 0, totalGames: 0 };
  }
  try {
    const userGames = await getUserGames(userId);
    const wins = userGames.filter((game) => game.winnerId === userId).length;
    const draws = userGames.filter((game) => game.result === "draw").length;
    const losses = userGames.length - wins - draws;
    return {
      wins,
      losses,
      draws,
      totalGames: userGames.length
    };
  } catch (error) {
    console.error("[Database] Failed to get user stats:", error);
    return { wins: 0, losses: 0, draws: 0, totalGames: 0 };
  }
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/auth.ts
import bcrypt from "bcryptjs";
import { eq as eq2 } from "drizzle-orm";
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
async function registerUser(email, password, name) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const existing = await db.select().from(users).where(eq2(users.email, email)).limit(1);
  if (existing.length > 0) {
    throw new Error("User with this email already exists");
  }
  const passwordHash = await hashPassword(password);
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
    role: "user"
  });
  return { id: userId, email, name, role: "user" };
}
async function loginUser(email, password) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.select().from(users).where(eq2(users.email, email)).limit(1);
  if (result.length === 0) {
    throw new Error("Invalid email or password");
  }
  const user = result[0];
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }
  await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq2(users.id, user.id));
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_schema();
    init_db();
  }
});

// shared/_core/errors.ts
var HttpError, ForbiddenError;
var init_errors = __esm({
  "shared/_core/errors.ts"() {
    "use strict";
    HttpError = class extends Error {
      constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
      }
    };
    ForbiddenError = (msg) => new HttpError(403, msg);
  }
});

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString2, EXCHANGE_TOKEN_PATH, GET_USER_INFO_PATH, GET_USER_INFO_WITH_JWT_PATH, OAuthService, createOAuthHttpClient, SDKServer, sdk;
var init_sdk = __esm({
  "server/_core/sdk.ts"() {
    "use strict";
    init_const();
    init_errors();
    init_db();
    init_env();
    isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
    EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
    GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
    GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
    OAuthService = class {
      constructor(client) {
        this.client = client;
        console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
        if (!ENV.oAuthServerUrl) {
          console.error(
            "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
          );
        }
      }
      decodeState(state) {
        const redirectUri = atob(state);
        return redirectUri;
      }
      async getTokenByCode(code, state) {
        const payload = {
          clientId: ENV.appId,
          grantType: "authorization_code",
          code,
          redirectUri: this.decodeState(state)
        };
        const { data } = await this.client.post(
          EXCHANGE_TOKEN_PATH,
          payload
        );
        return data;
      }
      async getUserInfoByToken(token) {
        const { data } = await this.client.post(
          GET_USER_INFO_PATH,
          {
            accessToken: token.accessToken
          }
        );
        return data;
      }
    };
    createOAuthHttpClient = () => axios.create({
      baseURL: ENV.oAuthServerUrl,
      timeout: AXIOS_TIMEOUT_MS
    });
    SDKServer = class {
      client;
      oauthService;
      constructor(client = createOAuthHttpClient()) {
        this.client = client;
        this.oauthService = new OAuthService(this.client);
      }
      deriveLoginMethod(platforms, fallback) {
        if (fallback && fallback.length > 0) return fallback;
        if (!Array.isArray(platforms) || platforms.length === 0) return null;
        const set = new Set(
          platforms.filter((p) => typeof p === "string")
        );
        if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
        if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
        if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
        if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
          return "microsoft";
        if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
        const first = Array.from(set)[0];
        return first ? first.toLowerCase() : null;
      }
      /**
       * Exchange OAuth authorization code for access token
       * @example
       * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
       */
      async exchangeCodeForToken(code, state) {
        return this.oauthService.getTokenByCode(code, state);
      }
      /**
       * Get user information using access token
       * @example
       * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
       */
      async getUserInfo(accessToken) {
        const data = await this.oauthService.getUserInfoByToken({
          accessToken
        });
        const loginMethod = this.deriveLoginMethod(
          data?.platforms,
          data?.platform ?? data.platform ?? null
        );
        return {
          ...data,
          platform: loginMethod,
          loginMethod
        };
      }
      parseCookies(cookieHeader) {
        if (!cookieHeader) {
          return /* @__PURE__ */ new Map();
        }
        const parsed = parseCookieHeader(cookieHeader);
        return new Map(Object.entries(parsed));
      }
      getSessionSecret() {
        const secret = ENV.cookieSecret;
        return new TextEncoder().encode(secret);
      }
      /**
       * Create a session token for a user ID
       * @example
       * const sessionToken = await sdk.createSessionToken(userInfo.id);
       */
      async createSessionToken(userId, options = {}) {
        return this.signSession(
          {
            openId: userId,
            appId: ENV.appId,
            name: options.name || ""
          },
          options
        );
      }
      async signSession(payload, options = {}) {
        const issuedAt = Date.now();
        const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
        const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
        const secretKey = this.getSessionSecret();
        return new SignJWT({
          openId: payload.openId,
          appId: payload.appId,
          name: payload.name
        }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
      }
      async verifySession(cookieValue) {
        if (!cookieValue) {
          console.warn("[Auth] Missing session cookie");
          return null;
        }
        try {
          const secretKey = this.getSessionSecret();
          const { payload } = await jwtVerify(cookieValue, secretKey, {
            algorithms: ["HS256"]
          });
          const { openId, appId, name } = payload;
          if (!isNonEmptyString2(openId) || !isNonEmptyString2(appId) || !isNonEmptyString2(name)) {
            console.warn("[Auth] Session payload missing required fields");
            return null;
          }
          return {
            openId,
            appId,
            name
          };
        } catch (error) {
          console.warn("[Auth] Session verification failed", String(error));
          return null;
        }
      }
      async getUserInfoWithJwt(jwtToken) {
        const payload = {
          jwtToken,
          projectId: ENV.appId
        };
        const { data } = await this.client.post(
          GET_USER_INFO_WITH_JWT_PATH,
          payload
        );
        const loginMethod = this.deriveLoginMethod(
          data?.platforms,
          data?.platform ?? data.platform ?? null
        );
        return {
          ...data,
          platform: loginMethod,
          loginMethod
        };
      }
      async authenticateRequest(req) {
        const cookies = this.parseCookies(req.headers.cookie);
        const sessionCookie = cookies.get(COOKIE_NAME);
        const session = await this.verifySession(sessionCookie);
        if (!session) {
          throw ForbiddenError("Invalid session cookie");
        }
        const sessionUserId = session.openId;
        const signedInAt = /* @__PURE__ */ new Date();
        let user = await getUser(sessionUserId);
        if (!user) {
          try {
            const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
            await upsertUser({
              id: userInfo.openId,
              name: userInfo.name || "User",
              email: userInfo.email || `${userInfo.openId}@oauth.local`,
              passwordHash: "oauth_user",
              // OAuth users don't have passwords
              lastSignedIn: signedInAt
            });
            user = await getUser(userInfo.openId);
          } catch (error) {
            console.error("[Auth] Failed to sync user from OAuth:", error);
            throw ForbiddenError("Failed to sync user info");
          }
        }
        if (!user) {
          throw ForbiddenError("User not found");
        }
        await upsertUser({
          id: user.id,
          lastSignedIn: signedInAt
        });
        return user;
      }
    };
    sdk = new SDKServer();
  }
});

// server/customAuthRouter.ts
import { z as z2 } from "zod";
var ONE_YEAR_MS2, customAuthRouter;
var init_customAuthRouter = __esm({
  "server/customAuthRouter.ts"() {
    "use strict";
    init_trpc();
    init_auth();
    init_const();
    init_cookies();
    init_sdk();
    ONE_YEAR_MS2 = 365 * 24 * 60 * 60 * 1e3;
    customAuthRouter = router({
      /**
       * Register a new user
       */
      register: publicProcedure.input(
        z2.object({
          email: z2.string().email(),
          password: z2.string().min(6),
          name: z2.string().min(1)
        })
      ).mutation(async ({ input, ctx }) => {
        try {
          const user = await registerUser(input.email, input.password, input.name);
          const sessionToken = await sdk.createSessionToken(user.id, {
            name: user.name,
            expiresInMs: ONE_YEAR_MS2
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, {
            ...cookieOptions,
            maxAge: ONE_YEAR_MS2
          });
          return {
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          };
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : "Registration failed");
        }
      }),
      /**
       * Login with email and password
       */
      login: publicProcedure.input(
        z2.object({
          email: z2.string().email(),
          password: z2.string()
        })
      ).mutation(async ({ input, ctx }) => {
        try {
          const user = await loginUser(input.email, input.password);
          const sessionToken = await sdk.createSessionToken(user.id, {
            name: user.name,
            expiresInMs: ONE_YEAR_MS2
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, {
            ...cookieOptions,
            maxAge: ONE_YEAR_MS2
          });
          return {
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          };
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : "Login failed");
        }
      })
    });
  }
});

// server/routers.ts
var routers_exports = {};
__export(routers_exports, {
  appRouter: () => appRouter
});
import { z as z3 } from "zod";
var appRouter;
var init_routers = __esm({
  "server/routers.ts"() {
    "use strict";
    init_const();
    init_cookies();
    init_systemRouter();
    init_trpc();
    init_db();
    init_customAuthRouter();
    appRouter = router({
      system: systemRouter,
      customAuth: customAuthRouter,
      auth: router({
        me: publicProcedure.query((opts) => opts.ctx.user),
        logout: publicProcedure.mutation(({ ctx }) => {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
          return {
            success: true
          };
        })
      }),
      game: router({
        /**
         * Save a completed game result
         */
        saveResult: protectedProcedure.input(
          z3.object({
            playerXId: z3.string(),
            playerOId: z3.string(),
            result: z3.enum(["X", "O", "draw"]),
            winnerId: z3.string().nullable()
          })
        ).mutation(async ({ input }) => {
          const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          await saveGame({
            id: gameId,
            playerXId: input.playerXId,
            playerOId: input.playerOId,
            result: input.result,
            winnerId: input.winnerId
          });
          return { success: true, gameId };
        }),
        /**
         * Get current user's game statistics
         */
        getMyStats: protectedProcedure.query(async ({ ctx }) => {
          const stats = await getUserStats(ctx.user.id);
          return stats;
        })
      })
    });
  }
});

// server/_core/context.ts
var context_exports = {};
__export(context_exports, {
  createContext: () => createContext
});
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}
var init_context = __esm({
  "server/_core/context.ts"() {
    "use strict";
    init_sdk();
  }
});

// server/_core/oauth.ts
var oauth_exports = {};
__export(oauth_exports, {
  registerOAuthRoutes: () => registerOAuthRoutes
});
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        id: userInfo.openId,
        name: userInfo.name || "User",
        email: userInfo.email || `${userInfo.openId}@oauth.local`,
        passwordHash: "oauth_user",
        // OAuth users don't have passwords
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
var init_oauth = __esm({
  "server/_core/oauth.ts"() {
    "use strict";
    init_const();
    init_db();
    init_cookies();
    init_sdk();
  }
});

// api/index.ts
import express from "express";
import cookieParser from "cookie-parser";
var app = express();
app.use(express.json());
app.use(cookieParser());
var routesInitialized = false;
async function initializeRoutes() {
  if (routesInitialized) return;
  const { createExpressMiddleware } = await import("@trpc/server/adapters/express");
  const { appRouter: appRouter2 } = await Promise.resolve().then(() => (init_routers(), routers_exports));
  const { createContext: createContext2 } = await Promise.resolve().then(() => (init_context(), context_exports));
  const { registerOAuthRoutes: registerOAuthRoutes2 } = await Promise.resolve().then(() => (init_oauth(), oauth_exports));
  registerOAuthRoutes2(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter2,
      createContext: createContext2
    })
  );
  routesInitialized = true;
}
async function handler(req, res) {
  try {
    await initializeRoutes();
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    return new Promise((resolve, reject) => {
      app(req, res, (err) => {
        if (err) {
          console.error("[API Error]", err);
          reject(err);
        } else {
          resolve(void 0);
        }
      });
    });
  } catch (error) {
    console.error("[API Handler Error]", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
export {
  handler as default
};
