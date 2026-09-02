import {
  createTask,
  completeTask,
  deleteTask,
  listTasks,
  listPendingTasks,
  findTaskById
} from './services/task.service.js';
import { delay } from './utils/delay.js';
import { getAppName, getNodeEnv } from './config/env.js';

const showTasks = (title: string, taskList = listTasks()): void => {
  console.log(`\n--- ${title} ---`);
  const rows = taskList.map((task) => ({
    ID: task.id,
    Título: task.title,
    Estado: task.status,
    'Fecha de Creación': task.createdAt.toLocaleString()
  }));
  console.table(rows);
};

const main = async (): Promise<void> => {
  console.log(`====================================`);
  console.log(` ${getAppName()} (${getNodeEnv()})`);
  console.log(`====================================`);

  console.log('Iniciando servicios y cargando datos...');
  await delay(400);

  showTasks('Tareas Iniciales');

  // 1. Crear Tarea
  const newTask = createTask('Construir mi primer servicio con TS');
  console.log(`✔ Tarea creada con éxito: [${newTask.id}] "${newTask.title}"`);

  // 2. Buscar Tarea por ID
  const foundTask = findTaskById(newTask.id);
  if (foundTask) {
    console.log(`🔍 Tarea encontrada por ID ${foundTask.id}: ${foundTask.title}`);
  }

  // 3. Completar Tarea
  completeTask(newTask.id);
  console.log(`✔ Tarea ID ${newTask.id} marcada como completada.`);

  // 4. Filtrar pendientes (Desafío)
  showTasks('Tareas Pendientes', listPendingTasks());

  // 5. Eliminar Tarea (Desafío)
  const deleted = deleteTask(1);
  console.log(`🗑️ Tarea ID ${deleted.id} eliminada correctamente.`);

  showTasks('Estado Final de Tareas');

  // 6. Manejo de Errores Controlados
  console.log('\n--- Probando Control de Errores ---');
  try {
    console.log('Intentando crear tarea vacía...');
    createTask('   ');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error esperado: ${error.message}`);
    }
  }

  try {
    console.log('Intentando completar tarea inexistente (ID: 999)...');
    completeTask(999);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error esperado: ${error.message}`);
    }
  }

  try {
    console.log('Intentando eliminar tarea inexistente (ID: 999)...');
    deleteTask(999);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error esperado: ${error.message}`);
    }
  }
};

main().catch((error) => {
  console.error('💥 Error no controlado en la aplicación:', error);
  process.exitCode = 1;
});