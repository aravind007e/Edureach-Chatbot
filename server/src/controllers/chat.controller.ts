import type { Request, Response, NextFunction } from "express";
import { getRAGResponse } from "../services/rag.service.ts";

// POST /api/chat/message
export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, mode } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ success: false, message: "Message is required." });
      return;
    }

    const queryMode: "text" | "voice" = mode === "voice" ? "voice" : "text";
    const result = await getRAGResponse(message.trim(), queryMode);

    res.json({
      success: true,
      data: {
        message: result.answer,
        sources: result.sources,
        intent: result.intent,
        timingMs: result.timingMs,
      },
    });
  } catch (error) { next(error); }
};