# Integración con el backend real

Estado: frontend conectado a `https://uzdi-backend-api.onrender.com/api/v1`. Swagger de referencia: <https://uzdi-backend-api.onrender.com/api/docs>. Contrato descargado en `docs/swagger.json`.

## 1. Configuración

Copiar `.env.example` a `.env` y mantener:

```env
VITE_API_URL=https://uzdi-backend-api.onrender.com/api/v1
VITE_USE_MOCK=false
```

- `VITE_API_URL` ya incluye `/api/v1`; no agregarlo dos veces.
- Si aún no existe `VITE_API_URL`, se acepta `VITE_API_BASE_URL` temporalmente.
- No subir `.env` ni tokens al repositorio.
- En Render free la primera petición puede tardar 30–40 s; el cliente espera 60 s y muestra aviso a los 5 s.
- En PowerShell usar `npm.cmd` y `curl.exe`.

## 2. Cómo probar

```bash
npm install
npm.cmd run build
npm run dev       # http://localhost:5174
```

Verificación rápida con curl; reemplazar `<clave-provista-por-el-equipo>` por la contraseña real, sin guardarla en archivos:

```bash
curl.exe -sS -X POST "https://uzdi-backend-api.onrender.com/api/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"login\":\"admin\",\"password\":\"<clave-provista-por-el-equipo>\"}"

curl.exe -sS "https://uzdi-backend-api.onrender.com/api/v1/auth/me" -H "Authorization: Bearer <token>"
curl.exe -sS "https://uzdi-backend-api.onrender.com/api/v1/adolescente" -H "Authorization: Bearer <token>"
curl.exe -sS "https://uzdi-backend-api.onrender.com/api/v1/expediente" -H "Authorization: Bearer <token>"
curl.exe -sS "https://uzdi-backend-api.onrender.com/api/v1/medida-expediente" -H "Authorization: Bearer <token>"
curl.exe -sS "https://uzdi-backend-api.onrender.com/api/v1/historial" -H "Authorization: Bearer <token>"
```

La respuesta correcta usa el envelope `{ ok, message, data, timestamp }`; el error usa `{ ok:false, statusCode, message, errors, path, timestamp }`.

## 3. Servicios conectados

| Servicio / vista | Cliente | Endpoint o origen | Observación |
| --- | --- | --- | --- |
| `auth.service.ts`, `LoginView.vue` | `api` | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/change-password` | JWT en `Authorization: Bearer`. `change-password` envía `currentPassword`/`newPassword`. |
| `access.ts`, `useAuth.ts` | local | `perfil.codigo` | `ADM` se muestra como administración; no se mapea por id. No existe perfil `Superadministrador`. |
| `usuario.service.ts`, `UsuariosView.vue` | `api` | `GET/POST/PATCH/DELETE /users`, `GET /users/{id}/perfiles` | Roles reales desde `/perfiles`; `estado` → `activo`. Cédula/cargo se muestran `—`. |
| `usuario.service.ts` | `apiMock` | `POST /users/{id}/reset-password` | `PENDIENTE BACKEND`: no existe en Swagger. |
| `catalogo.service.ts`, `useCatalogos.ts` | `api` | `/nacionalidad`, `/estado-civil`, `/etnia`, `/gdo`, `/canton`, `/provincia`, `/uzdi`, `/infraccion`, `/medida-socioeducativa` | `estado` → `activo`; `prov_id` como filtro de cantones; `cntn_id` para UZDI; `incluirInactivos` para infracciones/medidas. |
| `directorio.service.ts` | `api` + fallback | `GET /users/search?q=@` | `PENDIENTE BACKEND`: no existe `/directorio`. Con datos reales solo coincide el usuario con `@`; se necesita endpoint propio. |
| `adolescente.service.ts`, `AdolescentesView.vue` | `api` | `GET/POST/PATCH/DELETE /adolescente` | DTO real con `fecha_ingr`, FKs de catálogos y `estado`/`activo`. Falta `uzdi_id`. |
| `expediente.service.ts`, `ExpedientesView.vue` | `api` | `GET/POST/PATCH/DELETE /expediente` | DTO real: `adlc_id`, `uzdi_id`, `infc_id`, `numero_causa`, `estado_procesal`, `observaciones`. |
| `registry.ts` → asignaciones | `api` | `GET/POST/PATCH/DELETE /medida-expediente` | Requiere `expe_id`, `mdso_id`, `orden`, `fecha_inicio`. Alias mock antiguo `/asignacion-medida`. |
| `registry.ts` → medidas | `api` | `GET/POST/PATCH/DELETE /medida-socioeducativa` | Campo `descripcion` pendiente de backend; no se envía. |
| `uzdi.service.ts`, `UZDI` en registry | `api` | `GET/PATCH /uzdi/{id}`, CRUD `/uzdi` | Sin doble unwrap. No se envía `provincia_id`; se deriva de `cntn_id`. |
| `bitacora.service.ts`, `BitacoraView.vue`, `DashboardView.vue` | `api` | `GET /historial` | Sanitizado: se muestran acción, entidad, id y descripción; nunca `estadoAnterior`/`estadoNuevo`. |
| `ParametrosView.vue` | `api` para UZDI, `apiMock` para parámetros | `GET/PATCH /uzdi/{id}`, `GET/PATCH /parametros` | `PENDIENTE BACKEND`: `/parametros`. |
| `PermisosView.vue` | `apiMock` | `GET/PUT /permisos/:rol` | `PENDIENTE BACKEND`: matriz módulo → acciones. |
| `InformesView.vue` | `apiMock` | `POST /informe-tecnico` | `PENDIENTE BACKEND`. |
| `ReportesView.vue` | `apiMock` | `/representante`, `/taller`, `/asistencia-taller`, `/reporte/descarga` | `PENDIENTE BACKEND`. Exportación real disponible: `/reportes/export/excel`, `/reportes/export/pdf`. |
| Módulos del registry marcados abajo | `apiMock` | rutas listadas en `MOCK_ONLY_PATHS` | Se mantienen visibles con datos ficticios hasta que existan endpoints. |

### Rutas deliberadamente en mock

Configuradas en `src/services/crud.service.ts` (`MOCK_ONLY_PATHS`) y en servicios puntuales, siempre con comentario `PENDIENTE BACKEND`:

- `/representante`, `/vinculo-representante`.
- `/contexto-familiar/intervencion`, `/contexto-familiar/ficha`.
- `/ficha-psicologica`, `/informacion-educativa`, `/alerta-salud`, `/asignacion-caso`.
- `/taller`, `/asistencia-taller`.
- `/documento`, `/informe-tecnico`, `/parametros`.
- `/permisos/:rol`, `/users/{id}/reset-password`, `/reporte/descarga`.

No se usan mocks para rutas que sí existen: autenticación, usuarios, catálogos, adolescentes, expedientes, medidas, UZDI, historial, perfil ni reportes reales.

## 4. Datos de prueba

Durante la verificación se crearon:

- Adolescente id `8`, cédula ficticia `9999000001`.
- Expediente id `6`, `numero_causa: PRUEBA-INT-001`.

Ambos fueron dados de baja con `DELETE /adolescente/8` y `DELETE /expediente/6` el 2026-11-23. No se conservan contraseñas ni tokens en el repositorio.

## 5. Resumen de cambios por archivo

| Archivo | Cambio principal |
| --- | --- |
| `.env.example`, `README.md` | URL real, modo mock desactivado, avisos de Render y PowerShell. |
| `src/services/api.ts` | Base URL, timeout, unwrap del envelope, `ApiError`, `mensajeError`, aviso de conexión lenta, logout en 401, `apiMock`, re-export de `USE_MOCK`. |
| `src/router/access.ts` | Mapeo `perfil.codigo` ↔ rol front y `tppr_id`. |
| `src/services/auth.service.ts` | Login/perfil/logout/cambio de clave reales. |
| `src/composables/usePermisos.ts` | Permisos con `apiMock` hasta que exista el endpoint. |
| `src/views/LoginView.vue` | Errores centrales y aviso de conexión lenta. |
| `src/services/usuario.service.ts`, `src/views/UsuariosView.vue` | Usuarios y perfiles reales; reset-password mock; sin cédula/cargo. |
| `src/services/catalogo.service.ts`, `src/composables/useCatalogos.ts` | Catálogos reales normalizados y errores visibles. |
| `src/services/adolescente.service.ts` | DTO real y normalización `estado`/`activo`. |
| `src/services/expediente.service.ts`, `src/views/ExpedientesView.vue` | Expedientes reales, estados reales y aliases de solo presentación. |
| `src/entities/registry.ts` | Medidas y asignaciones reales; sin `descripcion`; campos UZDI/CANTON corregidos. |
| `src/components/crud/ModulePanel.vue` | Valores iniciales y conversión numérica. |
| `src/services/crud.service.ts` | CRUD genérico con selección explícita `api`/`apiMock` y normalización `estado` → `activo`. |
| `src/services/mock/adapter.ts` | Alias `/medida-expediente`, `/canton` y `/uzdi`; solo para compatibilidad/demo. |
| `src/services/directorio.service.ts` | Directorio vía `/users/search?q=@`. |
| `src/services/uzdi.service.ts` | Respuesta directa sin doble `data`. |
| `src/services/bitacora.service.ts` | Historial real sanitizado y fallback mock. |
| `src/views/BitacoraView.vue`, `src/views/DashboardView.vue` | Historial y módulos sensibles conectados según disponibilidad. |
| `src/views/PermisosView.vue`, `src/views/ParametrosView.vue`, `src/views/InformesView.vue`, `src/views/ReportesView.vue` | Rutas inexistentes detrás de `apiMock`. |
| `src/composables/useReferencias.ts` | Error visible al fallar opciones referenciales. |
| `docs/swagger.json` | Contrato real descargado para contraste. |

## 6. Texto listo para copiar al equipo de backend

Hola equipo UZDI/SNAI:

Conectamos el frontend con el API real usando el Swagger publicado. Encontramos funcionando autenticación, usuarios, catálogos, adolescentes, expedientes, UZDI, medida socioeducativa, medida-expediente, historial, perfil y exportación de reportes. El envelope `{ ok, message, data, timestamp }` quedó claro y lo mantenemos en el cliente.

Para terminar la integración sin mocks, necesitamos confirmar o incorporar:

1. `GET /directorio` con búsqueda por texto, UZDI, perfil y estado. Hoy usamos `/users/search?q=@` como solución temporal, pero con los datos actuales solo devuelve al usuario administrador.
2. `GET /users/{id}/cedula` y `GET /users/{id}/cargo`, o incluir `cedula` y `cargo` en `GET /users`. El frontend muestra `—` hasta que existan.
3. `POST /users/{id}/reset-password` que devuelva o envíe la contraseña temporal.
4. `POST /auth/change-password` ya quedó mapeado con `currentPassword` y `newPassword`; agradeceríamos confirmar el comportamiento para `debe_cambiar_clave`.
5. Perfil `Superadministrador` o autorizar el mapeo actual de `ADM` a administración en el frontend.
6. Incluir `uzdi_id` en el DTO de adolescente, o confirmar si debe derivarse del usuario autenticado.
7. Incluir `descripcion` en `CreateMedidaSocioeducativaDto`, `UpdateMedidaSocioeducativaDto` y la respuesta GET. Hoy el formulario no los envía.
8. Para expedientes: confirmar si se incorporarán `juzgado`, `defensor`, `fecha_apertura`, `fecha_cierre`, `fecha_inicio_medida`, `fecha_fin_medida` y `mdso_id`, o si esos datos pasarán a otra entidad. El frontend los quitó del formulario para no enviar campos rechazados.
9. `GET/PUT /permisos/{rol}` con matriz módulo → `{ view, create, edit, deactivate }`.
10. Endpoints de configuración y fichas: `/parametros`, `/ficha-psicologica`, `/contexto-familiar/ficha`, `/contexto-familiar/intervencion`, `/informacion-educativa`, `/alerta-salud`, `/asignacion-caso`, `/representante`, `/vinculo-representante`, `/taller`, `/asistencia-taller`, `/documento`, `/informe-tecnico`.
11. Contrato de descarga/reporte: hoy hay `/reportes/export/excel` y `/reportes/export/pdf`, pero el front también registra `/reporte/descarga` como mock. ¿Debemos unificar en `/reportes/export/*`?
12. Para bitácora usamos `GET /historial` y mostramos solo acción, entidad, id y descripción. No mostramos `estadoAnterior` ni `estadoNuevo` porque pueden contener datos sensibles de adolescentes. ¿Pueden confirmar que esos campos seguirán disponibles solo para auditoría internamente?

Quedamos atentos a los códigos/exactitudes de los campos marcados como pendientes. El frontend ya compila con `npm.cmd run build` y los módulos sin backend están aislados con `apiMock` y comentarios `PENDIENTE BACKEND`.
