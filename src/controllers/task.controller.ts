import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import type { AccessTokenSubject } from '../models/auth.js';
import {
  completeTask,
  createTask,
  deleteTask,
  findTaskById,
  listTasks,
  updateTask
} from '../services/task.service.js';

const getAuth = (res: Response): AccessTokenSubject => {
  const auth = res.locals.auth;
  if (!auth) {
    throw new AppError('No existe una identidad autenticada en la solicitud.', 401, 'AUTHENTICATION_REQUIRED');
  }
  return auth;
};

export const getTasks = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json(await listTasks(res.locals.taskQuery, getAuth(res)));
};

export const getTask = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ data: await findTaskById(res.locals.taskId, getAuth(res)) });
};

export const postTask = async (_req: Request, res: Response): Promise<void> => {
  const auth = getAuth(res);
  const task = await createTask(res.locals.taskTitle, auth.userId);
  res.status(201).json({ data: task });
};

export const patchTaskComplete = async (_req: Request, res: Response): Promise<void> => {
  const task = await completeTask(res.locals.taskId, getAuth(res));
  res.status(200).json({ data: task });
};

export const patchTask = async (_req: Request, res: Response): Promise<void> => {
  const task = await updateTask(res.locals.taskId, res.locals.taskUpdate, getAuth(res));
  res.status(200).json({ data: task });
};

export const removeTask = async (_req: Request, res: Response): Promise<void> => {
  await deleteTask(res.locals.taskId, getAuth(res));
  res.status(204).send();
};