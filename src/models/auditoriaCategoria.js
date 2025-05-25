const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Importar modelos relacionados
const Usuario = require("./Usuario");
const Categoria = require("./Categoria");

const AuditoriaCategoria = sequelize.define("auditoriaCategoria", {
  accion: {
    type: DataTypes.STRING,
    allowNull: false, // Ejemplo: "Crear", "Actualizar", "Eliminar"
  },
  detalles: {
    type: DataTypes.TEXT,
    allowNull: true, // Puedes almacenar JSON con los cambios
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// 🔗 Asociaciones
AuditoriaCategoria.belongsTo(Usuario, {
  foreignKey: "usuarioId",
  as: "Usuario",
});
AuditoriaCategoria.belongsTo(Categoria, {
  foreignKey: "categoriaId",
  as: "Categoria",
});

module.exports = AuditoriaCategoria;
