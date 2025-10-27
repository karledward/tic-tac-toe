import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerOAuthRoutes } from "../../server/_core/oauth";

const app = express();
registerOAuthRoutes(app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request to Express-compatible format
  const expressReq = req as any;
  const expressRes = res as any;

  // Handle OAuth request
  return app(expressReq, expressRes);
}

