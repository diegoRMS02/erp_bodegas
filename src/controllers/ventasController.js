const { Op } = require("sequelize");
const Venta = require("../models/Venta");
const CestaVentas = require("../models/cestaVentas");
const Producto = require("../models/Producto");

const confirmarVenta = async (req, res) => {
  try {
    const { usuarioId, cestaId } = req.body;

    // Validación de datos: asegurar que usuarioId y cestaId sean valores numéricos válidos
    if (!usuarioId || !cestaId || isNaN(usuarioId) || isNaN(cestaId)) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar usuarioId y cestaId válidos." });
    }

    // Verificar si la cesta existe y pertenece al usuario
    const cesta = await CestaVentas.findOne({
      where: { cestaId, usuarioId, estado: "pendiente" },
      include: [
        {
          model: Producto,
          as: "Producto",
          attributes: ["id", "nombre", "precio"],
        },
      ],
    });

    if (!cesta) {
      return res
        .status(404)
        .json({ error: "Cesta no encontrada o ya fue procesada/cancelada." });
    }

    // Obtener productos dentro de la cesta
    const productosCesta = await CestaVentas.findAll({
      where: { cestaId, usuarioId, estado: "pendiente" },
      include: [
        {
          model: Producto,
          as: "Producto",
          attributes: ["id", "nombre", "precio"],
        },
      ],
    });

    if (productosCesta.length === 0) {
      return res.status(400).json({
        error: "La cesta no tiene productos activos para confirmar la venta.",
      });
    }

    // Calcular el total de la venta
    let subtotal = 0;
    let detallesVenta = [];

    for (const item of productosCesta) {
      if (!item.Producto || !item.Producto.precio || !item.cantidad) {
        return res.status(400).json({
          error: `Error con los datos del producto ID: ${item.productoId}`,
        });
      }

      subtotal += item.Producto.precio * item.cantidad;
      detallesVenta.push({
        producto: item.Producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.Producto.precio,
      });
    }

    // Aplicar IGV (18% impuesto en Perú)
    const IGV = 0.18;
    const totalConImpuestos = subtotal + subtotal * IGV;

    // Crear la venta en la base de datos
    const nuevaVenta = await Venta.create({
      usuarioId,
      cestaId,
      total: totalConImpuestos,
    });

    // Actualizar el estado de la cesta a 'procesado'
    await CestaVentas.update(
      { estado: "procesado" },
      { where: { cestaId, usuarioId } }
    );

    res.status(201).json({
      mensaje: "Venta confirmada correctamente",
      ventaId: nuevaVenta.id,
      detallesVenta,
      totalFinal: totalConImpuestos,
    });
  } catch (error) {
    console.error("Error al confirmar venta:", error);
    res.status(500).json({ error: "Error interno al confirmar venta." });
  }
};

module.exports = { confirmarVenta };
