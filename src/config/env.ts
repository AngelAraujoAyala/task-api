import dotenv from 'dotenv';
dotenv.config();

export const getAppName = (): string =>
  process.env.APP_NAME?.trim() || 'Task Manager Backend';

export const getNodeEnv = (): string =>
  process.env.NODE_ENV?.trim() || 'development';