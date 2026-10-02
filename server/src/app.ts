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

if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy", service: "EduReach Server", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use(errorHandler);

export default app;