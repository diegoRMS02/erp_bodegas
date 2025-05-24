const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// Importa los modelos relacionados
const Usuario = require("./Usuario");
const Producto = require("./Producto");

const auditoriaProducto = sequelize.define("auditoriaProducto", {
  accion: {
    type: DataTypes.STRING,
    allowNull: false, // ejem. creaccion, edicion venta
  },
  detalles: {
    type: DataTypes.TEXT,
    allowNull: true, // pueder ser un json como texto descripcion
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});
// 🔗 Asociaciones
auditoriaProducto.belongsTo(Usuario, {
  foreignKey: "usuarioId",
  as: "Usuario",
});
auditoriaProducto.belongsTo(Producto, {
  foreignKey: "productoId",
  as: "Producto",
});

module.exports = auditoriaProducto;
