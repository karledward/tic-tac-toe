import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cookieParser from "cookie-parser";

// Create Express app
const app = express();
app.use(express.json());
app.use(cookieParser());

// Lazy-load and setup routes
let routesInitialized = false;

async function initializeRoutes() {
  if (routesInitialized) return;
  
  const { createExpressMiddleware } = await import("@trpc/server/adapters/express");
  const { appRouter } = await import("./server/routers");
  const { createContext } = await import("./server/_core/context");
  const { registerOAuthRoutes } = await import("./server/_core/oauth");

  // Register OAuth routes
  registerOAuthRoutes(app);

  // Register tRPC routes
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  routesInitialized = true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Initialize routes on first request
    await initializeRoutes();

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    // Handle request with Express app
    return new Promise((resolve, reject) => {
      app(req as any, res as any, (err: any) => {
        if (err) {
          console.error("[API Error]", err);
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error("[API Handler Error]", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

