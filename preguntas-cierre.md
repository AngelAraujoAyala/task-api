# Preguntas de Cierre: Fundamentos de Node.js y TypeScript

## 1. ¿Cuál es la función de Node.js dentro de esta aplicación?
Node.js actúa como el entorno de ejecución (runtime) del lado del servidor. Permite ejecutar el código JavaScript fuera del navegador web, administrando procesos de entrada/salida, variables del sistema operativo (`process.env`), operaciones asíncronas e hilos de ejecución mediante la Event Loop.

## 2. ¿Qué ventajas ofrece TypeScript frente a JavaScript?
* **Tipado Estático Estricto:** Permite detectar errores de sintaxis y tipos durante la etapa de compilación y no en tiempo de ejecución.
* **Autocompletado y Autodocumentación:** Proporciona un soporte avanzado en el IDE (IntelliSense), facilitando el uso de modelos como `Task` e interfaces.
* **Prevención de Errores Nulos:** Con la opción `noUncheckedIndexedAccess` o tipados explícitos (`Task | undefined`), obliga al desarrollador a manejar situaciones donde un elemento puede ser inexistente.

## 3. ¿Para qué sirven las importaciones y exportaciones?
Sirven para modularizar el proyecto utilizando el estándar de módulos de ECMAScript (ESM). Permiten dividir la lógica en archivos independientes, exponiendo únicamente las funciones o tipos necesarios (`export`) e incluyéndolos en otros archivos donde sean requeridos (`import`).

## 4. ¿Qué responsabilidad tiene cada módulo del proyecto?
* **`models/task.ts`:** Define las interfaces y tipos (`Task`, `TaskStatus`) que estructuran la información.
* **`config/env.ts`:** Lee y centraliza las variables de entorno desde el proceso del sistema.
* **`services/task.service.ts`:** Encapsula la lógica de negocio y manipulación de datos (crear, listar, buscar, completar, eliminar).
* **`utils/delay.ts`:** Proporciona utilidades transversales asíncronas (como simular latencia con `Promise`).
* **`index.ts`:** Coordina la ejecución, invoca los servicios y muestra la salida/errores en la consola.

## 5. ¿Cuál es la diferencia entre una operación síncrona y una asíncrona?
* **Operación Síncrona:** Bloquea el hilo de ejecución principal; cada instrucción debe terminar completamente antes de que la siguiente pueda iniciar.
* **Operación Asíncrona:** No bloquea el hilo principal. Se delega al entorno y devuelve una `Promesa`. Permite que la aplicación continúe ejecutando otras tareas mientras espera que la operación finalice (ej. lectura de archivos, peticiones a bases de datos o `setTimeout`).

## 6. ¿Para qué se utilizan `async` y `await`?
Son palabras clave que simplifican el manejo de código asíncrono basado en Promesas:
* `async`: Declara que una función es asíncrona y que retornará explícitamente una `Promise`.
* `await`: Pausa la ejecución dentro de la función `async` hasta que la `Promise` se resuelva o rechace, permitiendo escribir código asíncrono con una sintaxis secuencial y limpia.

## 7. ¿Por qué las variables sensibles no deben escribirse directamente en el código?
Escribir valores sensibles (claves API, credenciales de base de datos, secretos) directamente en el código genera fallas críticas de seguridad al subir el repositorio a plataformas públicas como GitHub. Utilizar variables de entorno (almacenadas en un `.env` excluido por `.gitignore`) garantiza que la configuración dependa de cada entorno sin comprometer las credenciales.

## 8. ¿Qué errores controla la aplicación y cómo responde ante ellos?
La aplicación controla:
* **Título vacío:** Valida con `title.trim()` al crear una tarea y lanza un error explicativo.
* **Búsqueda o modificación de ID inexistente:** Al intentar completar o eliminar una tarea cuyo ID no existe, lanza un mensaje de error indicando la falla.
* **Manejo mediante `try/catch`:** Captura las excepciones lanzadas por los servicios en `index.ts` y las imprime de forma limpia en la terminal mediante `console.error` sin detener abruptamente el proceso.