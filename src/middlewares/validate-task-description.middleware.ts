import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";

const MAX_DESCRIPTION_LENGTH = 300;

export const validateTaskDescription = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const description: unknown = req.body?.description;

  if (description === undefined) {
    res.locals.taskDescription = undefined;
    next();
    return;
  }

  if (typeof description !== "string") {
    next(
      new AppError(
        "La solicitud contiene datos inválidos.",
        422,
        "VALIDATION_ERROR",
        [{ field: "description", message: "Debe ser texto." }],
      ),
    );
    return;
  }

  const trimmed = description.trim();

  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    next(
      new AppError(
        "La solicitud contiene datos inválidos.",
        422,
        "VALIDATION_ERROR",
        [
          {
            field: "description",
            message: `No debe superar ${MAX_DESCRIPTION_LENGTH} caracteres.`,
          },
        ],
      ),
    );
    return;
  }

  // Una descripción vacía o solo con espacios se trata como "sin descripción".
  res.locals.taskDescription = trimmed === "" ? undefined : trimmed;
  next();
};