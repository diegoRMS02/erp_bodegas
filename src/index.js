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
app.get("/vista-comprobante", (req, res) => {
  const datosComprobante = {
    logo_empresa: "https://via.placeholder.com/100",
    emisor_razon_social: "Empresa Perú SAC",
    emisor_ruc: "20123456789",
    emisor_direccion: "Av. Central 456, Lima",
    serie: "F001",
    numero: "00012345",
    fecha_emision: "2025-06-01",
    tipo: "Factura",
    cliente_nombre: "Carlos Ramírez",
    cliente_dni_ruc: "20567890123",
    subtotal: 500,
    IGV: 90,
    total_final: 590,
    detalle: [
      {
        descripcion: "Laptop Lenovo",
        cantidad: 1,
        precio_unitario: 500,
        subtotal: 500,
        igv_item: 90,
        total_item: 590,
      },
    ],
  };

  // 🔹 Renderizar la plantilla con `main.hbs` como layout
  res.render("comprobanteTemplate", { layout: "main", ...datosComprobante });
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
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Error al conectar a la base de datos:", error);
  });

module.exports = app;
