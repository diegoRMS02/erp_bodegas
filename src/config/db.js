require("dotenv").config();
const { Sequelize } = require("sequelize"); // <-- Faltaba esta línea

// Validación de variables de entorno
const requiredEnvVars = ["DB_NAME", "DB_USER", "DB_PASS", "DB_HOST", "DB_PORT"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Falta la variable de entorno: ${envVar}`);
  }
}

// Configuración para producción
const isProduction = process.env.NODE_ENV === "production";
const dialectOptions = isProduction
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }
  : {};

module.exports = {
  development: {
    // <-- Este es el entorno por defecto que busca Sequelize CLI
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
    dialectOptions,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  test: {
    // <-- Añade estos aunque no los uses
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME + "_test",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
  },
  production: {
    // <-- Configuración para producción
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};

// Exporta también tu instancia de Sequelize si otros archivos la necesitan
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
    dialectOptions,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test de conexión (opcional)
async function testConnection() {
  try {
    await sequelize.authenticate();
    if (!isProduction) {
      console.log("✅ Conexión a PostgreSQL establecida correctamente");
    }
  } catch (error) {
    console.error("❌ Error al conectar a PostgreSQL:", error.message);
    process.exit(1);
  }
}

testConnection();

module.exports.sequelize = sequelize;
