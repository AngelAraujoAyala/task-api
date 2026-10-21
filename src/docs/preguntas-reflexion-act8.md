# Reflexión: consultas de tareas

## 1. ¿Qué responsabilidad nueva cumple `task.repository.ts`?

Concentra todo el acceso a Mongoose y MongoDB. Traduce un `TaskListQuery` ya validado a un filtro (`buildFilter`), un orden (`buildSort`), un `skip` y un `limit`, y ejecuta `find` y `countDocuments`. También convierte los errores técnicos de Mongoose en `AppError` seguros (por ejemplo, `503 DATABASE_UNAVAILABLE`). Gracias a esto, `task.service.ts` ya no importa `TaskModel` y no sabe qué base de datos hay detrás.

## 2. ¿Por qué el middleware debe validar `req.query` antes del controlador?

Porque los parámetros de la URL vienen del cliente y no son confiables: pueden ser texto, arreglos (`?page=1&page=2`) o valores inesperados. El middleware `validateTaskQuery` rechaza parámetros desconocidos o repetidos, comprueba los rangos y entrega un `TaskListQuery` limpio en `res.locals.taskQuery`. Si no se validara ahí, una URL como `?page=abc` llegaría al repositorio y causaría un error 500 o 503 en lugar de un 422 claro. Además, el controlador queda libre de interpretar cadenas.

## 3. ¿Cómo se calcula `skip` para una página determinada?

Con la fórmula `skip = (page - 1) × limit`. Por ejemplo, con `page=3` y `limit=5`, `skip = (3 - 1) × 5 = 10`. MongoDB salta los primeros 10 documentos y devuelve los siguientes 5. En el proyecto, el repositorio lo calcula como `(query.page - 1) * query.limit`.

## 4. ¿Por qué `find` y `countDocuments` deben usar el mismo filtro?

`find` devuelve los documentos de la página y `countDocuments` calcula `meta.total`. Si usaran filtros distintos, el total no correspondería a los datos. Por ejemplo, con `?status=completed` mi colección devuelve 2 tareas, pero si `countDocuments` no recibiera el filtro, `meta.total` diría 5 y `totalPages` sería incorrecto. Por eso en el repositorio construyo `filter` una sola vez y se lo paso a ambas consultas.

## 5. ¿Qué problema evita `escapeRegex`?

Evita que el texto que escribe el usuario se interprete como un patrón de expresión regular. Sin escapar, `?search=.*` significaría "cualquier texto" y devolvería toda la colección. Con `escapeRegex`, los caracteres especiales (`. * + ? ^ $ { } ( ) | [ ] \`) se convierten en texto literal, así que `.*` busca exactamente esos dos caracteres y no encuentra nada. También evita expresiones costosas que podrían afectar el rendimiento.

## 6. ¿Por qué `sortBy` utiliza una lista permitida?

Porque el valor de `sortBy` se usa como nombre de campo en el `sort` de Mongoose. Si aceptara cualquier cadena, el cliente podría ordenar por campos que no existen o que no deberían exponerse. La lista cerrada (`createdAt`, `updatedAt`, `title`, `status`) en `TASK_SORT_FIELDS` y la función `isTaskSortField` garantizan que solo lleguen valores autorizados. Si envío `sortBy=priority`, la API responde `422 QUERY_VALIDATION_ERROR`.

## 7. ¿Qué diferencia existe entre `data.length`, `meta.total` y `meta.totalPages`?

- `data.length`: cuántas tareas trae **esta página**.
- `meta.total`: cuántas tareas cumplen la consulta (con filtros) en **toda la colección**.
- `meta.totalPages`: en cuántas páginas se divide ese total, calculado como `Math.ceil(total / limit)`.

Ejemplo con mis datos: con `limit=2` y 5 tareas, la primera página tiene `data.length = 2`, `total = 5` y `totalPages = 3`. La tercera página tiene `data.length = 1`.

## 8. ¿Cómo llega un error asíncrono del repositorio al `errorHandler` de Express 5?

Cuando Mongoose falla, la función `execute` del repositorio captura el error y lanza un `AppError` mediante `mapPersistenceError`. Esa excepción rechaza la promesa de `findTaskDocuments`, luego la de `listTasks` en el servicio y, por último, la del controlador `getTasks`. Como el controlador no tiene `try/catch`, Express 5 detecta que el handler `async` devolvió una promesa rechazada y la envía automáticamente al `errorHandler` registrado al final de `app.ts`. Ese manejador genera la respuesta JSON con `code`, `message` y `requestId`. En Express 4 esto no ocurría y había que llamar a `next(error)` manualmente.

## 9. ¿Qué prueba demuestra que A8 no rompió el CRUD de A7?

La prueba de regresión completa del paso 22, ejecutada en Postman sobre la misma colección `tasks`:

- `POST /api/tasks` responde 201.
- `GET /api/tasks/:id` responde 200.
- `PATCH /api/tasks/:id` responde 200.
- `PATCH /api/tasks/:id/complete` responde 200.
- `DELETE /api/tasks/:id` responde 204 sin cuerpo.
- Consultar el id eliminado responde 404 `TASK_NOT_FOUND`.
- Un id inválido responde 400.

Además, verifico que las respuestas no incluyan `_id` ni `__v`, que los errores conserven `requestId` y que los datos persistan después de reiniciar la API.

## 10. ¿Qué limitación tiene la paginación basada en `skip` cuando la colección crece mucho?

MongoDB no salta directamente a la posición indicada: tiene que recorrer y descartar todos los documentos anteriores. Con `page=100000` y `limit=50`, debe procesar cinco millones de documentos para devolver solo 50, y el tiempo de respuesta crece con cada página. Además, si se insertan o eliminan documentos mientras el usuario navega, puede ver elementos repetidos u omitidos. Una alternativa para colecciones grandes es la paginación por cursor, que usa el último `_id` (o valor de orden) visto como punto de partida en lugar de `skip`.
