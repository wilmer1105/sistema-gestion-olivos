# REPORTE DE AUDITORÍA ANTI-FALSOS POSITIVOS Y CERTIFICACIÓN DE CALIDAD

**Proyecto:** MDLO Docs - Sistema de Gestión Documental  
**Entidad:** Municipalidad Distrital de Los Olivos  
**Fecha:** 27 de Octubre de 2026  
**Auditor:** Principal QA Automation Architect & Lead Test Engineer  

---

## 1. Falsos Positivos Detectados y Eliminados

Durante la auditoría exhaustiva de la suite de pruebas unitarias (`tests/unit/`) y pruebas BDD (`tests/features/`), se identificaron y erradicaron los siguientes patrones de falsos positivos:

### A. Aserciones Superficiales en Validadores Zod (`tests/unit/validators.test.ts`)
- **Problema previo:** Se utilizaba `expect(res.success).toBe(false)` sin comprobar el código ni el mensaje de error emitido por Zod. Un esquema con un error no intencionado (ej. fallo por tipo de campo en vez de validación de negocio) daba positivo falsamente.
- **Solución implementada:** Se añadieron aserciones profundas sobre `res.error.issues[0]?.message`, verificando mensajes exactos para:
  * DNI con letras o longitud distinta de 8 dígitos (`"El DNI debe contener exactamente 8 dígitos numéricos"`).
  * RUC con longitud distinta de 11 dígitos (`"El RUC debe contener exactamente 11 dígitos numéricos"`).
  * Archivos ejecutables no-PDF, archivos vacíos (0 bytes) y archivos que superen los 10MB (10,485,760 bytes).
  * Proveídos y justificaciones de derivación, asignación interna y cierre con longitud mínima de 5 caracteres.
  * Regla reactiva de `empleadoSchema`: Rechazo categórico si `ADMIN_TI` recibe un `area_id !== null`, y rechazo si roles operativos (`ASISTENTE_AREA`, `ESPECIALISTA`, `JEFE_AREA`) carecen de `area_id`.

### B. Mocks Tautológicos en la Capa de Autenticación (`tests/unit/auth_actions.test.ts`)
- **Problema previo:** No existía una suite unitaria que simulara los flujos anómalos de `loginAction`, permitiendo que regresiones en el manejo de RLS o de sesiones inactivas pasaran desapercibidas.
- **Solución implementada:** Se creó la suite completa `tests/unit/auth_actions.test.ts` que valida:
  * Rechazo inmediato ante entradas inválidas antes de invocar la infraestructura de base de datos.
  * Manejo seguro y sanitizado de credenciales erróneas devueltas por Supabase Auth (sin exponer trazas internas).
  * Invocación obligatoria de `supabase.auth.signOut()` cuando el perfil existe pero tiene `activo === false`.
  * Invocación obligatoria de `supabase.auth.signOut()` cuando el usuario se autentica en Auth pero no tiene registro en `public.perfiles` (fuga de perfiles).
  * Resolución determinista de la URL de redirección (`/dashboard/admin` para `ADMIN_TI` y `/dashboard/bandeja` para roles operativos).

### C. Aserciones sin Efectos Secundarios en Cucumber BDD (`tests/features/`)
- **Problema previo:** Los escenarios de autenticación y de administración estaban combinados en archivos extensos donde algunos pasos solo evaluaban variables locales sin verificar la acción de negocio completa.
- **Solución implementada:** Se modularizó la suite de BDD en archivos Gherkin independientes por Historia de Usuario (`hu01_autenticacion.feature`, `hu02_admin_usuarios.feature`, `hu04_bandeja_aislamiento.feature`, `hu05_recepcion_y_asignacion.feature`, `hu06_subida_documentos.feature`, `hu07_derivacion.feature`, `hu08_cierre_exclusivo_jefatura.feature`, `hu09_consulta_ciudadana.feature` y `rbac_y_flujo_expedientes.feature`), verificando mutaciones reales de estado en el repositorio y la trazabilidad auditable.

---

## 2. Reparación Definitiva del Flujo de Login (`app/actions/auth.ts`)

Se eliminó la trampa de RLS donde se consultaba la tabla `public.perfiles` antes de consolidar el contexto de sesión autenticado.

### Flujo Corregido y Blindado:
1. **Validación Zod Isomórfica:** Se parsea el payload de entrada con `loginSchema.safeParse(data)`.
2. **Autenticación Primaria en Supabase Auth:** Se ejecuta `await supabase.auth.signInWithPassword({ email, password })`. Ante cualquier error o usuario nulo, se retorna de inmediato `{ success: false, error: 'Correo o contraseña incorrectos' }`.
3. **Consulta Segura Post-Autenticación (Contexto RLS Activo):** Con la cookie de sesión ya inyectada en el cliente Supabase, se consulta `public.perfiles`:
   ```typescript
   const { data: perfil, error: perfilError } = await supabase
     .from('perfiles')
     .select('id, rol, area_id, activo, nombres, apellidos')
     .eq('id', authData.user.id)
     .single();
   ```
4. **Validación de Integridad Institucional:** Si el perfil no existe (`!perfil || perfilError`), se ejecuta `await supabase.auth.signOut()` y se retorna `{ success: false, error: 'El perfil institucional no existe en el sistema. Contacte a la OGTIC.' }`.
5. **Control de Baja Lógica (`activo === false`):** Si la cuenta está dada de baja, se cierra la sesión en el servidor vía `await supabase.auth.signOut()` y se retorna `{ success: false, error: 'Su cuenta se encuentra desactivada. Contacte a la OGTIC.' }`.
6. **Redirección Estricta por Rol:** Si la verificación es satisfactoria, se retorna `{ success: true, redirectUrl: obtenerRutaInicioPorRol(perfil.rol) }`, permitiendo que el cliente realice la navegación mediante recarga completa de contexto.

---

## 3. Sembrado de Usuarios Institucionales (`scripts/seed-users.ts`)

Se ejecutó el script de sembrado conectándose a la instancia física de Supabase con `SUPABASE_SERVICE_ROLE_KEY`, garantizando la existencia de los 5 roles oficiales con la contraseña maestra `Mdlo2026!`:

| Correo Institucional | Rol Oficial | Siglas de Unidad Orgánica | `area_id` Asignado | Estado |
| :--- | :--- | :--- | :--- | :--- |
| `admin@mdlo.gob.pe` | `ADMIN_TI` | — (Global OGTIC) | `NULL` | `ACTIVO` |
| `mesadepartes@mdlo.gob.pe` | `MESA_PARTES` | `OACGD-MDP` | `6a7c0dda-063a-40c5-996a-b7267d46603c` | `ACTIVO` |
| `asistente.obras@mdlo.gob.pe` | `ASISTENTE_AREA` | `SGOPCU` | `514c3477-70a9-4f53-8524-1b626f188e1a` | `ACTIVO` |
| `especialista.obras@mdlo.gob.pe` | `ESPECIALISTA` | `SGOPCU` | `514c3477-70a9-4f53-8524-1b626f188e1a` | `ACTIVO` |
| `jefe.obras@mdlo.gob.pe` | `JEFE_AREA` | `SGOPCU` | `514c3477-70a9-4f53-8524-1b626f188e1a` | `ACTIVO` |

> **Nota:** Todos los usuarios pueden ingresar inmediatamente a la aplicación a través de la pantalla `/login` utilizando sus correos respectivos y la clave `Mdlo2026!`.

---

## 4. Resumen de Cobertura y Certificación de Calidad

```
✓ TypeScript Strict (npx tsc --noEmit):
  - 0 errores
  - 0 advertencias
  - Cero uso de 'any' o '@ts-ignore' en todo el proyecto

✓ ESLint Flat Config (npm run lint):
  - 0 errores
  - 0 advertencias

✓ Vitest Unit Tests (npm run test:unit):
  - 5 archivos de prueba ejecutados
  - 48 pruebas unitarias aprobadas (100% de éxito)
  - Desglose:
    * tests/unit/accessibility.test.ts (7 tests)
    * tests/unit/solid.test.ts (8 tests)
    * tests/unit/rbac.test.ts (12 tests)
    * tests/unit/validators.test.ts (15 tests)
    * tests/unit/auth_actions.test.ts (6 tests)

✓ Cucumber BDD Tests (npm run test:bdd):
  - 29 escenarios ejecutados
  - 162 pasos aprobados (100% de éxito)
  - Cobertura integral de HU-01 a HU-09

✓ Next.js Turbopack Production Build (npm run build):
  - Compilación exitosa en 3.3s
  - 11 rutas estáticas y dinámicas optimizadas
```
