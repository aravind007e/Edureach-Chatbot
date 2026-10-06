import { createHash, timingSafeEqual } from "node:crypto";
import { request, createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const OLLAMA_HOST = "127.0.0.1";
const OLLAMA_PORT = 11434;
const DEFAULT_PROXY_PORT = 11435;

const allowedEndpoints = new Map<string, string>([
  ["/api/tags", "GET"],
  ["/api/embed", "POST"],
  ["/api/embeddings", "POST"],
  ["/api/generate", "POST"],
]);

const unauthorized = (res: ServerResponse): void => {
  res.writeHead(401, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify({ error: "Unauthorized" }));
};

const isAuthorized = (authorization: string | string[] | undefined, expectedToken: string): boolean => {
  if (typeof authorization !== "string") return false;

  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match?.[1]) return false;

  const expectedDigest = createHash("sha256").update(expectedToken).digest();
  const providedDigest = createHash("sha256").update(match[1]).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
};

const forwardRequest = (req: IncomingMessage, res: ServerResponse, requestPath: string): void => {
  const headers: Record<string, string | string[]> = {};
  for (const name of ["accept", "content-type", "content-length"]) {
    const value = req.headers[name];
    if (typeof value === "string" || Array.isArray(value)) headers[name] = value;
  }

  const upstream = request(
    {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      method: req.method,
      path: requestPath,
      headers,
    },
    (upstreamRes) => {
      const responseHeaders: Record<string, string | string[]> = {};
      for (const [name, value] of Object.entries(upstreamRes.headers)) {
        if (name !== "connection" && name !== "transfer-encoding" && value !== undefined) {
          responseHeaders[name] = value;
        }
      }

      res.writeHead(upstreamRes.statusCode || 502, responseHeaders);
      upstreamRes.pipe(res);
    },
  );

  upstream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    }
    res.end(JSON.stringify({ error: "Ollama is unavailable" }));
  });

  req.pipe(upstream);
};

export const startOllamaAuthProxy = (port = Number(process.env.OLLAMA_PROXY_PORT || DEFAULT_PROXY_PORT)):
  Promise<Server> => {
  const token = process.env.OLLAMA_AUTH_TOKEN?.trim();
  if (!token) {
    throw new Error("OLLAMA_AUTH_TOKEN must be set before starting the Ollama auth proxy.");
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("OLLAMA_PROXY_PORT must be a valid TCP port.");
  }

  const server = createServer((req, res) => {
    if (!isAuthorized(req.headers.authorization, token)) {
      unauthorized(res);
      return;
    }

    let pathname: string;
    try {
      pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid request path" }));
      return;
    }

    const allowedMethod = allowedEndpoints.get(pathname);
    if (!allowedMethod || req.method !== allowedMethod) {
      res.writeHead(allowedMethod ? 405 : 404, {
        "Content-Type": "application/json",
        ...(allowedMethod ? { Allow: allowedMethod } : {}),
      });
      res.end(JSON.stringify({ error: allowedMethod ? "Method not allowed" : "Not found" }));
      return;
    }

    forwardRequest(req, res, req.url || pathname);
  });

  return new Promise((resolveServer, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      const address = server.address();
      const activePort = address && typeof address === "object" ? address.port : port;
      console.log(`Ollama auth proxy listening on 127.0.0.1:${activePort}; upstream is 127.0.0.1:${OLLAMA_PORT}.`);
      resolveServer(server);
    });
  });
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    void startOllamaAuthProxy().catch(() => {
      console.error("Ollama auth proxy could not start. Check its local configuration.");
      process.exitCode = 1;
    });
  } catch {
    console.error("Ollama auth proxy could not start. Check its local configuration.");
    process.exitCode = 1;
  }
}
