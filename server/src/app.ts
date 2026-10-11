import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.ts";
import chatRoutes from "./routes/chat.routes.ts";
import errorHandler from "./middleware/error-handler.middleware.ts";

const app: Application = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

if (process.env.CLIENT_URL) {
  const customOrigins = process.env.CLIENT_URL.split(",").map((o) => o.trim()).filter(Boolean);
  for (const origin of customOrigins) {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  }
}

// Regex to match localhost and RFC 1918 private network IPs on any port:
// - localhost & 127.0.0.1
// - 10.0.0.0/8
// - 172.16.0.0/12 (e.g. 172.18.113.77)
// - 192.168.0.0/16
const PRIVATE_NETWORK_ORIGIN_REGEX =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?$/;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, health checks, server-to-server)
      // or origins in allowed list, or any private/local network origin
      if (!origin || allowedOrigins.includes(origin) || PRIVATE_NETWORK_ORIGIN_REGEX.test(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    optionsSuccessStatus: 204,
  }),
);

// Development & diagnosis request tracing middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  const origin = req.headers.origin || "no-origin";
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms) [Origin: ${origin}]`);
  });
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const healthCheck = (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy", service: "EduReach Server", timestamp: new Date().toISOString() });
};

app.get("/api/health", healthCheck);
app.get("/health", healthCheck);
app.get("/", healthCheck);


app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use(errorHandler);

export default app;