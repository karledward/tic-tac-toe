import { createExpressMiddleware } from "@trpc/server/adapters/express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

// Create Express middleware for tRPC
const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Convert Vercel request to Express-compatible format
  const expressReq = req as any;
  const expressRes = res as any;

  // Handle tRPC request
  return trpcMiddleware(expressReq, expressRes);
}

