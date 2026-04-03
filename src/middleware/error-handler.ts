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

  if (err instanceof Error) {
    const statusCode =
      typeof (err as unknown as { statusCode?: unknown }).statusCode === "number"
        ? (err as unknown as { statusCode: number }).statusCode
        : 500;
    const reason =
      typeof (err as unknown as { reason?: unknown }).reason === "string"
        ? (err as unknown as { reason: string }).reason
        : undefined;

    res.status(statusCode).json({
      error: reason ?? (statusCode >= 500 ? "Internal Server Error" : err.name),
      message: err.message,
      requestId: req.requestId
    });
    return;
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: "Unexpected internal error",
    requestId: req.requestId
  });
}
