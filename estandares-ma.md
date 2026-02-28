---
title: 'Estándares de codificación Media Áerea'
disqus: hackmd
---

Estándares de codificación Media Aérea
===


El presente documento establece los lineamientos de código para el equipo de desarrollo que se desempeñe en proyectos construidos con alguna de las siguientes tecnologías: 

* Python/Django
* PHP/Laravel
* JavaScript
* ReactJS


. Los estándares y prácticas descritas aquí buscan asegurar la calidad, la legibilidad y la mantenibilidad del código.

## Tabla de contenido

[TOC]

## Enfoque de desarrollo general

El enfoque de desarrollo de MediaAérea está orientado a la modularidad, priorizando la escabilidad y mantenimiento, facilitando la ejecución de pruebas unitarias dentro de los proyectos de desarrollo. 

Para lograr dicho objetivo se definen los siguientes lineamientos sobre el enfoque de desarrollo de los proyectos:

* La lógica de negocio deberá separarse siempre de vistas y controladores. 

* Las vistas y controladores se conformarán de las funcionalidades importadas a partir de el archivo de lógica de negocio del proyecto.

* La lógica de negocio del proyecto puede separarse a su vez en dos carpetas: 

    1. domain (reglas puras, ejemplo: validación de RFC)
    2. services (casos de uso, ejemplo: el guardado de un formulario)


**Este enfoque de desarrollo deberá ser adoptado en cualquier framework de trabajo.**

## Python/Django

Organización de carpetas dentro del proyecto, separando lógica y reglas de negocio de vistas y controladores:

```python

  orders/ # Ejemplo del nombre de la app
 ├─ __init__.py
 ├─ models.py # Django ORM (infraestructura)
 ├─ views.py # Controladores/API (interfaces)
 ├─ urls.py
 ├─ domain/ # reglas puras
 │  └─ order.py
 └─ services/ # casos de uso
    └─ order_service.py

```

### **Métodos**

Los métodos declarados en cada aplicación deberán cumplir con las siguientes características:

#### Nomenclatura del nombre del método

- Nombre en minúsculas 
- En formato snake case, ejemplo: `generar_reporte`
- Nombre en español
- Nombre descriptivo sin importar el largo
- Omitir caracteres especiales (acentos, eñes)
- Comenzar con verbo de acción
    * Seguir la convención de `verbo_objeto`, ejemplo: `generar_reporte`.
- Evitar conectores cuando estos no aporten legibilidad
    * Ejemplo de uso para un conector: `calcular_total_de_pedido` puede ser más claro que `calcular_total_pedido`. Permite conectores breves si aclaran.


#### Especificaciones de la funcionalidad y sintáxis del método

* Que la función realice el trabajo que especifica el verbo que la nombra
* Single purpose - Solo deben de realizar una acción
* Para retornos booleanos usar prefijos `is_`, `has_`, `can_`. Se permite el uso de los prefijos en inglés por convención internacional.
* Uso de **@transaction.atomic** para operaciones críticas en la base de datos, como:
    * Actualizar varias tablas dependientes entre sí (pedido + usuario + perfil, etc.).
    * Realizar varias operaciones críticas que deben completarse juntas.
    * Modificar datos sensibles o financieros (pagos, transferencias, inventario, etc.).
    * Quieres mantener consistencia ante posibles excepciones o errores de validación.

Ejemplo sin **@transaction.atomic**
```python
def crear_pedido_con_lineas(cliente, lineas):
    pedido = Pedido.objects.create(cliente=cliente)
    for linea in lineas:
        LineaPedido.objects.create(pedido=pedido, **linea)

```
En este escenario, si por alguna razón en la tercera línea (LineaPedido) ocurre una falla con alguna de las inserciones (por un valor inválido por ejemplo), el pedido principal ya se habrá guardado, y se tendrán datos incompletos en la base de datos.
Esto genera inconsistencias (en este ejemplo sería un pedido sin todas sus líneas).

Es aquí donde se puede aprovechar el uso de transaction.atomic:

```python
from django.db import transaction

@transaction.atomic
def crear_pedido_con_lineas(cliente, lineas):
    pedido = Pedido.objects.create(cliente=cliente)
    for linea in lineas:
        LineaPedido.objects.create(pedido=pedido, **linea)

```

En este escenario, si llegase a ocurrir un error con las inserciones, toda la operación es cancelada. Si una de las líneas falla Django revierte todo como si nunca hubiera pasado.

> [**NOTA**: El uso de **@transaction.atomic** consume recursos que impactan el rendimiento, por lo cual no debe usarse para cada método trivial, debe reservarse para las operaciones más críticas.]
> 
* No renombrar hooks/convenios del framework: save, clean, get_queryset, form_valid, get_context_data, clean_<field>, etc.
* Agregar descripciones con docstrings (triple-comillas) dentro de funciones en el formato Google/Numpy/reST, incluye Args/Returns/Raises/Side Effects/Examples según aplique.
    * Ejemplo: 

```python
def calcular_total_pedido(pedido: Pedido) -> Decimal:
    """Calcula el total del pedido.

    Args:
        pedido: Instancia del pedido.

    Returns:
        Importe total del pedido como Decimal.

    Raises:
        ValueError: Si el pedido no tiene líneas.
    """
    
```

Se deberán agregar comentarios explicando:
* Explicando fórmulas o funciones matemáticas
* Conversiones de formatos

#### **Métodos internos/no públicos**

Para métodos internos o no públicos será necesario utilizar el prefijo: `_`. 

Ejemplo: `_validar_descuento_inscripción`

> [**NOTA**: Los métodos internos o no públicos son métodos usados únicamente dentro de la clase o módulo. Su uso externo no está recomendado, ya que puede modificarse sin previo aviso, es por esto que se identifican con el prefijo del "_".]


### **Variables**

Las variables declaradas en cada aplicación deberán cumplir con las siguientes características:


#### Convención de nombres

* Formato snake_case.
* Todo en minúsculas. (A excepción de las constantes, las cuales deben definirse en mayúsculas)
* En español
* Descriptivas y significativas, evitando abreviaturas innecesarias.
* No usar acentos, eñes, ni símbolos especiales.
* Evitar temp, aux, obj, data.
    Usar nombres con propósito claro (cliente_data, resultado_temp).

#### Booleanos

* Usar prefijos is_, has_, can_. 
    
    Estos prefijos podrán estar en inglés por convención internacional. 
    
    Ejemplo: is_active, has_error, can_edit.

#### Constantes

* Se escriben en mayúsculas con formato SNAKE_CASE.
    
    Ejemplo: MAX_INTENTOS, URL_API_BASE.
Se deberá incluir un comentario para explicar el contexto de la variable, de dónde viene el criterio para asignarle un valor.

#### Pluralidad

* Usar nombres en plural para listas o colecciones (usuarios, pedimentos_list).
* Usar singular para instancias o elementos individuales (usuario, pedimento).


#### Consistencia

Mantener el mismo término para el mismo concepto a lo largo del proyecto (por ejemplo, no alternar usuario y cliente).
    
### Enumeraciones (Enums)

Las enumeraciones deberán utilizarse de manera **obligatoria** para representar conjuntos de valores fijos o estados predefinidos, en lugar de usar cadenas o números mágicos.


Todo campo, atributo o constante que represente un estado, tipo, categoría o fase deberá implementarse como una enumeración.
    
*Ejemplo: estados de pago, niveles de acceso, tipos de usuario, etc.*

Prohibido el uso de literales ("pendiente", "activo", 1, 2, etc.) cuando exista un conjunto cerrado de valores válidos.

#### Convención:

* Nombre en formato CamelCase y singular (EstadoPago, TipoUsuario).
* Miembros en mayúsculas (PENDIENTE, COMPLETADO, CANCELADO).
* Las cadenas de valor deben corresponder al formato utilizado en el dominio o base de datos.
  
Ejemplo:
```python
from enum import Enum

class EstadoPago(Enum):
    PENDIENTE = "pendiente"
    COMPLETADO = "completado"
    CANCELADO = "cancelado"

```

### **Clases**

Las clases declaradas en cada aplicación deberán cumplir con las siguientes características:
    
#### Convención de nombre

* Formato CamelCase (PascalCase/CapWords).
* En español
* Sin acentos ni eñes. Evitar palabras genéricas (Helper, Util) y conectores innecesarios. 
* Nombre descriptivo sin importar el largo

#### Patrones por tipo

* **Excepciones:** terminar en Error/Exception 
    Ej. PagoInvalidoError.

* **Mixins:** terminar en Mixin 
    Ej. TimestampedMixin.

* **Enums:** clase en CamelCase singular; miembros en UPPER_CASE 
    Ej. EstadoPago { PENDIENTE, COMPLETADO }.

* **Dataclasses/DTO:** sustantivo claro; usar @dataclass cuando represente datos. 
    Ej. ReporteResumen, ClienteDTO.

* **ABCs/Protocolos:** usar ABC o typing.Protocol; evitar sufijo Interface. 
    Ej. RepositorioPagosProtocol, BaseRepositorioPagos.


#### Generalidades

* Clases internas/no públicas: prefijo _ (ej. _CalculadorImpuestos).
* Una clase ↔ una responsabilidad. Extraer cuando crezca demasiado.
* Se deberán incluir docstrings explicando el propósito, entradas/salidas relevantes de todas las clases.
* Las clases para pruebas deberán terminar en "Tests". Ejemplo:` class ClienteModelTests`

Ejemplos:

```python
# Excepción
class PagoInvalidoError(Exception):
    """Se lanza cuando el pago no cumple las reglas de negocio definidas
    o los datos proporcionados no son válidos.
    """

# Mixin
class TimestampedMixin:
    """Agrega campos de auditoría de creación y actualización (created_at, updated_at)
    a los modelos o clases que hereden de este mixin.
    """
    ...

# Enum
from enum import Enum

class EstadoPago(Enum):
    """Define los estados válidos de un pago dentro del sistema."""
    PENDIENTE = "PENDIENTE"
    COMPLETADO = "COMPLETADO"
    FALLIDO = "FALLIDO"

# Dataclass/DTO
from dataclasses import dataclass

@dataclass(frozen=True)
class ReporteResumen:
    """Representa un objeto de transferencia de datos (DTO)
    para los totales de un reporte financiero.
    """
    total_ingresos: float
    total_egresos: float
    periodo: str

# Protocolo (contrato)
from typing import Protocol

class RepositorioPagosProtocol(Protocol):
    """Define el contrato mínimo que deben cumplir
    los repositorios de persistencia de pagos.
    """

    def guardar(self, pago) -> None:
        """Guarda un pago en la fuente de datos correspondiente."""
        ...

    def obtener_por_id(self, pago_id: int):
        """Obtiene un pago a partir de su identificador único."""
        ...


```


### **Modelos**

Los modelos declarados en cada aplicación deberán cumplir con las siguientes características:

#### Convención de nombres

* Singular, formato `CamelCase`.
* En español
* Nombre descriptivo sin abreviaturas innecesarias.
* Omitir conectores

#### Nombres de los campos
* Minuscules
* Snake case
* En español
* Nombre descriptivo sin importar el largo
    

####  Generalidades

* Todos los modelos deberán implementar eliminación lógica (Soft Delete) mediante un campo deleted_at o herencia de un modelo base común

* Se deberán incluir los siguientes campos obligatorios en cada tabla:
    * created_at (para guardar fecha de creación del registro)
    * updated_at (para guardar fecha de última actualizacióndel registro)
    * created_by (para guardar el usuario del sistema que generó el registro)
    * updated_by (para guardar el usuario del sistema que actualizó el registro)
    
    Se recomienda definirlos dentro de un modelo de base abstracto
    
* Se deberá incluir un docstring descriptivo en cada modelo.
* Definir __str__() para una representación legible.
* Definir verbose_name, verbose_name_plural y ordering en Meta.
* Especificar related_name en campos ForeignKey y ManyToManyField.
* Documentar cualquier caso especial o regla de negocio con comentarios en línea.
    

Ejemplo
```python
class Cliente(BaseModel):
    """
    Representa un cliente del sistema.

    Atributos:
        nombre (str): Nombre del cliente.
        correo (str): Dirección de correo electrónico.
        activo (bool): Indica si el cliente está habilitado.
    """
    nombre = models.CharField(max_length=150)
    correo = models.EmailField(unique=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ["nombre"]

    def __str__(self):
        """Devuelve una representación legible del cliente."""
        return self.nombre

```

### **Rutas**

Las rutas declaradas en cada aplicación deberán cumplir con las siguientes características:

* Rutas en español
* Recursos en plural
* Si se especifica un id de un recurso es inmediatamente después del recurso
* Siempre incluir la acción a realizar como verbo en infinitivo
* Si no se puede reducir a una sola palabra, separar por guiones
* Solo minúsculas
* Evitar caracteres especiales
* Se terminan las acciones en /
* Si trae parametros por url que no termine en /
* SIEMPRE especificar la acción al final de la ruta

Ejemplos:
* /alumnos/3/materias/5/inscribir/ (Inscribe al alumno 3 en la materia 5)
* /alumnos/5/mostrar/ (muestra los detalles del alumno 5)
* /materias/8/planes-clase/editar/ (Edita el plan de clase de la materia 8)
* /alumnos/buscar?ingreso=2020 (Busca los alumnos que ingresaron en 2020)

### **Serializers**

Los serializers declarados en cada aplicación deberán cumplir con las siguientes características:

#### **Convención de nombre**
    
* Utilizar el sufijo **Serializer**.
* Primera letra mayúscula.
* Formato **CamelCase**.
* En español.
* Nombre descriptivo sin importar el largo.
* Omitir conectores y caracteres especiales (acentos, eñes).
* Incluir **docstring** descriptivo que explique el propósito del serializer.
* No incluir lógica de negocio; limitarse a serialización y validación de datos.
* Mantener coherencia entre el nombre del modelo y del serializer (ej. `Cliente` → `ClienteSerializer`).

**Ejemplo:**
```python
from rest_framework import serializers
from apps.core.models import Cliente

class ClienteSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Cliente.
    Proporciona los campos principales y validaciones básicas.
    """
    class Meta:
        model = Cliente
        fields = ["id", "nombre", "correo", "activo"]
```
### **Forms**

Los formularios declarados en cada aplicación deberán cumplir con las siguientes características:

#### **Convención de nombre**
    
* Utilizar el sufijo **Form**.
* Primera letra mayúscula.
* Formato **CamelCase**.
* En español.
* Nombre descriptivo sin importar el largo.
* Omitir conectores y caracteres especiales (acentos, eñes).
* Incluir **docstring** que explique el propósito y uso del formulario.
* Implementar validaciones mediante `clean()` o `clean_<campo>()` según corresponda.
* Mantener consistencia entre el formulario y el modelo correspondiente si hereda de `ModelForm`.

**Ejemplo:**
```python
from django import forms
from apps.core.models import Cliente

class ClienteForm(forms.ModelForm):
    """
    Formulario para la creación y edición de clientes.
    Incluye validaciones personalizadas de correo electrónico.
    """
    class Meta:
        model = Cliente
        fields = ["nombre", "correo", "activo"]
        labels = {
            "nombre": "Nombre completo",
            "correo": "Correo electrónico",
            "activo": "Cliente activo",
        }
```
### **Vistas**

Las vistas declaradas en cada aplicación deberán cumplir con las siguientes características:

* Para vistas basadas en funciones (FBV):
  * Nombre en español.
  * Minúsculas.
  * Guiones bajos para separar palabras (`snake_case`).
* Para vistas basadas en clases (CBV):
  * Nombre en formato `CamelCase`.
  * Usar sufijo `View` o `APIView` según corresponda.
* Nombre descriptivo sin importar el largo.
* Omitir conectores y caracteres especiales (acentos, eñes).
* Incluir **docstring descriptivo** al inicio de la vista explicando su propósito y funcionalidad.
* Evitar lógica de negocio compleja dentro de la vista.

**Ejemplo (FBV):**
```python
from django.shortcuts import render
from apps.core.models import Cliente

def listar_clientes(request):
    """
    Devuelve la lista de clientes activos registrados en el sistema.
    """
    clientes = Cliente.objects.filter(activo=True)
    return render(request, "clientes/listar.html", {"clientes": clientes})
    
```

**Ejemplo (CBV):**

```python
from django.views import View
from django.shortcuts import render
from apps.core.models import Cliente

class ClienteListView(View):
    """
    Vista basada en clase para listar clientes activos.
    """
    def get(self, request):
        clientes = Cliente.objects.filter(activo=True)
        return render(request, "clientes/listar.html", {"clientes": clientes})

```

### **REST Framework**

La declaración de endpoints para una API REST, deberá realizarse en un archivo separado con el nombre de: apis.py

### **Validaciones**
[Documentación de validaciones en formularios Django](https://docs.djangoproject.com/en/5.2/ref/forms/validation/)

Las validaciones dentro del sistema deberan realizarse tomando las siguientes consideraciones:

**Back**
* Obligatorio
* Utilizar el método clean general por si hay dependencias de validación *(consultar documentación de validaciones de Django para más información)*
* Es válido usar un clean especifico por campo, siempre y cuando no tenga dependencia con otro campo
* Al volver al front el feedback se muestra en el campo
* Si es por REST Framework el proceso es custom, dependerá de cada proyecto, y tiene que mostrarse el feedback específicamente en el campo correspondiente
* Utilizar validate con los mismos criterios del clean


**Front**
* Si el flujo lo demanda
* Feedback en el mismo campo


### **Generalidades**

Las variables de entorno (archivo .env) deberán documentarse en un env.example, en el cual se deberán incluir comentarios especificando lo que hace cada variable de entorno. 

Se deberá contar con un archivo requeriments.txt actualizado de manera regular con la versión de Django correspondiente y las librerías utilizadas dentro del sistema, incluyendo la versión especifica de las mismas, no se deberá hacer uso del `-latest`.

Se deberá contar con un README actualizado indicando los requerimientos, e instrucciones necesarias para correr el proyecto. Y este deberá ser actualizado regularmente cuando se hagan cambios en el código que puedan impactar en el levantamiento o configuración del proyecto. 

Los imports que se realicen en cada archivo del proyecto deberán tener el siguiente orden: 

1. Primero imports del sistema
2. Segundo imports de librerias externas
3. Tercero imports desde el proyecto

Se deberá agregar un comentario en cada sección de los imports: 

```python
#imports del sistema
import os

#imports de terceros
import pandas from pandas

#imports internos
import vista_ejemplo from views.py
```

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

| Visibilidad | Descripción | Uso recomendado| Ejemplo|
| ----------- | ----------- | -------------- | ------ |
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

| Método | Descripción | Ejemplo |
| ------ | ----------- | ------- |
| `with()`| Precarga relaciones en el query inicial. | `Alumno::with('materias')->get();` |
| `load()`| Carga relaciones adicionales después de obtener los modelos.   | `$alumno->load('perfil');`  |
| `withCount()` | Añade el conteo de una relación sin traer todos los registros. | `Alumno::withCount('materias')->get();` |
| `loadMissing()` | Solo carga relaciones si aún no se han cargado. | `$alumno->loadMissing('perfil');` |
    

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

|**Middleware**|**Función principal**|**Descripción**| **Cuándo aplicarlo** |
| ------------ | ------------------- | ------------- | ----------------- |
| **`auth:sanctum`** | Autenticación                   | Valida que el usuario envíe un token de acceso válido mediante Laravel Sanctum. Bloquea el acceso a usuarios no autenticados.                             | En todas las rutas privadas o protegidas del sistema (APIs, paneles internos, endpoints con datos del usuario). |
| **`throttle:api`** | Límite de peticiones            | Controla la cantidad de solicitudes que un cliente puede realizar en un periodo de tiempo para prevenir abusos o ataques de denegación de servicio (DoS). | En endpoints públicos o APIs con tráfico potencialmente alto.                                                   |
| **`bindings`**     | Inyección automática de modelos | Resuelve automáticamente modelos de Eloquent en rutas con parámetros (`{id}`) y lanza un error 404 si no se encuentra el recurso.                         | En rutas que reciben identificadores de modelos, como `usuarios/{usuario}` o `pedidos/{pedido}`.                |

#### Ejemplo
``` php
Route::prefix('api/v1')->middleware(['auth:sanctum','throttle:api'])->group(function () {
    Route::apiResource('alumnos', AlumnoController::class)->names('api.alumnos');
});

```
      


JavaScript / TypeScript
---

Las aplicaciones que se desarrollen usando JS o TS como backend, deberán serpara su lógica de negocio de vistas/controladores, y manejarlo como servicios separados que después deberán ser consumidos en la vista correspondiente.
    
Estructura de carpetas sugerida para el proyecto:

```
src/
 ├─ app.ts                      # punto de entrada principal (Express, Nest, etc.)
 ├─ routes/
 │   └─ order.routes.ts         # definición de rutas / endpoints
 │
 ├─ controllers/
 │   └─ order.controller.ts     # Controladores / Interfaces de entrada
 │
 ├─ infrastructure/             # Infraestructura (ORM, adapters externos, etc.)
 │   ├─ db/
 │   │   └─ models/
 │   │       └─ OrderModel.ts   # ORM (Sequelize, Prisma, TypeORM)
 │   └─ repositories/
 │       └─ OrderRepository.ts  # Implementación de acceso a datos
 │
 ├─ application/                # Casos de uso / servicios de aplicación
 │   └─ order/
 │       └─ OrderService.ts     # Coordina domain + infraestructura
 │
 ├─ domain/                     # Reglas puras de negocio (sin dependencias externas)
 │   └─ order/
 │       ├─ OrderEntity.ts      # Entidad de dominio
 │       ├─ OrderStatus.ts      # Value Object
 │       └─ OrderDomainService.ts # Lógica de negocio pura
 

```
    
Los proyectos que involucren JavaScript o TypeScript deberán contemplar las siguientes especificaciones:

### Generalidades

* ES Modules por defecto (import/export). Evitar require() salvo compatibilidad.
    * Node: usa `"type":"module"` en package.json o `module: "NodeNext"` en TS
* Estandariza estilo y calidad con **ESLint + Prettier.**
    Prettier formatea; ESLint se encarga de “reglas de código”.
* Utilizar `async/await` para una mejor legibilidad y manejo de errores. Evita el uso de `.then().catch()` encadenados.
    * No hagas await dentro de loops, has uso de la concurrencia para ejecutar las peticiones de manera paralela. 
    ```javascript
    const resultados = await Promise.all(ids.map(cargarAlumno));
    ```
    * [`Promise.allSettled`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)  para realizar todas las peticiones sin importar errores, y obtener el resumen de los resultados de las mismas.
    * Usa [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) para cancelación.
    * Tipar las promesas en TypeScript

    ``` typescript
    async function cargarAlumno(id: number): Promise<Alumno> { /* … */ }
    ```   
* Seguir el Single Responsability Principle en todas las funciones.
* En entornos JavaScript / TypeScript, donde los objetos se comparten por referencia, es indispensable mantener la [inmutabilidad](https://developer.mozilla.org/en-US/docs/Glossary/Immutable?utm_source=chatgpt.com) de los objetos para prevenir efectos colaterales, mantener la consistencia de datos y facilitar la detección de cambios en interfaces reactivas.

    Prácticas para mantener la inmutabilidad:
    | Práctica  | Ejemplo |
    | --------- | --------|
    | Usa `const` para todo lo que no se reasigne | `const usuario = {...}` |
    | Usa operadores de propagación | `{ ...obj, propiedad: nuevoValor }`, `[...array, nuevoElemento]` |
    | Usa funciones puras | No dependas de variables externas |
    | Evita modificar objetos pasados como parámetros | Devuelve una copia nueva |
    | En Vue/React, **nunca mutar directamente props o estado** | Usa `setState`, `reactive`, o crea un nuevo objeto |
    
    
* Todas las funciones y métodos (público/privado/interno) deberán documentarse utilizando JSDoc/TSDoc según corresponda. Se deberá indicar el próposito del elemento, parámetros y resultados esperados. 
    
### Métodos

Los métodos declarados en JavaScript y TypeScript deberán cumplir con las siguientes especificaciones: 
    
#### Convención de nombre

* camelCase
* En español
* Iniciar con un verbo en infinitivo que indique la acción
* Nombre descriptivo sin importar el largo
* Sin acentos ni eñes
* Evitar conectores cuando estos no aporten claridad

#### Contenido

* Cada método deberá cumplir con el principo de Single Responsability Principle (SRP). Es decir, cada método deberá realizar una sola acción de manera clara y completa.
* Evitar anidar demasiados condicionales
* Incluir manejo de errores, con descripciones claras del motivo del error. Evitar ser poco claro en cuanto al origen del error.
* Respetar el principio de DRY (Don't Repeat Yourself)
* Incluir descripciones con JSDoc / TSDoc

#### Ejemplo (TypeScript)
``` typescript
/**
 * Tipo de dominio para un alumno (ejemplo).
 */
export interface Alumno {
  id: number;
  nombre: string;
  activo: boolean;
}

/**
 * Calcula el promedio de calificaciones de un alumno.
 * - Inmutable: no muta el arreglo de entrada.
 * - Validaciones: verifica tipos y rangos.
 * - Guard clauses: retorna 0 si no hay datos.
 *
 * @param {ReadonlyArray<number>} calificaciones - Lista de calificaciones (0..10).
 * @returns {number} Promedio general (0 si no hay datos).
 * @throws {TypeError} Si el parámetro no es un arreglo numérico.
 * @throws {RangeError} Si alguna calificación está fuera de rango.
 */
export function calcularPromedio(calificaciones: ReadonlyArray<number>): number {
  if (!Array.isArray(calificaciones)) {
    throw new TypeError('calificaciones debe ser un arreglo de numeros');
  }
  if (calificaciones.length === 0) return 0;

  // Validaciones de tipo y rango
  for (const nota of calificaciones) {
    if (typeof nota !== 'number' || Number.isNaN(nota) || !Number.isFinite(nota)) {
      throw new TypeError('todas las calificaciones deben ser numeros finitos');
    }
    if (nota < 0 || nota > 10) {
      throw new RangeError('las calificaciones deben estar en el rango 0..10');
    }
  }

  const total = calificaciones.reduce((acc, nota) => acc + nota, 0);
  return total / calificaciones.length;
}

/**
 * Obtiene alumnos activos desde una API.
 * - Asíncrono con async/await.
 * - Manejo de errores controlado (try/catch) y rethrow semántico.
 * - Single responsibility: sólo consulta y retorna datos ya parseados.
 *
 * @param {number} [limite=20] - Cantidad máxima de resultados.
 * @returns {Promise<Alumno[]>} Lista de alumnos activos.
 * @throws {Error} Si hay error de red o respuesta inválida.
 */
export async function obtenerAlumnosActivos(limite: number = 20): Promise<Alumno[]> {
  try {
    const res = await fetch(`/api/v1/alumnos?activo=true&limit=${encodeURIComponent(limite)}`);
    if (!res.ok) {
      // Ej.: 4xx / 5xx
      throw new Error(`HTTP ${res.status} al consultar alumnos activos`);
    }
    const payload = (await res.json()) as unknown;

    // Validación mínima en runtime (TS NO valida en tiempo de ejecución)
    if (!payload || typeof payload !== 'object' || !Array.isArray((payload as any).data)) {
      throw new Error('respuesta de API no valida: falta propiedad data[]');
    }

    // Tipado seguro con aserción local
    const alumnos = (payload as { data: Alumno[] }).data;
    return alumnos.filter(a => a.activo === true);
  } catch (e) {
    // Registro para debugging y rethrow semántico hacia capas superiores
    console.error('[obtenerAlumnosActivos] fallo:', e);
    throw new Error('no fue posible obtener los alumnos activos');
  }
}
```
    
### Variables

Las variables declaradas en JavaScript o TypeScript deberán seguir las siguientes especificaciones: 
    
#### Convenciones de nombre
    
* camelCase
* En español
* Omitir acentos y eñes 
* Nombre descriptivo sin imporgtar el largo (evitar nombres genéricos como: `data, tmp, obj`).
* Plural para colecciones, como: alumnos, materiasAsignadas.
* Booleanos con prefijos: `isActivo, hasErrores, canEditar`. 
    Ejemplo: `totalAlumnos`

#### Constantes
    
* En `UPPER_SNAKE_CASE`
* Siempre agregar un comentario explicando de dónde viene la variable
* En español 
    Ejemplo:` MAX_INTENTOS, API_URL`.

#### Funcionalidad
Siempre aplicar la visibilidad adecuada: public, private, protected
Usar const por defecto; let si habrá reasignación. Nunca var.
Usa estructuras Readonly (Para TypeScript)

    
#### Ejemplo (TypeScript)
 
``` typescript
// Catálogo inmutable y tipos derivados
export const ROLES = { ADMIN: 'ADMIN', EDITOR: 'EDITOR', LECTOR: 'LECTOR' } as const;
export type Rol = typeof ROLES[keyof typeof ROLES];

export function filtrarActivos(alumnos: ReadonlyArray<Alumno>): Alumno[] {
  if (!Array.isArray(alumnos)) throw new TypeError('alumnos debe ser una lista');
  return alumnos.filter(a => a.activo);
}

export class Sesion {
  private readonly token: string;
  private expiraEnMs: number;

  constructor(token: string, expiraEnMs: number) {
    this.token = token;
    this.expiraEnMs = expiraEnMs;
  }

  public isVigente(): boolean { return this.expiraEnMs > Date.now(); }
}
```    

#### Ejemplo (JavaScript)
    
``` javascript
export const MAX_INTENTOS = 3;

export function obtenerNombres(alumnos) {
  if (!Array.isArray(alumnos)) throw new TypeError('alumnos debe ser un arreglo');
  return alumnos.map(a => a.nombre);
}

export class BufferSeguro {
  #items = [];
  push(item) { this.#items.push(item); }
  snapshot() { return [...this.#items]; } // copia defensiva
}
```    
#### Rutas

Las rutas declaradas en JavaScript o TypeScript deberán seguir las siguientes especificaciones:
    
#### Convención de nombre

* kebab-case
* En español
* En minúsculas
* Omitir acentos y eñes
* Recursos en plural
* Si se incluye un id deberá ser inmediatamente después del recurso: `/alumnos/:alumnoId`.
* Parámetros: usar :`param (path)` y `?clave=valor (query)`.
* Sin barra(o slash) final. 
    Ejemplos 
    Correcto: `/alumnos`
    Incorrecto: `/alumnos/`
* Versionar API usnado el prefijo: `/api/v1/...`
* Seguridad por defecto: auth, validación, rate limit, CORS (cuando aplique).

#### Contenido

Agrupar las rutas por módulo
Definir prefijo consistente para cada módulo

#### API REST

En API REST no se usan verbos en la URL; el verbo va en el método HTTP.
    
| Acción  | Método | Path |
| --------| ------ | ---- |
| Listar alumnos                   | GET    | `/api/v1/alumnos`                          |
| Crear alumno                     | POST   | `/api/v1/alumnos`                          |
| Ver detalle                      | GET    | `/api/v1/alumnos/:alumnoId`                |
| Actualizar parcial               | PATCH  | `/api/v1/alumnos/:alumnoId`                |
| Eliminar                         | DELETE | `/api/v1/alumnos/:alumnoId`                |
| Iinscribir a materia | POST   | `/api/v1/alumnos/:alumnoId/materias`       |
| Buscar con filtros               | GET    | `/api/v1/alumnos?ingreso=2020&activo=true` |


    
* Implementar paginación: `?page=1&per_page=20; incluye meta.total, meta.pages`.
* Para orden y filtros: `?order_by=nombre&order=asc&ingreso=2020`.
* Realizar validaciones con validadores de esquemas, por ejemplo con librerías como zod o yup por ruta, nunca confiar todas las validaciones al front.
* Implementar manejo de errores claros, mínimamente contemplar los siguientes: 400/401/403/404/409/422/429/500.

#### Sequelize
    
* Nombre de instancia: descriptivo y constante.
* Archivo: src/db/sequelize.ts (o /database).
* Pasar opciones como objeto al constructor.
* Credenciales por ENV (nunca en código).
* Activar/desactivar logging por entorno.
* Definir pool y timezone si aplica.
* No usar sync({ force: true }) en producción

Ejemplo:

``` javascript
// src/db/sequelize.ts
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(process.env.DB_NOMBRE!, process.env.DB_USUARIO!, process.env.DB_PASS!, {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  dialect: 'postgres',
  logging: process.env.DB_LOG_SQL === 'true' ? console.log : false, // logs controlados
  pool: { max: 10, min: 0, idle: 10000 },
});
```
En modelos:
    
* PascalCase singular (Alumno, Materia); tableName en snake_case plural (alumnos, materias).
* Definir atributos con tipos precisos y `allowNull, defaultValue, validate`.
* Soft delete con `paranoid: true` cuando el dominio lo requiera.
* Índices en migraciones (FKs, campos de filtro/orden).
* Asociaciones explícitas en un archivo central o por modelo.


Ejemplo:

``` typescript
// src/models/Alumno.ts
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '@/db/sequelize';

export class Alumno extends Model {
  declare id: number;
  declare nombre: string;
  declare correo: string;
  declare activo: boolean;
}

Alumno.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  correo: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  sequelize,
  modelName: 'Alumno',
  tableName: 'alumnos',
  paranoid: true, // soft delete
  underscored: true, // columnas snake_case: created_at, updated_at
});
```

Relaciones: 
Declarar relaciones entre modelos en un archivo separado: `associations`, para evitar dependencias circulares.
    
Ejemplo:
``` typescript
// src/models/associations.ts
import { Alumno } from './Alumno';
import { Materia } from './Materia';

export function associateModels() {
  Alumno.belongsToMany(Materia, { through: 'alumno_materia', foreignKey: 'alumno_id', otherKey: 'materia_id' });
  Materia.belongsToMany(Alumno, { through: 'alumno_materia', foreignKey: 'materia_id', otherKey: 'alumno_id' });
}
```
    
#### Formularios

Estructura

* Encabezados claros por sección `<h2>, <h3>`.
* Orden intuitivo (de lo general a lo específico; de obligatorio a opcional).
* Agrupar campos relacionados (`fieldset/legend`).
* Botones visibles y con acción clara (primario: enviar, secundario: cancelar).

Legibilidad

* Etiquetas `<label>` claras y concisas; evita jerga.
* Siemplre incluir placeholders informativos, no reemplazan la etiqueta.
* Siempre incluir ayuda contextual: hints/badges/tooltips cerca del campo.
* Para formatos especificos (teléfono, RFC, fechas) incluir ejemplos (“ej: 2025-10-22”).
    
Diseño

* Layout limpio y consistente (grid de 12 col., espaciado regular).
* Contraste suficiente (WCAG AA mínimo).
* Estados visibles: focus/hover/disabled/error/success.
* Evitar exceso de gráficos; priorizar velocidad y claridad.
* Responsivo (móvil primero) cuando el sistema no esté definido como Desktop only.

Comportamiento

* Implementar siempre validación inmediata (onBlur/onChange) y al enviar.
* Mensajes de error amigables y accionables (“El correo no tiene formato válido”).
* Deshabilitar botón de envío mientras se envía (para evitar doble submit).
* Incluir spinner o feedback durante procesos.
* Atajos de teclado (Enter envía, Esc cancela) cuando tenga sentido.

#### Ejemplo:

``` typescript
<script setup lang="ts">
import { ref } from 'vue';
const correo = ref(''); const errorCorreo = ref<string | null>(null);
function validarCorreo() {
  errorCorreo.value = /\S+@\S+\.\S+/.test(correo.value) ? null : 'Correo inválido';
}
</script>

<template>
  <label for="correo">Correo electrónico</label>
  <input id="correo" type="email" v-model="correo" @blur="validarCorreo" :aria-invalid="!!errorCorreo" :aria-describedby="errorCorreo ? 'err-correo' : undefined" />
  <p v-if="errorCorreo" id="err-correo" role="alert">{{ errorCorreo }}</p>
</template>

```
### Vistas

Todas las vistas declaradas en el sistema deberán seguir las siguientes especificaciones
    
#### Convenciones de nombre

* kebab-case
* En español
* Nombre descriptivo sin importar el largo
* En minúsculas

#### Contenido

* Motores de plantillas: Vue/React recomendado, o Handlebars en proyectos más sencillos.
* Utilizar herencia o Layouts para cabeceras, pie de página, navegación, cualquier elemento en general que se repite de forma constante en las diferentes secciones del sistema.
* Mantener la lógica de UI en componentes.
* Mantener la lógica de dominio en servicios/stores (nunca en la vista).

### Generalidades

#### Seguridad

* XSS: nunca interpolar HTML sin sanitizar. Usar textContent / bindings seguros.
* CSRF: tokens en formularios/headers (según backend).
* CSP recomendada (evitar unsafe-inline/eval).
* CORS: restringir orígenes, métodos y headers necesarios.
* Escapar datos al renderizar (especialmente de usuario).
* Dependencias: auditar con npm audit/pnpm audit y actualizar.

#### Rendimiento

* Code splitting y lazy loading para rutas y componentes.
* Caching (HTTP cache, SW/Workbox si aplica).
* Imágenes optimizadas (formatos modernos: WebP/AVIF; tamaños responsivos).
* Memorización de cálculos costosos; evitar renders extra (keys estables).
* Virtualización de listas largas.
* Debounce/Throttle en inputs que disparan consultas.

#### Accesibilidad

* HTML semántico (main, nav, form, button).
* Focus visible y navegación con teclado.
* Texto alternativo en imágenes (alt).
* Contraste AA como mínimo.
* Mensajes de error anunciados con role="alert"

### Validaciones
    
#### Backend

Esquemas por ruta (endpoint)
* Toda ruta que reciba datos debe tener un esquema de validación asociado (Zod o Yup).
* Estos esquemas definen los tipos, rangos, formatos y valores permitidos para cada campo.
* Si los datos no cumplen las reglas, la petición debe detenerse inmediatamente antes del controlador.

Preferencia de herramienta
* Zod → recomendado en proyectos con TypeScript, ya que genera tipos automáticamente.
* Yup → opción alternativa para proyectos en JavaScript o formularios React/Vue.
* Ambas deben ser usadas como middleware para centralizar la validación.

Errores consistentes
* Todas las respuestas de error deben seguir un formato uniforme.
* Los errores de validación deben devolver el código HTTP 422 (Unprocessable Entity).
    
Autenticación y Autorización
* Toda ruta protegida debe requerir un token JWT válido (o sesión autenticada).
* Implementar verificación de expiración y rotación de tokens cuando aplique.
* Definir roles o permisos asociados a cada endpoint (por ejemplo: ADMIN, SUPERVISOR, CLIENTE).
* Negar acceso con 403 Forbidden si el usuario no tiene privilegios suficientes.

    
#### Frontend
    
Validación previa al envío
* Validar formularios en el navegador (HTML5 + JS).
* Mostrar errores antes de que el usuario presione “Enviar” o mientras completa los campos.
* Ejemplo: usar required, type="email", min, max y pattern en inputs HTML.

Validación con librerías
* En formularios complejos, usar Yup o Zod para la validación en tiempo real.
* Integrar con React Hook Form, Formik o VeeValidate (Vue), si se usa alguno de estos frameworks.
* Mantener los mensajes de error localizados y legibles (en español).

Sanitización y seguridad

* Sanitizar entradas del usuario: 
    Eliminar etiquetas HTML, scripts o caracteres peligrosos antes de mostrarlos en la interfaz.
* Nunca usar innerHTML con datos externos.
* Escapar valores interpolados en JSX o plantillas.
* Evitar ataques XSS (Cross-Site Scripting):
    Desactivar HTML dinámico no confiable.
* Utilizar librerías seguras como DOMPurify para limpiar contenido HTML.
* Evitar inyección SQL: 
    Aunque el frontend no ejecuta SQL directamente, no debe permitir manipular consultas o parámetros enviados al backend. 
    Siempre enviar datos limpios, validados y de tipos esperados.

## Móvil
    
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

    
## Rendimiento

En este apartado se especifican las buenas prácticas a seguir para garantizar un rendimiento adecuando tanto en frontend como en backend. 
    
### Prácticas de rendimiento Frontend (JS/TS)

Objetivo: asegurar tiempos de carga rápidos, minimizar trabajo en el main thread, y entregar una UX fluida validada por Lighthouse.

#### Metas numéricas

Core Web Vitals

* LCP (Largest Contentful Paint): ≤ 2.5 s
* INP (Interaction to Next Paint): ≤ 200 ms
* CLS (Cumulative Layout Shift): ≤ 0.10
    
Métricas de Lighthouse
* FCP (First Contentful Paint): ≤ 1.8 s
* TBT (Total Blocking Time): ≤ 200 ms
* Speed Index: ≤ 3.4 s

Nota: LCP/INP/CLS son prioridad (impactan ranking y UX). TBT es un buen proxy de INP en Ligthhouse.

#### Validación con Lighthouse (cómo medir)

Revisar con Chrome DevTools → Lighthouse (modo móvil/escritorio dependiendo de la naturaleza del proyecto), seleccionando las opciones de: Performance, Best Practices de manera obligataria, la opción de Accesibility podrá ser requerida dependiendo de las particularidades del proyecto.

Umbrales objetivo: 
* Performance ≥ 90
* Best Practices ≥ 90
* Accessibility ≥ 90
* SEO ≥ 90


**IMPORTANTE: ningún merge a main (producción o UAT según corresponda) si no se consiguen los umbrales objetivo en Lighthouse**

**Overview de aspectos a considerar**
    
| Práctica | Qué significa | Acción para cumplir|
| ---------| --------------| ------------------ |
| **Elimina JS/CSS no utilizado** | Bundle con código muerto | Activa tree-shaking, `splitChunks`, revisa imports, CSS purge |
| **Evita recursos que bloquean el render** | CSS/JS críticos bloquean FCP  | `defer` scripts, critical CSS inline, `media`/`preload`|
| **Imágenes de formato next-gen** | PNG/JPEG pesados | Convertir a WebP/AVIF (+ compresión) |
| **Serve images in proper size** | Imágenes más grandes que su contenedor | `srcset`/`sizes`, generar variantes responsivas |
| **Preload key requests** | Recursos LCP tardan en comenzar | `<link rel="preload">` de LCP/Fonts críticos |
| **Reduce TBT** | Mucho trabajo en main thread | Menos JS, dividir tareas, Web Workers, lazy hydration |
| **Evitar cambios de layout (CLS)** | Saltos de contenido | Reservar espacio (`width/height`/`aspect-ratio`), carga de fuentes con `swap`, anuncios con contenedor fijo |
| **Usar `font-display`** | Bloqueo de texto | `font-display: swap/optional` |
| **Minimiza el tamaño de la carga** | Payload inicial alto | Code splitting, compresión, cache, quitar librerías pesadas|


#### Buenas prácticas por categoría
    
En esta sección se describe más a detalle las buenas prácticas que se tienen que llevar a acabo para mantener un rendimiento óptimo en nuestros sistemas.

Estas prácticas pueden revisarse en mayor profundidad en la documentación oficial de: 
    
**Carga y red**

* HTTP/2+ / HTTP/3 habilitado.
* Compresión: Brotli (estático) o Gzip; prioridad a Brotli.
* Cache-Control: Estáticos versionados: `cache-control: public, max-age=31536000, immutable.`
* HTML: `no-store` o `max-age` corto.
* Preconexiones: rel=preconnect a orígenes críticos (CDN, APIs).
* Preload de recursos críticos:
* LCP (imagen/hero):
``` html
<link rel="preload" as="image" href="/hero.webp" imagesrcset="..." imagesizes="..." fetchpriority="high">
```

* Fuentes críticas: `rel="preload" as="font" type="font/woff2"` crossorigin.
* DNS Prefetch para terceros si aplica (rel=dns-prefetch).

**JavaScript (tamaño y ejecución)**

* Code splitting por ruta (lazy routes/componentes).
* Árbol sacudido (tree-shaking) y eliminar JS/CSS no usado (bundle analyzer).
* Evitar tareas largas en main thread (> 50 ms): dividir trabajo, usar Web Workers si hay CPU-bound.
* Defer/async en scripts no críticos; evitar document.write.
* Terceros: cargar async/defer, limitar librerías pesadas; auditar impacto.
* Polyfills: sólo los necesarios (target navegadores soporte del proyecto).

**Imágenes**

* Formatos modernos: WebP/AVIF (fallback si hace falta).
* Responsive: srcset + sizes; nunca una sola imagen gigante.
* Lazy loading en contenido no LCP: loading="lazy" + decoding="async".
* Dimensiones fijas para evitar CLS: width/height o CSS aspect-ratio.
* Sprite/inline sólo para íconos muy pequeños; preferir SVG optimizado.

**Fuentes**

* Subconjunto (subsetting) para reducir peso.
* Preload de la/las familias críticas.
* font-display: swap o optional para evitar retrasos de texto.
* Evitar cambios de layout (CLS) por late-loading de fuentes (usa métricas similares o fallback equilibrado).

**Renderizado y CSS**

* CSS crítico inline (critical CSS) para Above-the-Fold, resto defer o media apropiado.
* Evitar @import en CSS (usa bundler).
* Reducir DOM excesivo (Lighthouse marca >1500 nodos como riesgo).
* Evitar layout thrashing: agrupar lecturas y escrituras al DOM; usar transform/opacity para animaciones (GPU).

**Datos y API**

* Batching de peticiones cuando sea posible.
* Revalidación: ETag/Last-Modified; stale-while-revalidate donde encaje.
* Prefetch condicional (hover/viewport) de datos de próxima ruta.
* Evitar bloqueo por waterfalls iniciales (encadenamientos de fetch innecesarios).

## Anexo

Referencias y documentación utilizada en la elaboración de los estándares de Media Aérea.
    
### Referencias

#### Django (Python)

* Django Official Documentation – Code Style
* PEP 8 – Style Guide for Python Code
* PEP 20 – The Zen of Python
* Django REST Framework – API Guide & Conventions
* Python Logging – Official Library Docs

#### Laravel (PHP)

* Laravel Official Documentation – Coding Style & Conventions
* PSR-1 – Basic Coding Standard (PHP-FIG)
* PSR-12 – Extended Coding Style Guide (PHP-FIG)
* Laravel – Eloquent ORM Official Docs
* Laravel – Routing Documentation
* Laravel – Validation


#### JavaScript / TypeScript

* ECMAScript Language Specification (ECMA-262)
* TypeScript Handbook – Official Docs (Microsoft)
* JavaScript Style Guide – Google
* Airbnb JavaScript Style Guide
* ESLint – Official Documentation
* Prettier – Official Documentation
* MDN Web Docs – JavaScript
* MDN Web Docs – TypeScript Reference


#### Prácticas transversales

* GitHub – Conventional Commits Specification
* Google Developer Style Guide
* W3C – Accessibility Guidelines (WCAG 2.1)
* OWASP Cheat Sheet Series – Secure Coding Practices
* ISO/IEC 25010 – Software Product Quality Model

#### IETF (Internet Engineering Task Force)

* [RFC 9113 – Hypertext Transfer Protocol Version 2 (HTTP/2)](https://datatracker.ietf.org/doc/html/rfc9113)
* [RFC 9114 – Hypertext Transfer Protocol Version 3 (HTTP/3)](https://datatracker.ietf.org/doc/html/rfc9114)
* [RFC 7932 – Brotli Compressed Data Format](https://datatracker.ietf.org/doc/html/rfc7932)

Define los estándares oficiales para la comunicación cliente-servidor moderna (HTTP/2 y HTTP/3) y los formatos de compresión (Brotli) utilizados en la optimización del tráfico web.

#### W3C – World Wide Web Consortium

* [Resource Hints – Preload, Prefetch, Preconnect, DNS-Prefetch (Working Draft)](https://www.w3.org/TR/resource-hints/)
* [HTML Living Standard – Link Types (preload, prefetch, dns-prefetch)](https://html.spec.whatwg.org/multipage/links.html#link-type-preload)

Establece las prácticas recomendadas para la carga anticipada de recursos y la optimización del rendimiento mediante resource hints definidos en el estándar HTML.

#### Google Chrome Developers


* [Lighthouse Overview](https://developer.chrome.com/docs/lighthouse/overview/)
* [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
* [Core Web Vitals](https://web.dev/vitals/)

Documentación oficial sobre las herramientas de auditoría de rendimiento, accesibilidad y SEO utilizadas para la medición de métricas críticas (LCP, INP, CLS) y su integración continua.

#### MDN Web Docs

* [HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
* [HTTP Compression (Using Brotli and Gzip)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Compression)
* [Cache-Control Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
* [Vary Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary)

Base de documentación mantenida por Mozilla, utilizada como referencia internacional para el uso correcto de cabeceras HTTP, políticas de caché y compresión de respuestas.

Web.dev – Performance Guide

* [Web.dev / Fast – Make the Web Faster](https://web.dev/fast/)
* [Web Performance Optimization Fundamentals](https://web.dev/learn/performance/)
* [Measure Performance with Lighthouse and PageSpeed Insights](https://web.dev/measure-performance/)

Guía oficial de Google Web.dev que detalla las mejores prácticas modernas para optimización del rendimiento web, medición con Lighthouse y cumplimiento de los Core Web Vitals.
###### tags: `Templates` `Documentation`