import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Dynamically import server modules to avoid build-time issues
  const { createExpressMiddleware } = await import("@trpc/server/adapters/express");
  const { appRouter } = await import("../../server/routers");
  const { createContext } = await import("../../server/_core/context");

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Create Express middleware for tRPC
  const trpcMiddleware = createExpressMiddleware({
    router: appRouter,
    createContext,
  });

  // Convert Vercel request to Express-compatible format
  const expressReq = req as any;
  const expressRes = res as any;

  // Handle tRPC request
  return trpcMiddleware(expressReq, expressRes);
}

