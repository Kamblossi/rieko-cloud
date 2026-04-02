import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: "Not Found",
    message: `No route found for ${req.method} ${req.originalUrl}`,
    requestId: req.requestId
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Bad Request",
      message: "Request validation failed",
      issues: err.issues,
      requestId: req.requestId
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Unexpected internal error";
  res.status(500).json({
    error: "Internal Server Error",
    message,
    requestId: req.requestId
  });
}
