const ComprobantesPago = require("../models/comprobantesPago");
const crypto = require("crypto");
const { Op } = require("sequelize");
const Venta = require("../models/Venta");
const CestaVentas = require("../models/cestaVentas");
// 🔹 Función para generar un código hash único (usamos SHA-256)
const generarCodigoHash = (comprobante) => {
  const datos = `${comprobante.emisor_ruc}-${comprobante.serie}-${comprobante.numero}-${comprobante.total_final}`;
  return crypto.createHash("sha256").update(datos).digest("hex");
};

// 🔹 Controlador para crear un nuevo comprobante de pago
const crearComprobante = async (req, res) => {
  try {
    const {
      ventaId,
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
    } = req.body;

    // 🔍 **Validar datos de entrada**
    if (!ventaId || !serie || !numero || !emisor_ruc) {
      return res.status(400).json({
        error: "Debe proporcionar datos válidos para generar el comprobante.",
      });
    }

    // 🔄 **Obtener la venta y la cesta vinculada**
    const venta = await Venta.findOne({ where: { id: ventaId } });
    if (!venta) {
      return res.status(404).json({ error: "La venta no existe." });
    }

    const cesta = await CestaVentas.findOne({
      where: { cestaId: venta.cestaId, estado: "procesado" },
    });
    if (!cesta) {
      return res.status(400).json({
        error:
          "La cesta no está procesada, no se puede generar el comprobante.",
      });
    }

    // 🔄 **Extraer los productos vendidos**
    const detalleProductos = cesta.productos.map((producto) => ({
      productoId: producto.productoId,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: producto.cantidad,
    }));

    // 🔄 **Generar comprobante**
    const comprobante = {
      serie,
      numero,
      fecha_emision: fecha_emision || new Date(),
      tipo,
      emisor_ruc,
      emisor_razon_social,
      emisor_direccion,
      cliente_nombre,
      cliente_dni_ruc,
      tipo_documento_cliente,
      tipo_operacion: "0101",
      moneda: "PEN",
      subtotal: venta.total / 1.18,
      IGV: venta.total - venta.total / 1.18,
      total_final: venta.total,
      detalle: detalleProductos, // 🔹 Ahora obtenemos los productos desde `CestaVentas`
      codigo_hash: generarCodigoHash({
        emisor_ruc,
        serie,
        numero,
        total_final: venta.total,
      }),
      estado_sunat: "pendiente",
    };

    // 🔄 **Guardar comprobante en la BD**
    const nuevoComprobante = await ComprobantesPago.create(comprobante);

    res.status(201).json({
      mensaje: "Comprobante creado correctamente con datos reales de la venta.",
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
