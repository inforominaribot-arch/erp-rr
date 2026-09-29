# ERP RR — Arquitectura del Sistema

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + React + Tailwind CSS |
| Componentes UI | shadcn/ui + TanStack Table |
| Validación | TypeScript + Zod (End-to-End) |
| Backend | Next.js Server Actions & Route Handlers |
| ORM | Prisma ORM |
| Base de datos | Supabase (PostgreSQL) |
| Offline / PWA | next-pwa (Service Worker) + IndexedDB |
| PDF | @react-pdf/renderer |
| Calendario | FullCalendar (React) |
| Gráficos | Recharts |
| Íconos | lucide-react |
| Tema | next-themes |

## Estructura de Carpetas

```
erp-rr/
├── docs/
│   ├── ARCHITECTURE.md         ← Este archivo
│   └── SYSTEM_STATE.md         ← Estado actual de módulos
├── .antigravity/
│   └── rules                   ← Protocolo para todos los chats
├── prisma/
│   └── schema.prisma           ← Schema completo de BD
├── src/
│   ├── app/
│   │   ├── (auth)/             ← Login, registro (sin sidebar)
│   │   │   └── login/
│   │   └── (dashboard)/        ← Todo el ERP (con sidebar)
│   │       ├── layout.tsx      ← Layout con Sidebar + Header
│   │       ├── page.tsx        ← Dashboard principal
│   │       ├── clientes/
│   │       ├── mediciones/
│   │       ├── presupuestos/
│   │       ├── comandas/
│   │       ├── produccion/
│   │       ├── stock/
│   │       ├── proveedores/
│   │       ├── instalaciones/
│   │       └── metricas/
│   ├── components/
│   │   ├── ui/                 ← Componentes shadcn/ui (NO modificar)
│   │   └── shared/             ← Componentes propios reutilizables
│   │       ├── layout/
│   │       │   ├── Sidebar.tsx
│   │       │   ├── Header.tsx
│   │       │   └── PageHeader.tsx
│   │       ├── tables/
│   │       ├── forms/
│   │       └── cards/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       ← Cliente browser
│   │   │   ├── server.ts       ← Cliente server
│   │   │   └── middleware.ts
│   │   ├── prisma.ts           ← Cliente Prisma singleton
│   │   └── utils.ts            ← cn() y utilidades globales
│   ├── types/
│   │   └── index.ts            ← Tipos TypeScript globales
│   └── modules/
│       ├── clientes/
│       ├── mediciones/
│       ├── presupuestos/
│       ├── comandas/
│       ├── produccion/
│       ├── stock/
│       ├── proveedores/
│       ├── instalaciones/
│       └── metricas/
```

## Convenciones de Código

### Nomenclatura
- **Archivos**: kebab-case (`cliente-form.tsx`)
- **Componentes**: PascalCase (`ClienteForm`)
- **Variables/funciones**: camelCase (`obtenerClientes`)
- **Constantes**: UPPER_SNAKE_CASE (`ESTADOS_PRESUPUESTO`)
- **Tipos/Interfaces**: PascalCase con prefijo I para interfaces (`ICliente`)

### Server Actions
- Ubicar en `src/modules/<modulo>/actions.ts`
- Siempre validar con Zod antes de tocar la BD
- Siempre retornar `{ success: boolean, data?: T, error?: string }`

### Componentes
- Componentes de página: en `src/app/(dashboard)/<modulo>/`
- Componentes reutilizables del módulo: en `src/modules/<modulo>/components/`
- Componentes globales reutilizables: en `src/components/shared/`

### Variables de entorno
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=          ← Con pgBouncer (para Prisma en prod)
DIRECT_URL=            ← Conexión directa (para migraciones)
```

## Paleta de Colores (Tema)

```css
/* Primario - Índigo/Violeta */
primary: #6366f1    (indigo-500)
primary-dark: #4f46e5 (indigo-600)

/* Fondo */
background: #f8fafc  (slate-50)
surface: #ffffff

/* Texto */
text-primary: #0f172a  (slate-900)
text-secondary: #64748b (slate-500)

/* Bordes */
border: #e2e8f0  (slate-200)

/* Estados */
success: #22c55e (green-500)
warning: #f59e0b (amber-500)
danger:  #ef4444 (red-500)
```

## Roles y Permisos

| Rol | Código |
|---|---|
| Admin General | `ADMIN_GENERAL` |
| Administración | `ADMINISTRACION` |
| Taller | `TALLER` |
| Instalación | `INSTALACION` |

Los permisos específicos por módulo se definen en cada chat de módulo.

## Reglas Importantes

1. **NUNCA** instalar nuevas dependencias sin revisar si ya existe algo equivalente
2. **SIEMPRE** usar Prisma para consultas a BD (no SQL directo)
3. **SIEMPRE** validar datos de entrada con Zod
4. **Los módulos** solo modifican sus propias carpetas
5. **Los componentes shared** son responsabilidad de todos — si modificás uno, avisá en SYSTEM_STATE.md
