// Lista de precios Rollershade (marca RS) — Septiembre 2026
// Transcripta de "LISTA ROLLER SEPTIEMBRE 26.pdf". Precios de lista SIN recargos.
// vendemos: marcado con cruz o llave en la lista revisada por Romina Ribot.
// Formato de cada ítem: [descripcion, colores, unidad, precio, vendemos]

export const PROVEEDOR = {
  nombre: "Rollershade",
  contacto: "Yanina",
  telefono: "1176114055",
  email: "ventas@rielesycosas.com.ar",
  marcas: ["RS"],
  diasEntrega: 23,
  notas: "Entrega hasta 23 días corridos (incluye días no hábiles).",
}

export const VIGENCIA = "Septiembre 2026"

const NETOS_IVA = "Los motores y accesorios son netos + IVA"

export const SECCIONES = [
  // ─── SISTEMAS ROLLERSHADE ───
  {
    categoria: "SISTEMA",
    seccion: "Sistema Soft R25",
    nota: "No incluye tela",
    items: [["Sistema R25 p/ Soporte Soft con zócalo Deco, cadena plástica", null, "ml", 25500, false]],
  },
  {
    categoria: "SISTEMA",
    seccion: "Sistema Soft RS",
    nota: "No incluye tela",
    items: [
      ["Sistema RS p/ Soporte Soft con zócalo Deco, cadena plástica", null, "ml", 28900, true],
      ["Sistema RS p/ Soporte Soft con zócalo Deco, cadena metálica", null, "ml", 32400, false],
      ["Sistema RS p/ Soporte Soft con zócalo 19x3, cadena plástica", null, "ml", 26200, false],
      ["Sistema RS p/ Soporte Soft con zócalo 19x3, cadena metálica", null, "ml", 31200, false],
      ["Sistema RS p/ Soporte Soft con zócalo guía Liso, cadena plástica", null, "ml", 30100, false],
      ["Sistema RS p/ Soporte Soft con zócalo guía Liso, cadena metálica", null, "ml", 34200, false],
    ],
  },
  {
    categoria: "SISTEMA",
    seccion: "Sistema Soft MAXI",
    nota: "No incluye tela",
    items: [
      ["Sistema Maxi p/ Soporte Soft con zócalo Deco, cadena plástica", null, "ml", 33600, true],
      ["Sistema Maxi p/ Soporte Soft con zócalo Deco, cadena metálica", null, "ml", 37000, false],
      ["Sistema Maxi p/ Soporte Soft con zócalo 19x3, cadena plástica", null, "ml", 31200, false],
      ["Sistema Maxi p/ Soporte Soft con zócalo 19x3, cadena metálica", null, "ml", 34700, false],
      ["Sistema Maxi p/ Soporte Soft con zócalo guía Liso, cadena plástica", null, "ml", 38200, false],
      ["Sistema Maxi p/ Soporte Soft con zócalo guía Liso, cadena metálica", null, "ml", 42300, false],
    ],
  },
  {
    categoria: "SISTEMA",
    seccion: "Sistema Soft SUPER MAXI",
    nota: "No incluye tela",
    items: [
      ["Sistema Super Maxi p/ Soporte Soft con zócalo Deco, cadena plástica", null, "ml", 50000, true],
      ["Sistema Super Maxi p/ Soporte Soft con zócalo Deco, cadena metálica", null, "ml", 53200, false],
      ["Sistema Super Maxi p/ Soporte Soft con zócalo 19x3, cadena plástica", null, "ml", 47400, false],
      ["Sistema Super Maxi p/ Soporte Soft con zócalo 19x3, cadena metálica", null, "ml", 50900, false],
      ["Sistema Super Maxi p/ Soporte Soft con zócalo guía Liso, cadena plástica", null, "ml", 53000, false],
      ["Sistema Super Maxi p/ Soporte Soft con zócalo guía Liso, cadena metálica", null, "ml", 56600, false],
    ],
  },
  {
    categoria: "SISTEMA",
    seccion: "Sistema Económico (no lleva tubo, cartón)",
    nota: "No incluye tela",
    items: [
      ["Sistema RS Eco con zócalo 19x3, cadena plástica blanca", null, "ml", 20000, false],
      ["Sistema RS Maxi Eco con zócalo 19x3, cadena plástica blanca", null, "ml", 22000, false],
      ["Soporte Doble", null, "ml", 12700, false],
    ],
  },
  {
    categoria: "SISTEMA",
    seccion: "Sistema Eclipse RS",
    nota: "No incluye tela",
    items: [
      ["Sistema con Cajón RS", null, "ml", 59000, false],
      ["Sistema con Cajón Maxi", null, "ml", 70500, false],
    ],
  },

  // ─── ACCESORIOS ROLLERSHADE ───
  {
    categoria: "ACCESORIO",
    seccion: "Mecanismo para soporte Soft",
    items: [
      ["Mecanismo R25 (comando y soporte)", "blanco", "u", 9700, false],
      ["Mecanismo RS (comando y soporte)", "blanco/negro/gris/beige", "u", 9700, false],
      ["Mecanismo Maxi (comando y soporte)", "blanco/negro/gris/beige", "u", 11500, false],
      ["Mecanismo Super Maxi (comando y soporte)", "blanco", "u", 13300, false],
      ["Mecanismo RS ECO", null, "u", 8900, false],
      ["Mecanismo Maxi ECO", null, "u", 9500, false],
    ],
  },
  {
    categoria: "ACCESORIO",
    seccion: "Soportes dobles y especiales",
    items: [
      ["Soporte Doble Soft con embellecedor", null, "par", 13300, false],
      ["Soporte Doble Soft sin embellecedor", "blanco/negro/gris/beige", "par", 12000, false],
      ["Soporte Largo Soft", null, "par", 6200, false],
      ["Soporte Intermedio Soft", "blanco/negro/gris/beige", "par", 6200, false],
    ],
  },
  {
    categoria: "ACCESORIO",
    seccion: "Cadenas",
    items: [
      ["Cadena Silver", null, "ml", 2500, true],
      ["Cadena Soft", "blanco/negro/gris/beige", "ml", 1500, true],
      ["Contrapeso Cadena Soft", null, "u", 3000, true],
    ],
  },
  {
    categoria: "ACCESORIO",
    seccion: "Zócalos",
    items: [
      ["Zócalo 19x3", null, "ml", 7000, false],
      ["Zócalo Decorativo", "blanco/negro/gris/beige", "ml", 11000, true],
      ["Zócalo Guía Liso (GUIA)", null, "ml", 14000, true],
      ["Zócalo Eclipse", "blanco/negro/gris/beige", "ml", 18000, false],
    ],
  },
  {
    categoria: "ACCESORIO",
    seccion: "Guías laterales",
    items: [
      ["Guía Lateral Encastrable (50 mm)", "blanco/negro/gris/beige", "ml", 26000, false],
      ["Guía Lateral (50 mm)", "blanco/negro/gris/beige", "ml", 24000, true],
      ["Guía Lateral Chica (25 mm)", "blanco/negro/gris/beige", "ml", 22000, false],
    ],
  },
  {
    categoria: "ACCESORIO",
    seccion: "Suplementos",
    items: [
      ["Suplemento de Aluminio 25x25 mm", "blanco/negro/gris/beige", "ml", 15000, false],
      ["Suplemento de Aluminio 25x50 mm", "blanco/negro/gris/beige", "ml", 18000, false],
      ["Suplemento de Aluminio 25x75 mm", "blanco/negro/gris/beige", "ml", 21000, false],
      ["Suplemento ficha p/ soporte Soft", null, "u", 1400, false],
      ["Suplemento ficha p/ soporte Silver", null, "u", 1400, false],
    ],
  },
  {
    categoria: "ACCESORIO",
    seccion: "Cajón",
    items: [
      ["Cajón para Sistema RS p/ soporte Soft", "blanco/negro/gris/beige", "ml", 65000, false],
      ["Cajón para Sistema Maxi RS p/ soporte", "blanco/negro/gris/beige", "ml", 77000, false],
    ],
  },

  // ─── MOTORIZACIÓN ───
  {
    categoria: "MOTORIZACION",
    seccion: "Caño para motor",
    nota: NETOS_IVA,
    items: [
      ["Caño para Motor 40 mm", null, "u", 38200, true],
      ["Caño para Motor 50 mm", null, "u", 52000, true],
      ["Caño para Motor 60 mm", null, "u", 112100, false],
    ],
  },
  {
    categoria: "MOTORIZACION",
    seccion: "Accesorios - Motores",
    nota: NETOS_IVA,
    items: [
      ["Accesorios para tubo 40 mm", null, "u", 52300, false],
      ["Accesorios para tubo 50 mm", null, "u", 66200, false],
      ["Accesorios para tubo 60 mm", null, "u", 73400, false],
    ],
  },
  {
    categoria: "MOTORIZACION",
    seccion: "Motores tubulares - Tube",
    nota: NETOS_IVA,
    items: [
      ["Motor a Tecla 6/28 (40 mm)", null, "u", 83400, false],
      ["Motor a Control Remoto 6/28R (40 mm)", null, "u", 166400, true],
      ["Motor a Tecla NRI 10/28 (50 mm)", null, "u", 127900, false],
      ["Motor a Control Remoto 5/28R (50 mm)", null, "u", 196700, true],
      ["Tecla para Motor", null, "u", 10700, false],
      ["Control Remoto 1 Canal", null, "u", 40600, true],
      ["Control Remoto 4 Canales", null, "u", 42700, true],
      ["Control Remoto 15 Canales", null, "u", 78800, true],
    ],
  },
  {
    categoria: "MOTORIZACION",
    seccion: "Motor a batería Tube",
    nota: NETOS_IVA,
    items: [
      ["Motor Tube N025 1,1Nm (incluye accesorios)", null, "u", 188800, true],
      ["Caño", null, "ml", 10400, true],
      ["Cargador Li-ion", null, "u", 37200, true],
    ],
  },
  {
    categoria: "MOTORIZACION",
    seccion: "Motores tubulares Somfy",
    nota: NETOS_IVA,
    items: [
      ["Motor a Tecla LSN 6/28", null, "u", 152800, false],
      ["Motor a radio LSN 6/28R", null, "u", 213100, true],
      ["LT Ariane 6/32 Motor a Tecla (50 mm)", null, "u", 225200, false],
      ["Motor a radio LTN 10/28R", null, "u", 225900, true],
      ["Tecla para Motor", null, "u", 12800, false],
      ["Control Remoto 1 Canal", null, "u", 54600, true],
      ["Control Remoto 4 Canales", null, "u", 98700, true],
      ["Control Remoto 16 Canales", null, "u", 297500, true],
    ],
  },

  // ─── RIEL MOTORIZADO (incluye motor) ───
  {
    categoria: "RIEL_MOTORIZADO",
    seccion: "Riel motorizado - Línea Tube",
    nota: `Riel motorizado incluye motor. ${NETOS_IVA}`,
    items: [
      ["Riel hasta 2 metros con motor Tube", null, "u", 370500, false],
      ["Riel hasta 3 metros con motor Tube", null, "u", 498750, false],
      ["Riel hasta 4 metros con motor Tube", null, "u", 598500, false],
      ["Riel hasta 6 metros con motor Tube", null, "u", 655500, false],
      ["Riel hasta 8 metros con motor Tube", null, "u", 690000, false],
    ],
  },
  {
    categoria: "RIEL_MOTORIZADO",
    seccion: "Riel motorizado - Línea Somfy",
    nota: `Riel motorizado incluye motor. ${NETOS_IVA}`,
    items: [
      ["Riel hasta 2 metros con motor Movelite", null, "u", 565250, false],
      ["Riel hasta 3 metros con motor Movelite", null, "u", 684000, false],
      ["Riel hasta 4 metros con motor Movelite", null, "u", 836000, false],
      ["Riel hasta 6 metros con motor Movelite", null, "u", 921500, false],
      ["Riel hasta 8 metros con motor Movelite", null, "u", 970000, false],
    ],
  },

  // ─── TELAS ───
  {
    categoria: "TELA",
    seccion: "Línea Black Out RS",
    items: [
      ["Black Out Liso", "rosa/celeste", "m2", 37700, false],
      ["Black Out FV 1,83", "beige claro/beige oscuro/blanco/gris/negro", "m2", 29500, true],
      ["Black Out FV 2,50", "blanco/beige/gris/negro", "m2", 33000, true],
      ["Black Out FV 3,05", "blanco/beige/gris", "m2", 37700, true],
      ["Black Out Eco 2,50", "blanco/beige/gris", "m2", 17700, true],
      ["Black Out PL Técnico 2,50", "blanco/beige/gris", "m2", 24800, true],
    ],
  },
  {
    categoria: "TELA",
    seccion: "Línea Sun Screen RS",
    items: [
      ["Sun Screen 3% Bicolor", "marrón-beige", "m2", 49300, false],
      ["Sun Screen 5% Lino", "negro", "m2", 55800, false],
      ["Sun Screen 5% Bicolor", "blanco-beige-blanco", "m2", 44100, false],
      ["Sun Screen 8%", "gris metálico/negro metálico", "m2", 48000, true],
    ],
  },
  {
    categoria: "TELA",
    seccion: "Línea Sun Screen Mermet",
    items: [
      ["Sun Screen 1%", "blanco/beige/gris", "m2", 104800, true],
      ["Sun Screen 3%", "blanco/beige/gris", "m2", 95400, true],
      ["Sun Screen 4%", "pátina bronce/pátina beige/pátina gris/pátina marrón/pátina negro", "m2", 124000, true],
      ["Sun Screen 5% MidWay", "MW beige/MW marrón/MW gris/MW azul oscuro/MW negro/MW bronce", "m2", 81900, true],
      ["Sun Screen 5% 2,50", "blanco/beige/gris", "m2", 81900, true],
    ],
  },
  {
    categoria: "TELA",
    seccion: "Línea decorativa",
    items: [
      ["Tela Traslúcida", "azul/café", "m2", 29500, false],
      ["Traslúcida dúo", "gris/verde flúo/naranja/rojo/bordó/fucsia/azul celeste/gris oscuro/chocolate", "m2", 47100, true],
      ["Venecia", "negro", "m2", 30700, false],
      ["Venecia dúo", "beige/beige oscuro/gris perla", "m2", 60100, true],
      ["Garalona", "crema", "m2", 30200, true],
      ["Ibiza", "blanco/beige/marrón/gris", "m2", 30700, true],
      ["Maui", "blanco/natural", "m2", 30700, true],
      ["Balcánica", "blanco/beige/gris/marrón", "m2", 30700, true],
      ["Mediterránea", "blanco/beige/gris/marrón", "m2", 30700, true],
    ],
  },
  {
    categoria: "TELA",
    seccion: "Línea Eclipse",
    items: [
      ["Eclipse 2,80", "caramel/chocolate/gris/azul/negro", "m2", 49500, false],
      ["Eclipse 2,50", "blanco/beige/gris", "m2", 53000, false],
    ],
  },
  {
    categoria: "TELA",
    seccion: "Línea Boreal",
    items: [["Boreal Sunscreen 5%", "blanco/beige/gris/negro", "m2", 27100, true]],
  },
  {
    categoria: "TELA",
    seccion: "Línea Alpina",
    items: [
      ["Alpina Sunscreen 5% polyester", "blanco/beige/gris", "m2", 43600, true],
      ["Alpina Sunscreen 5% polyester NEGRO", "negro", "m2", 46000, true],
      ["Alpina 1% polyester", "blanco/beige/gris", "m2", 58900, true],
      ["Sun Screen Alpina 5% ancho 3,10", "blanco/beige/gris", "m2", 47100, true],
    ],
  },
  {
    categoria: "TELA",
    seccion: "Línea Sun Screen Técnico 5% Gales",
    items: [["Sunscreen Técnico 5%", "blanco/beige/gris", "m2", 30000, true]],
  },
  {
    categoria: "TELA",
    seccion: "Línea Sun Screen Irlanda 1%",
    items: [["Irlanda 1%", "Dublin/Tuam/Cavan/Bre/Galway", "m2", 58900, true]],
  },
  {
    categoria: "TELA",
    seccion: "Línea Sun Screen Escocia 5%",
    items: [["Escocia 5%", "Glasgow/Edimburgo/Ellon/Aberdeen/Dundee", "m2", 47100, true]],
  },
  {
    categoria: "TELA",
    seccion: "Línea Báltica",
    items: [
      ["Báltica Black Out", "blanco/beige/marrón/negro", "m2", 80100, true],
      ["Báltica Género", "blanco/beige/marrón/negro", "m2", 73000, true],
    ],
  },

  // ─── BANDAS VERTICALES ───
  {
    categoria: "BANDAS_VERTICALES",
    seccion: "Sistema BV Rollershade",
    items: [
      ["Sistema BV Aluminio", null, "ml", 38500, true],
      ["Sistema BV Esmalte Blanco", null, "ml", 40500, true],
    ],
  },
  {
    categoria: "BANDAS_VERTICALES",
    seccion: "Telas BV Rollershade",
    items: [
      ["Black Out FV 1,83 (BV)", "beige claro/beige oscuro/blanco/gris/negro", "m2", 33900, true],
      ["Nuance Poliéster (BV)", "blanco/gris/negra/ladrillo/beige/bordó/celeste/arena", "m2", 43600, true],
      ["Traslúcida dúo (BV)", "gris/verde flúo/naranja/rojo/bordó/fucsia/azul celeste/gris oscuro/chocolate", "m2", 58400, true],
      ["Garalona (BV)", "crema", "m2", 27300, true],
      ["Alpina Sunscreen 5% polyester (BV)", "blanco/beige/gris", "m2", 46700, true],
      ["Alpina Sunscreen 5% polyester NEGRO (BV)", "negro", "m2", 49500, true],
      ["Alpina 1% polyester (BV)", "blanco/beige/gris", "m2", 64800, true],
      ["Boreal 5% (BV)", "beige/blanco/gris/negro", "m2", 33000, true],
      ["Milán (BV)", "gris ceniza/gris perla/beige claro/beige oscuro/natural/blanco", "m2", 68700, true],
      ["Roma (BV)", "natural/gris perla/beige/blanco", "m2", 75200, true],
      ["Mallorca (BV)", "blanco/beige/marrón", "m2", 44800, true],
      ["Menorca (BV)", "blanco/beige/marrón", "m2", 44800, true],
      ["Báltica Género (BV)", "blanco/beige/marrón/negro", "m2", 80100, true],
      ["Ibiza (BV)", "blanco/beige/marrón/gris", "m2", 30700, true],
    ],
  },

  // ─── SERVICIOS ───
  {
    categoria: "SERVICIO",
    seccion: "Servicios",
    items: [
      ["Arreglo", null, "u", 11300, false],
      ["Mano de Obra", null, "u", 9500, false],
    ],
  },
]
