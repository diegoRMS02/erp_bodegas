// src/models/Producto.js

const { DataTypes } = require("sequelize"); // Importamos los tipos de datos
const { sequelize } = require("../config/db"); // Importamos la conexión

// Definimos el modelo "Producto"
const Producto = sequelize.define(
  "Producto",
  {
    nombre: {
      type: DataTypes.STRING, // Tipo texto
      allowNull: false, // No puede ser nulo
    },
    descripcion: {
      type: DataTypes.STRING, // Descripción opcional
    },
    stock: {
      type: DataTypes.INTEGER, // Número entero
      allowNull: false,
      defaultValue: 0, // Valor por defecto: 0
    },
    precio: {
      type: DataTypes.FLOAT, // Precio decimal
      allowNull: false,
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY, // Solo la fecha (sin hora)
    },
    eliminado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // false = activo, true = eliminado
    },
    categoria: {
      type: DataTypes.ENUM("fruta", "verdura", "lacteo", "carne", "otros"),
      defaultValue: "otros",
      allowNull: "false", // Categoría del producto
    },
  },
  {
    // Configuración adicional
    tableName: "productos", //importante para evitar el error de "no existe la relación"
    timestamps: false, //evita que cree campos createdAt y updatedAt si no los usas
  }
);

// Exportamos el modelo para usarlo en otras partes
module.exports = Producto;
