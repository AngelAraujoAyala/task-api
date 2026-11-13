import mongoose, {
  type FilterQuery,
  type HydratedDocument,
  type SortOrder
} from 'mongoose';
import { AppError } from '../errors/app-error.js';
import {
  TaskModel,
  type TaskPersistence,
  type TaskUpdate
} from '../models/task.js';
import type { TaskListQuery } from '../models/task-query.js';

type TaskDocument = HydratedDocument<TaskPersistence>;

export interface TaskPageDocuments {
  documents: TaskDocument[];
  total: number;
}

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ownerFilter = (ownerId?: string): FilterQuery<TaskPersistence> =>
  ownerId === undefined
    ? {}
    : { userId: ownerId as unknown as TaskPersistence['userId'] };

const buildFilter = (
  query: TaskListQuery,
  ownerId?: string
): FilterQuery<TaskPersistence> => {
  const filter: FilterQuery<TaskPersistence> = { ...ownerFilter(ownerId) };
  if (query.status !== undefined) filter.status = query.status;
  if (query.search !== undefined) {
    filter.title = { $regex: new RegExp(escapeRegex(query.search), 'i') };
  }
  return filter;
};

const buildSort = (query: TaskListQuery): Record<string, SortOrder> => {
  const direction: SortOrder = query.order === 'asc' ? 1 : -1;
  return { [query.sortBy]: direction, _id: direction };
};

const mapPersistenceError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message
    }));
    return new AppError(
      'La tarea no cumple las reglas del modelo.',
      422,
      'PERSISTENCE_VALIDATION_ERROR',
      details
    );
  }
  return new AppError(
    'No fue posible acceder al almacenamiento de tareas.',
    503,
    'DATABASE_UNAVAILABLE'
  );
};

const execute = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error: unknown) {
    throw mapPersistenceError(error);
  }
};

export const findTaskDocuments = async (
  query: TaskListQuery,
  ownerId?: string
): Promise<TaskPageDocuments> => execute(async () => {
  const filter = buildFilter(query, ownerId);
  const skip = (query.page - 1) * query.limit;
  const [documents, total] = await Promise.all([
    TaskModel.find(filter)
      .sort(buildSort(query))
      .skip(skip)
      .limit(query.limit),
    TaskModel.countDocuments(filter)
  ]);
  return { documents, total };
});

export const findTaskDocumentById = async (
  id: string,
  ownerId?: string
): Promise<TaskDocument | null> => execute(async () =>
  TaskModel.findOne({ _id: id, ...ownerFilter(ownerId) })
);

export const createTaskDocument = async (
  title: string,
  userId: string
): Promise<TaskDocument> => execute(async () =>
  TaskModel.create({ title, status: 'pending', userId })
);

export const updateTaskDocument = async (
  id: string,
  changes: TaskUpdate,
  ownerId?: string
): Promise<TaskDocument | null> => execute(async () =>
  TaskModel.findOneAndUpdate(
    { _id: id, ...ownerFilter(ownerId) },
    { $set: changes },
    { new: true, runValidators: true }
  )
);

export const deleteTaskDocument = async (
  id: string,
  ownerId?: string
): Promise<TaskDocument | null> => execute(async () =>
  TaskModel.findOneAndDelete({ _id: id, ...ownerFilter(ownerId) })
);