const { DataTypes } = require("sequelize");
const db = require("../config/db");
const Venta = require("./Venta");
const PromocionesDescuentos = require("./promocionesDescuentos");
const sequelize = require("../config/db");

const VentasDescuentos = sequelize.define(
  "VentasDescuentos",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ventaId: { type: DataTypes.INTEGER, allowNull: false },
    promocionId: { type: DataTypes.INTEGER, allowNull: false },
    tipo: {
      type: DataTypes.ENUM("porcentaje", "cantidad_fija", "combo", "codigo"), // 🔹 Agregamos "codigo" como opción válida
      allowNull: false,
    },
    valor_descuento: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    precio_final: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    fechaAplicacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false }
);

module.exports = VentasDescuentos;
