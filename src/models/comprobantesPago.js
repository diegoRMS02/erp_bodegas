const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Conexión a la base de datos

const ComprobantesPago = sequelize.define(
  "ComprobantesPago",
  {
    // 🔹 Identificador único del comprobante
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // 🔹 Serie y número del comprobante (Ejemplo: B001 - 00012345)
    serie: {
      type: DataTypes.STRING(4), // 4 caracteres (Ejemplo: F001, B001)
      allowNull: false,
    },
    numero: {
      type: DataTypes.STRING(10), // Número correlativo dentro de la serie
      allowNull: false,
    },

    // 🔹 Fecha de emisión del comprobante (Formato ISO 8601)
    fecha_emision: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM("boleta", "factura"), // Se permite solo "boleta" o "factura"
      allowNull: false,
    },

    // 🔹 Información del emisor (empresa)
    emisor_ruc: {
      type: DataTypes.STRING(11), // RUC debe tener 11 dígitos
      allowNull: false,
    },
    emisor_razon_social: {
      type: DataTypes.STRING(100), // Nombre o razón social de la empresa emisora
      allowNull: false,
    },
    emisor_direccion: {
      type: DataTypes.STRING(255), // Dirección fiscal obligatoria en comprobantes electrónicos
      allowNull: false,
    },
    tipo_documento_emisor: {
      type: DataTypes.STRING(1), // Siempre "6" (RUC)
      defaultValue: "6",
    },

    // 🔹 Información del cliente
    cliente_nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cliente_dni_ruc: {
      type: DataTypes.STRING(11), // Puede ser un DNI (8 dígitos) o RUC (11 dígitos)
      allowNull: false,
    },
    tipo_documento_cliente: {
      type: DataTypes.STRING(1), // "1" para DNI, "6" para RUC
      allowNull: false,
    },

    // 🔹 Detalles fiscales y operativos
    tipo_operacion: {
      type: DataTypes.STRING(4),
      defaultValue: "0101", // Venta interna
    },
    moneda: {
      type: DataTypes.STRING(3),
      defaultValue: "PEN", // Soles peruanos
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    IGV: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    total_final: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    // 🔹 Autenticidad y validación ante SUNAT
    codigo_hash: {
      type: DataTypes.STRING(100), // Código único generado para validación
      allowNull: false,
    },
    estado_sunat: {
      type: DataTypes.ENUM(
        "pendiente",
        "aceptado",
        "rechazado",
        "enviado",
        "rechazado",
        "anulado"
      ),
      defaultValue: "pendiente",
    },
    qr_url: {
      type: DataTypes.STRING(255), // URL del código QR para validación fiscal
    },
    firma_digital: {
      type: DataTypes.TEXT, // Firma electrónica del comprobante
    },
    cdr_url: {
      type: DataTypes.STRING(255), // Enlace al XML con datos de validación ante SUNAT
    },

    // 🔹 Ubicación del comprobante en formato PDF
    pdf_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // Indica si el comprobante está activo
    },
  },
  {
    tableName: "comprobantes_pago", // Nombre de la tabla en la BD
    timestamps: true, // Activar timestamps automáticos
  }
);

module.exports = ComprobantesPago;
