// ✅ Primero importas la clase Sequelize
const { Sequelize } = require("sequelize");

// ✅ Luego creas la instancia de conexión
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, // Asegúrate que esto está si cambiaste el puerto
    dialect: "postgres",
    logging: false,
  }
);

// ✅ Exportas la instancia para usarla en modelos
module.exports = sequelize;
console.log("Conectando a PostgreSQL con:");
console.log("DB:", process.env.DB_NAME);
console.log("USER:", process.env.DB_USER);
console.log("PASS:", process.env.DB_PASS);
console.log("HOST:", process.env.DB_HOST);
console.log("PORT:", process.env.DB_PORT);
