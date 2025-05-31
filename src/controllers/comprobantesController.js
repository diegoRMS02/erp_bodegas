const ComprobantesPago = require("../models/comprobantesPago");
const crypto = require("crypto");
const { Op } = require("sequelize");
// 🔹 Función para generar un código hash único (usamos SHA-256)
const generarCodigoHash = (comprobante) => {
  const datos = `${comprobante.emisor_ruc}-${comprobante.serie}-${comprobante.numero}-${comprobante.total_final}`;
  return crypto.createHash("sha256").update(datos).digest("hex");
};

// 🔹 Controlador para crear un nuevo comprobante de pago
const crearComprobante = async (req, res) => {
  try {
    const {
      serie,
      numero,
      fecha_emision,
      tipo,
      emisor_ruc,
      emisor_razon_social,
      emisor_direccion,
      cliente_nombre,
      cliente_dni_ruc,
      tipo_documento_cliente,
      subtotal,
      IGV,
      total_final,
      detalle, // 🔹 Lista de productos
    } = req.body;

    // 🔹 Validación: Verificamos que los datos esenciales no estén vacíos
    if (!serie || !numero || !emisor_ruc || !total_final || !detalle) {
      return res
        .status(400)
        .json({ error: "Faltan datos esenciales del comprobante." });
    }

    // 🔹 Verificamos si ya existe un comprobante con la misma serie y número
    const comprobanteExistente = await ComprobantesPago.findOne({
      where: { serie, numero },
    });
    if (comprobanteExistente) {
      return res
        .status(400)
        .json({
          mensaje: "Ya existe un comprobante con la misma serie y número.",
        });
    }

    // 🔹 Asegurar que `detalle` sea JSON válido antes de guardarlo
    let detalleProductos;
    try {
      detalleProductos = JSON.parse(detalle); // Si viene como string, convertirlo
    } catch (error) {
      detalleProductos = detalle; // Si ya es un array, lo dejamos tal cual
    }

    // 🔹 Creamos el objeto comprobante con los datos recibidos
    const comprobante = {
      serie,
      numero,
      fecha_emision: fecha_emision || new Date(), // Si no se envía fecha, se usa la actual
      tipo,
      emisor_ruc,
      emisor_razon_social,
      emisor_direccion,
      cliente_nombre,
      cliente_dni_ruc,
      tipo_documento_cliente,
      tipo_operacion: "0101", // Venta interna (valor fijo)
      moneda: "PEN", // Moneda en soles peruanos (por defecto)
      subtotal,
      IGV,
      total_final,
      detalle: detalleProductos, // 🔹 Guardamos `detalle` como JSON
      codigo_hash: generarCodigoHash({
        emisor_ruc,
        serie,
        numero,
        total_final,
      }), // Generamos el código hash
      estado_sunat: "pendiente", // Estado inicial antes de la validación
    };

    // 🔹 Guardamos el comprobante en la base de datos
    const nuevoComprobante = await ComprobantesPago.create(comprobante);

    // 🔹 Respuesta al usuario con el comprobante creado
    res.status(201).json({
      mensaje: "Comprobante creado correctamente.",
      comprobante: nuevoComprobante,
    });
  } catch (error) {
    console.error("Error al crear comprobante:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// 🔹 Obtener todos los comprobantes activos
const obtenerComprobantes = async (req, res) => {
  try {
    const { tipo, estado, desde, hasta } = req.query;

    // 🔹 Filtrado opcional por tipo, estado y rango de fechas
    const filtros = { activo: true };
    if (tipo) filtros.tipo = tipo;
    if (estado) filtros.estado_sunat = estado;
    if (desde && hasta)
      filtros.fecha_emision = { [Op.between]: [desde, hasta] };

    const comprobantes = await ComprobantesPago.findAll({ where: filtros });
    res.status(200).json(comprobantes);
  } catch (error) {
    console.error("Error al obtener comprobantes:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// 🔹 Buscar comprobante por ID o serie
const buscarComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    const { serie } = req.query;

    const comprobante = id
      ? await ComprobantesPago.findByPk(id)
      : await ComprobantesPago.findOne({ where: { serie } });

    if (!comprobante)
      return res.status(404).json({ mensaje: "Comprobante no encontrado." });

    res.status(200).json(comprobante);
  } catch (error) {
    console.error("Error al buscar comprobante:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// 🔹 Editar comprobante con restricciones en estado_sunat
const editarComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    const cambios = req.body;
    const { serie, numero } = req.body;

    const comprobante = await ComprobantesPago.findByPk(id);
    if (!comprobante)
      return res.status(404).json({ mensaje: "Comprobante no encontrado." });

    // 🔹 Bloquear modificación del campo `activo`
    if ("activo" in cambios) {
      return res.status(400).json({
        mensaje: "El campo 'activo' no puede modificarse mediante PUT.",
      });
    }

    // 🔹 Bloquear cambios manuales en estados controlados por SUNAT
    const estadosRestringidos = ["aceptado", "rechazado", "anulado"];
    if (
      "estado_sunat" in cambios &&
      estadosRestringidos.includes(cambios.estado_sunat)
    ) {
      return res.status(400).json({
        mensaje: `No se puede modificar 'estado_sunat' a '${cambios.estado_sunat}' manualmente.`,
      });
    }
    // 🔹 Validación: Verificar si el nuevo `serie` y `numero` ya existen en otro comprobante
    if (serie && numero) {
      const comprobanteExistente = await ComprobantesPago.findOne({
        where: { serie, numero, id: { [Op.ne]: id } },
      });
      if (comprobanteExistente) {
        return res.status(400).json({
          mensaje: "El número de serie ya existe en otro comprobante.",
        });
      }
    }

    await comprobante.update(cambios);
    res
      .status(200)
      .json({ mensaje: "Comprobante actualizado correctamente.", comprobante });
  } catch (error) {
    console.error("Error al editar comprobante:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};
// 🔹 Soft delete (marcar como eliminado)
const eliminarComprobante = async (req, res) => {
  try {
    const { id } = req.params;

    const comprobante = await ComprobantesPago.findByPk(id);
    if (!comprobante)
      return res.status(404).json({ mensaje: "Comprobante no encontrado." });

    await comprobante.update({ activo: false }); // Marcamos como inactivo
    res.status(200).json({ mensaje: "Comprobante eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar comprobante:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

module.exports = {
  crearComprobante,
  obtenerComprobantes,
  buscarComprobante,
  editarComprobante,
  eliminarComprobante,
};
