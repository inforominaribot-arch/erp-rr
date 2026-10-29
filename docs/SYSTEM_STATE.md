# ERP RR — Estado del Sistema

> Actualizar este archivo al terminar cada funcionalidad en cada chat.

## Estado por Módulo

| Módulo | Chat | Estado | Última actualización |
|---|---|---|---|
| Core / Base | Chat 0 | ✅ Completo | 2026-09-28 |
| Clientes & CRM | Chat 1 | ✅ Completo | 2026-09-28 |
| App Medición (PWA) | Chat 2 | ✅ Completo | 2026-09-29 |
| Presupuestos | Chat 3 | ✅ Completo | 2026-10-26 |
| Comandas & Producción | Chat 4 | ✅ Completo | 2026-09-29 |
| Stock & Inventario | Chat 5 | ✅ Completo | 2026-09-29 |
| Proveedores & Compras | Chat 6 | ✅ Completo | 2026-09-29 |
| Agenda & Instalación | Chat 7 | ✅ Completo | 2026-09-29 |
| Dashboard & Métricas | Chat 8 | ✅ Completo | 2026-09-29 |
| Adaptación Mobile & Responsive | Chat 9 | ✅ Completo | 2026-09-30 |
| App Móvil Nativa Android (APK) | Chat 10 | ✅ Completo | 2026-09-30 |
| Visitas de Medición & Obra | Chat 11 | ✅ Completo | 2026-10-02 |

## Leyenda
- ✅ Completo
- 🟡 En progreso
- 🔴 Con errores
- ⚪ Pendiente

---

## Chat 0 — Core / Base

### ✅ Completado
- [ ] Proyecto Next.js inicializado
- [ ] Dependencias instaladas
- [ ] Schema Prisma creado (`prisma/schema.prisma`)
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] Clientes Supabase (browser + server)
- [ ] Cliente Prisma singleton
- [ ] Middleware de autenticación
- [ ] Layout base (Sidebar + Header)
- [ ] Página de Login
- [ ] Estructura de carpetas de módulos
- [ ] Archivos de contexto (ARCHITECTURE.md, SYSTEM_STATE.md)
- [ ] Reglas del workspace

### 📦 Componentes Shared disponibles
_(Completar a medida que se creen)_

| Componente | Archivo | Descripción |
|---|---|---|
| `PWARegister` | `src/components/pwa-register.tsx` | Registro del Service Worker en el cliente para habilitar modo PWA offline |
| `AvisoMedidaModificada` | `src/components/shared/aviso-medida-modificada.tsx` | Aviso "Medida modificada" para Administración con botón "Revisado" |

### 🗄️ Tablas de BD creadas
_(Completar cuando se ejecute `prisma migrate`)_

- `usuarios`
- `clientes`
- `mediciones`, `ambientes`, `items_medicion`
- `presupuestos`, `items_presupuesto`
- `comandas`, `items_comanda`
- `productos`, `movimientos_stock`
- `proveedores`, `productos_proveedores`
- `ordenes_compra`, `items_orden_compra`
- `instalaciones`, `instaladores_instalaciones`

---

## Chat 1 — Clientes & CRM

### ✅ Completado
- [x] Tipos TypeScript del módulo (`src/modules/clientes/types.ts`)
- [x] Validación Zod end-to-end (`src/modules/clientes/schemas.ts`)
- [x] Consultas Prisma de solo lectura (`src/modules/clientes/queries.ts`)
- [x] Server Actions con validación y verificación de permisos (`src/modules/clientes/actions.ts`)
- [x] Componente Badge de estados con código de colores (`src/modules/clientes/components/cliente-estado-badge.tsx`)
- [x] Formulario crear / editar cliente con validación (`src/modules/clientes/components/cliente-form.tsx`)
- [x] Tabla de clientes con búsqueda reactiva, filtro por estado y acciones (`src/modules/clientes/components/cliente-tabla.tsx`)
- [x] Tablero Pipeline / Kanban por estados (`src/modules/clientes/components/cliente-pipeline.tsx`)
- [x] Cabecera de detalle de cliente con cambio rápido de estado (`src/modules/clientes/components/cliente-detalle-header.tsx`)
- [x] Historial completo de trabajos: mediciones, presupuestos y comandas (`src/modules/clientes/components/cliente-historial.tsx`)
- [x] Importación masiva desde CSV / Excel con preview y plantilla descargable (`src/modules/clientes/components/cliente-importar-csv.tsx`)
- [x] Control de roles en layout (`ADMIN_GENERAL` y `ADMINISTRACION` con acceso total; bloqueo a `TALLER` e `INSTALACION`)
- [x] Páginas del dashboard: `/clientes`, `/clientes/nuevo`, `/clientes/[id]`, `/clientes/[id]/editar`, `/clientes/pipeline`

---

## Chat 2 — App Medición (PWA)

### ✅ Completado
- [x] Tipos TypeScript del módulo con fórmulas de taller (`src/modules/mediciones/types.ts`)
- [x] Validación Zod end-to-end (`src/modules/mediciones/schemas.ts`)
- [x] Persistencia Offline-First en IndexedDB nativo (`src/modules/mediciones/lib/offline-storage.ts`)
- [x] Service Worker PWA para cacheo de assets e instalación en tablet sin conexión (`public/sw.js` y `src/components/pwa-register.tsx`)
- [x] Web App Manifest para PWA instalable (`public/manifest.json`)
- [x] Hook de detección de conectividad Online/Offline (`src/modules/mediciones/hooks/use-network-status.ts`)
- [x] Hook de gestión y sincronización offline (`src/modules/mediciones/hooks/use-mediciones-offline.ts`)
- [x] Consultas Prisma de solo lectura con serialización Decimal (`src/modules/mediciones/queries.ts`)
- [x] Server Actions con validación Zod y transacciones (`src/modules/mediciones/actions.ts`)
- [x] Componente de Dibujo Proporcional e Interactivo con aspect ratio dinámico (`src/modules/mediciones/components/cortina-dibujo-didactico.tsx`)
  - Alineación precisa de cota superior sobre el marco de cortina.
  - Eliminación de cotas redundantes y alturas internas innecesarias.
  - Modo compacto para impresión de alta densidad en hojas A4.
- [x] Formulario ágil de cortina con Aluminio, Tradicional, Roller, Bandas, Roller Noche Total, Mosquera y **Motorizada ⚡** (`src/modules/mediciones/components/cortina-item-form.tsx`):
  - **Nuevo tipo de cortina Motorizada:**
    - 8 subtipos combinados: *Tradicional Mot*, *Tradicional Mot y Tradicional*, *Roller Mot*, *Roller Mot y Roller*, *Tradicional Mot y Roller*, *Tradicional y Roller Mot*, *Tradicional Mot y Roller Mot*, *Roller Mot y Bandas Verticales*.
    - Motores Somfy (*LSN 6/28R*, *LTN 10/28R*, *Li-ion*) y Tube (*6/28R 40mm*, *5/28R 50mm*, *li-ion*).
    - Motores para Tradicional Mot (Somfy / Tube estándar).
    - Control Remoto (SÍ / NO) con selección de canales (1, 4, 15, 16).
    - Acordeón de motorización desplegable y limpio en tablet.
  - **Marcas independientes por capa:** Marca diferenciada para Gaza (RS / HD) y B.O. (RS / HD), excluyendo confección propia de taller.
  - **Combinación cruzada Roller $\leftrightarrow$ Bandas:** Gaza y B.O. configurables independientemente como Roller o Bandas.
  - **Aluminio con Gaza delantera:** Posibilidad de sumar Gaza por delante de la persiana (Tradicional o Roller, común o motorizada) con medidas independientes.
  - **Roller Noche Total:** Opción "Sin mando" disponible en la botonera de mandos.
  - **Riel Normal o Curvo:** Configurable en Tradicional común y Tradicional Mot (por defecto Normal).
  - **Sólo tela vs Normal en Roller:** Selector individual por cada cortina/tramo (por defecto Normal).
  - Auto-balance interactivo de paños (Gaza) y cortinas/tramos (B.O.) en Tradicional respetando el ancho total ingresado.
  - Soporte hasta 5 paños / cortinas con botón discreto "+ Agregar opción" para mantener la interfaz limpia.
  - Entrada de anchos independientes para cortinas de Roller, Bandas, Roller Noche Total y Mosquera con alto compartido.
  - Soportes Roller Común / Extendido disponibles para Roller y para Tradicional con B.O. Roller.
  - Selector de Marca antes de Perfilería; la marca RS expande colores de perfilería a Blanco, Negro, Gris y Beige.
  - Perfilería configurable también en Tradicional cuando se selecciona B.O. Roller.
  - Nuevo tipo de cortina Mosquera: perfilería de Noche Total, marca fija MG, sujeción estándar y mando con opción "Sin mando" por defecto.
  - Persiana de Aluminio con opción informativa de Tensor (SÍ / NO).
  - Cálculo automático de la cantidad de cortinas para el presupuesto según combinaciones de Gaza y B.O. (individuales por mecanismo).
- [x] Gestor de ambientes y aberturas con botones sugeridos y duplicación (`src/modules/mediciones/components/ambiente-manager.tsx`)
- [x] Selector de cliente con soporte offline y Alta Express en obra (`src/modules/mediciones/components/cliente-selector.tsx` y `cliente-express-modal.tsx`)
- [x] Barra de estado de red (`src/modules/mediciones/components/network-status-bar.tsx`) y Badge de sync (`src/modules/mediciones/components/medicion-sync-badge.tsx`)
- [x] Menú de app dividido por clientes con mini resumen (`src/modules/mediciones/components/medicion-clientes-grid.tsx`)
- [x] Tabla de mediciones con búsqueda reactiva y filtros (`src/modules/mediciones/components/medicion-tabla.tsx`)
- [x] Ficha unificada de Taller y Colocación optimizada para impresión A4 de alta densidad (`src/modules/mediciones/components/medicion-detalle.tsx`)
  - Impresión multi-cortina por hoja en 2 columnas (dibujo compacto + especificaciones técnicas con Marca).
  - Claridad de fabricación: distingue confección de taller propio de componentes provistos por fábrica externa.
  - Selector de vista ("Vista Interactiva Digital" vs "Vista Previa Ficha A4").
  - Estilos de impresión `@media print` limpios sin cabeceras ni barras de navegación.
- [x] Control de roles en layout (`ADMIN_GENERAL` y `ADMINISTRACION` total; `TALLER` e `INSTALACION` solo lectura)
- [x] Páginas del dashboard: `/mediciones`, `/mediciones/nueva`, `/mediciones/[id]`, `/mediciones/[id]/editar`

---

## Chat 3 — Presupuestos

### ✅ Completado
- [x] Tipos TypeScript del módulo con formateadores y utilidades (`src/modules/presupuestos/types.ts`)
- [x] Validación Zod estricta end-to-end (`src/modules/presupuestos/schemas.ts`)
- [x] Motor de cálculo de precios y cotizaciones replicando las fórmulas del Excel de taller (`src/modules/presupuestos/lib/calculadora-precios.ts`):
  - Tradicional $\le 2.85$ m: Riel ($50k/m) + Confección ($50k/m) + Telas (Gaza x2 / BO) + Instalación ($40k por capa).
  - Tradicional Paño Invertido $> 2.85$ m: Frunce x2, cálculo de paños verticales, metros de tela con 20cm extra, 1.5 ganancia y 1.21 IVA, confección invertida $70k/m, riel $50k/m e instalación.
  - Roller RS (Rollershade): m² tela + sistema + zócalo, coeficiente comercial 1.16025 + instalación.
  - Hunter Douglas (HD): Precio USD × 1.21 IVA × 1.5 ganancia × Cotización ARS + instalación.
  - MG / Manual: Carga directa de precio cerrado para presupuestos rápidos.
- [x] Helper de permisos y roles para administración y taller (`src/modules/presupuestos/lib/auth.ts`)
- [x] Consultas Prisma de solo lectura con serialización de `Decimal` a `number` y métricas (`src/modules/presupuestos/queries.ts`)
- [x] Server Actions con transacciones seguras y actualización automática del CRM del cliente (`src/modules/presupuestos/actions.ts`)
- [x] Badge de estados con código de colores e iconos (`src/modules/presupuestos/components/presupuesto-estado-badge.tsx`)
- [x] Calculadora modal interactiva para cotizar cortinas con las fórmulas de taller (`src/modules/presupuestos/components/presupuesto-calculadora-modal.tsx`)
- [x] Botón generador de mensajes y compartir por WhatsApp (`src/modules/presupuestos/components/presupuesto-whatsapp-button.tsx`)
- [x] Modal de gestión de estados y Aceptación Parcial inteligente con checklist de cortinas aprobadas (`src/modules/presupuestos/components/presupuesto-aprobar-modal.tsx`)
- [x] Ficha de cotización formal para el cliente optimizada para impresión A4 en 1 sola hoja y guardado en PDF con membrete de ROMINA RIBOT Cortinados, desglose horizontal lado a lado, datos bancarios y nombre de archivo automático `Presupuesto - Nombre y Apellido.pdf` (`src/modules/presupuestos/components/presupuesto-imprimible.tsx`)
- [x] Formulario dinámico de creación y edición con selector de clientes, importación automática de mediciones y desglose por ambientes (`src/modules/presupuestos/components/presupuesto-form.tsx`)
- [x] Vista de detalle del presupuesto con conmutador Digital / Ficha A4 y alerta de comanda (`src/modules/presupuestos/components/presupuesto-detalle.tsx`)
- [x] Tabla interactiva con buscador en vivo, filtros por estado y acciones rápidas (`src/modules/presupuestos/components/presupuesto-tabla.tsx`)
- [x] Páginas del dashboard: `/presupuestos`, `/presupuestos/nuevo`, `/presupuestos/[id]`, `/presupuestos/[id]/editar`
- [x] Panel de alerta de mediciones pendientes de presupuestar con acción directa "Presupuestar Cortinas" e insignia naranja reactiva en el menú lateral y cabecera (`src/modules/presupuestos/components/mediciones-pendientes-alerta.tsx`, `Sidebar.tsx`)
- [x] Motor de explosión de materiales y control preventivo de stock al aprobar presupuestos (`src/modules/presupuestos/lib/explosion-materiales.ts`):
  - Regla de negocio de rieles: múltiplos hacia arriba de 0.20m, máximo de 4.60m (si supera 4.60m se divide en 2 tramos iguales redondeados a 0.20m).
  - Detección de doble capa para combinación Gasa + Blackout (2 rieles por tramo).
  - Cruce en tiempo real contra inventario en `PresupuestoAprobarModal` y tarjeta de control en `PresupuestoDetalle`.


---

## Chat 4 — Comandas & Producción

### ✅ Completado
- [x] Tipos TypeScript del módulo con estructuras completas de taller e ítems aplanados de producción (`src/modules/comandas/types.ts`)
- [x] Validación Zod estricta end-to-end con tipado limpio de filtros y clasificación operativa (`src/modules/comandas/schemas.ts`)
- [x] Helper de permisos y roles (`src/modules/comandas/lib/auth.ts`):
  - `ADMIN_GENERAL` y `ADMINISTRACION`: control total en `/comandas` y `/produccion`.
  - `TALLER`: lectura de `/comandas`, generación de Fichas A4 y control operativo completo en `/produccion`.
  - `INSTALACION`: acceso bloqueado.
- [x] Consultas Prisma de solo lectura con serialización de Decimal a number y conteos de avance (`src/modules/comandas/queries.ts`):
  - Listado de comandas con búsqueda reactiva y filtros por estado (`obtenerComandas`).
  - Detalle completo con cliente, presupuesto e ítems ordenados por ambiente (`obtenerComandaPorId`).
  - Métricas generales para cabecera de comandas (`obtenerMetricasComandas`).
  - Métricas operativas de taller y corte (`obtenerMetricasProduccion`).
  - Listado plano de ítems para el tablero visual de taller (`obtenerItemsProduccion`).
  - Listado de presupuestos aceptados pendientes de emitir comanda (`obtenerPresupuestosAceptadosSinComanda`).
- [x] Server Actions transaccionales con Prisma (`src/modules/comandas/actions.ts`):
  - `generarComandaDesdePresupuesto`: recolecta ítems aprobados, hereda especificaciones técnicas completas de `ItemMedicion`, clasifica entre `FABRICAR` y `PEDIR_PROVEEDOR` y actualiza automáticamente el cliente a `EN_PRODUCCION`.
  - `cambiarEstadoComanda`: actualización del ciclo comercial y notas/fechas.
  - `toggleCompletadoItemComanda`: con **regla de negocio automática de taller** (cuando el 100% de ítems de una comanda están listos, transiciona automáticamente a `LISTO_PARA_INSTALAR`).
  - `actualizarTipoItemComanda`: alternancia ágil entre confección interna (`FABRICAR`) y pedido a terceros (`PEDIR_PROVEEDOR`).
  - `actualizarNotasComanda`: edición de notas técnicas y fecha de entrega comprometida.
  - `eliminarComanda`: borrado seguro en cascada para administradores.
- [x] Badges con código de colores e iconos para el ciclo de estados (`src/modules/comandas/components/comanda-estado-badge.tsx`) y tipo de trabajo (`comanda-tipo-badge.tsx`)
- [x] Modal ágil para generar comanda desde presupuesto aceptado con pre-clasificación de cortinas (`src/modules/comandas/components/comanda-generar-modal.tsx`)
- [x] Tabla interactiva de comandas con buscador reactivo, filtros, barra de avance de confección y acciones (`src/modules/comandas/components/comanda-tabla.tsx`)
- [x] Ficha de Comanda A4 para Taller optimizada para impresión física y PDF con membrete de ROMINA RIBOT: layout de tarjetas grandes por ambiente con dibujo esquemático protagonista para ítems `FABRICAR` (3 por hoja), desglose de confección (+10cm corte, paños, caídas, soportes), casilleros de control de taller y tabla compacta sin dibujos para ítems `PEDIR_PROVEEDOR` (`src/modules/comandas/components/comanda-imprimible.tsx`)
- [x] Vista de detalle de comanda con switch digital / Ficha A4, dibujos didácticos en cada tarjeta, desglose por ambientes, medidas destacadas y checkboxes táctiles (`src/modules/comandas/components/comanda-detalle.tsx`)
- [x] Tablero visual operativo de Producción para la jefa de taller (`/produccion`), con KPIs en vivo, filtrado por tareas (Taller vs Proveedores), tarjetas con medidas destacadas y botón táctil de un solo toque para completar trabajos (`src/modules/comandas/components/produccion-tablero.tsx`)
- [x] Integración bidireccional desde el detalle de presupuestos (`src/modules/presupuestos/components/presupuesto-detalle.tsx`) para emisión directa de comanda
- [x] Páginas del dashboard: `/comandas`, `/comandas/[id]`, `/produccion`

---

## Chat 5 — Stock & Inventario

### ✅ Completado
- [x] Extensión del modelo Prisma `Producto` con campo `imagen` sincronizado con la base de datos Supabase (`prisma/schema.prisma`).
- [x] Tipos TypeScript del módulo (`src/modules/stock/types.ts`).
- [x] Validación Zod end-to-end con Zod v4 (`src/modules/stock/schemas.ts`).
- [x] Permisos y roles (`src/modules/stock/lib/auth.ts`):
  - `ADMIN_GENERAL` y `ADMINISTRACION`: control total (creación, edición, precios de costo, ajustes e importación masiva).
  - `TALLER`: consulta de existencias e ingreso de mercadería con remitos. Costos de compra ocultos y bloqueo de edición de catálogo.
  - `INSTALACION`: acceso bloqueado con mensaje explicativo.
- [x] Extracción inteligente de remitos con IA (`src/modules/stock/lib/gemini-ocr.ts`):
  - Gemini Flash Vision para remitos en papel (escritos a mano con birome o impresos).
  - Reconocimiento de número de remito, proveedor, fecha y matching semántico con el catálogo oficial de insumos del ERP.
- [x] Consultas Prisma de solo lectura con serialización Decimal y cálculo de estado crítico (`src/modules/stock/queries.ts`):
  - `obtenerProductos`, `obtenerProductoPorId`, `obtenerMetricasStock`, `obtenerMovimientosStock`, `obtenerProveedoresActivos`.
- [x] Server Actions transaccionales con Prisma (`src/modules/stock/actions.ts`):
  - `crearProducto` y `actualizarProducto` (con foto, unidad de medida, stock mínimo, precio y movimiento inicial).
  - `eliminarProducto` (borrado físico o lógico seguro si tiene historial).
  - `registrarIngresoRemito` (suma de stock en lote, registro en `movimientos_stock` con referencia a remito y actualización de costos).
  - `analizarFotoRemitoIA` (extracción multimodal estructurada).
  - `registrarMovimientoManual` (egresos por merma/rotura, ingresos y balance por conteo físico en estantería).
  - `importarProductosCSV` (migración masiva con validación y upsert por código).
- [x] Integración automática Comandas → Stock (`src/modules/comandas/actions.ts`):
  - Al generar una comanda de producción desde un presupuesto aceptado, el sistema descuenta automáticamente las unidades y metros de los productos asociados y genera los movimientos de `EGRESO` trazables vinculados a la comanda.
- [x] Componentes de UI:
  - `StockEstadoBadge` (`src/modules/stock/components/stock-estado-badge.tsx`): Normal (verde), Bajo (ámbar), Crítico (rojo animate-pulse), Agotado (rose), Inactivo (slate).
  - `StockKPIs` (`src/modules/stock/components/stock-kpis.tsx`): Catálogo total, Alerta de Stock Crítico/Agotado interactivo, Movimientos del mes y Valuación del inventario a precio de costo.
  - `StockCatalogoGrid` (`src/modules/stock/components/stock-catalogo-grid.tsx`): **Vista Catálogo Visual idéntica a la hoja de repuestos y caños**, con mosaico de tarjetas, foto nítida de la pieza, título técnico ("lo que es"), contador grande de existencias en stock, barra de progreso vs stock mínimo, lightbox de ampliación y botones táctiles rápidos.
  - `StockTabla` (`src/modules/stock/components/stock-tabla.tsx`): Vista tabular compacta con ordenamiento, estado, costos y paginación.
  - `ProductoModal` (`src/modules/stock/components/producto-modal.tsx`): Modal de alta y edición con subida directa de foto, unidad, parámetros de stock y costo.
  - `RemitoIngresoModal` (`src/modules/stock/components/remito-ingreso-modal.tsx`): Recepción de mercadería con selector/cámara para foto del remito, botón "Escanear con IA 🪄", filas dinámicas de insumos y confirmación.
  - `MovimientoManualModal` (`src/modules/stock/components/movimiento-manual-modal.tsx`): Registro rápido de mermas de corte, roturas y ajustes por conteo físico con botones de motivos predefinidos.
  - `MovimientosHistorialTabla` (`src/modules/stock/components/movimientos-historial-tabla.tsx`): Auditoría completa de movimientos con filtros por tipo (Ingreso, Egreso, Ajuste), buscador y trazabilidad de stock anterior → nuevo.
  - `StockImportarCSV` (`src/modules/stock/components/stock-importar-csv.tsx`): Descarga de plantilla CSV con ejemplos de taller (gaza, blackout, caños, rieles, motores) y previsualización.
  - `StockView` (`src/modules/stock/components/stock-view.tsx`): Vista principal con conmutador entre Catálogo Visual 🖼️ y Tabla 📋, pestañas de navegación y búsqueda reactiva.
- [x] Página del dashboard: `/stock` (`src/app/(dashboard)/stock/page.tsx`).

---

## Chat 6 — Proveedores & Compras

### ✅ Completado
- [x] Tipos TypeScript del módulo con formateadores de órdenes (`src/modules/proveedores/types.ts`).
- [x] Validación Zod end-to-end con Zod v4 (`src/modules/proveedores/schemas.ts`):
  - ABM de proveedores (`proveedorSchema`).
  - Catálogo de insumos provistos (`productoProveedorSchema`).
  - Emisión de órdenes de compra con artículos dinámicos (`ordenCompraSchema`).
  - Recepción de mercadería con soporte de entregas parciales y fotos de remitos (`recepcionOrdenCompraSchema`).
- [x] Helper de permisos y roles (`src/modules/proveedores/lib/auth.ts`):
  - `ADMIN_GENERAL` y `ADMINISTRACION`: Control total (alta de proveedores, costos, emisión de órdenes y recepción de pedidos).
  - `TALLER`: Lectura de órdenes de compra y fechas de entrega para planificar cortes de taller (costos confidenciales ocultos).
  - `INSTALACION`: Acceso bloqueado.
- [x] Consultas Prisma de solo lectura con serialización Decimal a number (`src/modules/proveedores/queries.ts`):
  - `obtenerProveedores`: Directorio con conteo de insumos provistos y órdenes activas.
  - `obtenerProveedorPorId`: Ficha completa con catálogo abastecido e historial de órdenes.
  - `obtenerOrdenesCompra` y `obtenerOrdenCompraPorId`: Tablero con filtros de estado, buscador y avance de entregas.
  - `obtenerMetricasProveedoresYCompras`: KPIs de compras del mes, órdenes pendientes y alertas.
  - `obtenerSugerenciasReposicion`: Detección inteligente cruzando insumos bajo stock mínimo e ítems de comanda marcados como `PEDIR_PROVEEDOR` no completados, agrupándolos por su fábrica habitual.
  - `obtenerCatalogoProductosParaCompras`: Autocompletado ágil de insumos activos.
- [x] Server Actions transaccionales con Prisma (`src/modules/proveedores/actions.ts`):
  - `crearProveedor`, `actualizarProveedor` y `eliminarProveedor` (borrado lógico seguro si tiene historial).
  - `vincularProductoProveedor` y `desvincularProductoProveedor` (con manejo de proveedor principal y precios pactados).
  - `crearOrdenCompra`: Emisión correlativa automática (`#OC-0001`, `#OC-0002`...).
  - `cambiarEstadoOrdenCompra`: Transiciones de ciclo comercial (`PENDIENTE` $\to$ `ENVIADA` $\to$ `CANCELADA`).
  - `registrarRecepcionMercaderia`: **Conexión transaccional directa con Stock**:
    1. Incrementa `ItemOrdenCompra.cantidadRecibida` (entregas parciales).
    2. Suma automáticamente el stock en `Producto.stockActual`.
    3. Genera el registro de auditoría en `MovimientoStock` (`tipo: INGRESO`, referenciado a la Orden de Compra).
    4. Transiciona la orden a `RECIBIDA_TOTAL` si se completó el 100% de los artículos o `RECIBIDA_PARCIAL`.
    5. Actualiza el último costo pactado en `ProductoProveedor` y el costo del producto.
    6. Archiva la foto del remito o factura física.
- [x] Componentes de UI:
  - `ProveedorEstadoBadge` (`src/modules/proveedores/components/proveedor-estado-badge.tsx`): Activo / Inactivo.
  - `OrdenCompraEstadoBadge` (`src/modules/proveedores/components/orden-compra-estado-badge.tsx`): PENDIENTE, ENVIADA, RECIBIDA_PARCIAL, RECIBIDA_TOTAL, CANCELADA.
  - `ProveedoresKPIs` (`src/modules/proveedores/components/proveedores-kpis.tsx`): Proveedores activos, órdenes pendientes, órdenes enviadas, alerta de bajo stock y gasto del mes.
  - `ProveedorModal` (`src/modules/proveedores/components/proveedor-modal.tsx`): Modal de alta y edición con validación Zod.
  - `ProveedorCatalogoModal` (`src/modules/proveedores/components/proveedor-catalogo-modal.tsx`): Vinculación de insumos con código de fábrica y precio pactado.
  - `ProveedorTabla` (`src/modules/proveedores/components/proveedor-tabla.tsx`): Directorio en tarjetas responsivas con buscador reactivo, contacto rápido y WhatsApp.
  - `OrdenCompraFormModal` (`src/modules/proveedores/components/orden-compra-form-modal.tsx`): Emisión manual con selector de productos, cantidades y cálculo automático de total.
  - `OrdenCompraReposicionModal` (`src/modules/proveedores/components/orden-compra-reposicion-modal.tsx`): Asistente de reposición sugerida en 1 clic.
  - `OrdenCompraRecepcionModal` (`src/modules/proveedores/components/orden-compra-recepcion-modal.tsx`): Recepción de mercadería con soporte de entregas parciales y fotos de remitos.
  - `OrdenCompraImprimible` (`src/modules/proveedores/components/orden-compra-imprimible.tsx`): Ficha formal A4 con membrete oficial de ROMINA RIBOT, datos fiscales, tabla técnica y firmas.
  - `OrdenCompraWhatsAppButton` (`src/modules/proveedores/components/orden-compra-whatsapp-button.tsx`): Envío directo con mensaje prearmado por WhatsApp.
  - `OrdenesCompraTabla` (`src/modules/proveedores/components/ordenes-compra-tabla.tsx`): Tablero interactivo con filtros y barra de avance.
  - `ProveedoresView` (`src/modules/proveedores/components/proveedores-view.tsx`): Vista unificada con conmutador de pestañas y modales.
  - `ProveedorDetalleView` (`src/modules/proveedores/components/proveedor-detalle-view.tsx`): Ficha completa con catálogo e historial.
  - `OrdenCompraDetalleView` (`src/modules/proveedores/components/orden-compra-detalle-view.tsx`): Switch digital / Ficha A4.
- [x] Páginas del dashboard:
  - `/proveedores` (`src/app/(dashboard)/proveedores/page.tsx`): Vista principal.
  - `/proveedores/[id]` (`src/app/(dashboard)/proveedores/[id]/page.tsx`): Ficha individual del proveedor.
  - `/proveedores/ordenes/[id]` (`src/app/(dashboard)/proveedores/ordenes/[id]/page.tsx`): Detalle y comprobante de orden.
  - `/proveedores/ordenes` (`src/app/(dashboard)/proveedores/ordenes/page.tsx`): Redirección y acceso directo al tablero.

---

## Chat 7 — Agenda & Instalación

### ✅ Completado
- [x] Modelo Prisma `BloqueoAgenda` agregado al schema y sincronizado con Supabase (`prisma/schema.prisma`).
- [x] Tipos TypeScript del módulo con formateadores de agenda y franjas horarias (`src/modules/instalaciones/types.ts`).
- [x] Validación Zod end-to-end con Zod v4 (`src/modules/instalaciones/schemas.ts`):
  - Agendamiento y reprogramación con validación de horarios y formato.
  - Registro de indisponibilidad / bloqueos de horario (`bloqueoAgendaSchema`).
  - Cierre y conformidad de obra (`completarInstalacionSchema`).
- [x] Control de roles y permisos granular (`src/modules/instalaciones/lib/auth.ts`):
  - `ADMIN_GENERAL` y `ADMINISTRACION`: Control total (agendar, reprogramar, cancelar y asignar instaladores).
  - `TALLER`: Acceso a tablero de taller (`/instalaciones/taller`), confirmación de materiales y carga de bloqueos de horario.
  - `INSTALACION`: Visualización de agenda, hoja de ruta del día con WhatsApp y Maps, reporte de indisponibilidad y cierre de obra.
- [x] Consultas Prisma de solo lectura con serialización Decimal y cálculo preventivo de colisiones (`src/modules/instalaciones/queries.ts`):
  - `obtenerInstalaciones`, `obtenerInstalacionPorId`, `obtenerComandasPendientesAgendar`, `obtenerInstalacionesTaller`, `obtenerItinerarioInstalador`, `obtenerInstaladoresDisponibles`, `obtenerBloqueosAgenda`, `obtenerMetricasAgenda`.
- [x] Server Actions transaccionales con Prisma (`src/modules/instalaciones/actions.ts`):
  - `agendarInstalacion` y `reprogramarInstalacion` con **detección y bloqueo automático de solapamiento ante turnos médicos / indisponibilidades**.
  - `toggleMaterialesListos`: Switch para que el taller confirme la salida de paquetes.
  - `completarInstalacion`: **Cierre definitivo del circuito comercial y operativo** (actualiza `Instalacion.estado = COMPLETADA`, `Comanda.estado = INSTALADO` y `Cliente.estado = INSTALADO` en una transacción atómica).
  - `cancelarInstalacion`: Registro de motivo y liberación de la comanda.
  - `crearBloqueoAgenda` y `eliminarBloqueoAgenda`: Gestión ágil de indisponibilidades para taller y colocadores.
- [x] Componentes de UI:
  - `InstalacionEstadoBadge` (`src/modules/instalaciones/components/instalacion-estado-badge.tsx`): Programada, Materiales listos, Completada, Cancelada.
  - `InstalacionKPIs` (`src/modules/instalaciones/components/instalacion-kpis.tsx`): Programadas del mes, Colocaciones hoy, Alerta taller mañana y Completadas del mes.
  - `BloqueoAgendaModal` (`src/modules/instalaciones/components/bloqueo-agenda-modal.tsx`): Carga de turnos médicos, trámites o mantenimientos con auditoría de bloqueos activos.
  - `InstalacionAgendarModal` (`src/modules/instalaciones/components/instalacion-agendar-modal.tsx`): Asignación de colocación con alerta preventiva en tiempo real ante colisiones de horario.
  - `InstalacionesPendientesDrawer` (`src/modules/instalaciones/components/instalaciones-pendientes-drawer.tsx`): Panel lateral con comandas listas para colocar.
  - `CalendarioAgendaView` (`src/modules/instalaciones/components/calendario-agenda-view.tsx`): Calendario visual fluido con vistas Mes, Semana, Día e Itinerario, filtros por instalador y modal rápido.
  - `InstalacionesTallerTablero` (`src/modules/instalaciones/components/instalaciones-taller-tablero.tsx`): Tablero de taller (próximos 7 días) con **alerta crítica destacada para el día siguiente** y checklist de embalaje.
  - `InstaladorItinerarioCard` (`src/modules/instalaciones/components/instalador-itinerario-card.tsx`): Hoja de ruta mobile-first con enlace a **Google Maps**, **WhatsApp directo con mensaje prearmado** y botón táctil de **Completar Instalación**.
  - `InstalacionImprimible` (`src/modules/instalaciones/components/instalacion-imprimible.tsx`): Ficha formal A4 con membrete oficial ROMINA RIBOT, tabla técnica de cotas y casillero de conformidad del cliente.
  - `InstalacionDetalleView` (`src/modules/instalaciones/components/instalacion-detalle-view.tsx`): Vista unificada con conmutador Digital / Hoja A4.
  - `InstalacionesView` (`src/modules/instalaciones/components/instalaciones-view.tsx`): Vista principal del módulo.
- [x] Páginas del dashboard:
  - `/instalaciones` (`src/app/(dashboard)/instalaciones/page.tsx`): Calendario general interactivo.
  - `/instalaciones/taller` (`src/app/(dashboard)/instalaciones/taller/page.tsx`): Preparación de materiales (próximos 7 días).
  - `/instalaciones/[id]` (`src/app/(dashboard)/instalaciones/[id]/page.tsx`): Ficha técnica y hoja de colocación A4.

---

## Chat 8 — Dashboard & Métricas

### ✅ Completado
- [x] Tipos TypeScript del módulo (`src/modules/metricas/types.ts`):
  - Definición de KPIs para Dashboard Principal y Tablero Analítico.
  - Series temporales y datos estructurados para gráficos de Recharts.
  - Tipos de períodos: `30d`, `mes`, `mes_anterior`, `trimestre`, `anio`, `historico`.
- [x] Validación Zod end-to-end (`src/modules/metricas/schemas.ts`).
- [x] Control de roles y visibilidad granular (`src/modules/metricas/lib/auth.ts`):
  - `ADMIN_GENERAL` y `ADMINISTRACION`: Control y visualización total (métricas comerciales, montos financieros, costos y facturación).
  - `TALLER`: Dashboard operativo adaptado con comandas por confeccionar hoy, salidas de mañana y alerta de stock crítico sin números de dinero.
  - `INSTALACION`: Dashboard de campo mobile-first con itinerario de colocaciones del día/semana, Google Maps y WhatsApp directo.
- [x] Consultas Prisma de solo lectura con serialización segura (`src/modules/metricas/queries.ts`):
  - `obtenerDashboardOperativo`: KPIs en vivo (clientes del mes vs mes anterior, comandas activas, cotizaciones en juego, instalaciones semanales, alerta stock crítico), próximas 5 instalaciones con badge de materiales, presupuestos para seguimiento por WhatsApp, mosaico de stock crítico y feed de actividad reciente del sistema.
  - `obtenerMetricasAvanzadas`: Agregaciones de facturación, ticket promedio, tasa de conversión comercial, ratio confección propia vs terceros, cumplimiento de instalaciones y series Recharts.
- [x] Componentes de UI del Dashboard Principal:
  - `DashboardKpiCard` (`src/modules/metricas/components/dashboard-kpi-card.tsx`): Tarjetas interactivas con variación porcentual e iconos temáticos.
  - `DashboardInstalacionesProximas` (`src/modules/metricas/components/dashboard-instalaciones-proximas.tsx`): Lista con estado de materiales (`Listos en taller` vs `Materiales pendientes`), horarios y WhatsApp.
  - `DashboardPresupuestosPendientes` (`src/modules/metricas/components/dashboard-presupuestos-pendientes.tsx`): Seguimiento comercial con botón de mensaje prearmado a WhatsApp.
  - `DashboardStockAlerta` (`src/modules/metricas/components/dashboard-stock-alerta.tsx`): Mosaico de insumos bajo mínimo con botón de reposición ágil.
  - `DashboardFeedActividad` (`src/modules/metricas/components/dashboard-feed-actividad.tsx`): Feed unificado de los últimos movimientos del ERP con tiempos relativos.
  - `DashboardTallerView` (`src/modules/metricas/components/dashboard-taller-view.tsx`): Tablero del día exclusivo para taller.
  - `DashboardInstaladorView` (`src/modules/metricas/components/dashboard-instalador-view.tsx`): Hoja de ruta para colocadores.
- [x] Componentes de UI de Métricas Avanzadas:
  - `MetricasPeriodoSelector` (`src/modules/metricas/components/metricas-periodo-selector.tsx`): Barra de conmutación reactiva entre 6 rangos de tiempo.
  - `MetricasKpisGrid` (`src/modules/metricas/components/metricas-kpis-grid.tsx`): 4 grandes KPIs de rendimiento comercial y operativo.
  - `MetricasVentasChart` (`src/modules/metricas/components/metricas-ventas-chart.tsx`): Gráfico Recharts `AreaChart` con degradado índigo y tooltips en $ ARS.
  - `MetricasDistribucionConfeccionChart` (`src/modules/metricas/components/metricas-distribucion-confeccion-chart.tsx`): Gráfico Recharts `PieChart` / Donut por sistemas y tipos de cortina.
  - `MetricasTopProductosChart` (`src/modules/metricas/components/metricas-top-productos-chart.tsx`): Gráfico Recharts `BarChart` horizontal de insumos y telas más demandadas.
  - `MetricasClientesChart` (`src/modules/metricas/components/metricas-clientes-chart.tsx`): Gráfico Recharts `BarChart` de captación mensual de clientes.
  - `MetricasInstalacionesChart` (`src/modules/metricas/components/metricas-instalaciones-chart.tsx`): Gráfico Recharts `BarChart` comparativo de colocaciones programadas vs completadas.
  - `MetricasReporteEjecutivo` (`src/modules/metricas/components/metricas-reporte-ejecutivo.tsx`): Ficha formal A4 con membrete oficial ROMINA RIBOT para gerencia / dueña, optimizada para `@media print` y PDF.
  - `MetricasView` (`src/modules/metricas/components/metricas-view.tsx`): Contenedor interactivo que orquesta filtros, gráficos y reporte A4.
- [x] Páginas del dashboard:
  - `/` (`src/app/(dashboard)/page.tsx`): Reemplazo total de placeholders por el dashboard operativo en vivo.
  - `/metricas` (`src/app/(dashboard)/metricas/page.tsx`): Tablero analítico completo.
  - `/metricas/reporte` (`src/app/(dashboard)/metricas/reporte/page.tsx`): Vista directa de la Ficha Ejecutiva A4.

---

## Chat 9 — Adaptación Mobile-First & Responsive (Celulares y Tablets)

### ✅ Completado
- [x] **Layout Global Adaptativo:**
  - `DashboardShell` (`src/components/shared/layout/DashboardShell.tsx`): Componente de estado de cliente que administra la apertura del menú lateral en móviles, tecla ESC, backdrop desenfocado y cierre al cambiar de ruta.
  - `Sidebar` (`src/components/shared/layout/Sidebar.tsx`): Drawer deslizable lateral para pantallas `< 1024px` con botón de cierre táctil, backdrop con `z-50`, transiciones suaves de entrada/salida y targets táctiles `>= 44px`. Mantiene su versión fija `w-64` en escritorio (`lg:flex`).
  - `Header` (`src/components/shared/layout/Header.tsx`): Botón de menú hamburguesa visible solo en móviles y tablets (`lg:hidden`), buscador compacto responsive y avatar/acciones optimizadas.
  - `PageHeader` (`src/components/shared/layout/PageHeader.tsx`): Contenedor flexible `flex-col sm:flex-row` con acciones alineadas al ancho completo en móviles.
- [x] **Experiencia Táctil & Prevención de Auto-Zoom (iOS/Android):**
  - `globals.css`: Regla obligatoria `@media (max-width: 639px) { input, select, textarea { font-size: 16px !important; } }` para evitar que Safari y Chrome en iOS/Android hagan zoom automático al enfocar inputs.
  - Utilidad `.touch-scroll` con `-webkit-overflow-scrolling: touch` para desplazamiento inercial nativo en dispositivos móviles.
  - Botones principales y acciones con altura mínima táctil `>= 44px`.
- [x] **Tablas y Grillas con Scroll Inercial Seguro:**
  - Todas las tablas del sistema envueltas en contenedores `overflow-x-auto touch-scroll` con anchos mínimos definidos (`min-w-[700px..760px]`) para evitar el aplastamiento de columnas:
    - Clientes: `src/modules/clientes/components/cliente-tabla.tsx`
    - Presupuestos: `src/modules/presupuestos/components/presupuesto-tabla.tsx`
    - Comandas: `src/modules/comandas/components/comanda-tabla.tsx`
    - Stock & Historial: `src/modules/stock/components/stock-tabla.tsx` y `movimientos-historial-tabla.tsx`
    - Órdenes de Compra: `src/modules/proveedores/components/ordenes-compra-tabla.tsx`
    - Mediciones: `src/modules/mediciones/components/medicion-tabla.tsx`
    - Calendario de Instalaciones: `src/modules/instalaciones/components/calendario-agenda-view.tsx` (grillas de 7 columnas para Mes y Semana con scroll horizontal y selector de vista táctil).
- [x] **Módulos Críticos Adaptados:**
  - **App Mediciones:**
    - `cortina-dibujo-didactico.tsx`: Contenedor responsive con cálculo de proporciones dinámico para pantallas pequeñas, sin cortes horizontales en cotas superiores y marcos.
    - `cortina-item-form.tsx`: Botones de selección de tipo de cortina y sistema con `min-h-[48px]`, acciones inferiores apiladas verticalmente en móvil con `min-h-[44px]`.
    - `ambiente-manager.tsx`: Input de ambientes y etiquetas táctiles de rápido acceso (`min-h-[36px]`).
  - **Stock & Catálogo:**
    - `stock-catalogo-grid.tsx`: Grilla adaptativa `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
    - `remito-ingreso-modal.tsx`: Botones grandes táctiles (`min-h-[44px]`) para escaneo de cámara y OCR, modal `max-h-[92vh] flex flex-col`.
  - **Taller de Confección & Producción:**
    - `produccion-tablero.tsx`: Grilla de KPIs en 2 columnas en celular (`grid-cols-2 sm:grid-cols-4`), selector de tabs horizontal scrolleable con `touch-scroll`, buscador fluido y botón de un solo toque "Marcar Listo" con `min-h-[44px]`.
  - **Instaladores en Obra:**
    - `instalador-itinerario-card.tsx`: Botones prioritarios para Google Maps (`min-h-[46px]`), WhatsApp directo (`min-h-[46px]`) y "Marcar Instalación Completada" a ancho completo (`min-h-[48px]`).
  - **Gráficos Recharts & Analítica:**
    - Todos los gráficos de `metricas-ventas-chart.tsx`, `metricas-distribucion-confeccion-chart.tsx`, `metricas-top-productos-chart.tsx`, `metricas-clientes-chart.tsx` y `metricas-instalaciones-chart.tsx` actualizados con contenedores `h-[260px] sm:h-[300px] md:h-[340px] w-full min-w-0 overflow-hidden` para evitar expansiones horizontales infinitas del flexbox de Recharts.
    - `metricas-periodo-selector.tsx`: Scroll horizontal fluido táctil sin quiebre de líneas antiestético.
- [x] **Auditoría de Ventanas Modales:**
  - Todos los modales del sistema estructurados con `max-h-[92vh] flex flex-col`, cabecera y pie con `shrink-0`, cuerpo interno scrolleable `overflow-y-auto touch-scroll flex-1 min-h-0` y botones apilados en móvil (`flex-col-reverse sm:flex-row`) con `min-h-[44px]`:
    - `presupuesto-calculadora-modal.tsx`
    - `presupuesto-aprobar-modal.tsx`
    - `comanda-generar-modal.tsx`
    - `producto-modal.tsx`
    - `movimiento-manual-modal.tsx`
    - `remito-ingreso-modal.tsx`
- [x] **Compilación y Build Next.js:**
  - `npx next build` verificado exitosamente sin errores de TypeScript ni Turbopack (código de salida 0).

---

## Chat 10 — App Móvil Nativa Android (APK) & Modo Obra Offline con Capacitor

### 🎯 Objetivo
Construir una aplicación móvil nativa instalable (`.apk`) para tablets Android que funcione de manera **100% autónoma y offline en obra** (sin depender de internet, señal móvil ni caché del navegador), con sincronización hacia el ERP RR cuando haya conexión.

### 📋 Plan de Implementación
1. **Endpoint de Sincronización en ERP:** ✅ Completo
   - [x] Helper de autenticación y cabeceras CORS para aplicaciones móviles (`src/lib/api-auth.ts`).
   - [x] Schemas Zod de sincronización por lote y medición offline (`src/modules/mediciones/schemas.ts`).
   - [x] Ruta API `POST /api/mediciones/sync` para recibir mediciones tomadas en obra y persistirlas en PostgreSQL (Supabase) con validación Zod y transacciones atómicas Prisma (`src/app/api/mediciones/sync/route.ts`).
   - [x] Ruta API `GET /api/mediciones/clientes-sync` para descargar clientes precargados a la tablet con soporte de búsqueda y actualización incremental (`src/app/api/mediciones/clientes-sync/route.ts`).
2. **Capa Móvil Offline con Capacitor:** ✅ Completo
   - [x] Configuración de Capacitor en el entorno Android (`capacitor.config.ts` con `appId: 'com.rominaribot.mediciones'` y esquema seguro `https`).
   - [x] Proyecto Android nativo generado (`erp-rr/android`) con permisos `INTERNET` y `ACCESS_NETWORK_STATE` en `AndroidManifest.xml`.
   - [x] Base de datos local persistente en el dispositivo (`erp_rr_mediciones_mobile` en IndexedDB + `@capacitor/preferences` para persistir configuración, URL de ERP y token de sincronización en `src/mobile/services/storage-service.ts`).
   - [x] Reutilización directa del componente `CortinaDibujoDidactico` (cotas milimétricas, tipos de cortinas, sistemas, telas, argollas y soportes calculados).
3. **Flujo de Usuario en Obra:** ✅ Completo
   - [x] Apertura instantánea sin internet (`0.1s`), bundle local empaquetado dentro de la aplicación móvil (`mobile-dist` y `android/app/src/main/assets/public`).
   - [x] Selección reactiva de clientes precargados y formulario de **Alta Express en Obra** para registrar nuevos clientes sin conexión (`src/mobile/components/ClienteExpressModalMobile.tsx`).
   - [x] Gestor de ambientes y aberturas con dibujo dinámico didáctico en tiempo real (`src/mobile/components/MedicionFormMobile.tsx`).
   - [x] Guardado local garantizado e inmune a cortes de energía o reinicios de la tablet.
   - [x] Indicador de estado en cabecera: `🟡 Pendiente de sincronizar` / `🟢 Sincronizado` con visor de conectividad (`@capacitor/network`).
   - [x] Botón de sincronización manual y automática con barra de progreso y prueba de conexión contra el ERP (`src/mobile/services/sync-service.ts`).
4. **Compilación del Instalador:** ✅ Completo
   - [x] Script `npm run build:mobile` que compila el bundle móvil en Vite (800ms) y sincroniza automáticamente los assets de Capacitor con Android (`android/app/src/main/assets/public`).
   - [x] Workflow automatizado de GitHub Actions (`.github/workflows/build-apk.yml`) para compilar y generar automáticamente el archivo `mediciones-rr.apk` listo para descargar desde cualquier lugar a costo $0.
   - [x] Compatibilidad para compilación local con Gradle (`./gradlew assembleDebug`) o apertura directa con Android Studio.

---

## Chat 11 — Visitas de Medición & Asesoramiento en Obra (Agendar Visitas)

### 🎯 Objetivo
Organizar la agenda previa comercial antes de generar la medición técnica en obra para Romina Ribot. Permite coordinar citas cuando los clientes escriben por WhatsApp o llaman, dar de alta clientes express en 15 segundos, sincronizar con Google Calendar del celular, y contar con una consola táctil en la calle con WhatsApp, Google Maps y acceso directo a la app de mediciones en la tablet.

### ✅ Completado
- [x] **Base de Datos y Modelos Prisma (`prisma/schema.prisma`):**
  - Modelo `Visita` con campos: `id`, `clienteId`, `usuarioId`, `fecha`, `horaInicio`, `horaFin`, `tipoVisita`, `estado`, `direccion`, `localidad`, `notas`, `googleEventId`.
  - Enums `TipoVisita` (`PRIMERA_MEDICION`, `REMEDICION`, `MUESTRA_TELAS`, `ASESORAMIENTO`) y `EstadoVisita` (`PROGRAMADA`, `CONFIRMADA`, `REALIZADA`, `REPROGRAMADA`, `CANCELADA`).
  - Nuevo estado inicial en `EstadoCliente`: `POR_VISITAR` (el cliente se agenda antes de la medición técnica).
  - Migración aplicada exitosamente a Supabase PostgreSQL y cliente Prisma regenerado.
- [x] **Tipos y Validación End-to-End (`src/modules/visitas/types.ts` y `schemas.ts`):**
  - Interfaces `IVisita`, `IVisitaConRelaciones`, `IVisitasMetricas`.
  - Funciones auxiliares: `generarLinkWhatsAppVisita`, `generarLinkGoogleMaps`, `generarGoogleCalendarUrl`.
  - Validaciones Zod estrictas para agendar, editar, cambiar estado, reprogramar y alta rápida de cliente.
- [x] **Control de Permisos y Roles (`src/modules/visitas/lib/auth.ts`):**
  - `ADMIN_GENERAL` y `ADMINISTRACION`: control total (diseñado para la agenda central de Romina Ribot).
  - Bloqueo de acceso para `TALLER` e `INSTALACION`.
- [x] **Consultas y Mutaciones Prisma (`src/modules/visitas/queries.ts` y `actions.ts`):**
  - `obtenerVisitas` (con filtros de fecha, estado y buscador de texto reactivo).
  - `obtenerVisitasHoy`, `obtenerMetricasVisitas`, `obtenerClientesParaVisita`.
  - Server Actions: `agendarVisitaAction`, `actualizarVisitaAction`, `cambiarEstadoVisitaAction`, `reprogramarVisitaAction`, `eliminarVisitaAction`, `crearClienteRapidoVisitaAction`.
- [x] **Integración con Google Calendar:**
  - Botón directo universal *"📅 Guardar en Google Calendar"* en cada visita agendada.
  - Endpoint de suscripción en vivo iCal (`/api/visitas/calendario.ics`) para sincronizar el calendario personal del teléfono Android/iPhone de Romina con 1 clic.
- [x] **Componentes Visuales Mobile-First (`src/modules/visitas/components/`):**
  - `VisitaEstadoBadge` y `VisitaTipoBadge` con paleta de estados oficial.
  - `VisitaKPIs`: resumen de visitas hoy, semana, confirmadas y realizadas.
  - `VisitaCard`: tarjeta táctil para la calle con WhatsApp prearmado, GPS en Google Maps, Google Calendar y botón prioritario **"Iniciar Medición en Obra"** (redirecciona a `/mediciones/nueva?clienteId=...` para cargar ambientes y telas en la tablet).
  - `VisitasCalendarioView`: calendario interactivo con vistas Mes, Semana, Día e Itinerario táctil.
  - `VisitasTabla`: vista tabular para escritorio.
  - `VisitaModalForm`: agendador express en 15 segundos con selector reactivo de cliente, alta express integrada y franjas sugeridas.
  - `VisitaCambiarEstadoModal`: registro rápido de notas y reprogramación.
  - `VisitasView`: orquestador general con pestañas y modal de suscripción a Google Calendar.
- [x] **Integración con el resto del ERP:**
  - **Sidebar (`src/components/shared/layout/Sidebar.tsx`):** Ítem *"Visitas"* en la sección Comercial.
  - **Ficha de Cliente (`/clientes/[id]` y `ClienteHistorial`):** Pestaña *"Visitas Agendadas"* con historial completo, estado y acciones rápidas.
  - **CRM Pipeline (`src/modules/clientes/components/cliente-pipeline.tsx`):** Nueva columna *"Por Visitar"* como etapa inicial del embudo comercial.
  - **Mediciones (`src/modules/mediciones/actions.ts`):** Al guardar la medición en obra, el cliente pasa automáticamente de `POR_VISITAR` a `MEDICION_TOMADA`, y las visitas activas pasan a `REALIZADA`.
  - **Dashboard Principal (`/` y `src/modules/metricas/queries.ts`):** Nuevo KPI *"Visitas de obra"* (hoy / semana) y widget dedicado `DashboardVisitasHoy` para Romina.
- [x] **Páginas del Dashboard:**
  - `/visitas` (`src/app/(dashboard)/visitas/page.tsx`): Página principal del módulo.

---

## Actualización — Formulario de Medición Técnica de Cortinas (Móvil / Tablet)

### 🎯 Objetivo
Perfeccionar el formulario de medición técnica en obra (`CortinaItemForm`) para abarcar todo el espectro de combinaciones motorizadas, telas combinadas, Aluminio (persianas venecianas con o sin gaza delantera), Noche Total, y reglas precisas de taller propio vs proveedor externo.

### ✅ Ajustes Implementados:
- [x] **Subcategoría Motorizada (8 subtipos en grilla de 2 columnas numeradas):**
  - Columna 1: 1. `Tradicional Mot`, 2. `Tradicional Mot y Tradicional`, 3. `Tradicional Mot y Roller`, 4. `Tradicional Mot y Roller Mot`.
  - Columna 2: 5. `Roller Mot`, 6. `Roller Mot y Roller`, 7. `Roller Mot y Tradicional`, 8. `Bandas Verticales y Roller Mot`.
- [x] **Tarjetas inferiores dinámicas para las 2 capas:**
  - Nombres acordes para los 8 subtipos (ej: *Tradicional Mot 1 / Tradicional Mot 2*, *Roller Mot / Tradicional*, *Bandas Verticales / Roller Mot*, etc.).
- [x] **Motores Li-ion con campo de cargadores:**
  - Si el modelo de motor Roller Mot es `Li-ion` (Somfy) o `li-ion` (Tube), se habilita el recuadro numérico *"Cantidad de cargadores"* para la abertura entera.
- [x] **Marcas de cortina:**
  - Toda cortina Tradicional que no sea motorizada NO lleva marca (confección propia de taller Romina Ribot).
- [x] **Sistema Tradicional en Motorizadas:**
  - En combinaciones con Tradicional común (ej. `Roller Mot y Tradicional`), se puede configurar libremente como Riel (Normal o Curvo) o Barral (con sus colores).
  - Si se elige Riel (normal o curvo), **NO** lleva soportes Kent/Grampa (solo aplican si se elige Barral).
- [x] **Perfilería General:**
  - Si en la abertura conviven capas Roller y/o Roller Mot, se muestra un único selector de perfilería general aplicable a ambas.
- [x] **Lado de Mando individual por cortina:**
  - Selector individual de lado de mando (*Izq / Der*) para cada tramo/cortina de Roller o Roller Mot.
- [x] **Corrección de selector Bandas Verticales en Gaza:**
  - Se permite alternar fluidamente entre *Roller* y *Bandas verticales* en la capa Gaza sin bloqueos.
- [x] **Caída y Posición Roller ubicadas DENTRO de las tarjetas específicas:**
  - Caída (`Por delante` | `Por detrás`) y Posición (`Adelante` | `Atrás`) ya **NO** aparecen arriba junto a Sujeción; figuran exclusivamente dentro de la tarjeta de la capa que sea Roller o Roller Mot.
  - En capas combinadas (ej: Tradicional Mot + Roller), Caída y Posición aparecen únicamente en la tarjeta derecha (Roller).
  - **Única excepción no-roller:** B.O. Tradicional puro (de taller) incluye únicamente el selector de `Posición` (`Adelante` | `Atrás`), sin caída.
- [x] **Capa Tradicional en combinaciones motorizadas sin modo ni mando:**
  - En `Tradicional Mot y Tradicional` o `Roller Mot y Tradicional`, la tarjeta de Tradicional se comporta como confección de taller (ancho total + paños/tramos + alto + tela), sin selectores de modo (sólo tela) ni mando (izq/der).
- [x] **Títulos dinámicos y selector libre Roller / Bandas Verticales:**
  - En los tipos Roller y Bandas Verticales, tanto la Gaza como el B.O. reflejan dinámicamente en el encabezado de su tarjeta el sistema elegido: `GAZA (Roller)` vs `GAZA (Bandas Verticales)`, y `B.O. (Roller)` vs `B.O. (Bandas Verticales)`.
- [x] **Soporte Roller:**
  - Soporte `Común` o `Extendido` disponible para cualquier configuración que contenga Roller.
- [x] **Aluminio Mejorado:**
  - Medidas (ancho y alto) siempre visibles desde el inicio sin requerir activar Gaza.
  - Sujeción obligatoria agregada.
  - Selector de 1 a 5 cortinas con anchos individuales y alto compartido.
  - Opción de sumar Gaza delantera con selección completa de Tradicional, Roller o Motorizada.
- [x] **Roller Noche Total:**
  - Soporta sumar Gaza delantera de forma opcional con todas sus especificaciones.
- [x] **Reflejo del Mando en el Dibujo Didáctico (Opción A):**
  - **Gaza:** mandos representados en el cabezal superior de cada cortina (`top-1`, pastilla índigo/celeste `G{n}: Izq/Der` o ⚡ si es motorizada).
  - **B.O.:** mandos representados en la línea inferior de cada cortina (`bottom-1`, pastilla oscura `BO{n}: Izq/Der` o ⚡ si es motorizada).
  - **Tradicional común (no motorizada):** sin cadenita ni indicador de mando (confección textil pura).
  - **Aluminio:** mando colgante individual reflejando lado izquierdo o derecho.
  - **Barra inferior de especificaciones:**
    - Eliminado el indicador redundante `Mando: ...`.
    - Separación nítida de filas: **Posición de Telas** (`[Gaza (Adelante)] ➔ [B.O. (Atrás)]` según selección) y **Caída de Rollo** (`Caída Gaza` y `Caída B.O.` únicamente para capas Roller).

---

## Actualización — Edición de mediciones, sincronización bidireccional y modo Sólo riel (2026-10-26)

### ✅ Implementado
- [x] **Gaza Roller / Bandas se guarda:** `tipoCapaGaza` se persiste también en tipos Roller y Bandas verticales (antes se perdía). El validador acepta "Bandas verticales" en la Gaza. Las mediciones viejas sin el dato se abren con el valor según el tipo.
- [x] **Modo por cortina Normal / Sólo tela / Sólo riel** (`modosPanosGaza`, `modosTramosBO`) en Roller y Bandas verticales; Roller Mot mantiene Normal / Sólo tela. Se sigue escribiendo `soloTela*` (legado). Se muestra en el dibujo (ficha de taller, comanda) y en la tabla de pedidos a proveedor de la comanda impresa (`describirModosEspeciales`).
- [x] **Edición sin borrar cortinas** (`src/modules/mediciones/lib/aplicar-cambios-medicion.ts`): actualiza cada cortina por `id` y conserva los vínculos con presupuesto y comanda. Traslada medidas a `ItemPresupuesto` (precio sin cambios) y medidas + especificaciones a `ItemComanda` (no toca "completado").
- [x] **Aviso "Medida modificada"** solo para Administración: `ItemPresupuesto/ItemComanda.medidaAnterior` y `medidaModificadaEn`. Se ve en detalle de presupuesto, detalle de comanda (no se imprime) y alerta del dashboard. Botón "Revisado" (`marcarAvisoMedidaRevisado`). Componente shared `AvisoMedidaModificada`.
- [x] **Bloqueo con presupuesto aceptado (total o parcial):** no se pueden agregar ni quitar cortinas, solo modificarlas (web, tablet y servidor).
- [x] **Sincronización bidireccional de la tablet:** al sincronizar primero sube (si la medición ya existe en el ERP la actualiza, gana la tablet) y después baja lo modificado en la web (`GET /api/mediciones/descargar`, últimos 6 meses). Si la tablet tiene cambios sin sincronizar en una medición, conserva la suya. Rechazos (presupuesto aceptado) quedan pendientes con el motivo visible.
- [x] **Vínculo `ItemComanda.itemMedicionId`** (comandas nuevas se vinculan solas; script `scripts/vincular-comandas-mediciones.mjs` para las existentes).

### 📦 Componentes Shared nuevos
| Componente | Archivo | Descripción |
|---|---|---|
| `AvisoMedidaModificada` | `src/components/shared/aviso-medida-modificada.tsx` | Aviso de medida modificada con botón "Revisado" (solo Administración, no se imprime) |

---

## Actualización — Ficha de trabajo completa y pedidos a proveedor por capa (2026-10-26)

### ✅ Implementado
- [x] **Ficha de trabajo A4 con todas las cortinas** (`comanda-imprimible.tsx`): taller y proveedor como tarjetas con dibujo, etiqueta TALLER / PROVEEDOR, proveedor por capa y casillas (Corte / Confección / Control OK vs Recibido / Controlado / Embalado). Se quitó la tabla aparte de proveedor.
- [x] **Pedidos a proveedor por capa** (modelo `PedidoProveedorItem`, enum `EstadoPedidoProveedor`): Pendiente de pedido → Pedido realizado → Pedido recibido. Gaza y B.O. de distinta marca son pedidos separados; de la misma marca, uno solo (`capasPedidoProveedor` en `src/modules/comandas/lib/pedidos-proveedor.ts`).
- [x] **Proveedor preseleccionado por marca** de la medición (`Proveedor.marcas`), modificable. **Alerta de demora** con `Proveedor.diasEntrega` (fecha de pedido + días).
- [x] **Producción:** panel de pedidos en cada cortina de proveedor (`PedidosProveedorPanel`), KPI "por pedir / esperando / demorados" y filtros. Lo usan Administración y Taller. También en el detalle de comanda.
- [x] **Estado automático de la comanda:** "listo" de una cortina de proveedor = todas sus capas recibidas; todo listo → LISTO_PARA_INSTALAR; taller listo pero falta proveedor → ESPERANDO_PROVEEDOR.
- [x] **Dashboard de administración:** alerta de cortinas por pedir, esperando y demoradas.
- [x] Los pedidos de comandas existentes se crean solos al abrir Producción o la comanda (las ya marcadas como listas nacen "recibidas").

---

## Notas de integración entre módulos

| De | A | Dato compartido |
|---|---|---|
| Visitas de Obra | Clientes & CRM | Alta rápida de cliente (`estado = POR_VISITAR`), historial en ficha de cliente |
| Visitas de Obra | Google Calendar | Deep links directos + Feed iCal `/api/visitas/calendario.ics` |
| Visitas de Obra | App Medición | Botón "Iniciar Medición" (`/mediciones/nueva?clienteId=...`) precargando cliente |
| App Medición | Visitas de Obra | Al guardar medición → cliente pasa a `MEDICION_TOMADA` y visita a `REALIZADA` |
| App Medición | Presupuestos | `ItemMedicion` → `ItemPresupuesto` |
| Presupuestos | Comandas | `Presupuesto` aceptado → `Comanda` |
| Comandas | Stock | Al confirmar comanda → descuento automático |
| Comandas | Proveedores | Ítems `PEDIR_PROVEEDOR` → sugerencia de reposición |
| Stock | Proveedores | `stockActual <= stockMinimo` → sugerencia de reposición |
| Proveedores & Compras | Stock | Al recibir orden → suma automática en `stockActual` y crea `MovimientoStock (INGRESO)` |
| Comandas | Instalaciones | `Comanda` lista → `Instalacion` programada en calendario |
| Instalaciones | Comandas & Clientes | Al marcar `Instalacion = COMPLETADA` → `Comanda = INSTALADO` y `Cliente = INSTALADO` (cierre comercial) |
| Taller & Instaladores | Agenda | `BloqueoAgenda` (turnos médicos, trámites) previene asignación de instalaciones |
| Todos los Módulos | Dashboard & Métricas | Agregación en vivo de visitas, clientes, presupuestos, comandas, stock e instalaciones para KPIs, alertas y analítica con Recharts |

---

## Actualización — Alternativas por cortina en el presupuesto (2026-10-26)

### ✅ Implementado
- [x] **Modelo:** `ItemPresupuesto` suma `caracteristicas` (especificación propia de la opción; `null` = usa la de la medición), `grupoAlternativa` (une las opciones de una cortina), `nombreOpcion` ("Riel", "Barral"...) y `esOpcionPrincipal`. Cada alternativa es otra fila con el mismo `itemMedicionId`. La opción elegida es la fila con `aceptado = true`.
- [x] **Formulario** (`presupuesto-form.tsx`): "+ Agregar alternativa" por cortina (máx. 3 opciones, `MAX_OPCIONES_POR_CORTINA`). Abre `CortinaItemForm` precargado con la especificación de la medición; se nombra la opción y se cotiza con la calculadora. Las alternativas comparten ambiente, descripción, medidas y cantidad con la principal. La medición no se modifica. Validación Zod (`superRefine`): una principal por grupo, nombres obligatorios y sin repetir.
- [x] **Total guardado = suma de las opciones principales.** Helpers en `src/modules/presupuestos/lib/alternativas.ts` (`agruparCortinas`, `subtotalPrincipales`, `calcularTotalesPorOpcion`, `itemsAprobados`, `descripcionConOpcion`).
- [x] **Ficha A4 y WhatsApp:** cada cortina con sus opciones y precio; si todas las cortinas con alternativas usan los mismos nombres, "Total con Riel / Total con Barral" (las cortinas sin esa opción suman su principal).
- [x] **Aprobación** (`presupuesto-aprobar-modal.tsx`): en aceptación total y parcial se elige la opción del cliente en cada cortina; el servidor valida como máximo una opción por cortina. Detalle muestra "Elegida" y "Total aprobado".
- [x] **Comanda y stock** usan la opción elegida: `generarComandaDesdePresupuesto` toma `caracteristicas` de la opción (o de la medición) y agrega el nombre de la opción a la descripción; `verificarStockPresupuestoAction` idem (sin selección evalúa solo las principales).
- [x] **Cambios de medición** (`aplicar-cambios-medicion.ts`, `fusionarMedidasCaracteristicas`): en opciones con especificación propia, y en el ítem de comanda que salió de una de ellas, solo se trasladan las medidas (ancho/alto, paños/tramos de Gaza y B.O., ancho de confección); se conserva lo que difiere. Limitación: cambios de especificación (ej. color) en la medición no llegan a las alternativas ya creadas.
- [x] `CortinaItemForm` acepta `textoGuardar` opcional (texto del botón de guardar).
- [x] Explosión de materiales: si la especificación dice `sistema: "Barral"` no se cuentan rieles aunque la descripción diga "Tradicional" (antes se contaban igual).

---

## Actualización — Marca por capa, medidas con milímetros y edición de clientes en la tablet (2026-10-26)

### ✅ Implementado
- [x] **Marca de la cortina:** `caracteristicas.marca` ahora se deriva de las capas activas (`src/modules/mediciones/lib/marcas.ts`, `marcaPrincipalCortina`). Antes quedaba fija en el default del B.O. (HD) aunque se eligiera RS en la Gaza, o en la marca vieja al editar. El dibujo y el detalle de medición muestran la marca por capa (`textoMarcaCortina`: "RS" o "Gaza: RS • B.O.: HD"), así que las mediciones viejas también se ven bien. El aluminio es siempre HD.
- [x] **Medidas con 3 decimales:** `ancho`/`alto` de `items_medicion`, `items_presupuesto` e `items_comanda` pasan a `DECIMAL(9,3)`. Helper `fmtMedida` en `src/lib/utils.ts` (2 decimales, o 3 si hay milímetros: 2.50 / 1.775) usado en dibujo, detalle de medición, comanda imprimible, presupuesto y aviso de medida. Los campos aceptan 0.001 y los cálculos de paños/tramos redondean a 3 decimales. El aviso "Medida modificada" detecta cambios de 1 mm.
- [x] **Editar cliente desde la tablet:** botón "Editar datos" en la tarjeta del cliente elegido (nombre, teléfono, email, dirección, localidad, notas). Funciona offline; queda `pendienteSync` y se envía al sincronizar con `POST /api/mediciones/clientes-sync` (Zod `clienteTabletSyncSchema`, gana la tablet). Los clientes dados de alta offline viajan con su medición.
- [x] **Cambios de clientes hechos en la web llegan a la tablet:** al bajar clientes se refresca la copia del nombre/teléfono/dirección guardada en cada medición local (antes la lista seguía mostrando el nombre viejo). No se pisan clientes con cambios de la tablet sin subir.
- [x] Orden de sincronización: sube mediciones → sube clientes editados → baja mediciones → baja clientes.
- [x] Alta Express: guarda email y notas en la tablet (las notas de un cliente creado offline todavía no viajan al ERP).

---

## Actualización — Lista de precios de proveedores (2026-10-26)

### ✅ Implementado
- [x] **Modelo `ListaPrecioItem`** (`lista_precios_items`) con enum `CategoriaListaPrecio` (SISTEMA, ACCESORIO, MOTORIZACION, RIEL_MOTORIZADO, TELA, BANDAS_VERTICALES, SERVICIO): proveedor, sección, descripción, colores, unidad, precio de lista (sin recargos), `vendemos`, orden, vigencia y nota de sección. Clave única proveedor + sección + descripción. Es independiente del stock (`Producto`) para no afectar el control de stock.
- [x] **Proveedor Rollershade (marca RS)** cargado con contacto, 23 días de entrega y su lista de Septiembre 2026: 140 ítems verificados contra el PDF, 68 marcados "vendemos".
- [x] **Importador** `scripts/importar-lista-precios.mjs <archivo de datos> [--aplicar]`: muestra los cambios y solo escribe con `--aplicar`; al recargar actualiza precios sin duplicar y **conserva el "vendemos" marcado a mano**. Datos en `scripts/data/lista-rollershade-2026-09.mjs`.
- [x] **Lista de accesorios Rieles y Cosas (Rollershade) Septiembre 2026:** 142 ítems verificados contra el PDF, categoría nueva `RIELES_BARRALES` ("Rieles, barrales y kits": barrales Black Point / Níquel-Bronce, Sabicort, visillos, rieles Cortimatic / Europeo / Deluxe, romanas, panel oriental, tensores, kits de madera). Cargados sin marcar "vendemos" (se marcan a mano). Datos en `scripts/data/lista-accesorios-rollershade-2026-09.mjs`.
- [x] **Ficha del proveedor:** sección "Lista de Precios" (`lista-precios-proveedor.tsx`) con buscador, filtro por categoría, "Solo lo que vendemos" y edición de precio y "vendemos" (`actualizarItemListaPrecio`, Zod). Solo visible para roles que ven costos.

- [x] La lista ya se usa en el presupuesto (ver "Presupuesto por cortina física con la lista RS"). Los recargos por categoría que se habían hablado (+10% / +80% / redondeo de telas) quedaron descartados: se usa el precio de lista tal cual con los coeficientes de cada fórmula.

---

## Actualización — Presupuesto por cortina física con la lista RS (2026-10-26)

### ✅ Implementado
- [x] **Una fila por cortina física:** al importar una medición, cada capa (Gaza / B.O.) se separa en sus paños / tramos (`src/modules/mediciones/lib/cortinas-fisicas.ts`: `tipoDeCapa`, `cortinasFisicas`, `medidasCortinaFisica`). Tradicional, Tradicional Mot y Aluminio son una sola cortina por capa. `ItemPresupuesto` suma `capa` ("GAZA"/"BO"), `indiceCortina`, `tipoFila` ("CORTINA"/"CONTROL"/"CARGADOR") y `calculoPrecio` (Json: entrada, opciones elegidas, desglose, avisos y si se corrigió a mano). Cada fila tiene cantidad 1.
- [x] **Fórmulas RS** (`src/modules/presupuestos/lib/lista-precios-rs.ts`, solo capas marca RS; precios de lista sin recargos). Ancho de cálculo con mínimo 1 m y m² con mínimo 1 m²:
  - Roller: (m² × tela + ancho × sistema) × 1,16025 + instalación. Sistema por m²: < 3 Soft RS, 3 a < 6 Maxi, 6 a 9 Super Maxi (variante "zócalo Deco, cadena plástica"). Más de 9 m² no se calcula: avisa "debe ser motorizada".
  - Solo tela: el zócalo (Decorativo por defecto, o Guía Liso) reemplaza al sistema. Solo riel: sin tela.
  - Roller Mot: (ancho × caño + motor + m² × tela × 1,105) × 1,5 + instalación. Caño 40 / 50 mm a elección (sugerido según el motor); con motor Li-ion siempre el caño de batería. Motor según marca y modelo de la medición. Solo tela motorizada: el zócalo reemplaza caño + motor.
  - Bandas RS: (ancho × Sistema BV Esmalte Blanco + m² × tela BV) × 1,16025 + instalación.
  - Instalación $40.000 por cortina física (también solo tela / solo riel), editable.
  - **Controles:** se suman todos los del cliente (capas Roller Mot RS con "control"), agrupados por marca y canales, en filas propias: lista × 1,5. **Cargadores Li-ion:** una fila por abertura con la cantidad cargada en la medición: lista × 1,5.
- [x] **Tela por nombre:** en mediciones viejas (texto libre) se busca en la lista (`buscarTelaPorNombre`); si no es seguro, la fila queda sin precio con el aviso "Elegí la tela".
- [x] **Calculadora:** pestaña "Lista RS" (`calculo-lista-rs.tsx`) con desglose y selectores (tela y color, zócalo, caño, motor, control/cargador, instalación). Cambiar ancho/alto recalcula; tocar el precio a mano lo marca "Precio corregido a mano".
- [x] **Aprobación por capa:** una opción = todas las cortinas de la capa con el mismo nombre (`agruparCortinas` devuelve opciones con `filas` y subtotal sumado). Se acepta o rechaza la capa entera. Las alternativas ("+ Agregar alternativa (B.O.)") son por capa y regeneran sus cortinas con la especificación nueva. La ficha A4 y el WhatsApp muestran una línea por capa con sus medidas.
- [x] **Comanda y stock por abertura** (`lib/filas-por-abertura.ts`, `unirFilasPorAbertura`): se unen las capas aceptadas de cada abertura en un ítem con las medidas de la medición; las capas no aceptadas quedan desactivadas (`capasExcluidas`) y se anota "Solo B.O." (+ cargadores) en observaciones. Al cambiar la medición no se reactivan.
- [x] **Recálculo con la lista** (`lib/recalcular-con-lista.ts`): al cambiar un precio en la ficha del proveedor, y con el botón "Recalcular presupuestos abiertos" (después de importar una lista nueva). Actualiza Borradores, Enviados, Rechazados y las capas no aceptadas de los Aceptados parciales; los Aceptados totales y lo aceptado no se tocan. Las filas con precio corregido a mano quedan con el aviso "No se actualizó con la lista".
- [x] **Selector de tela en la medición** (`selector-tela-lista.tsx`, contexto `TelasListaProvider`): en capas Roller / Roller Mot / Bandas RS la tela se elige de la lista (solo tildadas "vendemos"; "(BV)" para bandas) y el color de otro desplegable según la tela. Se guarda `telaId` y `colorTela` además de `nombreTela`. La tablet baja las telas al sincronizar (`GET /api/mediciones/telas`, sin precios) y las guarda en Preferences para usarlas sin señal. El resto de las capas sigue con texto libre.

### ⏳ Pendiente / Limitaciones
- [ ] Presupuesto con lista para HD (incluye motor Li-ion Somfy) y para Tradicional: siguen con la calculadora del Excel.
- [ ] Los cambios de medida de una medición ya presupuestada actualizan las medidas de cada cortina, pero no recalculan el precio (queda el aviso "Medida modificada").
- [ ] Presupuestos creados antes de este cambio siguen con una fila por abertura (se pueden reimportar).


---

## Actualización — Mosquiteros MagicRoll (MG) con tablas de precios por medida (2026-10-29)

### ✅ Implementado
- [x] **Modelo `PrecioMedidaItem`** (`precios_por_medida`): cada celda de una tabla ancho × alto del proveedor (modelo, tabla de origen, cajón, ancho desde/hasta, alto desde/hasta en mm con extremos incluidos, precio con IVA, vigencia). Clave única proveedor + modelo + tabla + ancho desde + alto desde.
- [x] **Proveedor MagicRoll (marca MG)** e importador `scripts/importar-tablas-medida.mjs <datos> [--aplicar]` (muestra los cambios; desactiva las celdas que ya no figuran). Datos: `scripts/data/tablas-magicroll-mosquiteros-2026-10.mjs` (págs. 13 a 20 de la lista N° 26/10, 710 celdas, verificadas por el usuario).
- [x] **Medición de Mosquera** (`src/modules/mediciones/lib/mosquiteros.ts`): un mosquitero por abertura. Orden: ancho y alto → modelo (solo los que se fabrican en esa medida; en el Vertical a resorte, si entra en las tablas del cajón 40 y del 54, se toma el 40) → mando (a Cadena) / "Sentido de Apertura (donde va el cajón)" (horizontales) / Simple o Doble (Plegable Importado, con cartel si el alto no supera en 120 mm al ancho de cada puerta) → perfilería (Plegable Importado: anodizado natural fijo; Nacional: blanco fijo) → sujeción → Gaza. Se guarda en `caracteristicas.mosquitero` (modelo, cajón según la celda, mando, sentidoApertura, puertas).
- [x] **Tablet:** baja las medidas disponibles (sin precios) junto con las telas (`GET /api/mediciones/telas` → `mosquiteros`) y las guarda para filtrar los modelos sin señal. Sin tablas sincronizadas muestra todos los modelos.
- [x] **Presupuesto:** la Mosquera se importa como una fila con precio = celda × 1,25 (instalación incluida). Plegable Importado doble: se entra a la tabla con la mitad del ancho y el precio va × 2. Calculadora: pestaña "Lista MG" (modelo y puertas, desglose con la celda usada). Si la medida no se fabrica o falta el modelo, la fila queda sin precio con aviso. El recálculo de presupuestos abiertos incluye MG.
- [x] **Ficha del proveedor:** sección "Tablas de Precios por Medida" (resumen por tabla) con el botón "Recalcular presupuestos abiertos".
- [x] El modelo del mosquitero se ve en el dibujo de la medición y en el detalle de la comanda.

### ⏳ Pendiente
- [x] Roller Noche Total MagicRoll: ver la sección siguiente.
- [ ] Mosqueras medidas antes de este cambio: no tienen modelo; al presupuestarlas se elige en la calculadora (pestaña "Lista MG").

---

## Actualización — Roller Noche Total MagicRoll (MG) con tablas de precios por medida (2026-10-29)

### ✅ Implementado
- [x] **Tablas** (`scripts/data/tablas-magicroll-noche-total-2026-10.mjs`, págs. 25 a 27 de la lista N° 26/10, 444 celdas, verificadas por el usuario; se cargan con `scripts/importar-tablas-medida.mjs`): Black Out con guías y cajón, dos sistemas:
  - `NOCHE_TOTAL_RESORTE` — Sistema a Resorte: pág. 25 (cajón 40) y pág. 26 (cajón 54; las celdas gris oscuro, columna 2100–2200 y altos 2100–2300 desde 1400 de ancho, llevan cajón 62,5). Si la medida entra en las dos tablas se toma el cajón 40 (el más barato).
  - `NOCHE_TOTAL_CADENA` — Sistema a Cadena Plástica con Tensor: pág. 27 (cajón 62,5; guías 42 mm con alto menor a 2000 y 60 mm con alto mayor).
  - Sin extras (cadena extra, acero inoxidable, etc.). La zona "tela sellada horizontalmente" es solo informativa.
- [x] **Medición** (`src/modules/mediciones/lib/noche-total.ts`, `cortina-item-form.tsx`): después del ancho de cada cortina y el alto se elige el **sistema** (solo los que se fabrican en la medida de todas las cortinas de la abertura; muestra el cajón), el **color de la tela** (Blanco, Negro, Gris o Beige) y, a Cadena, el **lado de la cadena** de cada cortina (`bo.mandosRoller`) y el **color de la cadena**. Perfilería, sujeción y Gaza delantera siguen como antes. Se guarda en `caracteristicas.nocheTotal` (sistema, colorTela, colorCadena, cajones por cortina); la tela queda como "Black Out <color>". La Noche Total es siempre marca MG. La tablet usa las mismas medidas que baja para los mosquiteros (`GET /api/mediciones/telas` → `mosquiteros` trae todas las celdas MG).
- [x] **Presupuesto:** una fila por cortina, método `MG_NOCHE_TOTAL`: precio = celda (ancho y alto tal cual) × 1,25, instalación incluida. Pestaña "Lista MG" de la calculadora con el sistema y el desglose. Si no se fabrica en la medida o falta el sistema, la fila queda sin precio con aviso. El recálculo de presupuestos abiertos la incluye.
- [x] El sistema, los colores y el cajón se ven en el dibujo de la medición y en el detalle de la comanda (con el lado de la cadena).
- Datos de prueba: medición "Ventanal prueba NT" (2 cortinas a cadena, 2,30 y 1,00 × 1,00) y presupuesto #PRE-0015 (borrador), de Romina Ribot.

### ⏳ Pendiente
- [ ] Noche Total medidas antes de este cambio: no tienen sistema; al presupuestarlas se elige en la calculadora (pestaña "Lista MG").

---

## Actualización — Comanda de taller y hoja del presupuesto (2026-10-29)

### ✅ Implementado
- [x] **Comanda (ficha A4 y vista digital):**
  - "GANCHOS: ____" para escribir a mano en las cortinas con Tradicional común con riel (`comandas/lib/detalle-capas.ts`, `llevaGanchos`). Las argollas se muestran solo en barral. La medida de riel / barral / sistema va como texto en negrita (sin recuadro).
  - Caída, posición y mando de cada capa (`detalleCapasComanda`): ej. "B.O. (Roller): Caída por delante · Posición atrás · Mando C1 Izq · C2 Der".
  - Sin el recuadro "Corte (+10cm)": el dibujo (`CortinaDibujoDidactico` con `medidasConfeccion`) muestra la Gasa y el B.O. tradicionales con los 10 cm sumados (total + 0,10 y cada paño + 0,10 / paños), con los números al doble de tamaño.
  - Encabezado solo "ROMINA RIBOT"; el número de comanda y el nombre del cliente en recuadro oscuro; teléfono y dirección en negrita. Textos de la comanda con "Gasa".
  - Impresión: estilos A4 propios, tonos plenos (textos en negro en vez de grises claros; naranja de proveedor y violeta de tipo llenos), sin el rótulo "Dibujo técnico y especificaciones", cada cortina entera en una hoja; el layout (`DashboardShell`) se imprime como bloque (antes se cortaban las últimas cortinas).
  - **Fecha de entrega:** `Presupuesto.fechaAceptacion` (se guarda al aceptar total o parcial; la primera aceptación se conserva). Al generar la comanda la entrega es aceptación + 25 días corridos (`comandas/lib/fecha-entrega.ts`), editable en el modal.
- [x] **Hoja PDF del presupuesto:** sin columna de medidas ni "Opción … ✓ elegida"; cada línea muestra la tela y su color (`presupuestos/lib/texto-presupuesto.ts`, `telaDeFila`). Membrete "ROMINA RIBOT — Fábrica de cortinas, toldos y afines" con teléfono e Instagram (@ribotromina, con link) en negrita, sin la dirección de la empresa ni los datos bancarios.
- [x] **"Gasa" con s** en todo el presupuesto (hoja, detalle, aprobación, calculadora, descripciones nuevas; `conGasa`). En los datos la capa sigue siendo "GAZA"; la medición sigue diciendo "Gaza".
- [x] **WhatsApp:** el botón abre WhatsApp con "Hola, te envío el presupuesto" y la ficha A4 con el diálogo de impresión para guardar el PDF y adjuntarlo (un link de WhatsApp no puede llevar archivos).

### ⏳ Pendiente
- [ ] Presupuestos aceptados antes de este cambio no tienen fecha de aceptación: su comanda propone 25 días desde el día en que se genera.

