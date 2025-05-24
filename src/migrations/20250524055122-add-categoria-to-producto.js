"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Primero crea el tipo ENUM en PostgreSQL
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_productos_categoria" AS ENUM ('lacteos', 'bebidas', 'snacks', 'limpieza', 'otros');
    `);

    // 2. Luego añade la columna
    await queryInterface.addColumn("productos", "categoria", {
      type: Sequelize.ENUM("lacteos", "bebidas", "snacks", "limpieza", "otros"),
      defaultValue: "otros",
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    // 1. Primero elimina la columna
    await queryInterface.removeColumn("productos", "categoria");

    // 2. Luego elimina el tipo ENUM
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_productos_categoria";
    `);
  },
};
