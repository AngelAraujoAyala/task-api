import type { HydratedDocument } from 'mongoose';
import { AppError } from '../errors/app-error.js';
import type { AccessTokenSubject } from '../models/auth.js';
import {
  type Task,
  type TaskPersistence,
  type TaskUpdate
} from '../models/task.js';
import {
  createTaskDocument,
  deleteTaskDocument,
  findTaskDocumentById,
  findTaskDocuments,
  updateTaskDocument
} from '../repositories/task.repository.js';
import type { TaskListQuery, TaskListResult } from '../models/task-query.js';

const toTask = (document: HydratedDocument<TaskPersistence>): Task => ({
  id: document._id.toString(),
  title: document.title,
  status: document.status,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt
});

const ownerScope = (auth: AccessTokenSubject): string | undefined =>
  auth.role === 'admin' ? undefined : auth.userId;

export const listTasks = async (
  query: TaskListQuery,
  auth: AccessTokenSubject
): Promise<TaskListResult> => {
  const { documents, total } = await findTaskDocuments(query, ownerScope(auth));
  const totalPages = Math.ceil(total / query.limit);
  return {
    data: documents.map(toTask),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1 && totalPages > 0
    }
  };
};

export const findTaskById = async (
  id: string,
  auth: AccessTokenSubject
): Promise<Task> => {
  const document = await findTaskDocumentById(id, ownerScope(auth));
  if (!document) {
    throw new AppError(`No existe una tarea con el id ${id}.`, 404, 'TASK_NOT_FOUND');
  }
  return toTask(document);
};

export const createTask = async (title: string, userId: string): Promise<Task> => {
  const document = await createTaskDocument(title, userId);
  return toTask(document);
};

export const updateTask = async (
  id: string,
  changes: TaskUpdate,
  auth: AccessTokenSubject
): Promise<Task> => {
  const document = await updateTaskDocument(id, changes, ownerScope(auth));
  if (!document) {
    throw new AppError(`No existe una tarea con el id ${id}.`, 404, 'TASK_NOT_FOUND');
  }
  return toTask(document);
};

export const completeTask = async (
  id: string,
  auth: AccessTokenSubject
): Promise<Task> => updateTask(id, { status: 'completed' }, auth);

export const deleteTask = async (
  id: string,
  auth: AccessTokenSubject
): Promise<void> => {
  const document = await deleteTaskDocument(id, ownerScope(auth));
  if (!document) {
    throw new AppError(`No existe una tarea con el id ${id}.`, 404, 'TASK_NOT_FOUND');
  }
};