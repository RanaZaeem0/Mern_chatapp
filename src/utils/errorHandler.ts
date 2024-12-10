import { Request, Response, NextFunction } from "express";
import { ApiError } from "./apiError";

const errorHandler = (err: ApiError | Error, req: Request, res: Response, next: NextFunction) => {
  // Check if the error is an instance of ApiError
  if (err instanceof ApiError) {
    const response = err.toResponse();
    return res.status(err.statusCode).json(response);
  }

  // Handle unexpected errors
  res.status(500).json({
    statusCode: 500,
    message: process.env.NODE_ENV === "PRODUCTION" ? "Internal Server Error" : err.message,
    success: false,
    ...(process.env.NODE_ENV !== "PRODUCTION" && { stack: err.stack }), // Include stack trace only in development
  });
};

export default errorHandler;
