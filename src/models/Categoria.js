const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Producto = require("./Producto"); // Importamos el modelo de Producto
const Categoria = sequelize.define(
  "categorias",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eliminado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // false = activo, true = eliminado
    },
  },
  {
    tableName: "categorias",
    timestamps: false,
  }
);

// Relaciones

module.exports = Categoria;
