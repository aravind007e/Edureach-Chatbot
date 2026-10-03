import type { Request, Response } from "express";
import app from "../src/app.ts";
import connectDB from "../src/config/database.config.ts";

export default async function handler(req: Request, res: Response): Promise<void> {
  await connectDB();
  return app(req, res);
}
