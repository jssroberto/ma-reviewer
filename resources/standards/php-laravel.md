PHP/Laravel
---


Los proyectos desarrollados en Laravel deberán manejar la siguiente estructura intentar para separar lógica de negocio de controladores. 
    
Sugerencia de estructura para carpetas del proyecto:

```
app/
 ├─ Models/
 │   └─ Order.php                # Eloquent ORM (infraestructura)
 │
 ├─ Http/
 │   ├─ Controllers/
 │   │   └─ OrderController.php  # Controladores/API (interfaces)
 │   └─ Requests/
 │       └─ CreateOrderRequest.php # Validaciones
 │
 ├─ Domain/                      # Reglas puras de negocio
 │   └─ Order/
 │       
 │
 ├─ Application/                 # Casos de uso / servicios de aplicación
 │   └─ Order/
 │       └─ OrderService.php     # Coordina domain + infraestructura
 │
 ├─ Repositories/
 │   └─ OrderRepository.php      # Acceso a datos (infraestructura)
 │
 └─ Providers/
     └─ AppServiceProvider.php   # Inyección de dependencias
```

    
La convención de sintáxis descrita en los estándares para Laravel está basada en: [PSR-1: Basic Coding Standard](https://www.php-fig.org/psr/psr-1/)

### Métodos
    
Los métodos declarados en cada aplicación deberán cumplir con las siguientes especificaciones.

#### Convenciones de nombre

* Camel case
* En español
* Con un nombre descriptivo sin importar el largo
* Omitir acentos y eñes
* Omitir conectores cuando estos no aporten valor

#### Contenido

* Single purpose, cada método debe solo una cosa.
* El método debe hacer lo que su nombre promete.
* Se deberá incluir un Docblock PHPDoc obligatorio breve, mencionando `@param, @return, @throws` si aplica), así como el propósito general del método.

#### Ejemplo
    
```php
/**
 * Calcula el monto total del pedido aplicando descuentos vigentes.
 *
 * @param array<int, array{precio: float, cantidad: int}> $items
 * @return float
 */
public function calcularTotal(array $items): float
{
    // ...
}

```
    
### Variables
    
Las variables declaradas dentro de las aplicaciones deberán seguir las siguientes especificaciones:
    
#### Convenciones de nombre

* camelCase
* En español
* Nombres descriptivos sin importar el largo
* Omitir acentos y eñes
* Eviar nombres genéricos como: `$data, $temp, $obj`
* Usar plural cuando se trate de colecciones como: `$alumnos, $planesClase`.

#### Ámbito / Tipo

Las variables deben declararse con la visibilidad adecuada y con tipos definidos explícitamente.

| Visibilidad | Descripción                               | Uso recomendado                                                              | Ejemplo                          |
| ----------- | ----------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------- |
| `private`   | Solo accesible dentro de la misma clase.  | Para atributos internos o métodos auxiliares.                                | `private string $token;`         |
| `protected` | Accesible desde la clase y sus subclases. | Para clases que puedan ser heredadas (ej. modelos base).                     | `protected array $reglas;`       |
| `public`    | Accesible desde cualquier lugar.          | Solo si el atributo o método forma parte de la interfaz pública de la clase. | `public function obtenerTotal()` |


* Usar visibilidad correcta (private, protected, public) en propiedades.
* Preferir tipos estrictos; evitar mixed salvo necesidad real.

```php
class Pedido
{
    // Solo la clase Pedido puede modificar directamente este valor
    private float $subtotal = 0;

    // Puede ser accedido desde clases hijas
    protected float $descuento = 0.0;

    // Método público: interfaz visible hacia el exterior
    public function calcularTotal(): float
    {
        return $this->subtotal - $this->descuento;
    }
}

```
#### Constantes

Las constantes declaradas en las aplicaciones deberán seguir las siguientes especificaciones:

Preferir constantes de clase (con namespacing natural) a define().

* Nombre en mayúsculas usando snake case, ejemplo: `UPPER_SNAKE_CASE`.
* Especificar visibilidad como: `public|protected|private `, según su uso.
* Para configuración app → config/ + config() (no hacer uso de constantes globales).

#### Ejemplo
    
``` php
final class PedidoService
{
    private const DESCUENTO_MAXIMO = 0.15;
}
```
    
### Enumeraciones

### Clases

#### Convenciones de nombre

* PascalCase
* En español 
* Nombre descriptivo sin importar el largo
* Evitar acentos y eñes
* Evitar nombres genéricos (Helper, Util), utilizar nombres que aporten contexto.

#### Contenido

* Ubicar en namespaces claros: App\Models\, App\Services\, App\Http\Controllers\, etc.
* Atributos privados, exponer comportamiento vía métodos.
Se deberá incluir un Docblock con la descripción del propósito de la clase

#### Ejemplo

``` php
namespace App\Services;

/**
 * Orquesta el flujo de pago de pedidos.
 */
final class PagoPedidoService
{
    public function procesar(int $pedidoId): void { /* ... */ }
}
```

    
### Eloquent

Los modelos declarados dentro de las aplicaciones deberán cumplir con las siguientes especificaciones: 
    
#### Modelos
##### Convenciones de nombre
* PascalCase
* En singular (Alumno, Materia).
* Nombre en español
* Nombre descriptivo sin importar el largo
* Evitar acentos/ñ

##### Contenido

* Ubicarlos dentro de: `App\Models\`
* Deberán tener timestamps (`created_at, updated_at, deleted_at`)
* Siempre utilizar SoftDelets
* Los nombres de los campos deberán estar en snake_case
* Siempre deberá agregarse un Docblock explicando el propósito del modelo, reglas de negocio relevantes y relaciones clave

#### Relaciones

* Declaración explícita: hasOne, hasMany, belongsTo, belongsToMany.
* Nombres de las relaciones en singular para belongsTo / hasOne (ejemplo: `cliente(), perfil()`).
* Nombres de las relaciones en plural para hasMany / belongsToMany (ejemplo: `materias(), pedidos()`).

##### FKs y tablas intermediarias:

* Para Foreing Keys (FKs) mantener:
    - Nombre en singular
    - Agregar "`_id`" al final del nombre
    - snake case
Ejemplo: `materia_id`
* Para tablas intermediarias (tablas pivote): 
    - Nombre en plural y por orden alfabético, conformado a partir de los nombres de las tablas que se están relacionando
    - snake_case
    Ejemplo: `alumnos_materias`
* Pivote con atributos: usa ->withPivot([...]) o Pivot personalizado si necesitas lógica.

#### Eager Loading (N+1)
    
El Eager Loading es una técnica de Eloquent que permite precargar todas las relaciones de un modelo para evitar el problema de rendimiento conocido como **N+1 Query Problem**, que ocurre cuando el sistema ejecuta una consulta adicional por cada registro obtenido de una relación.
    
Por lo tanto, deberán tenerse las siguientes consideraciones: 
    
* Toda vista o endpoint que devuelva una lista de registros con relaciones debe usar eager loading (with(), load(), withCount()).
* Nunca deben ejecutarse consultas dentro de bucles (foreach, for) para obtener relaciones de otros modelos.
* Las relaciones que no sean necesarias deben omitirse para evitar sobrecarga de datos.

| Método          | Descripción                                                    | Ejemplo                                 |
| --------------- | -------------------------------------------------------------- | --------------------------------------- |
| `with()`        | Precarga relaciones en el query inicial.                       | `Alumno::with('materias')->get();`      |
| `load()`        | Carga relaciones adicionales después de obtener los modelos.   | `$alumno->load('perfil');`              |
| `withCount()`   | Añade el conteo de una relación sin traer todos los registros. | `Alumno::withCount('materias')->get();` |
| `loadMissing()` | Solo carga relaciones si aún no se han cargado.                | `$alumno->loadMissing('perfil');`       |
    

Ejemplo de un problema de N+1

```php
$alumnos = Alumno::all();
foreach ($alumnos as $alumno) {
    echo $alumno->perfil->nombre;
}
```
Este código ejecuta 1 consulta por alumno para obtener su perfil. Nunca podremos saber cuántas consultas se realizarán en total, ya que esto siempre dependerá de la cantidad de alumnos en el sistema.

Solución con Eager Loading (uso correcto)
    
```php
$alumnos = Alumno::with('perfil')->get();
foreach ($alumnos as $alumno) {
    echo $alumno->perfil->nombre;
}
```
Este código ejecuta solo 2 consultas en total:

1. Para traer todos los alumnos.
2. Para traer todos los perfiles asociados.

#### Ejemplo

``` php
    

declare(strict_types=1);

namespace App\Models;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Clase Alumno
 *
 * Representa a un alumno del sistema.
 * Este modelo administra la relación entre alumnos y materias, así como su información de perfil.
 *
 * Reglas:
 * - Las validaciones se realizan en los Form Requests.
 * - El modelo debe mantenerse libre de lógica de negocio.
 * - Las consultas complejas se encapsulan en Scopes o Servicios.
 * - Evitar N+1 usando eager loading (with / withCount).
 */
class Alumno extends Model
{
    use SoftDeletes;

    /**
     * Eager loading por defecto para evitar N+1 en operaciones comunes.
     * Carga siempre el perfil asociado.
     * (Agregar aquí SOLO relaciones livianas y frecuentemente usadas.)
     *
     * @var array<int, string>
     */
    protected $with = ['perfil'];

    /**
     * Atributos asignables masivamente.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nombre',
        'correo',
        'ingreso',
        'activo',
    ];

    /**
     * Casts automáticos de atributos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'activo' => 'boolean',
        'ingreso' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relaciones del modelo
     */

    // belongsToMany → plural
    public function materias(): BelongsToMany
    {
        return $this->belongsToMany(Materia::class, 'alumno_materia')
                    ->withPivot(['calificacion', 'inscrito_en'])
                    ->withTimestamps();
    }

    // hasOne → singular
    public function perfil(): HasOne
    {
        return $this->hasOne(Perfil::class);
    }

    /**
     * Scopes reutilizables
     */

    // Scope: alumnos activos
    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('activo', true);
    }

    // Scope: alumnos por año de ingreso
    public function scopeIngreso(Builder $query, int $anio): Builder
    {
        return $query->where('ingreso', $anio);
    }

    /**
     * Accessors / Mutators modernos
     */
    protected function nombre(): Attribute
    {
        return Attribute::make(
            get: fn(string $value) => trim($value),
            set: fn(string $value) => mb_convert_case(trim($value), MB_CASE_TITLE, 'UTF-8'),
        );
    }

    /**
     * Ejemplo de uso de Route Model Binding con clave natural.
     */
    public function getRouteKeyName(): string
    {
        return 'correo'; // permite rutas del tipo /alumnos/{correo}
    }

    /**
     * Helper de consulta:
     * Lista de alumnos activos con relaciones precargadas para evitar N+1.
     *
     * @param  int|null  $ingreso Filtra por año de ingreso si se provee.
     */
    public static function listadoActivosConRelaciones(?int $ingreso = null, int $porPagina = 20): LengthAwarePaginator
    {
        return self::query()
            ->activos()
            ->when($ingreso, fn (Builder $q) => $q->ingreso($ingreso))
            // Eager loading explícito (además del $with por defecto):
            ->with([
                'materias.profesor', // relación anidada: cada materia con su profesor
            ])
            ->withCount('materias') // contador sin traer toda la colección
            ->orderBy('nombre')
            ->paginate($porPagina);
    }
}


```

### Rutas

#### Principios y alcance

* REST-first: las URLs nombran recursos; los verbos van en el método HTTP.
* Consistencia: mismo patrón en todo el proyecto (web y API).
* Mantenibilidad: named routes obligatorias; agrupar por módulo con prefix y name.


#### Convenciones de nombre

* En español.
* En minúsculas
* Omitir acentos/ñ
* Usar guiones medios - para separar palabras.
* Recursos en plural: /alumnos, /materias, /planes-clase.
* Sin verbos en la URL ( ejemplo: /inscribir, /editar, /mostrar).
* La profundidad de anidado tiene un máximo de dos niveles: /alumnos/{id}/materias.
* Política de trailing slash: elegir una y aplicarla globalmente. 
    - En API: sin slash final (/alumnos, /alumnos/5). 
    - En web, seguir la convención que ya use el proyecto.

#### Contenido

Agrupar las urls por módulo usando prefijos y nombres. Ejemplo: `prefix('alumnos')` y `name('alumnos.')`.
Todas las urls deben tener nombre, y deberán llamarse por el mismo, no se deberá usar el path literal.
    
#### Ejemplo
    
``` php
use App\Http\Controllers\AlumnoController;
use App\Http\Controllers\InscripcionController;

Route::prefix('alumnos')->name('alumnos.')->group(function () {
    Route::get('/', [AlumnoController::class, 'index'])->name('index');
    Route::post('/', [AlumnoController::class, 'store'])->name('store');
    Route::get('{alumno}', [AlumnoController::class, 'show'])->name('show');
    Route::patch('{alumno}', [AlumnoController::class, 'update'])->name('update');
    Route::delete('{alumno}', [AlumnoController::class, 'destroy'])->name('destroy');

    // Subrecurso: materias inscritas del alumno
    Route::get('{alumno}/materias', [InscripcionController::class, 'index'])->name('materias.index');
    Route::post('{alumno}/materias', [InscripcionController::class, 'store'])->name('materias.store');
});
```
#### Uso por nombre
En blade
``` blade
<a href="{{ route('alumnos.show', ['alumno' => $alumno->id]) }}">Ver</a>

```
En el back
``` php
return redirect()->route('alumnos.index');

```
#### Rutas de API
    
* Para rutas de APIs utilizar el prefijo API y el versionado correspondiente. 
* Aplicar middlewares al grupo de rutas según corresponda(`auth:sanctum, throttle:api, bindings, locale`) 

| **Middleware**     | **Función principal**           | **Descripción**                                                                                                                                           | **Cuándo aplicarlo**                                                                                            |
| ------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **`auth:sanctum`** | Autenticación                   | Valida que el usuario envíe un token de acceso válido mediante Laravel Sanctum. Bloquea el acceso a usuarios no autenticados.                             | En todas las rutas privadas o protegidas del sistema (APIs, paneles internos, endpoints con datos del usuario). |
| **`throttle:api`** | Límite de peticiones            | Controla la cantidad de solicitudes que un cliente puede realizar en un periodo de tiempo para prevenir abusos o ataques de denegación de servicio (DoS). | En endpoints públicos o APIs con tráfico potencialmente alto.                                                   |
| **`bindings`**     | Inyección automática de modelos | Resuelve automáticamente modelos de Eloquent en rutas con parámetros (`{id}`) y lanza un error 404 si no se encuentra el recurso.                         | En rutas que reciben identificadores de modelos, como `usuarios/{usuario}` o `pedidos/{pedido}`.                |

#### Ejemplo
``` php
Route::prefix('api/v1')->middleware(['auth:sanctum','throttle:api'])->group(function () {
    Route::apiResource('alumnos', AlumnoController::class)->names('api.alumnos');
});

```
