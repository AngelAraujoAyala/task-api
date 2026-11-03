# Reflexión EC3 F1 A9

Preguntas de cierre del proyecto `task-api-express`: registro de usuarios, protección de contraseñas y autenticación con JWT.

---

## 1. ¿Por qué un hash de contraseña no debe poder descifrarse?

Porque el hash es una función **unidireccional**: del hash no se puede volver a la contraseña. Si alguien roba la base de datos, solo obtiene hashes y no las contraseñas reales de los usuarios. El servidor nunca necesita "recuperar" la contraseña: en el login calcula el hash de lo que escribió el usuario y lo compara con el guardado. En el proyecto esto lo hace `verifyPassword` con `bcrypt.compare`.

## 2. ¿Qué diferencia existe entre una sal aleatoria y la clave usada para firmar HS256?

- **Sal (bcrypt):** es un valor aleatorio distinto para cada contraseña. Va incluido dentro del hash y **no es secreto**. Sirve para que dos contraseñas iguales produzcan hashes diferentes y para frenar ataques con tablas precalculadas.
- **Clave HS256 (`JWT_SECRET`):** es **secreta** y única para toda la API. Sirve para firmar y verificar tokens. Si se filtra, cualquiera podría fabricar tokens válidos.

Ejemplo del proyecto: dos usuarios con la misma contraseña tienen distinto `passwordHash` por la sal, pero todos los tokens se firman con el mismo `JWT_SECRET`.

## 3. ¿Por qué `passwordHash` tiene `select: false` y aun así el login puede recuperarlo?

Con `select: false`, Mongoose **no incluye** el campo en las consultas normales, así que no se filtra por accidente en ninguna respuesta. El login sí lo necesita para comparar, entonces el repositorio lo pide de forma explícita con `query.select('+passwordHash')` cuando `includePasswordHash` es `true`. Así el acceso al hash es la excepción y no la regla.

## 4. ¿Por qué `unique` no sustituye la validación HTTP del correo?

Porque `unique` solo crea un **índice** que impide duplicados en MongoDB; no revisa que el texto sea un correo. Un valor como `hola` pasaría el índice sin problema. La validación HTTP (`EMAIL_PATTERN`, longitud, tipo, `trim` y `lowercase`) rechaza datos incorrectos antes, con un 422 claro y detalles por campo.

Además, cada una cumple una función distinta: la validación mejora la respuesta al cliente y el índice es la protección definitiva contra duplicados, incluso con solicitudes simultáneas.

## 5. ¿Qué riesgo evita rechazar el campo `role` durante el registro?

Evita la **escalada de privilegios**: que un cliente se registre enviando `"role": "admin"` y se asigne permisos que no le corresponden. Por eso `validateRegister` solo permite `name`, `email`, `password` (y `confirmPassword`), y el servicio fija siempre `role: 'user'`. El rol lo decide el servidor, nunca el cliente.

## 6. ¿Por qué correo inexistente y contraseña incorrecta devuelven el mismo mensaje?

Para no dar pistas a un atacante. Si los mensajes fueran distintos, se podría averiguar qué correos están registrados (**enumeración de usuarios**). En el proyecto ambos casos responden `401 INVALID_CREDENTIALS` con el mismo mensaje.

Además, `loginUser` usa un `DUMMY_PASSWORD_HASH` para ejecutar bcrypt aunque el correo no exista, y así los tiempos de respuesta se parecen.

## 7. ¿Qué información contiene el JWT de esta actividad y qué información se excluye?

- **Contiene:** `sub` (id del usuario), `role` y los claims estándar `iss`, `aud`, `iat` y `exp`.
- **Excluye:** contraseña, `passwordHash`, nombre y correo.

La razón es que un JWT está **firmado, no cifrado**: cualquiera que tenga el token puede decodificar su contenido. La firma solo protege que no sea alterado.

## 8. ¿Qué validan `issuer`, `audience`, `algorithms` y `exp`?

| Elemento     | Qué valida                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `issuer`     | Que el token lo emitió esta API y no otro sistema.                                                   |
| `audience`   | Que el token se creó para este cliente o servicio.                                                   |
| `algorithms` | Que se firmó con HS256, el algoritmo definido por la app, y no con otro que alguien intente imponer. |
| `exp`        | Que el token no haya expirado; pasado ese tiempo ya no se acepta.                                    |

`jwtVerify` además comprueba la firma con la clave secreta.

## 9. ¿Cómo llega un error de MongoDB desde el repositorio hasta `errorHandler` en Express 5?

1. En el repositorio, `execute` envuelve la operación en `try/catch` y `mapPersistenceError` convierte el error de MongoDB en un `AppError` (por ejemplo, el código 11000 pasa a `409 USER_EMAIL_EXISTS`).
2. El servicio usa `await`, así que ese rechazo sube hacia arriba.
3. El controlador es `async` y también termina con una promesa rechazada.
4. Express 5 detecta esa promesa rechazada y la trata como `next(error)`, sin necesidad de `try/catch` en el controlador.
5. `errorHandler` reconoce el `AppError` y responde con `code`, `message`, `details` y `requestId`, sin exponer URI, credenciales ni stack trace.

## 10. ¿Por qué las rutas de tareas permanecen públicas en A9 y qué cambiará en A10?

En A9 el alcance es **construir la identidad**: registro, login, hash de contraseñas y emisión del token. `verifyAccessToken` queda preparada, pero todavía no se conecta a ninguna ruta, y dejar las tareas públicas permite comprobar por regresión que el CRUD de A8 sigue funcionando.

En A10 se agregará un middleware que exija el token en `/api/tasks`, convierta el token en la identidad de la solicitud y aplique permisos por rol (autorización), con respuestas como 401 para tokens inválidos y 403 para falta de permisos.
