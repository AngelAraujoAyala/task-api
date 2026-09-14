**¿Qué responsabilidad cumple Express y qué responsabilidad conserva el servicio?**
*Express únicamente es la capa de transpote, no sabe nada de las reglas del negocio. Lo que hace es mover datos de un lado a otro entre el cliente y el servidor*

**¿Por qué no conviene escribir toda la lógica dentro de task.routes.ts?**
*Porque se haría un archivo demasiado largo en el cual sería muy difícil encontrar exactamente que necesitas cambiar o acualizar en caso de necesitarlo, es mucho mas limpio y escalable dibir por responsabilidades los archivos del código, así si en algún punto necesitas hacer implementaciones es mas facil ubicar funcionalidades y actualizarlas sin romper nada más*

**¿Qué diferencia existe entre req.params y req.body?**
*req.paramas son los parámetros de la URL que deben mandarse en una petición. Y el req.body es el cuerpo de la solicitud, toda la información que el cliente manda dentro de la solicitud en formato JSON*

**¿Por qué el título recibido desde un cliente se considera unknown antes de validarlo?**
*Porque typescript no puede confiar en lo que se manda desde fuera del programa, dentro del propio código, TypeScript verifica los tipos en tiempo de compilación y te avisa si algo no encaja*

**¿Qué ventaja ofrece centralizar los errores en un middleware?**
*Nos ahorra escribir lo mismo en todos los controladores, además on el middleware centralizado, el controlador ya no necesita saber cómo se ve una respuesta de error, solo hace next(error) y sigue. Decidir "qué código HTTP corresponde a este error" y "qué mensaje mandar" deja de ser trabajo del controlador*

**¿Cuándo debe utilizarse 201 en lugar de 200?**
*201 significa específicamente "se creó un recurso nuevo, y aquí tienes una representación de él". 200 significa, en general "la operación se completó correctamente", sin implicar que algo nuevo haya nacido*

**¿Por qué DELETE responde 204 sin un objeto JSON?**
*significa "la operación fue exitosa, y no hay nada que valga la pena devolverte en el cuerpo de la respuesta"*

**¿Qué ocurrirá con las tareas cuando el servidor se reinicie y por qué?**
*Las tareas se van a borrar, porque como no estamos apuntando a una base de datos, toda la información se guarda únicamente en la memoria del proceso de Node.js mientras el servidor está corriendo. En cuanto ese proceso termina, esa memoria se libera y el arreglo tasks vuelve a inicializarse con solo las dos tareas de ejemplo definidas en el código*

**¿Qué archivos podrán conservarse cuando se incorpore MongoDB Atlas?**
*Podrán conservarse casi sin cambios los archivos que no saben cómo se almacenan los datos: task.routes.ts, task.controller.ts, app-error.ts, los middlewares, y en gran medida models/task.ts. Esto es posible porque ninguno de ellos toca directamente el arreglo tasks, solo llaman funciones del servicio. El archivo que sí desaparece es data/tasks.ts, este es el arreglo en memoria, y task.service.ts deberá reescribirse por dentro para usar MongoDB en lugar del arreglo, aunque puede mantener las mismas funciones exportadas (findTaskById, createTask, etc.) para no obligar a cambiar nada en las capas superiores*