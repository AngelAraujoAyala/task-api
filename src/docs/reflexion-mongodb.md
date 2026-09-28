# Reflexión: MongoDB Atlas y conexión segura desde Express

## 1. ¿Qué diferencia existe entre tu cuenta de Atlas y el usuario de base de datos?

Mi cuenta de Atlas sirve para administrar la plataforma: crear proyectos, clústeres y reglas de red. El usuario de base de datos (`task_api_user`) es la cuenta que usa la API para leer y escribir datos, y solo tiene permiso `readWrite` sobre `task_api`. Si se filtra el usuario de base de datos, el daño es limitado, mientras que mi cuenta de Atlas controlaría todo.

## 2. ¿Por qué `MONGODB_URI` se considera un secreto aunque el repositorio sea privado?

Porque contiene el usuario, la contraseña y el host del clúster. Un repositorio privado puede compartirse, clonarse o hacerse público por error, y el historial de Git conserva el secreto aunque se borre el archivo después. Por eso va en `.env`, que está en `.gitignore`.

## 3. ¿Qué riesgo introduce permitir `0.0.0.0/0` en la lista de acceso?

Permite conexiones desde cualquier IP del mundo. La contraseña pasaría a ser la única defensa, y si se filtra o es débil, cualquiera podría entrar a la base de datos.

## 4. ¿Por qué la API espera `connectDatabase` antes de ejecutar `app.listen`?

Para no aceptar solicitudes si no puede usar su base de datos. Si abriera el puerto primero, la API parecería sana pero fallaría al usar MongoDB. Así, cuando falla la conexión, el puerto no se abre y el problema se detecta de inmediato.

## 5. ¿Qué comprueba `readyState` y qué añade el comando `ping`?

`readyState` indica si Mongoose cree que está conectado (el valor 1 significa conectado), pero es un estado local. `ping` envía una operación real al servidor y confirma que MongoDB responde en ese momento.

## 6. ¿Por qué una falla de MongoDB corresponde a infraestructura y no a validación HTTP?

Porque el cliente no hizo nada mal: su solicitud era válida, pero una dependencia del servidor no está disponible. Las validaciones HTTP revisan datos que envía el cliente (Content-Type, id, title). Por eso el error es un 503 `DATABASE_UNAVAILABLE` y no un 400 o un 422.

## 7. ¿Cómo llega un `AppError` lanzado por `getDatabaseHealth` al manejador central en Express 5?

`getDatabaseHealth` es `async`, así que un error lanzado dentro de ella rechaza su promesa. Express 5 detecta esa promesa rechazada y pasa el error automáticamente a `errorHandler`, sin necesidad de `try/catch` ni de llamar a `next(error)`. Ese manejador lo convierte en una respuesta JSON uniforme con estado 503 y `requestId`.

## 8. ¿Qué pruebas demuestran que la incorporación de Atlas no rompió la API anterior?

Las pruebas de regresión en Postman: `GET /api/tasks` (200), `POST` (201), `GET` por id (200), `PATCH /api/tasks/:id/complete` (200), `DELETE` (204) y una consulta final (404). También las negativas heredadas: `INVALID_ID`, `TASK_NOT_FOUND`, `UNSUPPORTED_MEDIA_TYPE`, `VALIDATION_ERROR` y `ROUTE_NOT_FOUND`, todas con el mismo formato de error. Además, `git diff` no muestra cambios en el CRUD, las validaciones ni el modelo.

## 9. ¿Por qué el arreglo en memoria se conserva todavía en esta actividad?

Porque esta actividad solo prepara la infraestructura: configuración, conexión segura y diagnóstico. Cambiar ya `Task` y `task.service.ts` mezclaría este objetivo con el de la siguiente actividad (esquemas y modelos). Además, el arreglo permite comprobar que el CRUD anterior sigue funcionando, y la persistencia real se hará en EC2 F2 A6 y A7.

## 10. ¿Qué información debe ocultarse al cliente cuando ocurre un error de conexión?

La URI, la contraseña, el usuario, el nombre del host, el stack trace y el objeto de error original de Mongoose. Con esos datos un atacante conocería la infraestructura y podría aprovecharlos. El cliente solo recibe un mensaje genérico ("La base de datos no está disponible.") con el código `DATABASE_UNAVAILABLE`.
