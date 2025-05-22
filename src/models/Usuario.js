const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Usuario = sequelize.define(
  "Usuario",
  {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM("admin", "vendedor"), // ✅ Correcto
      defaultValue: "vendedor",
    },
  },
  {
    tableName: "usuarios", // 👈 asegura que coincida con la base de datos
    timestamps: false,
  }
);

module.exports = Usuario;
