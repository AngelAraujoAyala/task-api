# Reflexión: CRUD persistente con Express y MongoDB

## 1. ¿Qué operación de Mongoose corresponde a cada letra de CRUD?

- **Create:** `TaskModel.create()`, usada en `createTask`.
- **Read:** `TaskModel.find()` y `TaskModel.findById()`, usadas en `listTasks` y `findTaskById`.
- **Update:** `TaskModel.findByIdAndUpdate()`, usada en `updateTask`.
- **Delete:** `TaskModel.findByIdAndDelete()`, usada en `deleteTask`.

## 2. ¿Por qué se usa PATCH y no un reemplazo completo del documento?

Porque el cliente puede enviar solo el campo que quiere cambiar, por ejemplo `{"status":"completed"}`, sin tener que reenviar el título ni el resto del documento. Un reemplazo completo obligaría a enviar todos los campos y borraría los que se omitan.

## 3. ¿Qué problema evita $set?

Evita sobrescribir el documento completo. `$set` modifica únicamente los campos incluidos en el objeto de cambios, así que si solo envío `title`, el `status` conserva su valor anterior.

## 4. ¿Qué efecto tienen new true y runValidators true?

- `new: true` hace que Mongoose devuelva el documento **después** de actualizarse; sin esto devolvería la versión anterior.
- `runValidators: true` aplica las reglas del esquema (`enum`, `maxlength`, `required`) durante la actualización, ya que por defecto Mongoose no las valida en `findByIdAndUpdate`.

## 5. ¿Por qué un cuerpo vacío debe rechazarse?

Porque `{}` no expresa ningún cambio. Aceptarlo ejecutaría una actualización sin sentido y respondería 200 como si algo hubiera cambiado. Se rechaza con 422 `VALIDATION_ERROR`.

## 6. ¿Qué diferencia existe entre INVALID_ID y TASK_NOT_FOUND?

- `INVALID_ID` (400): el identificador tiene un formato incorrecto y no es un ObjectId válido, por ejemplo `/api/tasks/1`.
- `TASK_NOT_FOUND` (404): el formato es válido, pero no existe ningún documento con ese id en la colección.

## 7. ¿Qué responsabilidad cumple validateTaskUpdate y cuál cumple TaskModel?

- `validateTaskUpdate` valida la **forma de la solicitud HTTP**: que el cuerpo sea un objeto JSON, que no esté vacío, que no tenga campos no permitidos y que `title` y `status` sean correctos. Así rechaza los errores antes de consultar MongoDB.
- `TaskModel` es la **segunda barrera**: aplica las reglas de los datos (`enum`, `maxlength`, `required`) a cualquier operación que llegue a Mongoose.

## 8. ¿Cómo llega un error de updateTask al errorHandler de Express 5?

`updateTask` lanza un `AppError` y su promesa se rechaza. Como `patchTask` es una función `async` que hace `await updateTask(...)`, Express 5 detecta la promesa rechazada, omite los middlewares normales y entrega el error al `errorHandler`, que responde con `code`, `message`, `details` y `requestId`. No hace falta `try/catch` en el controlador.

## 9. ¿Por qué DELETE responde 204 sin cuerpo?

Porque el código 204 significa "operación exitosa, sin contenido que devolver". El recurso ya no existe, así que no hay nada que enviar en el cuerpo. Por eso se usa `res.status(204).send()` y no `json()`.

## 10. ¿Qué prueba demuestra que el CRUD es persistente y no solo funcional en memoria?

Crear una tarea, cambiar su título, detener la API con Ctrl+C, reiniciarla con `pnpm dev` y consultar `GET /api/tasks/:id`. Si el título actualizado sigue ahí, los datos viven en MongoDB Atlas y no en la memoria del proceso de Node.js.
