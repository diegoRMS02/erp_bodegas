const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Producto = require("./Producto");
const Categoria = require("./Categoria");

const PromocionesDescuentos = sequelize.define(
  "PromocionesDescuentos",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_promocion: { type: DataTypes.STRING, allowNull: false },
    tipo: {
      type: DataTypes.ENUM("porcentaje", "cantidad_fija", "combo", "codigo"),
      allowNull: false,
    },
    valor_descuento: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    productoId: { type: DataTypes.INTEGER, allowNull: true },
    categoriaId: { type: DataTypes.INTEGER, allowNull: true },
    codigo_promocional: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    cantidad_minima: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    fecha_inicio: { type: DataTypes.DATE, allowNull: false },
    fecha_fin: { type: DataTypes.DATE, allowNull: false },
    estado: {
      type: DataTypes.ENUM("activo", "inactivo"),
      defaultValue: "activo",
    },
    acumulable: {
      // 🔹 Permitir que el administrador defina si el descuento se puede combinar con otros
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    creadoPor: { type: DataTypes.INTEGER, allowNull: false },
    fechaCreacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    modificadoPor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    fechaModificacion: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  { timestamps: false }
);

// Definir correctamente las relaciones como Foreign Key
PromocionesDescuentos.belongsTo(Producto, {
  foreignKey: "productoId",
  as: "Producto",
});
PromocionesDescuentos.belongsTo(Categoria, {
  foreignKey: "categoriaId",
  as: "Categoria",
});

module.exports = PromocionesDescuentos;
