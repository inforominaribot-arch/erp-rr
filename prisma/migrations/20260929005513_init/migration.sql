-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN_GENERAL', 'ADMINISTRACION', 'TALLER', 'INSTALACION');

-- CreateEnum
CREATE TYPE "EstadoCliente" AS ENUM ('MEDICION_TOMADA', 'PRESUPUESTO_ENVIADO', 'PRESUPUESTO_ACEPTADO', 'EN_PRODUCCION', 'INSTALADO');

-- CreateEnum
CREATE TYPE "EstadoPresupuesto" AS ENUM ('BORRADOR', 'ENVIADO', 'ACEPTADO_TOTAL', 'ACEPTADO_PARCIAL', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoComanda" AS ENUM ('PENDIENTE', 'EN_PRODUCCION', 'ESPERANDO_PROVEEDOR', 'LISTO_PARA_INSTALAR', 'INSTALADO');

-- CreateEnum
CREATE TYPE "TipoItemComanda" AS ENUM ('FABRICAR', 'PEDIR_PROVEEDOR');

-- CreateEnum
CREATE TYPE "EstadoInstalacion" AS ENUM ('PROGRAMADA', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoMovimientoStock" AS ENUM ('INGRESO', 'EGRESO', 'AJUSTE');

-- CreateEnum
CREATE TYPE "EstadoOrdenCompra" AS ENUM ('PENDIENTE', 'ENVIADA', 'RECIBIDA_PARCIAL', 'RECIBIDA_TOTAL', 'CANCELADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "supabase_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ADMINISTRACION',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "localidad" TEXT,
    "notas" TEXT,
    "estado" "EstadoCliente" NOT NULL DEFAULT 'MEDICION_TOMADA',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mediciones" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "observaciones" TEXT,
    "sincronizado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mediciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambientes" (
    "id" TEXT NOT NULL,
    "medicion_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ambientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_medicion" (
    "id" TEXT NOT NULL,
    "ambiente_id" TEXT NOT NULL,
    "producto_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "ancho" DECIMAL(8,2) NOT NULL,
    "alto" DECIMAL(8,2) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "caracteristicas" JSONB,
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_medicion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presupuestos" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "estado" "EstadoPresupuesto" NOT NULL DEFAULT 'BORRADOR',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "validez_dias" INTEGER NOT NULL DEFAULT 15,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presupuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_presupuesto" (
    "id" TEXT NOT NULL,
    "presupuesto_id" TEXT NOT NULL,
    "item_medicion_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "ambiente" TEXT,
    "ancho" DECIMAL(8,2) NOT NULL,
    "alto" DECIMAL(8,2) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "aceptado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comandas" (
    "id" TEXT NOT NULL,
    "presupuesto_id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "estado" "EstadoComanda" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "fecha_entrega" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comandas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_comanda" (
    "id" TEXT NOT NULL,
    "comanda_id" TEXT NOT NULL,
    "producto_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "ambiente" TEXT,
    "ancho" DECIMAL(8,2) NOT NULL,
    "alto" DECIMAL(8,2) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "tipo" "TipoItemComanda" NOT NULL DEFAULT 'FABRICAR',
    "caracteristicas" JSONB,
    "observaciones" TEXT,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_comanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "unidad_medida" TEXT NOT NULL DEFAULT 'unidad',
    "stock_actual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock_minimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio" DECIMAL(12,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_stock" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "tipo" "TipoMovimientoStock" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "stock_anterior" DECIMAL(10,2) NOT NULL,
    "stock_nuevo" DECIMAL(10,2) NOT NULL,
    "motivo" TEXT,
    "referencia_id" TEXT,
    "referencia_tipo" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_proveedores" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "codigo_proveedor" TEXT,
    "precio_ultimo" DECIMAL(12,2),
    "es_principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "productos_proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "estado" "EstadoOrdenCompra" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "foto_remito" TEXT,
    "total" DECIMAL(12,2),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_orden_compra" (
    "id" TEXT NOT NULL,
    "orden_compra_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad_pedida" DECIMAL(10,2) NOT NULL,
    "cantidad_recibida" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio_unitario" DECIMAL(12,2),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_orden_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instalaciones" (
    "id" TEXT NOT NULL,
    "comanda_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora_inicio" TEXT,
    "hora_fin" TEXT,
    "estado" "EstadoInstalacion" NOT NULL DEFAULT 'PROGRAMADA',
    "notas" TEXT,
    "materiales_listos" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instalaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instaladores_instalaciones" (
    "id" TEXT NOT NULL,
    "instalacion_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,

    CONSTRAINT "instaladores_instalaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_supabase_id_key" ON "usuarios"("supabase_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_numero_key" ON "presupuestos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "comandas_presupuesto_id_key" ON "comandas"("presupuesto_id");

-- CreateIndex
CREATE UNIQUE INDEX "comandas_numero_key" ON "comandas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_key" ON "productos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "productos_proveedores_producto_id_proveedor_id_key" ON "productos_proveedores"("producto_id", "proveedor_id");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_numero_key" ON "ordenes_compra"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "instalaciones_comanda_id_key" ON "instalaciones"("comanda_id");

-- CreateIndex
CREATE UNIQUE INDEX "instaladores_instalaciones_instalacion_id_usuario_id_key" ON "instaladores_instalaciones"("instalacion_id", "usuario_id");

-- AddForeignKey
ALTER TABLE "mediciones" ADD CONSTRAINT "mediciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mediciones" ADD CONSTRAINT "mediciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambientes" ADD CONSTRAINT "ambientes_medicion_id_fkey" FOREIGN KEY ("medicion_id") REFERENCES "mediciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_medicion" ADD CONSTRAINT "items_medicion_ambiente_id_fkey" FOREIGN KEY ("ambiente_id") REFERENCES "ambientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_medicion" ADD CONSTRAINT "items_medicion_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_presupuesto" ADD CONSTRAINT "items_presupuesto_presupuesto_id_fkey" FOREIGN KEY ("presupuesto_id") REFERENCES "presupuestos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_presupuesto" ADD CONSTRAINT "items_presupuesto_item_medicion_id_fkey" FOREIGN KEY ("item_medicion_id") REFERENCES "items_medicion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_presupuesto_id_fkey" FOREIGN KEY ("presupuesto_id") REFERENCES "presupuestos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_comanda" ADD CONSTRAINT "items_comanda_comanda_id_fkey" FOREIGN KEY ("comanda_id") REFERENCES "comandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_comanda" ADD CONSTRAINT "items_comanda_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_proveedores" ADD CONSTRAINT "productos_proveedores_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_proveedores" ADD CONSTRAINT "productos_proveedores_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instalaciones" ADD CONSTRAINT "instalaciones_comanda_id_fkey" FOREIGN KEY ("comanda_id") REFERENCES "comandas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instaladores_instalaciones" ADD CONSTRAINT "instaladores_instalaciones_instalacion_id_fkey" FOREIGN KEY ("instalacion_id") REFERENCES "instalaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instaladores_instalaciones" ADD CONSTRAINT "instaladores_instalaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
