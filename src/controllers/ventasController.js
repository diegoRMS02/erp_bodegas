const Venta = require("../models/Venta");
const CestaVentas = require("../models/cestaVentas");
const Producto = require("../models/Producto");
const PromocionesDescuentos = require("../models/promocionesDescuentos");
const VentasDescuentos = require("../models/ventasDescuentos");
const { Op } = require("sequelize");
const sequelize = require("../config/db");
const confirmarVenta = async (req, res) => {
  const transaction = await sequelize.transaction(); // 🔹 Crear transacción
  try {
    const { usuarioId, cestaId, codigo_promocional } = req.body;

    // 🔍 **Validar datos de entrada**
    if (!usuarioId || !cestaId || isNaN(usuarioId) || isNaN(cestaId)) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: "Debe proporcionar usuarioId y cestaId válidos." });
    }

    // 🔄 **Obtener la cesta con productos almacenados en JSON**
    const cesta = await CestaVentas.findOne({
      where: { cestaId, usuarioId, estado: "pendiente" },
      transaction,
    });

    if (!cesta || !cesta.productos || cesta.productos.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: "La cesta no tiene productos activos para confirmar la venta.",
      });
    }

    let subtotal = 0;
    let detallesDescuentos = [];

    // 🔧 **Verificar stock antes de registrar la venta**
    for (const producto of cesta.productos) {
      let stockDisponible = await Producto.findOne({
        where: { id: producto.productoId },
        attributes: ["stock"],
        raw: true,
        transaction,
      });

      if (!stockDisponible || stockDisponible.stock < producto.cantidad) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Stock insuficiente para el producto: ${
            producto.nombre
          }. Disponible: ${stockDisponible?.stock || 0}, solicitado: ${
            producto.cantidad
          }`,
        });
      }
    }

    // 🔄 **Registrar la venta SOLO si todo está bien**
    const nuevaVenta = await Venta.create(
      {
        usuarioId,
        cestaId,
        total: 0,
        fecha: new Date(),
      },
      { transaction }
    );

    // 🔧 **Aplicar descuentos y reducir stock**
    for (const producto of cesta.productos) {
      let stockDisponible = await Producto.findOne({
        where: { id: producto.productoId },
        attributes: ["stock"],
        raw: true,
        transaction,
      });
      let precio_final = producto.precio;
      let descuentoAplicado = 0;

      // 🔍 **Evitar error de `undefined` en `categoriaId`**
      const filtroPromocion = {
        estado: "activo",
        fecha_inicio: { [Op.lte]: new Date() },
        fecha_fin: { [Op.gte]: new Date() },
      };

      if (producto.productoId)
        filtroPromocion[Op.or] = [{ productoId: producto.productoId }];
      if (producto.categoriaId !== undefined)
        filtroPromocion[Op.or].push({ categoriaId: producto.categoriaId });

      const promocion = await PromocionesDescuentos.findOne({
        where: filtroPromocion,
        transaction,
      });

      if (promocion) {
        descuentoAplicado =
          promocion.tipo === "porcentaje"
            ? precio_final * (promocion.valor_descuento / 100)
            : promocion.valor_descuento;
        precio_final -= descuentoAplicado;

        await VentasDescuentos.create(
          {
            ventaId: nuevaVenta.id,
            promocionId: promocion.id,
            tipo: promocion.tipo,
            valor_descuento: promocion.valor_descuento,
            precio_final,
          },
          { transaction }
        );

        detallesDescuentos.push({
          producto: producto.nombre,
          promocion: promocion.nombre_promocion,
          tipo: promocion.tipo,
          descuentoAplicado,
          precioFinal: precio_final,
        });
      }

      subtotal += precio_final * producto.cantidad;

      // 🔄 **Reducir stock después de la venta**
      await Producto.update(
        { stock: stockDisponible.stock - producto.cantidad },
        { where: { id: producto.productoId }, transaction }
      );
    }

    // 🔍 **Calcular IGV (18%) y actualizar total**
    const IGV = subtotal * 0.18;
    const totalConImpuestos = subtotal + IGV;
    await nuevaVenta.update({ total: totalConImpuestos }, { transaction });

    // 🔄 **Actualizar la cesta como `procesado`**
    await CestaVentas.update(
      { estado: "procesado" },
      { where: { cestaId, usuarioId }, transaction }
    );

    await transaction.commit(); // ✅ Confirmar la transacción

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
    await transaction.rollback(); // 🔄 Si hay error, revertir todo para evitar ventas vacías
    console.error("Error al confirmar venta:", error);
    res.status(500).json({ error: "Error interno al confirmar venta." });
  }
};

module.exports = { confirmarVenta };
