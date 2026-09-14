# Reflexión — Validación y manejo de errores

**1. ¿Qué diferencia existe entre validar el formato HTTP y proteger una regla del negocio?**

Validar el formato HTTP comprueba que la solicitud esté bien construida antes de interpretarla: que el `id` sea un entero positivo, que el `title` sea texto no vacío, que el `Content-Type` sea `application/json`. Esto lo hacen los middlewares, sin conocer nada del dominio de tareas. Proteger una regla del negocio es distinto: comprueba que la operación tenga sentido dentro del dominio, como que la tarea exista antes de completarla o eliminarla. Esa regla vive en el servicio porque seguiría siendo válida aunque la API cambiara de framework o de transporte.

**2. ¿Por qué conviene usar `router.param` para validar el id?**

Porque centraliza la validación en un solo lugar en vez de repetirla en cada ruta que use `:id`. Se define una vez con `taskRouter.param("id", validateTaskId)` y Express la ejecuta automáticamente antes de cualquier controlador cuya ruta contenga ese parámetro. Esto elimina duplicación y garantiza que todas las rutas apliquen exactamente la misma regla, sin riesgo de que una quede desactualizada si la validación cambia.

**3. ¿Qué ventaja ofrece guardar datos normalizados en `res.locals`?**

El controlador recibe el dato ya validado y limpio (por ejemplo, el `title` sin espacios sobrantes, o el `id` ya convertido a número), sin tener que repetir la conversión ni confiar en el dato crudo de `req.body` o `req.params`. Esto separa responsabilidades: el middleware decide si el dato es válido y en qué forma debe usarse, y el controlador solo coordina la respuesta.

**4. ¿Cuándo corresponde responder 400 y cuándo 422?**

400 se usa cuando la solicitud no puede interpretarse: un `id` que no es un entero (`INVALID_ID`) o un cuerpo que no es JSON sintácticamente válido (`INVALID_JSON`). 422 se usa cuando el JSON sí es válido y se pudo interpretar, pero sus valores no cumplen las reglas esperadas, como un `title` vacío o un `completed` que no es booleano. La diferencia es sintaxis (400) contra semántica de los datos (422).

**5. ¿Por qué `notFound` delega el error en lugar de responder directamente?**

Si `notFound` construyera su propia respuesta JSON, existiría un segundo lugar generando el formato de error, además del `errorHandler`, con riesgo de que ambos queden inconsistentes. Al lanzar un `AppError` con `next()`, `notFound` deja que el mismo manejador central que procesa todos los demás errores también decida el formato final, garantizando una sola fuente de verdad para la estructura de errores.

**6. ¿Qué información no debe enviarse al cliente en un error 500?**

No debe enviarse el stack trace, el mensaje interno de la excepción original, ni ningún detalle sobre la causa técnica del fallo. El cliente solo recibe un `code: "INTERNAL_ERROR"` y un mensaje genérico; el detalle real (incluyendo el error completo) se registra únicamente en el servidor con `console.error`, asociado al `requestId`, para no exponer información que pueda revelar cómo está construida la aplicación.

**7. ¿Cómo ayuda `requestId` durante la depuración?**

Cada solicitud genera un identificador único que se devuelve tanto en el cuerpo del error como en el header `X-Request-Id`. Si un cliente reporta un problema, ese identificador permite localizar exactamente esa solicitud en los logs del servidor (donde se registró junto al error real), sin tener que adivinar cuál de muchas solicitudes similares fue la que falló.

**8. ¿Qué prueba demuestra que la refactorización no rompió la API anterior?**

Las pruebas de regresión: repetir `PATCH /api/tasks/:id/complete` y `DELETE /api/tasks/:id` con un id válido después de agregar toda la capa de validación y manejo de errores, y confirmar que ambos endpoints siguen respondiendo igual que antes (200 y 204 respectivamente). Esto demuestra que las mejoras se agregaron sin alterar el comportamiento correcto que ya existía.