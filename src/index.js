const express = require("express");
const app = express();
require("dotenv").config();
const sequelize = require("./config/db"); // Importamos la conexión con la base de datos
const Producto = require("./models/Producto");
const productoRoutes = require("./routes/productoRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const Usuario = require("./models/Usuario");
const auditoriaProducto = require("./models/auditoriaProducto");
const auditoriaRoutes = require("./routes/auditoriaRoutes");

// Agrega después de app.use(express.json())
app.use(express.json());

app.use("/usuarios", usuarioRoutes);
app.use("/productos", productoRoutes);
app.use("/auditorias", auditoriaRoutes);

sequelize
  .sync({ alter: true })
  .then(() => console.log("Base de datos sincronizada con alter"))
  .catch((err) => console.error("Error sincronizando DB:", err));

const bcrypt = require("bcryptjs");
const hash = bcrypt.hashSync("miclaveultrasecreta123", 10);
console.log(hash);

//relaciones
Usuario.hasMany(auditoriaProducto, { foreignKey: "usuarioId" });
auditoriaProducto.belongsTo(Usuario, { foreignKey: "usuarioId" });

Producto.hasMany(auditoriaProducto, { foreignKey: "productoId" });
auditoriaProducto.belongsTo(Producto, { foreignKey: "productoId" });

app.get("/", (req, res) => {
  res.send("¡ERP de la Bodega funcionando!");
});

const PORT = process.env.PORT || 3001;
// Conectamos con la base de datos y arrancamos el servidor
sequelize
  .authenticate()
  .then(async () => {
    console.log("✅ Conexión exitosa a la base de datos");

    // Este método crea la tabla si no existe (no borra nada)
    await sequelize.sync(); // Usa await porque es una promesa

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Error al conectar a la base de datos:", error);
  });

module.exports = app;
