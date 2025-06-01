const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Usuario = require("./Usuario"); // Importamos el modelo Usuario

const CestaVentas = sequelize.define(
  "CestaVentas",
  {
    cestaId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Usuario, key: "id" },
    },
    productos: {
      type: DataTypes.JSON, // 🔹 Nuevo campo para almacenar productos como JSON
      allowNull: false,
      defaultValue: [], // 🔹 Cada producto tendrá `productoId`, `nombre`, `precio`, `cantidad`
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "eliminado", "cancelado", "procesado"),
      allowNull: false,
      defaultValue: "pendiente",
    },
  },
  { timestamps: true }
);

// 🔹 Relación con Usuario (cada usuario tiene su propia cesta)
CestaVentas.belongsTo(Usuario, { foreignKey: "usuarioId", as: "Usuario" });

module.exports = CestaVentas;
