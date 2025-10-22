import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { loginUser, registerUser } from "./auth";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export const customAuthRouter = router({
  /**
   * Register a new user
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await registerUser(input.email, input.password, input.name);
        
        // Create session token using SDK
        const sessionToken = await sdk.createSessionToken(user.id, {
          name: user.name,
          expiresInMs: ONE_YEAR_MS,
        });

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Registration failed");
      }
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await loginUser(input.email, input.password);
        
        // Create session token using SDK
        const sessionToken = await sdk.createSessionToken(user.id, {
          name: user.name,
          expiresInMs: ONE_YEAR_MS,
        });

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Login failed");
      }
    }),
});

