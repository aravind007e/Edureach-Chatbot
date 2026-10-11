import type { Request, Response, NextFunction } from "express";

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.error("[ERROR]", err.message || err);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      message: messages.join(", ") || "Validation failed.",
    });
    return;
  }

  if (err.code === 11000) {
    res.status(409).json({
      success: false,
      message: "An account with this email already exists.",
    });
    return;
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
};

export default errorHandler;