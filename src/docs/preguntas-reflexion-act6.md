1. ¿Qué diferencia existe entre un documento, un esquema y un modelo?
El documento es el registro guardado en Atlas (una tarea con _id, title, status). El esquema define las reglas que debe cumplir (title obligatorio, máximo 120 caracteres). El modelo (TaskModel) es la herramienta que usa el servicio para crear y consultar documentos de la colección tasks.

2. ¿Por qué la API devuelve id en lugar de _id?
Para no exponer la estructura interna de MongoDB y dar una respuesta clara al cliente. La función toTask convierte el ObjectId de _id en un id de tipo string.

3. ¿Qué problema evita migrar todas las operaciones a una sola fuente de datos?
Evita tener dos fuentes de verdad. Si POST y GET usaran Atlas pero PATCH y DELETE el arreglo en memoria, una tarea creada no podría completarse ni eliminarse de forma confiable.

4. ¿Qué reglas aplica el middleware y cuáles repite el esquema?
El middleware valida la entrada HTTP antes de llegar al servicio: title no vacío y de máximo 120 caracteres, formato de ObjectId en el id, y en mi desafío description de máximo 300. El esquema repite los límites de longitud y el obligatorio de title, y protege la base aunque otro código use TaskModel directamente.

5. ¿Qué diferencia existe entre INVALID_ID y TASK_NOT_FOUND?
INVALID_ID (400) significa que el id de la URL no tiene formato de ObjectId (por ejemplo /api/tasks/1) y lo rechaza el middleware. TASK_NOT_FOUND (404) significa que el formato es válido, pero no existe una tarea con ese id, y lo decide el servicio.

6. ¿Qué hacen timestamps y versionKey: false?
timestamps: true hace que Mongoose agregue y actualice createdAt y updatedAt automáticamente. versionKey: false evita el campo __v, porque la API todavía no usa control de versiones de documentos.

7. ¿Por qué los controladores deben usar async y await?
Porque las operaciones de Mongoose devuelven promesas. Sin await, la respuesta se enviaría antes de tener el resultado y contendría una Promise en lugar de los datos.

8. ¿Cómo llega un AppError asíncrono al errorHandler de Express 5?
En Express 5, si una función asíncrona lanza un error o su promesa es rechazada, Express lo captura y lo pasa automáticamente al manejador de errores registrado al final de app.ts. No hace falta try/catch ni next(error) en el controlador.

9. ¿Qué prueba demuestra realmente que una tarea es persistente?
Reiniciar la API y volver a consultar la tarea. Reiniciar Node.js borra los datos en memoria, pero no los de Atlas, así que si GET /api/tasks/{{taskId}} la sigue encontrando, los datos están en la base.

10. ¿Qué información de Mongoose o Atlas nunca debe aparecer en la respuesta HTTP?
La URI de conexión, el usuario y la contraseña, los nombres de servidores o clústeres, los stack traces, los objetos completos de Mongoose y los mensajes de errores desconocidos. Por eso mapPersistenceError devuelve un mensaje genérico con DATABASE_UNAVAILABLE.