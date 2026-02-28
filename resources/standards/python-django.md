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

> [**NOTA**: Los métodos internos o no públicos son métodos usados únicamente dentro de la clase or módulo. Su uso externo no está recomendado, ya que puede modificarse sin previo aviso, es por esto que se identifican con el prefijo del "_".]


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
