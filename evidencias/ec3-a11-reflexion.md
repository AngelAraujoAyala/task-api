# Reflexión EC3 F2 A11

## 1. ¿Qué parte de la aplicación se reemplaza con dobles en api.test.ts y qué parte sigue siendo real?

Se reemplazan los servicios de negocio: `auth.service` (`registerUser`, `loginUser`, `getAuthenticatedUser`) y
`task.service` (`listTasks`, `findTaskById`, `createTask`, `updateTask`, `completeTask`, `deleteTask`) mediante
`vi.mock`. Sigue siendo real todo lo que forma la frontera HTTP: `app`, las rutas, los middleware
(`requestContext`, Helmet, CORS, `authenticate`, `requireRole`, `requireJson`, validadores), los controladores,
el `errorHandler`, `token.service` (los JWT se firman y verifican de verdad) y las respuestas de Express.

## 2. ¿Por qué una suite aprobada no demuestra que MongoDB Atlas esté configurado correctamente?

Porque los dobles devuelven datos conocidos y nunca se llama a `connectDatabase`; no se abre una conexión real.
La suite no comprueba la URI, el usuario, la contraseña codificada ni la lista de acceso de red de Atlas. Un
`query` real contra Mongoose podría fallar y las pruebas seguirían aprobando.

## 3. ¿Qué diferencia existe entre OpenAPI y Swagger UI?

OpenAPI es el contrato: un documento (aquí `openApiDocument` en `src/docs/openapi.ts`) que describe de forma
legible por personas y herramientas las operaciones, parámetros, cuerpos, seguridad y esquemas. Swagger UI es la
interfaz web que consume esa especificación, la representa y permite enviar solicitudes con "Try it out". OpenAPI
se publica en `/api-docs.json`; Swagger UI se sirve en `/api-docs`.

## 4. ¿Por qué GET /api/auth/me obtiene el id desde el token y no desde params o body?

Porque el token es la evidencia firmada de la identidad. El middleware `authenticate` verifica la firma con
`JWT_SECRET` y deja el `userId` en `res.locals.auth`. Si el id viniera del navegador, cualquiera podría pedir la
identidad de otra cuenta (un fallo de tipo IDOR). El cliente nunca debe decir quién es: lo demuestra con el JWT.

## 5. ¿Por qué authRateLimiter ya no se monta en todo authRouter?

Porque `/api/auth/me` no es un intento de credenciales. En A10 solo existían `register` y `login`, así que
limitar el router completo tenía sentido. Con `/me`, limitar todo el router haría que las consultas normales de
un usuario autenticado consumieran el límite de acceso y pudieran recibir 429. Ahora el limitador se coloca
directamente en cada `POST` público (`register` y `login`) y `/me` conserva solo la autenticación.

## 6. ¿Qué diferencia hay entre un error 401 y uno 403 en el cliente?

El 401 significa que no hay autenticación válida: falta el token, está mal formado, expiró o no tiene cuenta
asociada. En el cliente, un 401 debe limpiar la sesión local (`sessionStorage`) y volver al login. El 403
significa que la identidad es válida pero su rol no tiene permiso; la sesión sigue siendo buena, así que se
muestra el mensaje de permiso denegado sin cerrar sesión.

## 7. ¿Por qué Postman puede funcionar aunque el navegador informe CORS?

Porque CORS es una política que aplica el navegador, no el servidor. Postman, `curl` o un script de servidor no
aplican la misma política de origen y sus solicitudes llegan y se procesan. El navegador, en cambio, bloquea que
JavaScript lea la respuesta de otro origen si el servidor no responde con el encabezado
`Access-Control-Allow-Origin` correcto. Por eso la evidencia de CORS debe hacerse en el navegador o incluyendo
el encabezado `Origin`.

## 8. ¿Qué riesgo conserva sessionStorage y por qué se usa solo como solución didáctica?

`sessionStorage` es accesible desde JavaScript, así que un ataque XSS puede leer el token y usarlo. Además, no se
invalida en el servidor: cerrar sesión solo borra el token local y no existe una lista de revocación. Se usa aquí
porque A9 y A10 no implementaron cookies `HttpOnly` ni refresh tokens, y así se puede observar el flujo Bearer.
Para producción lo recomendable son cookies `HttpOnly` (con `Secure` y `SameSite`), tokens de refresco y
protección CSRF.

## 9. ¿Qué contrato comparten openapi.ts, types.ts y las respuestas reales?

El contrato observable de la API: rutas y métodos, los sobres `{ data: ... }` y `{ error: { code, message,
details?, requestId } }`, los nombres y tipos de campo (`id`, `title`, `status`, `createdAt`, `updatedAt`, `role`,
`accessToken`, `tokenType`), los códigos de estado y el esquema `bearerAuth`. `openapi.ts` lo documenta,
`client/src/types.ts` lo tipa para el cliente y las respuestas reales de Express deben coincidir con ambos.

## 10. ¿Qué prueba agregarías primero antes de desplegar la actividad 12 y por qué?

Una prueba de integración real contra Atlas que haga login, cree una tarea y la vuelva a listar, sin dobles. Es
la primera porque las pruebas actuales aíslan la persistencia: lo que más riesgo corre en un despliegue es la
conexión real a la base, las variables de entorno y el comportamiento de escritura/lectura, además de CORS en el
navegador. Verificar eso primero evita descubrir fallos de configuración ya en producción.
