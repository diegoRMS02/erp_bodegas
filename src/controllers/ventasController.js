const Venta = require("../models/Venta");
const CestaVentas = require("../models/cestaVentas");
const Producto = require("../models/Producto");
const PromocionesDescuentos = require("../models/promocionesDescuentos");
const VentasDescuentos = require("../models/ventasDescuentos");
const { Op } = require("sequelize");

const confirmarVenta = async (req, res) => {
  try {
    const { usuarioId, cestaId, codigo_promocional } = req.body;

    // 🔍 **Validar datos de entrada**
    if (!usuarioId || !cestaId || isNaN(usuarioId) || isNaN(cestaId)) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar usuarioId y cestaId válidos." });
    }

    // 🔄 **Obtener la cesta con productos almacenados en JSON**
    const cesta = await CestaVentas.findOne({
      where: { cestaId, usuarioId, estado: "pendiente" },
    });

    if (!cesta || cesta.productos.length === 0) {
      return res
        .status(400)
        .json({
          error: "La cesta no tiene productos activos para confirmar la venta.",
        });
    }

    let subtotal = 0;
    let detallesDescuentos = [];

    // 🔄 **Registrar la venta antes de aplicar descuentos**
    const nuevaVenta = await Venta.create({
      usuarioId,
      cestaId,
      total: subtotal, // Se actualizará más adelante
      fecha: new Date(),
    });

    // 🔧 **Aplicar descuentos y actualizar stock**
    for (const producto of cesta.productos) {
      const stockDisponible = await Producto.findByPk(producto.productoId);
      if (!stockDisponible || isNaN(producto.cantidad)) {
        return res.status(400).json({
          error: `Stock insuficiente o cantidad inválida para el producto: ${
            producto.nombre
          }. Disponible: ${
            stockDisponible ? stockDisponible.stock : 0
          }, solicitado: ${producto.cantidad}`,
        });
      }

      let precio_final = producto.precio;
      let descuentoAplicado = 0;
      let promocionUsada = null;

      // 🔍 **Verificar si `categoriaId` existe antes de buscar promociones**
      const filtroPromocion = {
        estado: "activo",
        fecha_inicio: { [Op.lte]: new Date() },
        fecha_fin: { [Op.gte]: new Date() },
      };

      if (producto.productoId)
        filtroPromocion[Op.or] = [{ productoId: producto.productoId }];
      if (producto.categoriaId)
        filtroPromocion[Op.or].push({ categoriaId: producto.categoriaId });

      const promocion = await PromocionesDescuentos.findOne({
        where: filtroPromocion,
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
          producto: producto.nombre,
          promocion: promocion.nombre_promocion,
          tipo: promocion.tipo,
          valor: promocion.valor_descuento,
          descuentoAplicado,
          precioFinal: precio_final,
        };

        detallesDescuentos.push(promocionUsada);
      }

      subtotal += precio_final * producto.cantidad;

      // 🔄 **Reducir stock después de la venta**
      const nuevoStock = stockDisponible.stock - producto.cantidad;
      if (nuevoStock < 0) {
        return res.status(400).json({
          error: `Stock insuficiente para el producto: ${producto.nombre}. Quedan: ${stockDisponible.stock}, solicitado: ${producto.cantidad}`,
        });
      }

      await Producto.update(
        { stock: nuevoStock },
        { where: { id: producto.productoId } }
      );
    }

    // 🔍 **Calcular IGV (18%)**
    const IGV = subtotal * 0.18;
    const totalConImpuestos = subtotal + IGV;

    // 🔄 **Actualizar el total de la venta después de aplicar descuentos e impuestos**
    await nuevaVenta.update({ total: totalConImpuestos });

    // 🔄 **Actualizar la cesta como `procesado`**
    await CestaVentas.update(
      { estado: "procesado" },
      { where: { cestaId, usuarioId } }
    );

    res.status(201).json({
      mensaje:
        "Venta confirmada correctamente con descuentos y stock actualizado.",
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
