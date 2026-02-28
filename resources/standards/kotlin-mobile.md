### Kotlin
    
#### Convención principal

Las funciones empiezan en minúscula y usan lowerCamelCase, sin guiones bajos.
Ej.: `procesarDeclaraciones(), calcularPromedio() `

Ejemplos

`obtenerAlumno(), crearSesionSegura()`


Lo mismo se aplicará para propiedades y variables locales (minúscula + camelCase). 


#### Funciones “factory”

Las funciones de factoría que crean instancias pueden llamarse igual que el tipo abstracto que devuelven.
    
#### Ejemplo:

``` kotlin
interface Foo
class FooImpl : Foo
fun Foo(): Foo = FooImpl()


(la función Foo() retorna un Foo) 
```
Úsala solo cuando:

* La intención sea crear/proveer una instancia del tipo de retorno.
* No genere confusión con constructores reales.

#### Nombres de funciones en pruebas

En tests, se permiten nombres con espacios entre comillas invertidas y también guiones bajos.
    
#### Ejemplo:

``` kotlin
@Test fun `calcula promedio correctamente`() { /*...*/ }
@Test fun calculaPromedio_conListaVacia() { /*...*/ }
```


* Los nombres de las funciones deberán incluir un verbo o frase verbal que comunique la acción y si modifica o retorna copia

`sort() (ordena en sitio) vs sorted() (retorna una copia ordenada).`
    
* Evita nombres vacíos como Manager, Wrapper. 


#### Recomendaciones prácticas

* Prefiere: cerrar(), leerPersonas(), comoJson(), filtrarActivos().
* Distingue efectos: agregarAlumno() (muta) vs conAlumnoAgregado() (retorna nuevo).
* Sé específico: calcularPromedioPonderado() mejor que calcular().

#### Acrónimos en nombres (si aparecen en funciones/clases)

* Dos letras: ambas en mayúscula (IOStream).
* Más de dos: solo la primera en mayúscula (XmlFormatter, HttpInputStream). 
* Aplica cuando el acrónimo va en UpperCamelCase (clases/objetos). En funciones (lowerCamelCase), conserva la legibilidad: leerXml(), enviarHttp(). 


#### Apoyo de IDE / estilo oficial de Kotlin

* Configura Kotlin style guide en IntelliJ/Android Studio para formato y convenciones.
    `Settings → Editor → Code Style → Kotlin → Set from… → Kotlin style guide.`
* Activa inspecciones para nombres/formato. 


#### Ejemplo


``` kotlin
fun obtenerAlumnoPorId(id: Long): Alumno? = repo.buscar(id)

fun cerrarSesionActual() {
    // efectos laterales claros
}

fun alumnosOrdenadosPorNombre(alumnos: List<Alumno>): List<Alumno> =
    alumnos.sortedBy { it.nombre } // no muta: nombre “sorted” semántico

```
