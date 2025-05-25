module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("productos", "categoriaId", {
      type: Sequelize.INTEGER,
      references: {
        model: "categorias", // Nombre de la tabla de categorías
        key: "id", // Clave primaria de la tabla de categorías
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true, // Puedes cambiar esto según tu lógica de negocio
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("productos", "categoriaId");
  },
};
