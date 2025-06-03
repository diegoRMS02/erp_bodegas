const express = require("express");
const app = express();
require("dotenv").config();
const sequelize = require("./config/db");

const { engine } = require("express-handlebars");
const path = require("path");

// 🔹 Importar modelos y rutas
const Producto = require("./models/Producto");
const Usuario = require("./models/Usuario");
const auditoriaProducto = require("./models/auditoriaProducto");
const Categoria = require("./models/Categoria");
const ComprobantesPago = require("./models/comprobantesPago");
const productoRoutes = require("./routes/productoRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const auditoriaRoutes = require("./routes/auditoriaRoutes");
const categoriasRoutes = require("./routes/categoriasRoutes");
const auditoriaCategoriaRoutes = require("./routes/auditoriaCategoriaRoutes");
const ventasRoutes = require("./routes/ventasRoutes");
const promocionesRoutes = require("./routes/promocionesRoutes");
const comprobantesRoutes = require("./routes/comprobantesRoutes");

// 🔹 Middleware
app.use(express.json());

// 🔹 Rutas API
app.use("/usuarios", usuarioRoutes);
app.use("/productos", productoRoutes);
app.use("/auditorias", auditoriaRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/auditoria-categorias", auditoriaCategoriaRoutes);
app.use("/ventas", ventasRoutes);
app.use("/promociones", promocionesRoutes);
app.use("/comprobantes", comprobantesRoutes);

// 🔹 Configuración de Handlebars con `main.hbs`
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main", // Usa `main.hbs` como layout principal
    layoutsDir: path.join(__dirname, "views/layouts"), // Ruta correcta para layouts
  })
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// 🔹 Ruta para vista previa del comprobante antes del PDF
app.get("/vista-comprobante/:id", async (req, res) => {
  try {
    const comprobanteId = req.params.id;

    // 🔹 Obtener el comprobante desde la BD
    const comprobante = await ComprobantesPago.findOne({
      where: { id: comprobanteId },
    });

    if (!comprobante) {
      return res.status(404).send("Comprobante no encontrado.");
    }

    // 🔄 **Inspeccionar qué datos llegan en `detalle`**
    console.log("Detalle antes de procesar:", comprobante.detalle);

    // 🔍 **Convertir `detalle` a JSON si es string**
    let detalleProductos;
    try {
      detalleProductos =
        typeof comprobante.detalle === "string"
          ? JSON.parse(comprobante.detalle)
          : comprobante.detalle;
    } catch (error) {
      console.error("Error al parsear detalle:", error);
      return res
        .status(500)
        .send("Error al procesar los productos del comprobante.");
    }

    console.log("Detalle después de procesar:", detalleProductos);

    // 🔹 Verificar si `detalleProductos` está vacío
    if (!detalleProductos || detalleProductos.length === 0) {
      return res
        .status(400)
        .send("El comprobante no tiene productos registrados.");
    }

    // 🔹 Estructurar datos para Handlebars
    const datosComprobante = {
      logo_empresa:
        comprobante.logo_empresa || "https://via.placeholder.com/100",
      emisor_razon_social: comprobante.emisor_razon_social,
      emisor_ruc: comprobante.emisor_ruc,
      emisor_direccion: comprobante.emisor_direccion,
      serie: comprobante.serie,
      numero: comprobante.numero,
      fecha_emision: comprobante.fecha_emision,
      tipo: comprobante.tipo,
      cliente_nombre: comprobante.cliente_nombre,
      cliente_dni_ruc: comprobante.cliente_dni_ruc,
      subtotal: comprobante.subtotal,
      IGV: comprobante.IGV,
      total_final: comprobante.total_final,
      detalle: detalleProductos, // 🔹 Ahora `detalle` está verificado
    };

    // 🔹 Renderizar la plantilla con `main.hbs`
    res.render("comprobanteTemplate", { layout: "main", ...datosComprobante });
  } catch (error) {
    console.error("Error mostrando la vista previa del comprobante:", error);
    res.status(500).send("Error interno al mostrar la vista previa.");
  }
});

// 🔹 Definir relaciones entre modelos
Usuario.hasMany(auditoriaProducto, { foreignKey: "usuarioId" });
auditoriaProducto.belongsTo(Usuario, { foreignKey: "usuarioId" });

Producto.hasMany(auditoriaProducto, { foreignKey: "productoId" });
auditoriaProducto.belongsTo(Producto, { foreignKey: "productoId" });

Producto.belongsTo(Categoria, { foreignKey: "categoriaId", targetKey: "id" });
Categoria.hasMany(Producto, { foreignKey: "categoriaId", as: "productos" });

// 🔹 Ruta principal
app.get("/", (req, res) => {
  res.send("¡ERP de la Bodega funcionando!");
});

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 3001;

sequelize
  .authenticate()
  .then(async () => {
    console.log("✅ Conexión exitosa a la base de datos");
    await sequelize.sync({ alter: true }); // Sincronizar modelos con la base de datos
    app.listen(PORT, () => {
      console.log(
        `🚀 Servidor corriendo en http://localhost:${PORT} sincronizado con alter`
      );
    });
  })
  .catch((error) => {
    console.error("❌ Error al conectar a la base de datos:", error);
  });

module.exports = app;
