import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getUserStats, saveGame } from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  game: router({
    /**
     * Save a completed game result
     */
    saveResult: protectedProcedure
      .input(
        z.object({
          playerXId: z.string(),
          playerOId: z.string(),
          result: z.enum(["X", "O", "draw"]),
          winnerId: z.string().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        await saveGame({
          id: gameId,
          playerXId: input.playerXId,
          playerOId: input.playerOId,
          result: input.result,
          winnerId: input.winnerId,
        });

        return { success: true, gameId };
      }),

    /**
     * Get current user's game statistics
     */
    getMyStats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await getUserStats(ctx.user.id);
      return stats;
    }),
  }),
});

export type AppRouter = typeof appRouter;
