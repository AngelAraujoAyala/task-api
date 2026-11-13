import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { TaskModel } from '../models/task.js';
import { findUserDocumentByEmail } from '../repositories/user.repository.js';

const run = async (): Promise<void> => {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error('Uso: pnpm task:backfill <correo>');
  }

  await connectDatabase({
    uri: env.MONGODB_URI,
    dbName: env.MONGODB_DB_NAME
  });

  const user = await findUserDocumentByEmail(email);
  if (!user) throw new Error(`No existe un usuario con el correo ${email}.`);

  const result = await TaskModel.updateMany(
    { $or: [{ userId: { $exists: false } }, { userId: null }] },
    { $set: { userId: user._id } }
  );

  console.log(
    `Backfill completado: ${result.modifiedCount} tarea(s) asignada(s) a ${user.email}.`
  );
};

try {
  await run();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Error desconocido.';
  console.error(`No fue posible asignar las tareas. ${message}`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
