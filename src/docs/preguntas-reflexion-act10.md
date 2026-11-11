## Preguntas de cierre

### 1. ¿Por qué un token decodificable no necesariamente es un token válido?

Decodificar solo lee el contenido del token (está en Base64URL, no cifrado), así que cualquiera puede fabricar uno con el rol que quiera. Un token es válido solo si `verifyAccessToken` comprueba la firma con `JWT_SECRET`, además de la expiración, el emisor y la audiencia.

### 2. ¿Cuándo corresponde responder 401 y cuándo 403?

Se responde 401 cuando no hay una autenticación válida: falta el token, el encabezado está mal formado o el token no se verifica. Se responde 403 cuando la identidad es válida pero su rol no permite la operación, por ejemplo un `user` que intenta hacer `DELETE`.

### 3. ¿Por qué CORS no sustituye la autenticación?

CORS lo aplica el navegador y solo decide si el JavaScript de otro origen puede leer la respuesta. No impide que `curl`, Postman o un script de servidor envíen solicitudes. Solo la autenticación comprueba quién llama.

### 4. ¿Qué riesgo existe si DELETE se registra antes de requireRole?

Express ejecuta los handlers en orden, así que `removeTask` correría antes de comprobar el rol y un `user` podría borrar tareas. Es un fallo de autorización causado por el orden de los middleware.

### 5. ¿Por qué debes iniciar sesión después de cambiar el rol en MongoDB?

El JWT lleva el rol firmado al momento del login y `requireRole` lee el rol del token, no de MongoDB. Cambiar el rol en la base no modifica los tokens ya emitidos, así que el token viejo conserva `role=user` hasta expirar. Un nuevo login emite un token con `role=admin`.

### 6. ¿Cómo llega un error asíncrono de authenticate al errorHandler en Express 5?

`authenticate` es `async` y devuelve una promesa. Si se lanza un `AppError` o `verifyAccessToken` rechaza, la promesa se rechaza y Express 5 la envía automáticamente a `next(error)`, que lleva al `errorHandler`. Por eso no se necesita `try/catch` ni llamar `next` manualmente.

### 7. ¿Qué limitación tiene el almacén en memoria del rate limiter al escalar la API?

El contador vive en la memoria de cada proceso. Con varias instancias, cada una cuenta por separado y el límite real se multiplica por el número de instancias. Además, el contador se pierde al reiniciar. En despliegue se necesita un almacén compartido, como Redis.

### 8. ¿Qué cambios requeriría autorizar por propietario de la tarea?

Hay que agregar `userId` al modelo `Task`, migrar las tareas existentes, guardar el `userId` de `res.locals.auth` al crear, filtrar por `userId` en el repositorio (listar, consultar, modificar y eliminar) y definir qué puede hacer `admin`. Hoy la autorización es solo por rol.

## Reflexión

[Escribe aquí un error que te ayudó a entender mejor el flujo.]
