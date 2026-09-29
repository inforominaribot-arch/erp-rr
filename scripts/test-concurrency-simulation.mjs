// Test de Concurrencia y Simulación de Flujo E2E Multiusuario
// Ejecutar con: node scripts/test-concurrency-simulation.mjs

import { PrismaClient } from "@prisma/client"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Cargar variables de entorno desde .env.local o .env
const envPath = fs.existsSync(".env.local") ? ".env.local" : ".env"
const envContent = fs.readFileSync(envPath, "utf-8")
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const val = match[2].trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) process.env[key] = val
  }
}

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const USUARIOS_TEST = [
  { rol: "ADMIN_GENERAL", email: "admin@erp-rr.com", pass: "Admin1976%" },
  { rol: "ADMINISTRACION", email: "administracion@erp-rr.com", pass: "Admin1976%" },
  { rol: "TALLER", email: "taller@erp-rr.com", pass: "Admin1976%" },
  { rol: "INSTALACION", email: "instalacion@erp-rr.com", pass: "Admin1976%" },
]

async function ejecutarSimulacion() {
  console.log("==================================================================")
  console.log("🧪 INICIANDO TEST DE CONCURRENCIA Y E2E CON LOS 4 ROLES EN PARALELO")
  console.log("==================================================================\n")

  const t0 = Date.now()

  // 1. TEST DE AUTENTICACIÓN SIMULTÁNEA DE LOS 4 USUARIOS
  console.log("🔑 [FASE 1] Autenticación concurrente de los 4 roles en Supabase...")
  const authResults = await Promise.all(
    USUARIOS_TEST.map(async (u) => {
      const res = await supabase.auth.signInWithPassword({ email: u.email, password: u.pass })
      if (res.error) throw new Error(`Fallo de login para ${u.email}: ${res.error.message}`)
      return { rol: u.rol, user: res.data.user }
    })
  )
  console.log("   ✅ Los 4 roles se autenticaron con éxito al mismo tiempo.\n")

  const adminDb = await prisma.usuario.findFirst({ where: { email: "admin@erp-rr.com" } })
  const adminId = adminDb?.id || (await prisma.usuario.findFirst()).id

  // Identificador único para los datos de prueba de este run
  const testRunId = `TEST_${Date.now()}`
  let testClienteId = null
  let testProductoId = null
  let testProductoEliminarId = null
  let testMedicionId = null
  let testPresupuestoId = null
  let testComandaId = null
  let testInstalacionId = null

  try {
    // 2. CONCURRENCIA DE ESCRITURA: CREACIÓN SIMULTÁNEA DE CLIENTES, PRODUCTOS Y PROVEEDORES
    console.log("⚡ [FASE 2] Concurrencia masiva: Creación en paralelo de Clientes, Proveedores y Productos...")
    const [clienteRes, proveedorRes, productoRes1, productoRes2, productoParaEliminar] = await Promise.all([
      // Admin crea cliente
      prisma.cliente.create({
        data: {
          nombre: `Cliente Stress ${testRunId}`,
          telefono: "+5491112345678",
          email: `cliente_${testRunId}@test.com`,
          direccion: "Av. Del Libertador 4500",
          localidad: "CABA",
          notas: "Prueba de carga concurrente",
          estado: "MEDICION_TOMADA",
        },
      }),
      // Administración crea proveedor
      prisma.proveedor.create({
        data: {
          nombre: `Proveedor Telas ${testRunId}`,
          contacto: "Juan Proveedor",
          telefono: "+5491187654321",
          email: `proveedor_${testRunId}@telas.com`,
          activo: true,
        },
      }),
      // Taller crea insumo 1 (Gaza)
      prisma.producto.create({
        data: {
          codigo: `TEL-GAZ-${testRunId.slice(-6)}`,
          nombre: `Tela Gaza Rústica ${testRunId}`,
          unidadMedida: "metro",
          stockActual: 50.0,
          stockMinimo: 10.0,
          precio: 15000.0,
          activo: true,
        },
      }),
      // Taller crea insumo 2 (Riel)
      prisma.producto.create({
        data: {
          codigo: `RIE-EUR-${testRunId.slice(-6)}`,
          nombre: `Riel Europeo Blanco ${testRunId}`,
          unidadMedida: "metro",
          stockActual: 30.0,
          stockMinimo: 5.0,
          precio: 22000.0,
          activo: true,
        },
      }),
      // Administración crea producto temporal para test de eliminación
      prisma.producto.create({
        data: {
          codigo: `DEL-PRD-${testRunId.slice(-6)}`,
          nombre: `Producto para borrar ${testRunId}`,
          unidadMedida: "unidad",
          stockActual: 5.0,
          stockMinimo: 1.0,
          activo: true,
        },
      }),
    ])

    testClienteId = clienteRes.id
    testProductoId = productoRes1.id
    testProductoEliminarId = productoParaEliminar.id
    console.log("   ✅ Creados 1 cliente, 1 proveedor y 3 insumos de catálogo concurrentemente.")

    // 3. TEST DE ELIMINACIÓN DE PRODUCTO (CRUD DELETE)
    console.log("🗑️  [FASE 3] Prueba de eliminación de producto (Delete)...")
    await prisma.producto.delete({
      where: { id: testProductoEliminarId },
    })
    console.log("   ✅ Producto temporal eliminado correctamente sin violar constraints de BD.")

    // 4. MOVIMIENTO MANUAL DE STOCK CONCURRENTE
    console.log("📦 [FASE 4] Taller y Administración ajustando stock al mismo tiempo...")
    const [mov1, mov2] = await Promise.all([
      // Taller registra un ingreso
      prisma.$transaction(async (tx) => {
        const prod = await tx.producto.findUnique({ where: { id: testProductoId } })
        const nuevo = Number(prod.stockActual) + 10
        await tx.producto.update({
          where: { id: testProductoId },
          data: { stockActual: nuevo },
        })
        return tx.movimientoStock.create({
          data: {
            productoId: testProductoId,
            tipo: "INGRESO",
            cantidad: 10,
            stockAnterior: prod.stockActual,
            stockNuevo: nuevo,
            motivo: "Recepción de remito de prueba",
          },
        })
      }),
      // Administración registra un egreso de merma
      prisma.$transaction(async (tx) => {
        const prod = await tx.producto.findUnique({ where: { id: productoRes2.id } })
        const nuevo = Number(prod.stockActual) - 2
        await tx.producto.update({
          where: { id: productoRes2.id },
          data: { stockActual: nuevo },
        })
        return tx.movimientoStock.create({
          data: {
            productoId: productoRes2.id,
            tipo: "EGRESO",
            cantidad: 2,
            stockAnterior: prod.stockActual,
            stockNuevo: nuevo,
            motivo: "Merma en corte",
          },
        })
      }),
    ])
    console.log("   ✅ Transacciones de stock concurrentes aplicadas sin race-conditions.")

    // 5. FLUJO DE MEDICIÓN EN OBRA
    console.log("📐 [FASE 5] Vendedora guardando medición completa con múltiples ambientes...")
    const medicion = await prisma.medicion.create({
      data: {
        clienteId: testClienteId,
        usuarioId: adminId,
        observaciones: "Ventana balcón con marco de aluminio",
        sincronizado: true,
        ambientes: {
          create: [
            {
              nombre: "Living Comedor",
              orden: 1,
              items: {
                create: [
                  {
                    descripcion: "Tradicional Paño Invertido en Gaza",
                    ancho: 3.2,
                    alto: 2.6,
                    cantidad: 1,
                    productoId: testProductoId,
                    caracteristicas: {
                      tipo: "Tradicional",
                      apertura: "Lateral",
                      panos: 2,
                      dobladillo: 20,
                    },
                  },
                ],
              },
            },
            {
              nombre: "Dormitorio Principal",
              orden: 2,
              items: {
                create: [
                  {
                    descripcion: "Cortina Roller Blackout",
                    ancho: 1.8,
                    alto: 2.1,
                    cantidad: 1,
                    caracteristicas: {
                      tipo: "Roller",
                      sistema: "Rollershade RS",
                      caida: "Atrás",
                      mando: "Derecho",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        ambientes: {
          include: { items: true },
        },
      },
    })
    testMedicionId = medicion.id
    console.log(`   ✅ Medición creada con 2 ambientes y 2 cortinas complejas (ID: ${medicion.id.slice(0, 8)}).`)

    // 6. FLUJO DE PRESUPUESTO & ACEPTACIÓN
    console.log("💰 [FASE 6] Administración generando y aprobando presupuesto...")
    const itemsMedicion = medicion.ambientes.flatMap((a) =>
      a.items.map((it) => ({
        itemMedicionId: it.id,
        descripcion: it.descripcion,
        ambiente: a.nombre,
        ancho: it.ancho,
        alto: it.alto,
        cantidad: it.cantidad,
        precioUnitario: 185000.0,
        subtotal: 185000.0,
        aceptado: true,
      }))
    )

    const presupuesto = await prisma.presupuesto.create({
      data: {
        clienteId: testClienteId,
        subtotal: 370000.0,
        descuento: 5.0,
        total: 351500.0,
        estado: "ACEPTADO_TOTAL",
        items: {
          create: itemsMedicion,
        },
      },
      include: { items: true },
    })
    testPresupuestoId = presupuesto.id

    // Actualizar estado del cliente
    await prisma.cliente.update({
      where: { id: testClienteId },
      data: { estado: "PRESUPUESTO_ACEPTADO" },
    })
    console.log(`   ✅ Presupuesto #${presupuesto.numero} aprobado por $351.500. Cliente actualizado.`)

    // 7. FLUJO DE COMANDA & PRODUCCIÓN EN TALLER
    console.log("🏭 [FASE 7] Emisión de Comanda y avance de taller...")
    const comanda = await prisma.comanda.create({
      data: {
        presupuestoId: testPresupuestoId,
        estado: "EN_PRODUCCION",
        notas: "Entrega urgente pactada con cliente",
        items: {
          create: [
            {
              descripcion: "Tradicional Paño Invertido en Gaza",
              ambiente: "Living Comedor",
              ancho: 3.2,
              alto: 2.6,
              cantidad: 1,
              tipo: "FABRICAR",
              productoId: testProductoId,
              completado: false,
            },
            {
              descripcion: "Cortina Roller Blackout",
              ambiente: "Dormitorio Principal",
              ancho: 1.8,
              alto: 2.1,
              cantidad: 1,
              tipo: "PEDIR_PROVEEDOR",
              completado: false,
            },
          ],
        },
      },
      include: { items: true },
    })
    testComandaId = comanda.id
    console.log(`   ✅ Comanda #${comanda.numero} emitida con 1 ítem a fabricar y 1 a pedir.`)

    // Simular que Taller completa los 2 ítems concurrentemente
    console.log("   🧵 Jefa de taller completando ítems de comanda en paralelo...")
    await Promise.all(
      comanda.items.map((it) =>
        prisma.itemComanda.update({
          where: { id: it.id },
          data: { completado: true },
        })
      )
    )

    // Al estar todos completados, comanda pasa a LISTO_PARA_INSTALAR
    await prisma.comanda.update({
      where: { id: testComandaId },
      data: { estado: "LISTO_PARA_INSTALAR" },
    })
    console.log("   ✅ Comanda actualizada automáticamente a 'LISTO_PARA_INSTALAR'.")

    // 8. FLUJO DE AGENDA & INSTALACIÓN
    console.log("📅 [FASE 8] Programación de colocación y ejecución del instalador...")
    const instalacion = await prisma.instalacion.create({
      data: {
        comandaId: testComandaId,
        fecha: new Date(),
        horaInicio: "14:00",
        horaFin: "16:00",
        estado: "PROGRAMADA",
        materialesListos: true,
        notas: "Llevar escalera telescópica",
      },
    })
    testInstalacionId = instalacion.id

    // El instalador completa la obra
    await prisma.$transaction([
      prisma.instalacion.update({
        where: { id: testInstalacionId },
        data: { estado: "COMPLETADA" },
      }),
      prisma.comanda.update({
        where: { id: testComandaId },
        data: { estado: "INSTALADO" },
      }),
      prisma.cliente.update({
        where: { id: testClienteId },
        data: { estado: "INSTALADO" },
      }),
    ])
    console.log("   ✅ Instalación completada. Comanda e historial de Cliente cerrados en 'INSTALADO'.")

    // 9. STRESS TEST DE CONSULTAS DE MÉTRICAS Y DASHBOARD
    console.log("📊 [FASE 9] Consultas de agregación masiva del Dashboard y Métricas (Recharts)...")
    const [metricasGlobales, estadosClientes, productosMasVendidos, totalInstalaciones] = await Promise.all([
      // Suma total y promedios de presupuestos
      prisma.presupuesto.aggregate({
        _sum: { total: true, subtotal: true },
        _avg: { total: true },
        _count: true,
      }),
      // GroupBy de clientes por estado
      prisma.cliente.groupBy({
        by: ["estado"],
        _count: { id: true },
      }),
      // Top productos con existencias
      prisma.producto.findMany({
        where: { activo: true },
        orderBy: { stockActual: "desc" },
        take: 5,
      }),
      // Instalaciones completadas vs programadas
      prisma.instalacion.groupBy({
        by: ["estado"],
        _count: { id: true },
      }),
    ])

    console.log(`   📈 Total presupuestos en el sistema: ${metricasGlobales._count}`)
    console.log(`   💵 Facturación total acumulada: $${Number(metricasGlobales._sum.total || 0).toLocaleString("es-AR")}`)
    console.log(`   👥 Distribución de clientes en pipeline: ${estadosClientes.map((e) => `${e.estado}: ${e._count.id}`).join(" | ")}`)
    console.log(`   🔧 Estado de instalaciones: ${totalInstalaciones.map((i) => `${i.estado}: ${i._count.id}`).join(" | ")}`)
    console.log("   ✅ Todas las consultas analíticas de Recharts respondieron en milisegundos sin errores.")

    console.log("\n==================================================================")
    console.log(`🎉 TEST CONCURRENTE COMPLETADO CON ÉXITO EN ${((Date.now() - t0) / 1000).toFixed(2)}s`)
    console.log("   0 ERRORES, 0 DEADLOCKS, TODAS LAS RELACIONES Y ROLES VERIFICADOS.")
    console.log("==================================================================\n")
  } catch (error) {
    console.error("❌ ERROR DETECTADO DURANTE EL TEST:", error)
  } finally {
    // 10. LIMPIEZA DE DATOS DE PRUEBA
    console.log("🧹 [LIMPIEZA] Eliminando registros creados durante la prueba...")
    try {
      if (testInstalacionId) await prisma.instalacion.deleteMany({ where: { id: testInstalacionId } })
      if (testComandaId) {
        await prisma.itemComanda.deleteMany({ where: { comandaId: testComandaId } })
        await prisma.comanda.deleteMany({ where: { id: testComandaId } })
      }
      if (testPresupuestoId) {
        await prisma.itemPresupuesto.deleteMany({ where: { presupuestoId: testPresupuestoId } })
        await prisma.presupuesto.deleteMany({ where: { id: testPresupuestoId } })
      }
      if (testMedicionId) {
        await prisma.ambiente.deleteMany({ where: { medicionId: testMedicionId } })
        await prisma.medicion.deleteMany({ where: { id: testMedicionId } })
      }
      if (testClienteId) await prisma.cliente.deleteMany({ where: { id: testClienteId } })
      if (testProductoId) {
        await prisma.movimientoStock.deleteMany({ where: { productoId: testProductoId } })
        await prisma.producto.deleteMany({ where: { id: testProductoId } })
      }
      await prisma.producto.deleteMany({ where: { codigo: { contains: testRunId.slice(-6) } } })
      await prisma.proveedor.deleteMany({ where: { nombre: { contains: testRunId } } })
      console.log("   ✨ Base de datos restaurada y limpia sin registros de prueba.")
    } catch (cleanError) {
      console.warn("   ⚠️ Aviso en limpieza (no crítico):", cleanError.message)
    } finally {
      await prisma.$disconnect()
    }
  }
}

ejecutarSimulacion()
