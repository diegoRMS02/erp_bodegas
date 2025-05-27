const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Usuario = require("./Usuario"); // Importamos el modelo Usuario
const Producto = require("./Producto"); // Importamos el modelo Producto

const CestaVentas = sequelize.define(
  "CestaVentas",
  {
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: "id",
      },
    },
    productoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Producto,
        key: "id",
      },
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1, // Valor por defecto para la cantidad
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "eliminado", "procesado"),
      allowNull: false,
      defaultValue: "pendiente", // Valor por defecto para el estado
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt
  }
);

//relaciones
CestaVentas.belongsTo(Usuario, { foreignKey: "usuarioId", as: "Usuario" });
CestaVentas.belongsTo(Producto, { foreignKey: "productoId", as: "Producto" });

// Exportamos el modelo
module.exports = CestaVentas;
