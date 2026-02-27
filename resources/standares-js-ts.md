# Estándares de Codificación Media Aérea

---
title: 'Estándares de codificación Media Áerea'
disqus: hackmd
--
Estándares de codificación Media Aérea
===

El presente documento establece los lineamientos de código para el equipo de desarrollo que se desempeñe en proyectos construidos con alguna de las siguientes tecnologías:

* JavaScript / TypeScript

Los estándares y prácticas descritas aquí buscan asegurar la calidad, la legibilidad y la mantenibilidad del código, alineándose con las mejores prácticas internacionales.

JavaScript / TypeScript
---

Las aplicaciones que se desarrollen usando JS o TS como backend, deberán **separar** su lógica de negocio de vistas/controladores, manejándola como servicios aislados que después serán consumidos por la capa correspondiente.

Estructura de carpetas sugerida para el proyecto:

```
src/
 ├─ app.ts                      # Entry point (Express, Nest, etc.)
 ├─ routes/
 │   └─ order.routes.ts         # Routes definitions
 │
 ├─ controllers/
 │   └─ order.controller.ts     # Controllers / Input interfaces
 │
 ├─ infrastructure/             # Infrastructure (ORM, external adapters)
 │   ├─ db/
 │   │   └─ models/
 │   │       └─ OrderModel.ts   # ORM Models (Sequelize, Prisma, TypeORM)
 │   └─ repositories/
 │       └─ OrderRepository.ts  # Data access implementation
 │
 ├─ application/                # Use cases / Application services
 │   └─ order/
 │       └─ OrderService.ts     # Coordinates domain + infra
 │
 ├─ domain/                     # Pure business rules (no external deps)
 │   └─ order/
 │       ├─ OrderEntity.ts      # Domain Entity
 │       ├─ OrderStatus.ts      # Value Object
 │       └─ OrderDomainService.ts # Pure business logic
```

Los proyectos que involucren JavaScript o TypeScript deberán contemplar las siguientes especificaciones:

### Generalidades

* **ES Modules** por defecto (`import`/`export`). Evitar `require()` salvo estricta necesidad de compatibilidad.
    * Node: usar `"type":"module"` en `package.json` o `module: "NodeNext"` en `tsconfig.json`.
* Estandarizar estilo y calidad con **ESLint + Prettier**.
    * Prettier formatea; ESLint se encarga de las "reglas de calidad de código".
* Utilizar `async/await` para mejor legibilidad. Evitar el uso de `.then().catch()` encadenados (callback hell).
    * No utilizar `await` dentro de bucles (loops); usar concurrencia para peticiones paralelas.
    ```javascript
    // Correct
    const results = await Promise.all(ids.map(loadStudent));
    ```
    * [`Promise.allSettled`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) para realizar peticiones sin detenerse por errores individuales.
    * Usar [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) para cancelación de peticiones.
    * Tipar siempre las promesas en TypeScript:

    ```typescript
    async function loadStudent(id: number): Promise<Student> { /* … */ }
    ```
* Seguir el **Single Responsibility Principle (SRP)** en todas las funciones.
* **Inmutabilidad:** En JS/TS los objetos se pasan por referencia. Es indispensable mantener la inmutabilidad para prevenir efectos colaterales.

    Prácticas para mantener la inmutabilidad:
    | Práctica | Ejemplo |
    | --------- | --------|
    | Usa `const` para referencias no reasignables | `const user = {...}` |
    | Usa Spread Operator | `{ ...obj, prop: newValue }`, `[...array, newItem]` |
    | Usa funciones puras | No depender de variables externas ni mutar inputs |
    | En Vue/React, **nunca mutar props o estado directamente** | Usar `setState`, `reactive` o copias |


* Todas las funciones y métodos públicos deberán documentarse utilizando **JSDoc/TSDoc** en inglés.

### Métodos (Functions/Methods)

Los métodos declarados en JavaScript y TypeScript deberán cumplir con las siguientes especificaciones:

#### Convención de nombre

* `camelCase`
* **En INGLÉS**
* Iniciar con un verbo en infinitivo que indique la acción (`get`, `set`, `fetch`, `create`, `delete`, `is`, `has`).
* Nombre descriptivo, priorizando claridad sobre longitud.
* Evitar conectores innecesarios (`And`, `With`) si no aportan claridad lógica.

#### Contenido

* **SRP:** Cada método realiza una sola acción.
* **Early Return:** Evitar anidar `if/else` (arrow code). Usar "Guard Clauses".
* Manejo de errores explícito (`try/catch` o propagación).
* **DRY:** (Don't Repeat Yourself).
* Documentación TSDoc/JSDoc en inglés.

#### Ejemplo (TypeScript)

```typescript
/**
 * Domain type for a Student.
 */
export interface Student {
  id: number;
  name: string;
  isActive: boolean;
}

/**
 * Calculates the average of a list of grades.
 * - Immutable: does not mutate the input array.
 * - Guard clauses: returns 0 if no data.
 *
 * @param {ReadonlyArray<number>} grades - List of grades (0..10).
 * @returns {number} General average (0 if empty).
 * @throws {TypeError} If the parameter is not an array.
 */
export function calculateAverage(grades: ReadonlyArray<number>): number {
  if (!Array.isArray(grades)) {
    throw new TypeError('Grades must be an array of numbers');
  }
  if (grades.length === 0) return 0;

  // Runtime validation (optional if Zod is used at boundaries)
  for (const grade of grades) {
    if (typeof grade !== 'number' || Number.isNaN(grade)) {
      throw new TypeError('All grades must be finite numbers');
    }
  }

  const total = grades.reduce((acc, grade) => acc + grade, 0);
  return total / grades.length;
}

/**
 * Fetches active students from the API.
 * - Uses async/await.
 * - Controlled error handling.
 *
 * @param {number} [limit=20] - Max results.
 * @returns {Promise<Student[]>} List of active students.
 */
export async function getActiveStudents(limit: number = 20): Promise<Student[]> {
  try {
    const res = await fetch(`/api/v1/students?active=true&limit=${encodeURIComponent(limit)}`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} while fetching active students`);
    }
    
    // Ideally, use a schema validator here (like Zod) instead of raw casting
    const payload = (await res.json()) as { data: Student[] };

    if (!payload?.data || !Array.isArray(payload.data)) {
      throw new Error('Invalid API response: missing data array');
    }

    return payload.data.filter(s => s.isActive === true);
  } catch (error) {
    console.error('[getActiveStudents] failed:', error);
    throw new Error('Unable to retrieve active students');
  }
}
```

### Variables

Las variables declaradas en JavaScript o TypeScript deberán seguir las siguientes especificaciones:

#### Convenciones de nombre

* `camelCase`
* **En INGLÉS**
* Nombre descriptivo (evitar: `data`, `tmp`, `obj`, `foo`).
* **Arrays/Colecciones en Plural:** `students`, `assignedSubjects`.
* **Booleanos con prefijos:** `isActive`, `hasErrors`, `canEdit`, `shouldRender`.
    * Ejemplo: `totalStudents`

#### Constantes

* `UPPER_SNAKE_CASE`
* Agregar comentario si es un "magic number" explicando su origen.
* **En INGLÉS**
    * Ejemplo: `MAX_RETRIES`, `API_BASE_URL`.

#### Funcionalidad
* Visibilidad adecuada (`public`, `private`, `protected`).
* Usar `const` por defecto. Usar `let` solo si habrá reasignación. **Nunca usar `var`**.
* Usar `readonly` en interfaces/clases de TypeScript para inmutabilidad.

#### Ejemplo (TypeScript)

```typescript
// Immutable catalog
export const USER_ROLES = { ADMIN: 'ADMIN', EDITOR: 'EDITOR', READER: 'READER' } as const;
export type UserRol = typeof USER_ROLES[keyof typeof USER_ROLES];

export function filterActiveStudents(students: ReadonlyArray<Student>): Student[] {
  return students.filter(s => s.isActive);
}

export class Session {
  private readonly token: string;
  private expiresAtMs: number;

  constructor(token: string, expiresAtMs: number) {
    this.token = token;
    this.expiresAtMs = expiresAtMs;
  }

  public isValid(): boolean { return this.expiresAtMs > Date.now(); }
}
```

#### Ejemplo (JavaScript)

```javascript
export const MAX_ATTEMPTS = 3;

export function getStudentNames(students) {
  if (!Array.isArray(students)) throw new TypeError('Students must be an array');
  return students.map(s => s.name);
}

export class SafeBuffer {
  #items = []; // Private field
  push(item) { this.#items.push(item); }
  snapshot() { return [...this.#items]; } // Defensive copy
}
```

### Rutas (Routes / Endpoints)

Las rutas (API REST) deberán seguir las siguientes especificaciones:

#### Convención de nombre

* `kebab-case` (URL friendly)
* **En INGLÉS**
* En minúsculas
* **Recursos en Plural** (`/students`, no `/student`)
* Identificadores inmediatamente después del recurso: `/students/:studentId`
* Sin barra (`slash`) final.
    * Correcto: `/students`
    * Incorrecto: `/students/`
* Versionado: `/api/v1/...`

#### API REST Design

Los verbos no van en la URL, se usan los métodos HTTP.

| Acción | Método | Path |
| --------| ------ | ---- |
| List students | GET | `/api/v1/students` |
| Create student | POST | `/api/v1/students` |
| Get details | GET | `/api/v1/students/:studentId` |
| Partial Update | PATCH | `/api/v1/students/:studentId` |
| Delete | DELETE | `/api/v1/students/:studentId` |
| Enroll in subject | POST | `/api/v1/students/:studentId/subjects` |
| Search/Filter | GET | `/api/v1/students?year=2020&active=true` |

* Paginación: `?page=1&per_page=20`. Respuesta debe incluir metadatos (`meta.total`, `meta.pages`).
* Validación: Usar librerías como **Zod** o **Yup** en el middleware de entrada. No confiar en el frontend.
* Status Codes correctos: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 422 (Unprocessable Entity), 500 (Server Error).

### Base de Datos (Sequelize)

*Nota: Si es un proyecto nuevo ("Greenfield"), evaluar Prisma o TypeORM. Si se usa Sequelize, seguir estas reglas:*

* Instancia: `sequelize.ts`.
* Credenciales: **Siempre** mediante variables de entorno (`process.env.DB_NAME`).
* **No usar** `sync({ force: true })` en producción.

```javascript
// src/db/sequelize.ts
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DB_NAME!, 
  process.env.DB_USER!, 
  process.env.DB_PASS!, 
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    dialect: 'postgres',
    logging: process.env.DB_LOG_SQL === 'true' ? console.log : false,
  }
);
```

**Modelos:**

* Nombre de clase: `PascalCase` y Singular (`Student`).
* Nombre de tabla: `snake_case`, Plural y **en INGLÉS** (`students`).
* Columnas: `snake_case` y **en INGLÉS** (`created_at`, `is_active`, `first_name`).

```typescript
// src/models/Student.ts
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '@/db/sequelize';

export class Student extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare isActive: boolean;
}

Student.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  isActive: { type: DataTypes.BOOLEAN, field: 'is_active', defaultValue: true },
}, {
  sequelize,
  modelName: 'Student',
  tableName: 'students', // English
  paranoid: true, // soft delete
  underscored: true, // automatically maps camelCase props to snake_case columns
});
```

### Formularios (Frontend)

Estructura y Legibilidad:
* Etiquetas `<label>` obligatorias.
* Placeholders informativos (ej: "john.doe@company.com").
* Feedback inmediato (validación onBlur/onChange).

Comportamiento:
* Deshabilitar botón de envío (`disabled`) mientras se procesa la petición (`isSubmitting`).

Ejemplo (Vue + TS):

```typescript
<script setup lang="ts">
import { ref } from 'vue';

const email = ref(''); 
const emailError = ref<string | null>(null);

function validateEmail() {
  // Simple regex for example, prefer a library like Zod
  const isValid = /\S+@\S+\.\S+/.test(email.value);
  emailError.value = isValid ? null : 'Invalid email format';
}
</script>

<template>
  <label for="email">Email Address</label>
  <input 
    id="email" 
    type="email" 
    v-model="email" 
    @blur="validateEmail" 
    :aria-invalid="!!emailError" 
    :aria-describedby="emailError ? 'err-email' : undefined" 
  />
  <p v-if="emailError" id="err-email" role="alert" class="error-msg">
    {{ emailError }}
  </p>
</template>
```

### Vistas

Las vistas declaradas en el sistema deberán seguir las siguientes especificaciones:

#### Convenciones de nombre

* `kebab-case`
* **En INGLÉS** (para alinearse con las rutas y componentes).
    * Ejemplo: `edit-profile.vue`, `student-list.tsx`.

#### Contenido

* Mantener la lógica de UI en componentes.
* Lógica de negocio en stores/hooks/services.

### Validaciones & Seguridad

#### Backend
* **Esquemas por ruta:** Usar **Zod** (recomendado para TS) o Yup.
* Si el payload no cumple el esquema, retornar `422 Unprocessable Entity`.
* **Autenticación:** JWT en Headers (`Authorization: Bearer <token>`).

#### Frontend
* **Sanitización:** Usar librerías como `DOMPurify` si se debe renderizar HTML. Nunca usar `innerHTML` con datos de usuario sin sanitizar.
* **XSS:** Evitar interpolación insegura.
* **Validación:** Validar en el cliente para UX, pero **nunca** confiar en ello para seguridad; el backend es la fuente de la verdad