import type { Request, Response } from "express";
import { checkDatabaseHealth } from "../services/databse.service.js";
export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({ data: { status: "up" } });
};
export const getDatabaseHealth = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const database = await checkDatabaseHealth();
  res.status(200).json({ data: { database } });
};
