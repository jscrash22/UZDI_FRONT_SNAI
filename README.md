# UZDI_FRONT — Frontend Vue 3

Aplicación frontend del Sistema de Gestión Integral UZDI. Construida con Vue 3, TypeScript y Vite.

---

## Stack

| Dependencia | Rol |
| --- | --- |
| Vue 3.5 + TypeScript | Framework reactivo con `<script setup>` y Composition API |
| Vite 8 | Bundler y servidor de desarrollo con HMR |
| Vue Router 4 | Enrutamiento SPA con guards de autenticación |
| axios | Cliente HTTP con interceptor JWT automático |
| @lucide/vue | Íconos SVG como componentes Vue |

---

## Estructura

```text
src/
├── main.ts                     # Punto de entrada
├── App.vue                     # Componente raíz (RouterView)
├── design-system.css           # Tokens CSS y clases globales
├── router/                     # Rutas, matriz RBAC y guard
├── layouts/AppShell.vue        # Sidebar, topbar y búsqueda global
├── views/                      # Login, dashboard, módulos y configuración
├── components/
│   ├── crud/                   # ModulePanel para módulos declarativos
│   ├── dashboard/              # Gráficos, skeleton y accesos rápidos
│   ├── ui/                     # Modales, estados vacíos, toasts y formularios
│   └── reportes/               # Parámetros, tabla y gráfico de reportes
├── entities/registry.ts        # Definición declarativa de módulos CRUD
├── services/                   # Servicios REST y adaptador mock
├── composables/                # Sesión, permisos, catálogos, inactividad y toasts
├── config/                     # Seguridad y valores pendientes del SNAI
└── utils/                      # Validadores de cédula, correo, teléfono y fechas
```

---

## Rutas

```text
/                   → redirect /login
/login              → LoginView
/app/dashboard      → DashboardView
/app/adolescentes   → AdolescentesView
/app/representantes → RepresentantesView
/app/contexto-familiar, /app/alertas-salud, /app/fichas, /app/educacion,
/app/talleres, /app/asistencia-talleres, /app/documentos, /app/gdos,
/app/asignacion-casos, /app/uzdi, /app/perfiles → ModuleView
/app/expedientes    → ExpedientesView
/app/medidas        → MedidasView
/app/catalogos      → CatalogosView
/app/reportes       → ReportesView
/app/informes       → InformesView
/app/bitacora       → BitacoraView
/app/permisos       → PermisosView
/app/usuarios       → UsuariosView
/app/parametros     → ParametrosView
/app/perfil         → PerfilView
```

El guard redirige a `/login` sin sesión y aplica la matriz de acceso por módulo y acción. Una ruta no autorizada vuelve al dashboard con un aviso.

---

## Control de acceso (RBAC)

| tppr_id | Rol |
| --- | --- |
| 1 | Trabajador/a Social |
| 2 | Coordinador/a de área |
| 3 | Administrador/a |
| 4 | Superadministrador/a |
| 5 | Usuario (sin módulos, conservado por compatibilidad) |
| 6 | Psicólogo/a |
| 7 | Educador/a |
| 8 | Jurídico |

La matriz `MODULE_ACCESS` de `src/router/access.ts` define las acciones `view`, `create`, `edit` y `deactivate` por rol. El menú, los accesos rápidos y los botones de cada vista usan la misma matriz.

---

## Design System

`design-system.css` define todas las variables CSS y clases globales. No usa ningún framework de UI externo.

**Variables principales:**

```css
--color-brand-blue
--color-brand-blue-light
--color-surface / --color-surface-mute / --color-surface-soft
--color-text-primary / --color-text-secondary / --color-text-muted
--color-border
--color-success / --color-success-bg
--color-error / --color-error-bg
--radius-sm / --radius-md / --radius-lg / --radius-xl / --radius-full
```

**Clases globales de uso frecuente:**

| Clase | Uso |
| --- | --- |
| `.page` | Contenedor raíz de cada vista |
| `.hero` | Cabecera de página con eyebrow, título y descripción |
| `.card` | Panel con borde, radio y sombra suave |
| `.tbl` | Tabla con cabecera, hover por fila y badges |
| `.badge` + tono | Pill coloreado: `green`, `amber`, `red`, `slate`, `blue` |
| `.btn` / `.btn-primary` / `.btn-ghost` | Botones con variantes y `:active` |
| `.btn-sm` | Variante compacta para acciones en tabla |
| `.f-ctl` / `.f-label` / `.f-err` | Inputs, selects y textareas del sistema de formularios |
| `.modal` `.sm/.md/.lg` | Modal con backdrop oscuro |
| `.sk` | Skeleton shimmer para estados de carga |
| `.tool-search` / `.tool-select` | Barra de herramientas de filtros |

---

## Autenticación

El token JWT se guarda en `localStorage` bajo la clave `uzdi_token`. El composable `useAuth()` expone:

- `token` — ref con el token actual
- `user` — ref con los datos del usuario logueado
- `isLoggedIn` — computed boolean
- `setSession(token, user)` — guarda sesión
- `logout()` — limpia localStorage y refs

El servicio `api.ts` añade automáticamente `Authorization: Bearer <token>` a todas las peticiones axios.

---

## Modo demo

Con `VITE_USE_MOCK=true` el adaptador de `src/services/mock/` responde las mismas rutas REST que el backend. Los datos viven en memoria y se reinician al recargar.

Usuarios demo: `superadmin`, `admin`, `coordinador`, `tsocial`, `psicologo`, `educador`, `juridico`, `tsocial.gye`.

Contraseña: `Snai2026`.

Con `VITE_USE_MOCK=false` se usa `VITE_API_URL` (incluye `/api/v1`). El backend real está en Render; la primera petición puede tardar 30–40 s. Los módulos cuyo endpoint aún no existe usan el mock de forma explícita (`apiMock`).

---

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:5174
npm.cmd run build # En Windows/PowerShell: vue-tsc + vite build
npm run preview   # Sirve el build localmente
```

El backend real se configura en `.env` con `VITE_API_URL=https://uzdi-backend-api.onrender.com/api/v1`. En modo demo no se necesita backend.

## GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` compila y publica automáticamente al hacer push a `main` o `master`.

1. Subir el proyecto a un repositorio de GitHub.
2. En `Settings > Pages > Build and deployment`, elegir **GitHub Actions**.
3. Ejecutar `Actions > Deploy a GitHub Pages > Run workflow` si no hubo push inicial.

El workflow fija `VITE_API_URL`, `VITE_USE_MOCK=false`, `VITE_ROUTER_MODE=hash` y calcula `VITE_BASE` según el nombre del repo, así que funciona tanto en `usuario.github.io` como en `usuario.github.io/<repo>/`. CORS ya está habilitado en el backend para dominios `github.io`.

Documentación adicional:

- `docs/INTEGRACION_BACKEND.md`: configuración, endpoints conectados, mocks pendientes y mensaje para el equipo de backend.
- `docs/CUMPLIMIENTO.md`: estado de RF y RNF.
- `docs/PENDIENTES_SNAI.md`: decisiones configurables pendientes de validación.
