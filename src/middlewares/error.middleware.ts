import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const requestId: string | undefined = res.locals.requestId;

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
      },
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    res
      .status(400)
      .json({
        error: {
          code: "INVALID_JSON",
          message: "El cuerpo contiene JSON inválido.",
          requestId,
        },
      });
    return;
  }

  console.error({ requestId, error });
  res
    .status(500)
    .json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Ocurrió un error interno.",
        requestId,
      },
    });
};
