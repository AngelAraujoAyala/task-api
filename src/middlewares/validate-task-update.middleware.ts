import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import {
  TASK_STATUSES,
  type TaskStatus,
  type TaskUpdate
} from '../models/task.js';
import { FieldIssue } from '../data/api-error.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTaskStatus = (value: unknown): value is TaskStatus =>
  typeof value === 'string'
  && TASK_STATUSES.some((status) => status === value);

export const validateTaskUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const body: unknown = req.body;

  if (!isRecord(body)) {
    next(new AppError(
      'La solicitud contiene datos inválidos.',
      422,
      'VALIDATION_ERROR',
      [{ field: 'body', message: 'Debe ser un objeto JSON.' }]
    ));
    return;
  }

  const issues: FieldIssue[] = [];
  const update: TaskUpdate = {};
  const fields = Object.keys(body);

  if (fields.length === 0) {
    issues.push({
      field: 'body',
      message: 'Incluye al menos title o status.'
    });
  }

  for (const field of fields) {
    if (field !== 'title' && field !== 'status') {
      issues.push({ field, message: 'El campo no está permitido.' });
    }
  }

  if ('title' in body) {
    const title = body.title;
    if (typeof title !== 'string' || !title.trim()) {
      issues.push({ field: 'title', message: 'Debe ser texto no vacío.' });
    } else if (title.trim().length > 120) {
      issues.push({ field: 'title', message: 'No debe superar 120 caracteres.' });
    } else {
      update.title = title.trim();
    }
  }

  if ('status' in body) {
    if (!isTaskStatus(body.status)) {
      issues.push({
        field: 'status',
        message: 'Debe ser pending o completed.'
      });
    } else {
      update.status = body.status;
    }
  }

  if (issues.length > 0) {
    next(new AppError(
      'La solicitud contiene datos inválidos.',
      422,
      'VALIDATION_ERROR',
      issues
    ));
    return;
  }

  res.locals.taskUpdate = update;
  next();
};