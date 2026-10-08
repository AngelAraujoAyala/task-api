import { Router } from "express";
import { validateTaskId } from "../middlewares/validate-task-id.middleware.js";
import { validateTaskTitle } from "../middlewares/validate-task-title.middleware.js";
import { requireJson } from "../middlewares/require-json.middleware.js";
import { validateCompletion } from "../middlewares/validate-completion.middleware.js";
import { patchTaskStatus } from "../controllers/task.controller.js";
import { validateTaskDescription } from "../middlewares/validate-task-description.middleware.js";
import {
  getTask,
  getTasks,
  patchTaskComplete,
  patchTaskTitle,
  postTask,
  removeTask,
} from "../controllers/task.controller.js";

export const taskRouter = Router();

taskRouter.param("id", validateTaskId);

taskRouter.get("/", getTasks);
taskRouter.get("/:id", getTask);
taskRouter.post(
  "/",
  requireJson,
  validateTaskTitle,
  validateTaskDescription,
  postTask,
);
taskRouter.patch("/:id", requireJson, validateTaskTitle, patchTaskTitle);
taskRouter.patch("/:id/complete", patchTaskComplete);
taskRouter.patch("/:id/status", requireJson, validateCompletion, patchTaskStatus);
taskRouter.delete("/:id", removeTask);
