const { DataTypes } = require("sequelize");
const db = require("../config/db");
const CestaVenta = require("./cestaVentas");

const Venta = db.define(
  "Venta",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    cestaId: { type: DataTypes.INTEGER, allowNull: false },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false }
);

module.exports = Venta;
