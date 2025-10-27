import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Dynamically import server modules
    const { fetchRequestHandler } = await import("@trpc/server/adapters/fetch");
    const { appRouter } = await import("../../server/routers");
    const { createContext } = await import("../../server/_core/context");

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    // Convert Vercel request to Fetch API Request
    const url = new URL(req.url || "", `https://${req.headers.host}`);
    
    const fetchRequest = new Request(url.toString(), {
      method: req.method || "GET",
      headers: new Headers(req.headers as HeadersInit),
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });

    // Handle tRPC request using fetch adapter
    const fetchResponse = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: fetchRequest,
      router: appRouter,
      createContext: async () => {
        // Create Express-like request object for context
        const mockReq = {
          headers: Object.fromEntries(new Headers(req.headers as HeadersInit)),
          cookies: req.cookies || {},
        };
        const mockRes = {
          setHeader: () => {},
          cookie: () => {},
        };
        return createContext({ req: mockReq as any, res: mockRes as any });
      },
    });

    // Convert Fetch Response to Vercel Response
    const body = await fetchResponse.text();
    
    fetchResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    res.status(fetchResponse.status).send(body);
  } catch (error) {
    console.error("[tRPC API Error]", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

