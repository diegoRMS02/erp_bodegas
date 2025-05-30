const Venta = require("../models/Venta");
const CestaVentas = require("../models/cestaVentas");
const Producto = require("../models/Producto");
const PromocionesDescuentos = require("../models/promocionesDescuentos");
const VentasDescuentos = require("../models/ventasDescuentos");

const { Op } = require("sequelize");

const confirmarVenta = async (req, res) => {
  try {
    const { usuarioId, cestaId, codigo_promocional } = req.body;

    // Validar datos de entrada
    if (!usuarioId || !cestaId || isNaN(usuarioId) || isNaN(cestaId)) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar usuarioId y cestaId válidos." });
    }

    // Obtener productos en la cesta
    const productosCesta = await CestaVentas.findAll({
      where: { cestaId, usuarioId, estado: "pendiente" },
      include: [
        {
          model: Producto,
          as: "Producto",
          attributes: ["id", "nombre", "precio", "categoriaId"],
        },
      ],
    });

    if (productosCesta.length === 0) {
      return res
        .status(400)
        .json({
          error: "La cesta no tiene productos activos para confirmar la venta.",
        });
    }

    // Registrar la venta antes de aplicar descuentos
    let subtotal = 0;
    let detallesDescuentos = [];

    const nuevaVenta = await Venta.create({
      usuarioId,
      cestaId,
      total: subtotal,
    });

    for (const item of productosCesta) {
      let precio_final = item.Producto.precio;
      let descuentoAplicado = 0;
      let promocionUsada = null;

      // Buscar promociones activas
      const promocion = await PromocionesDescuentos.findOne({
        where: {
          estado: "activo",
          fecha_inicio: { [Op.lte]: new Date() },
          fecha_fin: { [Op.gte]: new Date() },
          [Op.or]: [
            { productoId: item.Producto.id },
            { categoriaId: item.Producto.categoriaId },
          ],
        },
      });

      if (promocion) {
        if (promocion.tipo === "porcentaje") {
          descuentoAplicado = precio_final * (promocion.valor_descuento / 100);
        } else if (promocion.tipo === "cantidad_fija") {
          descuentoAplicado = promocion.valor_descuento;
        }

        precio_final -= descuentoAplicado;

        await VentasDescuentos.create({
          ventaId: nuevaVenta.id,
          promocionId: promocion.id,
          tipo: promocion.tipo,
          valor_descuento: promocion.valor_descuento,
          precio_final,
        });

        promocionUsada = {
          producto: item.Producto.nombre,
          promocion: promocion.nombre_promocion,
          tipo: promocion.tipo,
          valor: promocion.valor_descuento,
          descuentoAplicado,
          precioFinal: precio_final,
        };

        detallesDescuentos.push(promocionUsada);
      }

      subtotal += precio_final * item.cantidad;
    }

    // Calcular IGV (18%)
    const IGV = subtotal * 0.18;
    const totalConImpuestos = subtotal + IGV;

    // Actualizar el total de la venta después de aplicar descuentos e impuestos
    await nuevaVenta.update({ total: totalConImpuestos });

    res.status(201).json({
      mensaje: "Venta confirmada correctamente con descuentos aplicados",
      ventaId: nuevaVenta.id,
      subtotal,
      descuentos: detallesDescuentos,
      IGV,
      totalFinal: totalConImpuestos,
    });
  } catch (error) {
    console.error("Error al confirmar venta:", error);
    res.status(500).json({ error: "Error interno al confirmar venta." });
  }
};

module.exports = { confirmarVenta };
