const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Usuario = sequelize.define(
  "Usuario",
  {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    rol: {
      type: DataTypes.ENUM("admin", "vendedor"),
      defaultValue: "vendedor",
    },
    ultimoLogin: {
      // 👈 Nuevo campo
      type: DataTypes.DATE,
      allowNull: true, // Permitir null inicialmente
      defaultValue: null,
    },
  },
  {
    tableName: "usuarios",
    timestamps: false,
    hooks: {
      beforeCreate: (usuario) => {
        if (!usuario.nombre || !usuario.correo || !usuario.password) {
          throw new Error("Faltan datos obligatorios");
        }
      },
    },
  }
);

module.exports = Usuario;
